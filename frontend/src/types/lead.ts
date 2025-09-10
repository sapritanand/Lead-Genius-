export interface Lead {
  name: string;
  address: string;
  phone: string;
  website: string;
  confidence_score: 'High' | 'Medium' | 'Low';
  source: string;
}

export interface LeadResponse {
  leads: Lead[];
}

export interface LeadRequest {
  business_type: string;
  location: string;
}