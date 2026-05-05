import { Router } from "express";
import { Type } from "@google/genai";
import { ai } from "../config";
import { geminiLimiter } from "../security";
import { strategyResponseSchema, websiteAnalysisResponseSchema } from "../geminiSchemas";
import { getErrorMessage, sanitizePromptInput } from "../geminiUtils";

export const geminiRouter = Router();

geminiRouter.post("/gemini/strategy", geminiLimiter, async (req, res) => {
  const { input } = req.body;
  if (!input || typeof input !== "string" || !input.trim()) {
    return res.status(400).json({ error: "Se requiere una descripción del negocio." });
  }

  if (!ai) {
    return res.status(503).json({ error: "Falta GEMINI_API_KEY. Cargala para habilitar estrategia." });
  }

  try {
    const sanitized = sanitizePromptInput(input);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza esta descripción de negocio y devuelve información estructurada del negocio y un buyer persona.
        IMPORTANTE: Todas las respuestas descriptivas, nombres de industrias, puntos de dolor y metas DEBEN ESTAR EN ESPAÑOL.
        Input: "${sanitized}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: strategyResponseSchema as unknown as { type: Type },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía de Gemini");
    const parsed = JSON.parse(text) as { business: unknown; persona: unknown; ads: unknown };
    res.json({ business: parsed.business, persona: parsed.persona, ads: parsed.ads });
  } catch (error: unknown) {
    console.error("Gemini strategy error:", getErrorMessage(error, "Error desconocido al generar estrategia"));
    res.status(500).json({ error: "No se pudo generar la estrategia. Intentá de nuevo." });
  }
});

geminiRouter.post("/gemini/website-analysis", geminiLimiter, async (req, res) => {
  const { scrapedData } = req.body;
  if (!scrapedData || typeof scrapedData !== "object") {
    return res.status(400).json({ error: "Se requieren datos del sitio web para analizar." });
  }

  if (!ai) {
    return res.status(503).json({ error: "Falta GEMINI_API_KEY. Cargala para habilitar auditoría inteligente." });
  }

  try {
    const sanitizedData = {
      ...scrapedData,
      title: sanitizePromptInput(scrapedData.title || ""),
      meta_description: sanitizePromptInput(scrapedData.meta_description || ""),
      h1: sanitizePromptInput(scrapedData.h1 || ""),
      body_preview: sanitizePromptInput(scrapedData.body_preview || ""),
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza los siguientes datos de un sitio web y proporciona una puntuación de SEO/Conversión e insights detallados.
        Calcula puntuaciones específicas (0-100) para el Título, Meta Descripción y presencia de H1 basándote en su calidad y longitud.
        Identifica las palabras clave (keywords) principales.
        IMPORTANTE: Todas las explicaciones, mejoras y descripción de ítems DEBEN ESTAR EN ESPAÑOL.
        Data: ${JSON.stringify(sanitizedData).slice(0, 8000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: websiteAnalysisResponseSchema as unknown as { type: Type },
      },
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía de Gemini");
    res.json(JSON.parse(text));
  } catch (error: unknown) {
    console.error("Gemini website analysis error:", getErrorMessage(error, "Error desconocido al analizar sitio web"));
    res.status(500).json({ error: "No se pudo analizar el sitio web. Intentá de nuevo." });
  }
});
