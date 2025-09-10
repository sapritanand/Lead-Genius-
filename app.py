import os
import json
import re
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.llms import Ollama
from langchain.agents import AgentType, initialize_agent, load_tools
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional
from dotenv import load_dotenv

# --- Configuration & Initialization ---

# Set up structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Pydantic Models for Output Validation ---

# Define the structure for a single lead using Pydantic for validation.
class Lead(BaseModel):
    name: str = Field(description="The official name of the business.")
    address: Optional[str] = Field(description="The full street address of the business.", default='N/A')
    phone: Optional[str] = Field(description="The primary contact phone number.", default='N/A')
    website: Optional[str] = Field(description="The official website URL.", default='N/A')
    confidence_score: str = Field(description="Confidence score: 'High', 'Medium', or 'Low'.")
    source: str = Field(description="The primary URL source for verification.")

# Define the structure for the list of leads.
class LeadList(BaseModel):
    leads: List[Lead]

# --- LangChain Agent Setup ---

# Load configuration from environment variables
load_dotenv()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama2")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")

agent = None
if not SERPAPI_API_KEY:
    logger.error("FATAL: SERPAPI_API_KEY environment variable not set.")
else:
    try:
        llm = Ollama(model=OLLAMA_MODEL)
        tools = load_tools(["serpapi"], llm=llm, serpapi_api_key=SERPAPI_API_KEY)
        agent = initialize_agent(
            tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True
        )
        logger.info(f"LangChain agent initialized successfully with model '{OLLAMA_MODEL}'.")
    except Exception as e:
        logger.error(f"FATAL: Error initializing LangChain agent: {e}", exc_info=True)

# --- Utility Function ---

def extract_json_from_response(text: str) -> Optional[dict]:
    """
    Extracts the JSON object from the LLM's text response.
    Handles markdown code blocks and finds the first valid JSON object.
    """
    # Regex to find JSON in markdown blocks
    match = re.search(r"```(json)?\s*(\{[\s\S]*?\})\s*```", text)
    if match:
        json_str = match.group(2)
    else:
        # Fallback to finding the first '{' and last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end+1]
        else:
            logger.warning("No JSON object found in the response text.")
            return None
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON from extracted string: {json_str}")
        return None

# --- API Endpoint ---

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "agent_ready": agent is not None})

@app.route('/generate-leads', methods=['POST'])
def generate_leads():
    """
    API endpoint to generate business leads.
    """
    if not agent:
        return jsonify({"error": "Agent not initialized. Check server logs."}), 503

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON payload."}), 400
        business_type = data.get('business_type')
        location = data.get('location')

        if not (business_type and location):
            return jsonify({"error": "Missing 'business_type' or 'location' in request."}), 400

        logger.info(f"Received lead generation request for '{business_type}' in '{location}'.")

        # The refined, industry-standard prompt for the agent
        prompt = (
            f"You are a professional Lead Generation Specialist. Your goal is to identify and verify business leads with maximum accuracy. "
            f"Generate a list of leads for '{business_type}' in '{location}'.\n\n"
            f"For each lead, perform these steps:\n"
            f"1.  **Identify**: Find the official business name, full address, main phone number, and a working website.\n"
            f"2.  **Verify**: Cross-reference details using reliable sources like official websites or Google Business Profiles.\n"
            f"3.  **Score Confidence**: Assign a 'High', 'Medium', or 'Low' confidence score. 'High' requires all info to be verified from a primary source.\n"
            f"4.  **Cite Source**: Provide the single most authoritative URL used for verification.\n\n"
            f"**Output Format**: Your final output MUST be a single, valid JSON object with a single key 'leads' containing an array of lead objects. "
            f"The structure should conform to this Pydantic schema: {LeadList.schema_json(indent=2)}"
        )
        
        response_text = agent.run(prompt)
        json_data = extract_json_from_response(response_text)

        if not json_data:
            logger.error(f"Could not extract valid JSON from agent response. Raw response: {response_text}")
            return jsonify({"error": "Agent returned a non-JSON response."}), 502

        # Validate the extracted JSON against the Pydantic model
        validated_data = LeadList(**json_data)
        logger.info(f"Successfully generated and validated {len(validated_data.leads)} leads.")
        
        return jsonify(validated_data.dict())

    except ValidationError as e:
        logger.error(f"Pydantic validation failed. Errors: {e.errors()}. JSON data: {json_data}")
        return jsonify({"error": "Agent returned data in an invalid structure.", "details": e.errors()}), 502
    except Exception as e:
        logger.error(f"An unexpected error occurred in /generate-leads: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred."}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)


