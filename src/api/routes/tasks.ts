import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "../utils/activityLogger";

export const tasksRouter = Router();

tasksRouter.use(authenticateToken);

tasksRouter.get("/", (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, p.nombre_proyecto 
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    ORDER BY t.fecha_vencimiento ASC
  `).all();
  res.json(tasks);
});

tasksRouter.post("/", (req, res) => {
  const id = uuidv4();
  const { project_id, titulo, estado, fecha_vencimiento } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO tasks (id, project_id, titulo, estado, fecha_vencimiento, fecha_creacion)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, project_id, titulo, estado || "por_hacer", fecha_vencimiento, new Date().toISOString().split('T')[0]);
  
  const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  
  logActivity("task", id, "crear", (req as any).user?.email || "system", `Tarea creada: ${titulo}`);
  
  res.json(newTask);
});

tasksRouter.put("/:id/status", (req, res) => {
  const { estado } = req.body;
  db.prepare("UPDATE tasks SET estado = ? WHERE id = ?").run(estado, req.params.id);
  
  const task = db.prepare("SELECT titulo FROM tasks WHERE id = ?").get(req.params.id) as any;
  if (task) {
    logActivity("task", req.params.id, "actualizar_estado", (req as any).user?.email || "system", `Tarea '${task.titulo}' cambiada a: ${estado}`);
  }
  
  res.json({ success: true });
});
