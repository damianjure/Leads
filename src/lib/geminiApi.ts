import { BusinessInfo, BuyerPersona, AdRecommendation, ScrapedWebsiteData, WebsiteAnalysis } from "../types";
import { fetchJson } from "./api";

export const geminiApi = {
  async generateStrategy(input: string): Promise<{
    business: BusinessInfo;
    persona: BuyerPersona;
    ads: AdRecommendation;
  }> {
    return fetchJson("/api/gemini/strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input }),
    }, "No se pudo generar la estrategia.");
  },

  async analyzeWebsite(scrapedData: ScrapedWebsiteData): Promise<WebsiteAnalysis> {
    return fetchJson("/api/gemini/website-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scrapedData }),
    }, "No se pudo analizar el sitio web.");
  },
};
