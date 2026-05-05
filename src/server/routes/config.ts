import { Router } from "express";
import { getConfigStatus } from "../config";

export const configRouter = Router();

configRouter.get("/config/status", (_req, res) => {
  res.json(getConfigStatus());
});
