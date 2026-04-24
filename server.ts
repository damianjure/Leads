import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import * as cheerio from "cheerio";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/api/google/callback" // Redirect URL
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const getRedirectUri = (req: express.Request) => {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['host'];
    return `${protocol}://${host}/api/google/callback`;
  };

  // Google Sheets Export Route
  app.post("/api/google/sheets/export", async (req, res) => {
    const { leads } = req.body;
    
    // Check if we have credentials
    if (!oauth2Client.credentials || !oauth2Client.credentials.access_token) {
      const redirectUri = getRedirectUri(req);
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
        redirect_uri: redirectUri // Pass dynamically
      });
      return res.json({ authUrl });
    }

    try {
      const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      
      // 1. Create a new spreadsheet
      const spreadsheet = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: `Leads Export - ${new Date().toLocaleDateString()}` }
        }
      });

      const spreadsheetId = spreadsheet.data.spreadsheetId;
      if (!spreadsheetId) throw new Error("Could not create spreadsheet");

      // 2. Add header and data
      const values = [
        ["ID", "Nombre", "Categoría", "Dirección", "Teléfono", "Sitio Web", "Puntuación de Oportunidad"],
        ...leads.map((l: any) => [
          l.id, l.name, l.category, l.address, l.phone || "N/A", l.website || "N/A", l.opportunity_score
        ])
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: { values }
      });

      res.json({ success: true, spreadsheetUrl: spreadsheet.data.spreadsheetUrl });
    } catch (error: any) {
      console.error("Sheets export error:", error.message);
      res.status(500).json({ error: "Failed to export to Google Sheets" });
    }
  });

  // OAuth Callback Route
  app.get("/api/google/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    try {
      const redirectUri = getRedirectUri(req);
      const { tokens } = await oauth2Client.getToken({
        code: code as string,
        redirect_uri: redirectUri
      });
      oauth2Client.setCredentials(tokens);
      
      // Success HTML to close popup
      res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h2 style="color: #10b981;">¡Autenticación Exitosa!</h2>
            <p>Ya puedes cerrar esta ventana y volver a la aplicación para guardar tus datos.</p>
            <script>
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("OAuth callback error:", error.message);
      res.status(500).send("Authentication failed");
    }
  });

  // Google Maps Geocoding Proxy
  app.get("/api/google/geocode", async (req, res) => {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: "Address is required" });

    try {
      if (!GOOGLE_MAPS_API_KEY) {
        // Fallback for demo if no key
        console.warn("GOOGLE_MAPS_API_KEY is not set");
        return res.json({ 
          results: [{ 
            geometry: { location: { lat: 40.4168, lng: -3.7038 } },
            formatted_address: "Madrid, Spain (Demo Fallback)"
          }] 
        });
      }

      const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Geocoding error:", error.message);
      res.status(500).json({ error: "Fallo en el servicio de Geocoding" });
    }
  });

  // API Route: PageSpeed Insights Proxy
  app.post("/api/analyze/performance", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      // If we have an API key, use real data
      if (PAGESPEED_API_KEY && PAGESPEED_API_KEY.length > 10) {
        // Construct the URL with multiple category parameters manually to avoid axios array serialization issues
        const categories = ['PERFORMANCE', 'SEO', 'ACCESSIBILITY', 'BEST_PRACTICES'];
        const params = new URLSearchParams();
        params.append('url', url);
        params.append('key', PAGESPEED_API_KEY);
        params.append('strategy', 'DESKTOP');
        categories.forEach(cat => params.append('category', cat));

        const psRes = await axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`);

        const categoriesData = psRes.data.lighthouseResult.categories;
        const auditData = {
          performance_score: Math.round(categoriesData.performance.score * 100),
          seo_score: Math.round(categoriesData.seo.score * 100),
          accessibility_score: Math.round(categoriesData.accessibility.score * 100),
          best_practices_score: Math.round(categoriesData['best-practices'].score * 100),
          is_real: true
        };
        return res.json(auditData);
      }

      // Fallback for demo if no key
      res.json({
        performance_score: Math.floor(Math.random() * 40) + 40,
        seo_score: Math.floor(Math.random() * 30) + 50,
        accessibility_score: 85,
        best_practices_score: 90,
        is_real: false,
        note: "Configura PAGESPEED_API_KEY para datos reales"
      });
    } catch (error: any) {
      console.error("PageSpeed error:", error.message);
      res.status(500).json({ error: "Fallo al conectar con Google PageSpeed" });
    }
  });

  // API Route: Website Scraper Proxy
  app.post("/api/proxy/scrape", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      const $ = cheerio.load(response.data);
      
      // Extract basic SEO and content data
      const data = {
        title: $("title").text().trim(),
        meta_description: $("meta[name='description']").attr("content") || "",
        h1: $("h1").first().text().trim(),
        body_preview: $("body").text().slice(0, 5000).replace(/\s+/g, ' ').trim(), // Limit for AI analysis
        forms_count: $("form").length,
        has_cta: $("button, a.btn, a.button").length > 0,
      };

      res.json(data);
    } catch (error: any) {
      console.error("Scraping error:", error.message);
      res.status(500).json({ error: "Failed to scrape the website. It might be blocking automated access." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
