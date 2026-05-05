import { AppConfigStatus } from "../types";

export const countReadyConnectors = (config: AppConfigStatus | null) =>
  [config?.gemini, config?.pagespeed, config?.googleMaps].filter(Boolean).length;

export const getMissingVariablesLabel = (config: AppConfigStatus | null) => {
  if (!config) return "No se pudo leer la configuración actual.";
  if (!config.missingVariables.length) return "Todo configurado. La experiencia completa ya está habilitada.";

  return `Variables pendientes: ${config.missingVariables.join(", ")}`;
};
