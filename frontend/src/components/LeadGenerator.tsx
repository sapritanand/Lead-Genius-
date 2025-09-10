import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Search, Target, Zap } from "lucide-react";
import { LeadCard } from "./LeadCard";
import { Lead, LeadRequest, LeadResponse } from "@/types/lead";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export function LeadGenerator() {
  const [formData, setFormData] = useState<LeadRequest>({
    business_type: "",
    location: "",
  });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_type.trim() || !formData.location.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both business type and location.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLeads([]);

    try {
      const response = await fetch(`${API_BASE_URL}/generate-leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate leads");
      }

      const data: LeadResponse = await response.json();
      setLeads(data.leads);
      
      toast({
        title: "Leads Generated Successfully",
        description: `Found ${data.leads.length} potential leads for your business.`,
      });
    } catch (error) {
      console.error("Error generating leads:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="container relative mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-5xl font-bold text-primary-foreground">
              Generate High-Quality
              <span className="bg-gradient-to-r from-white to-primary-glow bg-clip-text text-transparent">
                {" "}Business Leads
              </span>
            </h1>
            <p className="mb-8 text-xl text-primary-foreground/90">
              Powered by AI to find verified business contacts with confidence scores and source verification
            </p>
            
            {/* Feature Pills */}
            <div className="mb-12 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-primary-foreground">
                <Target className="h-4 w-4" />
                <span>Verified Data</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-primary-foreground">
                <Zap className="h-4 w-4" />
                <span>AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-primary-foreground">
                <Search className="h-4 w-4" />
                <span>Real-Time Search</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Lead Generation Form */}
        <Card className="mx-auto mb-12 max-w-2xl shadow-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Generate Your Leads</CardTitle>
            <CardDescription>
              Enter your target business type and location to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type</Label>
                <Input
                  id="business_type"
                  placeholder="e.g., restaurants, dental clinics, law firms"
                  value={formData.business_type}
                  onChange={(e) =>
                    setFormData({ ...formData, business_type: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York, NY or Los Angeles, CA"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="h-12"
                />
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                variant="gradient"
                className="h-12 w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Leads...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Generate Leads
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {leads.length > 0 && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold">Your Generated Leads</h2>
              <p className="text-muted-foreground">
                Found {leads.length} potential leads for{" "}
                <span className="font-semibold">{formData.business_type}</span> in{" "}
                <span className="font-semibold">{formData.location}</span>
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {leads.map((lead, index) => (
                <LeadCard key={index} lead={lead} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && leads.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Ready to Generate Leads?</h3>
            <p className="text-muted-foreground">
              Fill out the form above to start finding potential customers for your business.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}