import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "../utils/activityLogger";

export const clientsRouter = Router();

clientsRouter.use(authenticateToken);

clientsRouter.get("/", (req, res) => {
  const clients = db.prepare("SELECT * FROM clients ORDER BY fecha_alta DESC").all();
  res.json(clients);
});

clientsRouter.post("/", (req, res) => {
  const id = uuidv4();
  const { nombre_cliente, nombre_negocio, sector, estado_relacion, prioridad, fecha_alta } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO clients (id, nombre_cliente, nombre_negocio, sector, estado_relacion, prioridad, fecha_alta)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, nombre_cliente, nombre_negocio, sector, estado_relacion, prioridad, fecha_alta || new Date().toISOString().split('T')[0]);
  
  const newClient = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
  
  logActivity("client", id, "crear", (req as any).user?.email || "system", `Cliente creado: ${nombre_cliente}`);
  
  res.json(newClient);
});

clientsRouter.get("/:id", (req, res) => {
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id);
  if (!client) return res.status(404).json({ error: "Client not found" });
  res.json(client);
});

clientsRouter.put("/:id", (req, res) => {
  const { nombre_cliente, nombre_negocio, sector, estado_relacion, prioridad } = req.body;
  const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(req.params.id) as any;
  
  if (!client) return res.status(404).json({ error: "Client not found" });

  const stmt = db.prepare(`
    UPDATE clients 
    SET nombre_cliente = ?, nombre_negocio = ?, sector = ?, estado_relacion = ?, prioridad = ?
    WHERE id = ?
  `);
  stmt.run(
    nombre_cliente !== undefined ? nombre_cliente : client.nombre_cliente, 
    nombre_negocio !== undefined ? nombre_negocio : client.nombre_negocio, 
    sector !== undefined ? sector : client.sector, 
    estado_relacion !== undefined ? estado_relacion : client.estado_relacion, 
    prioridad !== undefined ? prioridad : client.prioridad, 
    req.params.id
  );
  
  if (estado_relacion !== undefined && estado_relacion !== client.estado_relacion) {
    logActivity("client", req.params.id, "actualizar_estado", (req as any).user?.email || "system", `Estado cambiado a: ${estado_relacion}`);
  }
  
  res.json({ success: true });
});
