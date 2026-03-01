import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";

export const activityRouter = Router();

activityRouter.use(authenticateToken);

activityRouter.get("/", (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  
  const logs = db.prepare(`
    SELECT * FROM activity_log 
    ORDER BY fecha DESC 
    LIMIT ?
  `).all(limit);
  
  res.json(logs);
});

activityRouter.get("/:entity/:entityId", (req, res) => {
  const { entity, entityId } = req.params;
  
  const logs = db.prepare(`
    SELECT * FROM activity_log 
    WHERE entidad = ? AND entidad_id = ?
    ORDER BY fecha DESC
  `).all(entity, entityId);
  
  res.json(logs);
});
