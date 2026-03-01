import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "../utils/activityLogger";

export const ticketsRouter = Router();

ticketsRouter.use(authenticateToken);

ticketsRouter.get("/", (req, res) => {
  const tickets = db.prepare(`
    SELECT t.*, c.nombre_cliente 
    FROM tickets t 
    LEFT JOIN clients c ON t.client_id = c.id
    ORDER BY t.fecha_creacion DESC
  `).all();
  res.json(tickets);
});

ticketsRouter.post("/", (req, res) => {
  const id = uuidv4();
  const { client_id, titulo, descripcion, prioridad, tipo } = req.body;
  
  db.prepare(`
    INSERT INTO tickets (id, client_id, titulo, descripcion, prioridad, estado, tipo, fecha_creacion)
    VALUES (?, ?, ?, ?, ?, 'nuevo', ?, ?)
  `).run(id, client_id, titulo, descripcion, prioridad, tipo, new Date().toISOString().split('T')[0]);
  
  const newTicket = db.prepare(`
    SELECT t.*, c.nombre_cliente 
    FROM tickets t 
    LEFT JOIN clients c ON t.client_id = c.id 
    WHERE t.id = ?
  `).get(id) as any;
  
  logActivity("ticket", id, "crear", (req as any).user?.email || "system", `Ticket creado: ${titulo} para ${newTicket.nombre_cliente}`);
  if (client_id) {
    logActivity("client", client_id, "ticket_creado", (req as any).user?.email || "system", `Ticket creado: ${titulo}`);
  }
  
  res.json(newTicket);
});

ticketsRouter.put("/:id/status", (req, res) => {
  const { estado } = req.body;
  db.prepare("UPDATE tickets SET estado = ? WHERE id = ?").run(estado, req.params.id);
  
  const ticket = db.prepare("SELECT titulo, client_id FROM tickets WHERE id = ?").get(req.params.id) as any;
  if (ticket) {
    logActivity("ticket", req.params.id, "actualizar_estado", (req as any).user?.email || "system", `Estado de ticket '${ticket.titulo}' cambiado a: ${estado}`);
    if (ticket.client_id) {
      logActivity("client", ticket.client_id, "ticket_actualizado", (req as any).user?.email || "system", `Estado de ticket '${ticket.titulo}' cambiado a: ${estado}`);
    }
  }
  
  res.json({ success: true });
});
