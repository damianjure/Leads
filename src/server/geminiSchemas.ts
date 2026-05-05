import { Type } from "@google/genai";

export const strategyResponseSchema = {
  type: Type.OBJECT,
  properties: {
    business: {
      type: Type.OBJECT,
      properties: {
        business_type: { type: Type.STRING },
        target_niche: { type: Type.STRING },
        location: { type: Type.STRING },
        services: { type: Type.ARRAY, items: { type: Type.STRING } },
        customer_type: { type: Type.STRING },
      },
      required: ["business_type", "target_niche", "location", "services", "customer_type"],
    },
    persona: {
      type: Type.OBJECT,
      properties: {
        industry: { type: Type.STRING },
        company_size: { type: Type.STRING },
        pain_points: { type: Type.ARRAY, items: { type: Type.STRING } },
        goals: { type: Type.ARRAY, items: { type: Type.STRING } },
        channels: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["industry", "company_size", "pain_points", "goals", "channels"],
    },
    ads: {
      type: Type.OBJECT,
      properties: {
        channels: { type: Type.ARRAY, items: { type: Type.STRING } },
        targeting: { type: Type.ARRAY, items: { type: Type.STRING } },
        strategy: { type: Type.STRING },
      },
      required: ["channels", "targeting", "strategy"],
    },
  },
  required: ["business", "persona", "ads"],
} as const;

export const websiteAnalysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    performance_score: { type: Type.NUMBER },
    lead_capture_readiness: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
    seo_checklist: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          item: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["pass", "fail"] },
          score: { type: Type.NUMBER },
          details: { type: Type.STRING },
        },
        required: ["item", "status", "score"],
      },
    },
    seo_breakdown: {
      type: Type.OBJECT,
      properties: {
        title_score: { type: Type.NUMBER },
        meta_score: { type: Type.NUMBER },
        h1_score: { type: Type.NUMBER },
        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["title_score", "meta_score", "h1_score", "keywords"],
    },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["performance_score", "lead_capture_readiness", "seo_checklist", "seo_breakdown", "improvements"],
} as const;
