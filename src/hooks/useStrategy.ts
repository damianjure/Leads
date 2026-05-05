import { useState } from "react";
import { geminiApi } from "../lib/geminiApi";
import { getErrorMessage } from "../lib/errors";
import { AdRecommendation, BusinessInfo, BuyerPersona } from "../types";

export const useStrategy = () => {
  const [loading, setLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [data, setData] = useState<{ business: BusinessInfo; persona: BuyerPersona } | null>(null);
  const [ads, setAds] = useState<AdRecommendation | null>(null);

  const generateStrategy = async (description: string) => {
    if (!description.trim()) {
      setStrategyError("Describí tu negocio antes de generar la estrategia.");
      return;
    }

    setLoading(true);
    setStrategyError(null);

    try {
      const result = await geminiApi.generateStrategy(description);

      setData({ business: result.business, persona: result.persona });
      setAds(result.ads);
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error(error);
      setData(null);
      setAds(null);
      setStrategyError(
        getErrorMessage(error, "No se pudo generar la estrategia. Revisá la configuración e intentá de nuevo."),
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    strategyError,
    data,
    ads,
    generateStrategy,
  };
};
