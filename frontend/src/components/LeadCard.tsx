import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Phone, Globe, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Lead } from "@/types/lead";

interface LeadCardProps {
  lead: Lead;
}

const getConfidenceBadge = (confidence: string) => {
  switch (confidence) {
    case 'High':
      return (
        <Badge variant="default" className="bg-success hover:bg-success text-success-foreground">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          High Confidence
        </Badge>
      );
    case 'Medium':
      return (
        <Badge variant="secondary" className="bg-warning hover:bg-warning text-warning-foreground">
          <AlertCircle className="mr-1 h-3 w-3" />
          Medium Confidence
        </Badge>
      );
    case 'Low':
      return (
        <Badge variant="outline" className="border-destructive text-destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Low Confidence
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {confidence}
        </Badge>
      );
  }
};

const formatValue = (value: string) => {
  return value === 'N/A' ? 'Not Available' : value;
};

export function LeadCard({ lead }: LeadCardProps) {
  const handlePhoneClick = () => {
    if (lead.phone !== 'N/A') {
      window.open(`tel:${lead.phone}`);
    }
  };

  const handleWebsiteClick = () => {
    if (lead.website !== 'N/A') {
      window.open(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`, '_blank');
    }
  };

  const handleSourceClick = () => {
    window.open(lead.source.startsWith('http') ? lead.source : `https://${lead.source}`, '_blank');
  };

  return (
    <Card className="group shadow-card hover:shadow-glow transition-all duration-300 bg-gradient-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold leading-tight text-card-foreground group-hover:text-primary transition-colors">
            {lead.name}
          </h3>
          {getConfidenceBadge(lead.confidence_score)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Address */}
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm text-card-foreground leading-relaxed">
            {formatValue(lead.address)}
          </span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
          {lead.phone !== 'N/A' ? (
            <Button
              variant="link"
              className="h-auto p-0 text-sm font-normal text-primary hover:text-primary-glow"
              onClick={handlePhoneClick}
            >
              {lead.phone}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Not Available</span>
          )}
        </div>

        {/* Website */}
        <div className="flex items-center gap-3">
          <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          {lead.website !== 'N/A' ? (
            <Button
              variant="link"
              className="h-auto p-0 text-sm font-normal text-primary hover:text-primary-glow"
              onClick={handleWebsiteClick}
            >
              <span className="truncate">{lead.website}</span>
              <ExternalLink className="ml-1 h-3 w-3 shrink-0" />
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">Not Available</span>
          )}
        </div>

        {/* Source */}
        <div className="pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
            onClick={handleSourceClick}
          >
            View Source
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}