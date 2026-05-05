import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { configRouter } from "./config";
import { geminiRouter } from "./gemini";
import { performanceRouter } from "./performance";
import { scrapeRouter } from "./scrape";

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api", configRouter);
  app.use("/api", geminiRouter);
  app.use("/api", performanceRouter);
  app.use("/api", scrapeRouter);
  return app;
};

describe("backend route contracts", () => {
  it("returns configuration status with module readiness fields", async () => {
    const app = createTestApp();

    const response = await request(app).get("/api/config/status");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        gemini: expect.any(Boolean),
        pagespeed: expect.any(Boolean),
        googleMaps: expect.any(Boolean),
        strategyMode: expect.stringMatching(/ready|blocked/),
        auditMode: expect.stringMatching(/ready|degraded|blocked/),
        leadSearchMode: expect.stringMatching(/ready|degraded/),
        missingVariables: expect.any(Array),
      }),
    );
  });

  it("validates missing strategy input before hitting Gemini", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/gemini/strategy")
      .send({ input: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/descripción del negocio/i);
  });

  it("validates missing scraped data before running website analysis", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/gemini/website-analysis")
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/datos del sitio web/i);
  });

  it("rejects localhost targets in performance analysis", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/analyze/performance")
      .send({ url: "http://localhost:3000" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/URL inválida|no permitida/i);
  });

  it("rejects private-network scrape targets", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/proxy/scrape")
      .send({ url: "http://127.0.0.1:8080" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/locales|privadas|IP privada/i);
  });
});
