export interface BusinessInfo {
  business_type: string;
  target_niche: string;
  location: string;
  services: string[];
  customer_type: string;
}

export interface BuyerPersona {
  industry: string;
  company_size: string;
  pain_points: string[];
  goals: string[];
  channels: string[];
}

export interface Lead {
  id: string;
  name: string;
  category: string;
  address: string;
  phone?: string;
  website?: string | null;
  opportunity_score: 'HIGH' | 'MEDIUM' | 'LOW';
  lat?: number;
  lng?: number;
  rating?: number;
  totalRatings?: number;
  place_id?: string;
  types?: string[];
  photoUrl?: string;
}

export interface WebsiteAnalysis {
  performance_score: number;
  seo_score?: number;
  accessibility_score?: number;
  best_practices_score?: number;
  is_real?: boolean;
  lead_capture_readiness: 'LOW' | 'MEDIUM' | 'HIGH';
  seo_checklist: { item: string; status: 'pass' | 'fail'; score: number; details?: string }[];
  seo_breakdown: {
    title_score: number;
    meta_score: number;
    h1_score: number;
    keywords: string[];
  };
  improvements: string[];
}

export interface AdRecommendation {
  channels: string[];
  targeting: string[];
  strategy: string;
}

export interface AppConfigStatus {
  gemini: boolean;
  pagespeed: boolean;
  googleMaps: boolean;
  strategyMode: "ready" | "blocked";
  auditMode: "ready" | "degraded" | "blocked";
  leadSearchMode: "ready" | "degraded" | "places";
  missingVariables: string[];
}

export interface ScrapedWebsiteData {
  title: string;
  meta_description: string;
  h1: string;
  body_preview: string;
  forms_count: number;
  has_cta: boolean;
}

export interface GeocodeResponse {
  results: Array<{
    geometry: { location: { lat: number; lng: number } };
    formatted_address: string;
  }>;
  source: "live" | "demo";
  note?: string;
}

export interface PerformanceAuditResponse {
  performance_score: number;
  seo_score: number;
  accessibility_score: number;
  best_practices_score: number;
  is_real: boolean;
  audited_url: string;
  source: "live" | "estimated";
  note?: string;
}

export interface ApiErrorResponse {
  error: string;
}

export interface PlacesSearchResponse {
  leads: Lead[];
  source: "live" | "demo";
  note?: string;
  nextPageToken?: string;
}

export interface PlaceDetailsResponse {
  phone?: string;
  website?: string;
  photoUrl?: string;
  url?: string;
}
