import {
  ApiErrorResponse,
  AppConfigStatus,
  GeocodeResponse,
  PerformanceAuditResponse,
  PlaceDetailsResponse,
  PlacesSearchResponse,
  ScrapedWebsiteData,
} from "../types";

const getApiErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "error" in payload) {
    const value = (payload as ApiErrorResponse).error;
    if (typeof value === "string" && value.trim()) return value;
  }

  return fallback;
};

const FETCH_TIMEOUT_MS = 30_000;

export const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit, fallbackError = "La solicitud falló"): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(input, { ...init, signal: controller.signal });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new Error("Respuesta inválida del servidor (no es JSON).");
    }

    if (!response.ok) {
      throw new Error(getApiErrorMessage(payload, fallbackError));
    }

    return payload as T;
  } finally {
    clearTimeout(timer);
  }
};

export const api = {
  getConfigStatus: () =>
    fetchJson<AppConfigStatus>("/api/config/status", undefined, "No se pudo leer el estado de configuración."),

  getGeocode: (address: string) =>
    fetchJson<GeocodeResponse>(
      `/api/google/geocode?address=${encodeURIComponent(address)}`,
      undefined,
      "No se pudo geocodificar la ubicación.",
    ),

  analyzePerformance: (url: string) =>
    fetchJson<PerformanceAuditResponse>(
      "/api/analyze/performance",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      },
      "No se pudo auditar performance.",
    ),

  scrapeWebsite: (url: string) =>
    fetchJson<ScrapedWebsiteData>(
      "/api/proxy/scrape",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      },
      "No se pudo inspeccionar el sitio.",
    ),

  searchPlaces: (query: string, location?: string, radius?: number) =>
    fetchJson<PlacesSearchResponse>(
      "/api/google/places-search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, location, radius }),
      },
      "No se pudo buscar negocios.",
    ),

  getPlaceDetails: (place_id: string) =>
    fetchJson<PlaceDetailsResponse>(
      `/api/google/place-details?place_id=${encodeURIComponent(place_id)}`,
      undefined,
      "No se pudieron obtener detalles del negocio.",
    ),
};
