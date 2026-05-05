import { Router } from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import { scrapeLimiter } from "../security";
import { getErrorMessage } from "../geminiUtils";
import { assertPublicHttpUrl } from "../urlSafety";

export const scrapeRouter = Router();

scrapeRouter.post("/proxy/scrape", scrapeLimiter, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Se requiere una URL." });

  try {
    const safeUrl = await assertPublicHttpUrl(url);
    const response = await axios.get(safeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });
    const $ = cheerio.load(response.data);

    res.json({
      title: $("title").text().trim(),
      meta_description: $("meta[name='description']").attr("content") || "",
      h1: $("h1").first().text().trim(),
      body_preview: $("body").text().slice(0, 3000).replace(/\s+/g, " ").trim(),
      forms_count: $("form").length,
      has_cta: $("button, a.btn, a.button").length > 0,
    });
  } catch (error: unknown) {
    const message = getErrorMessage(error, "Error desconocido al escanear");
    console.error("Error de escaneo:", message);
    const isSafeError = /URL inválida|Solo se permiten|No se permiten|resuelve a una IP privada/i.test(message);
    res.status(isSafeError ? 400 : 500).json({ error: isSafeError ? message : "No se pudo escanear el sitio. Puede estar bloqueando acceso automatizado." });
  }
});
