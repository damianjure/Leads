import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";

const isProduction = process.env.NODE_ENV === "production";
const ONE_MINUTE_MS = 60_000;

const createLimiter = (max: number, message: string) =>
  rateLimit({
    windowMs: ONE_MINUTE_MS,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
  });

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://*.googleusercontent.com", "https://*.google.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    } : false,
  }),
  cors({
    origin: process.env.CORS_ORIGIN || (isProduction ? false : "*"),
    methods: ["GET", "POST"],
  }),
] as const;

export const apiLimiter = createLimiter(30, "Demasiadas solicitudes. Esperá un momento e intentá de nuevo.");
export const geminiLimiter = createLimiter(10, "Demasiadas solicitudes a la IA. Esperá un momento.");
export const scrapeLimiter = createLimiter(15, "Demasiados escaneos. Esperá un momento.");
export const geocodeLimiter = createLimiter(10, "Demasiadas solicitudes de geocodificación. Esperá un momento.");
export const performanceLimiter = createLimiter(10, "Demasiadas solicitudes de auditoría. Esperá un momento.");
export const placesLimiter = createLimiter(10, "Demasiadas búsquedas de negocios. Esperá un momento.");
