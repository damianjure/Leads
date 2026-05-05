import { GoogleGenAI } from "@google/genai";

export const PORT = Number(process.env.PORT || 3000);

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
export const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;
export const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

export const getConfigStatus = () => {
  const gemini = Boolean(GEMINI_API_KEY);
  const pagespeed = Boolean(PAGESPEED_API_KEY);
  const googleMaps = Boolean(GOOGLE_MAPS_API_KEY);
  const missingVariables = [
    !gemini ? "GEMINI_API_KEY" : null,
    !pagespeed ? "PAGESPEED_API_KEY" : null,
    !googleMaps ? "GOOGLE_MAPS_API_KEY" : null,
  ].filter(Boolean);

  return {
    gemini,
    pagespeed,
    googleMaps,
    strategyMode: gemini ? "ready" : "blocked",
    auditMode: gemini ? (pagespeed ? "ready" : "degraded") : "blocked",
    leadSearchMode: googleMaps ? "ready" : "degraded",
    missingVariables,
  } as const;
};
