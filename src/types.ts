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
