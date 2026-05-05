import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { PORT } from "./src/server/config";
import { configRouter } from "./src/server/routes/config";
import { geminiRouter } from "./src/server/routes/gemini";
import { geocodeRouter } from "./src/server/routes/geocode";
import { performanceRouter } from "./src/server/routes/performance";
import { scrapeRouter } from "./src/server/routes/scrape";
import { placesRouter } from "./src/server/routes/places";
import { apiLimiter, securityMiddleware } from "./src/server/security";

async function startServer() {
  const app = express();

  app.use(...securityMiddleware);
  app.use(express.json());
  app.use("/api/", apiLimiter);
  app.use("/api", configRouter);
  app.use("/api", geminiRouter);
  app.use("/api", geocodeRouter);
  app.use("/api", performanceRouter);
  app.use("/api", scrapeRouter);
  app.use("/api", placesRouter);

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
    app.get("*", (req, res, next) => {
      res.sendFile(path.join(distPath, "index.html"), (err) => {
        if (err) next(err);
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
