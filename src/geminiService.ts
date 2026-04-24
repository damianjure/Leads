import { GoogleGenAI, Type } from "@google/genai";
import { BusinessInfo, BuyerPersona, AdRecommendation, WebsiteAnalysis } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  // 5.1 & 5.2 Extract Business Info & Persona
  async analyzeBusiness(input: string): Promise<{ business: BusinessInfo; persona: BuyerPersona }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza esta descripción de negocio y devuelve información estructurada del negocio y un buyer persona.
      IMPORTANTE: Todas las respuestas descriptivas, nombres de industrias, puntos de dolor y metas DEBEN ESTAR EN ESPAÑOL.
      Input: "${input}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
            }
          },
          required: ["business", "persona"]
        }
      }
    });

    return JSON.parse(response.text);
  },

  // 5.5 Advertising Recommendations
  async recommendAds(business: BusinessInfo, persona: BuyerPersona): Promise<AdRecommendation> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Basado en este negocio y persona, sugiere canales publicitarios, segmentación y estrategia.
      IMPORTANTE: Todas las explicaciones y la estrategia DEBEN ESTAR EN ESPAÑOL.
      Business: ${JSON.stringify(business)}
      Persona: ${JSON.stringify(persona)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            channels: { type: Type.ARRAY, items: { type: Type.STRING } },
            targeting: { type: Type.ARRAY, items: { type: Type.STRING } },
            strategy: { type: Type.STRING },
          },
          required: ["channels", "targeting", "strategy"],
        }
      }
    });

    return JSON.parse(response.text);
  },

  // 5.4 Website Analysis (Interpreting Scraped Data)
  async analyzeWebsite(scrapedData: any): Promise<WebsiteAnalysis> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza los siguientes datos de un sitio web y proporciona una puntuación de SEO/Conversión e insights detallados.
      Calcula puntuaciones específicas (0-100) para el Título, Meta Descripción y presencia de H1 basándote en su calidad y longitud.
      Identifica las palabras clave (keywords) principales.
      IMPORTANTE: Todas las explicaciones, mejoras y descripción de ítems DEBEN ESTAR EN ESPAÑOL.
      Data: ${JSON.stringify(scrapedData)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
                  details: { type: Type.STRING }
                },
                required: ["item", "status", "score"]
              }
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
        }
      }
    });

    return JSON.parse(response.text);
  }
};
