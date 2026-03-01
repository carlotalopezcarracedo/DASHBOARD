import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "../utils/activityLogger";

export const servicesRouter = Router();

servicesRouter.use(authenticateToken);

servicesRouter.get("/", (req, res) => {
  const services = db.prepare("SELECT * FROM services_catalog ORDER BY nombre_servicio ASC").all();
  res.json(services);
});

servicesRouter.post("/", (req, res) => {
  const id = uuidv4();
  const { nombre_servicio, tipo_precio, precio_setup, precio_mensual, descripcion } = req.body;
  
  db.prepare(`
    INSERT INTO services_catalog (id, nombre_servicio, tipo_precio, precio_setup, precio_mensual, descripcion, activo)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(id, nombre_servicio, tipo_precio, precio_setup, precio_mensual, descripcion);
  
  const newService = db.prepare("SELECT * FROM services_catalog WHERE id = ?").get(id);
  
  logActivity("service", id, "crear", (req as any).user?.email || "system", `Servicio creado: ${nombre_servicio}`);
  
  res.json(newService);
});
