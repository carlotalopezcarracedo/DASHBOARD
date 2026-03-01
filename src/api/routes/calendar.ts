import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";
import { getCalendarEvents } from "../../services/googleCalendar";

export const calendarRouter = Router();

calendarRouter.use(authenticateToken);

calendarRouter.get("/events", async (req: any, res) => {
  const { start, end } = req.query; // e.g. 2026-03-01 to 2026-03-31
  const userId = req.user.id;

  // Fetch internal events
  const tasks = db.prepare(`
    SELECT id, titulo as title, fecha_vencimiento as date, 'task' as type, estado
    FROM tasks 
    WHERE fecha_vencimiento >= ? AND fecha_vencimiento <= ?
  `).all(start, end);

  const milestones = db.prepare(`
    SELECT id, nombre_hito as title, fecha_objetivo as date, 'milestone' as type, estado
    FROM milestones
    WHERE fecha_objetivo >= ? AND fecha_objetivo <= ?
  `).all(start, end);

  const invoices = db.prepare(`
    SELECT id, 'Factura ' || numero_factura as title, fecha_vencimiento as date, 'invoice' as type, estado
    FROM invoices
    WHERE fecha_vencimiento >= ? AND fecha_vencimiento <= ?
  `).all(start, end);

  const subscriptions = db.prepare(`
    SELECT id, 'Cobro Suscripción' as title, dia_cobro_mes, 'subscription' as type, estado
    FROM subscriptions
    WHERE estado = 'activa'
  `).all();

  let googleEvents: any[] = [];
  const googleToken = db.prepare("SELECT * FROM google_tokens WHERE user_id = ?").get(userId) as any;

  if (googleToken) {
    try {
      const timeMin = new Date(start as string).toISOString();
      const timeMax = new Date(end as string).toISOString();
      const items = await getCalendarEvents(googleToken, timeMin, timeMax);
      
      googleEvents = (items || []).map((item: any) => ({
        id: item.id,
        title: item.summary,
        date: item.start.dateTime || item.start.date,
        type: 'google',
        link: item.htmlLink
      }));
    } catch (error) {
      console.error("Error fetching Google events:", error);
    }
  }

  res.json({
    events: [...tasks, ...milestones, ...invoices, ...googleEvents],
    subscriptions
  });
});
