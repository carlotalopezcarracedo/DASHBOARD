import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";

export const dashboardRouter = Router();

dashboardRouter.use(authenticateToken);

dashboardRouter.get("/stats", (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const activeProjects = db.prepare("SELECT COUNT(*) as count FROM projects WHERE estado NOT IN ('entregado', 'cancelado', 'pausado')").get() as any;
  const tasksDueSoon = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE estado NOT IN ('lista', 'cancelada') AND fecha_vencimiento <= ?").get(nextWeek) as any;
  const pendingInvoices = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE estado = 'pendiente'").get() as any;
  const overdueInvoices = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE estado = 'vencida' OR (estado = 'pendiente' AND fecha_vencimiento < ?)").get(today) as any;

  const tasksToday = db.prepare("SELECT * FROM tasks WHERE estado NOT IN ('lista', 'cancelada') AND fecha_vencimiento = ?").all(today);
  const tasksNext7Days = db.prepare("SELECT * FROM tasks WHERE estado NOT IN ('lista', 'cancelada') AND fecha_vencimiento > ? AND fecha_vencimiento <= ?").all(today, nextWeek);
  
  res.json({
    activeProjects: activeProjects.count,
    tasksDueSoon: tasksDueSoon.count,
    pendingInvoices: pendingInvoices.count,
    overdueInvoices: overdueInvoices.count,
    tasksToday,
    tasksNext7Days
  });
});
