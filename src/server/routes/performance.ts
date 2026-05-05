import { Router } from "express";
import axios from "axios";
import { PAGESPEED_API_KEY } from "../config";
import { performanceLimiter } from "../security";
import { getErrorMessage } from "../geminiUtils";
import { assertPublicHttpUrl } from "../urlSafety";

export const performanceRouter = Router();

performanceRouter.post("/analyze/performance", performanceLimiter, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Se requiere una URL." });

  let safeUrl: string;
  try {
    safeUrl = await assertPublicHttpUrl(url);
  } catch {
    return res.status(400).json({ error: "URL inválida o no permitida." });
  }

  const estimateData = () => ({
    performance_score: Math.floor(Math.random() * 40) + 40,
    seo_score: Math.floor(Math.random() * 30) + 50,
    accessibility_score: 85,
    best_practices_score: 90,
    is_real: false,
    audited_url: safeUrl,
    source: "estimated" as const,
  });

  if (!PAGESPEED_API_KEY || PAGESPEED_API_KEY.length <= 10) {
    return res.json({
      ...estimateData(),
      note: "Configurá PAGESPEED_API_KEY para datos reales.",
    });
  }

  try {
    const categories = ["PERFORMANCE", "SEO", "ACCESSIBILITY", "BEST_PRACTICES"];
    const params = new URLSearchParams();
    params.append("url", safeUrl);
    params.append("key", PAGESPEED_API_KEY);
    params.append("strategy", "DESKTOP");
    categories.forEach((cat) => params.append("category", cat));

    const psRes = await axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`);
    const categoriesData = psRes.data.lighthouseResult.categories;

    return res.json({
      performance_score: Math.round(categoriesData.performance.score * 100),
      seo_score: Math.round(categoriesData.seo.score * 100),
      accessibility_score: Math.round(categoriesData.accessibility.score * 100),
      best_practices_score: Math.round(categoriesData["best-practices"].score * 100),
      is_real: true,
      audited_url: safeUrl,
      source: "live",
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, "Error desconocido en PageSpeed");
    console.error("Error de PageSpeed:", message);
    return res.json({
      ...estimateData(),
      note: `Fallo al conectar con Google PageSpeed. Usando métricas estimadas.`,
    });
  }
});
