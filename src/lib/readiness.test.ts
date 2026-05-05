import { describe, expect, it } from "vitest";
import { countReadyConnectors, getMissingVariablesLabel } from "./readiness";
import { AppConfigStatus } from "../types";

const baseConfig: AppConfigStatus = {
  gemini: true,
  pagespeed: false,
  googleMaps: true,
  strategyMode: "ready",
  auditMode: "degraded",
  leadSearchMode: "ready",
  missingVariables: ["PAGESPEED_API_KEY"],
};

describe("readiness helpers", () => {
  it("counts enabled connectors", () => {
    expect(countReadyConnectors(baseConfig)).toBe(2);
  });

  it("returns a helpful missing variables label", () => {
    expect(getMissingVariablesLabel(baseConfig)).toContain("PAGESPEED_API_KEY");
  });

  it("returns success label when everything is configured", () => {
    const config: AppConfigStatus = {
      ...baseConfig,
      pagespeed: true,
      auditMode: "ready",
      missingVariables: [],
    };

    expect(getMissingVariablesLabel(config)).toContain("Todo configurado");
  });

  it("returns fallback label when config is unavailable", () => {
    expect(getMissingVariablesLabel(null)).toContain("No se pudo leer");
  });
});
