import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "../utils/activityLogger";

export const invoicesRouter = Router();

invoicesRouter.use(authenticateToken);

invoicesRouter.get("/", (req, res) => {
  // Auto-update overdue invoices
  const today = new Date().toISOString().split('T')[0];
  db.prepare("UPDATE invoices SET estado = 'vencida' WHERE estado = 'pendiente' AND fecha_vencimiento < ?").run(today);

  const invoices = db.prepare(`
    SELECT i.*, c.nombre_cliente, c.nombre_negocio 
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.fecha_emision DESC
  `).all();
  res.json(invoices);
});

invoicesRouter.post("/", (req, res) => {
  const id = uuidv4();
  const { client_id, tipo, total, fecha_vencimiento } = req.body;
  const numero_factura = `2026-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  db.prepare(`
    INSERT INTO invoices (id, client_id, tipo, numero_factura, fecha_emision, fecha_vencimiento, estado, total)
    VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)
  `).run(id, client_id, tipo, numero_factura, new Date().toISOString().split('T')[0], fecha_vencimiento, total);
  
  const newInvoice = db.prepare(`
    SELECT i.*, c.nombre_cliente, c.nombre_negocio 
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(id) as any;
  
  logActivity("invoice", id, "crear", (req as any).user?.email || "system", `Factura ${numero_factura} creada para ${newInvoice.nombre_cliente}`);
  
  res.json(newInvoice);
});

invoicesRouter.put("/:id/status", (req, res) => {
  const { estado } = req.body;
  db.prepare("UPDATE invoices SET estado = ? WHERE id = ?").run(estado, req.params.id);
  
  const invoice = db.prepare("SELECT numero_factura FROM invoices WHERE id = ?").get(req.params.id) as any;
  if (invoice) {
    logActivity("invoice", req.params.id, "actualizar_estado", (req as any).user?.email || "system", `Estado de factura ${invoice.numero_factura} cambiado a: ${estado}`);
  }
  
  res.json({ success: true });
});
