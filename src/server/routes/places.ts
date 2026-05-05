import { Router } from "express";
import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "../config";
import { placesLimiter } from "../security";
import { getErrorMessage } from "../geminiUtils";

export const placesRouter = Router();

const PLACES_FIELDS = "name,formatted_address,geometry,rating,user_ratings_total,place_id,types,photos,business_status,opening_hours";
const DETAILS_FIELDS = "formatted_phone_number,website,url,photo";

const scoreFromRatings = (totalRatings: number): "HIGH" | "MEDIUM" | "LOW" => {
  if (totalRatings >= 100) return "HIGH";
  if (totalRatings >= 10) return "MEDIUM";
  return "LOW";
};

placesRouter.post("/google/places-search", placesLimiter, async (req, res) => {
  const { query, location, radius = 5000 } = req.body;
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Se requiere un tipo de negocio para buscar." });
  }

  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return res.json({
        leads: [],
        source: "demo",
        note: "Configurá GOOGLE_MAPS_API_KEY para búsqueda real de negocios.",
      });
    }

    const params = new URLSearchParams();
    params.append("query", query);
    if (location) params.append("location", location);
    params.append("radius", String(radius));
    params.append("key", GOOGLE_MAPS_API_KEY);
    params.append("language", "es");

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`
    );

    const results = response.data.results || [];
    const leads = results.map((place: Record<string, unknown>) => ({
      id: (place.place_id as string) || String(Math.random()),
      name: (place.name as string) || "Sin nombre",
      category: query,
      address: (place.formatted_address as string) || (place.vicinity as string) || "",
      lat: (place.geometry as { location: { lat: number } })?.location?.lat,
      lng: (place.geometry as { location: { lng: number } })?.location?.lng,
      rating: (place.rating as number) || undefined,
      totalRatings: (place.user_ratings_total as number) || 0,
      opportunity_score: scoreFromRatings((place.user_ratings_total as number) || 0),
      place_id: place.place_id as string,
      types: (place.types as string[]) || [],
      photoUrl: undefined,
    }));

    res.json({
      leads,
      source: "live",
      nextPageToken: (response.data.next_page_token as string) || undefined,
    });
  } catch (error: unknown) {
    console.error("Error de Places Search:", getErrorMessage(error, "Error desconocido en Places Search"));
    res.status(500).json({ error: "Fallo en la búsqueda de negocios. Intentá de nuevo." });
  }
});

placesRouter.get("/google/place-details", placesLimiter, async (req, res) => {
  const { place_id } = req.query;
  if (!place_id || typeof place_id !== "string") {
    return res.status(400).json({ error: "Se requiere un place_id." });
  }

  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return res.json({});
    }

    const params = new URLSearchParams();
    params.append("place_id", place_id);
    params.append("fields", DETAILS_FIELDS);
    params.append("key", GOOGLE_MAPS_API_KEY);
    params.append("language", "es");

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
    );

    const result = response.data.result || {};

    res.json({
      phone: result.formatted_phone_number || undefined,
      website: result.website || undefined,
      url: result.url || undefined,
      photoUrl: result.photos?.[0]?.photo_reference
        ? `/api/google/place-photo?ref=${result.photos[0].photo_reference}`
        : undefined,
    });
  } catch (error: unknown) {
    console.error("Error de Place Details:", getErrorMessage(error, "Error desconocido en Place Details"));
    res.status(500).json({ error: "Fallo al obtener detalles del negocio." });
  }
});

placesRouter.get("/google/place-photo", async (req, res) => {
  const { ref } = req.query;
  if (!ref || typeof ref !== "string" || !GOOGLE_MAPS_API_KEY) {
    return res.status(400).json({ error: "Referencia de foto inválida." });
  }

  try {
    const params = new URLSearchParams();
    params.append("photoreference", ref);
    params.append("maxwidth", "400");
    params.append("key", GOOGLE_MAPS_API_KEY);

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/photo?${params.toString()}`,
      { responseType: "arraybuffer" }
    );

    const contentType = String(response.headers["content-type"] || "image/jpeg");
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=86400");
    res.send(response.data);
  } catch (error: unknown) {
    console.error("Error de Place Photo:", getErrorMessage(error, "Error desconocido en Place Photo"));
    res.status(500).json({ error: "Fallo al cargar la foto." });
  }
});
