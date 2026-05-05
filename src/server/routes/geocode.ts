import { Router } from "express";
import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "../config";
import { geocodeLimiter } from "../security";
import { getErrorMessage } from "../geminiUtils";

export const geocodeRouter = Router();

geocodeRouter.get("/google/geocode", geocodeLimiter, async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: "Se requiere una dirección." });

  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn("GOOGLE_MAPS_API_KEY no está configurada");
      return res.json({
        results: [{
          geometry: { location: { lat: 40.4168, lng: -3.7038 } },
          formatted_address: "Madrid, España (Demo)"
        }],
        source: "demo",
        note: "Configurá GOOGLE_MAPS_API_KEY para geocodificación real.",
      });
    }

    const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });
    res.json({ ...response.data, source: "live" });
  } catch (error: unknown) {
    console.error("Error de geocodificación:", getErrorMessage(error, "Error desconocido en geocodificación"));
    res.status(500).json({ error: "Fallo en el servicio de geocodificación." });
  }
});
