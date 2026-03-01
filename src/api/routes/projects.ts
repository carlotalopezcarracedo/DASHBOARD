import { Router } from "express";
import { db } from "../../db";
import { authenticateToken } from "./auth";
import { v4 as uuidv4 } from "uuid";
import { logActivity } from "../utils/activityLogger";

export const projectsRouter = Router();

projectsRouter.use(authenticateToken);

const CHECKLIST_TEMPLATE = [
  { category: "0) Preparación (antes de tocar n8n)", items: [
    "Nombre corto del cliente (slug sin espacios)",
    "Número WhatsApp del cliente (o el que vas a usar para él)",
    "Confirmar que el cliente acepta: Que el bot pida confirmación antes de crear/editar/cancelar",
    "Confirmar que el cliente acepta: Que en caso de duda el bot pregunte (no invente)"
  ]},
  { category: "1) Google Calendar (cliente)", items: [
    "Crear un calendario dedicado: [Nombre] - Citas",
    "Fijar zona horaria: Europe/Madrid",
    "(Opcional pro) Crear una cuenta Google “de empresa” o usar la del cliente.",
    "Crear credencial Google Calendar en n8n con nombre: GCAL - [slug]",
    "Verificar permisos (crear/leer/editar eventos).",
    "Summary estándar: SERVICIO - NOMBRE",
    "Description estándar con: Teléfono cliente, Servicio, Duración, Notas",
    "Extended properties (si ya las usas): clientPhone, etc."
  ]},
  { category: "2) WhatsApp / Evolution API (cliente)", items: [
    "Crear sesión/nombre de instancia en Evolution: [slug]",
    "Conectar el WhatsApp (QR)",
    "Enviar mensaje de prueba desde WhatsApp real",
    "Confirmar que la instancia queda online después de reinicio (importantísimo)",
    "Configurar en Evolution el webhook hacia n8n con URL: http://carlotan8n.duckdns.org:5678/webhook/whatsapp-[slug] y Método: POST",
    "Confirmar que el webhook llega a n8n con un mensaje real"
  ]},
  { category: "3) n8n (cliente) — estructura y duplicado", items: [
    "Crear carpeta: Cliente - [Nombre]",
    "Copiar/duplicar los 6 workflows dentro",
    "Renombrar todos con prefijo: [PREFIJO] - Agente (Main)",
    "Renombrar todos con prefijo: [PREFIJO] - Tool Verificar disponibilidad",
    "Renombrar todos con prefijo: [PREFIJO] - Tool Crear cita",
    "Renombrar todos con prefijo: [PREFIJO] - Tool Cambiar cita",
    "Renombrar todos con prefijo: [PREFIJO] - Tool Cancelar cita",
    "Renombrar todos con prefijo: [PREFIJO] - Tool Consultar agenda"
  ]},
  { category: "4) n8n (cliente) — configuración del workflow principal", items: [
    "En el workflow MAIN, el Webhook debe ser único: Path: whatsapp-[slug]",
    "Confirmar que NO coincide con otro cliente",
    "En tu nodo Set de configuración: businessName = \"[Nombre]\"",
    "En tu nodo Set de configuración: timezone = \"Europe/Madrid\"",
    "En tu nodo Set de configuración: calendarId = <ID del calendario del cliente>",
    "En tu nodo Set de configuración: appointmentDuration = 60 (o lo que toque)",
    "En tu nodo Set de configuración: Horario real del negocio (L-S, etc.)",
    "En todos los nodos de Google Calendar, seleccionar: GCAL - [slug]",
    "En el nodo de envío WhatsApp (Evolution): Asegúrate de usar el endpoint correcto y la sesión correcta",
    "En el nodo de envío WhatsApp (Evolution): Si tienes filtros tipo “solo mi número”, ELIMÍNALO o actualízalo para el cliente",
    "En el nodo AI Agent (tools): Cada tool debe apuntar a los subworkflows del cliente (los duplicados)",
    "En el nodo AI Agent (tools): Nada de apuntar al subworkflow “general” o del cliente anterior"
  ]},
  { category: "5) n8n (cliente) — memoria y sesión", items: [
    "sessionId debe ser el remoteJid del usuario final",
    "La Memory del agente debe usar sessionKey = sessionId",
    "Verificar que no usas un sessionId fijo tipo “default”"
  ]},
  { category: "6) Workflow “PING” por cliente (monitorización)", items: [
    "Crear un mini workflow por cliente: Webhook GET path: ping-[slug], Responder JSON { \"ok\": true }",
    "Activarlo y probar URL final: http://carlotan8n.duckdns.org:5678/webhook/ping-[slug]"
  ]},
  { category: "7) Uptime Kuma (cliente)", items: [
    "En Kuma, crea monitor: Nombre: [PREFIJO] - Ping",
    "URL: http://carlotan8n.duckdns.org:5678/webhook/ping-[slug]",
    "Interval: 60s",
    "Retries: 2",
    "Notificación Telegram activada"
  ]},
  { category: "8) Pruebas obligatorias (antes de cobrar)", items: [
    "Mensajería y comprensión: “Hola, quiero cita mañana a las 10 para corte”",
    "Mensajería y comprensión: “Mejor a las 11”",
    "Mensajería y comprensión: “Cancélala”",
    "Mensajería y comprensión: “Qué citas tengo mañana?”",
    "Conflictos: Crea un evento manual en esa hora → bot debe decir “no hay hueco” y ofrecer alternativa",
    "Ambigüedad: “Quiero cita mañana” → bot debe pedir hora/servicio/nombre",
    "Reinicio controlado: docker restart n8n y docker restart evolution-api",
    "Confirmar que Kuma avisa y luego vuelve a verde"
  ]},
  { category: "9) Documentación mínima", items: [
    "En una nota por cliente (Notion o doc): Nombre del cliente, Slug, Calendario (ID), Sesión de Evolution (nombre), Webhook path, Duración y horarios, Precio y fecha de inicio, “Gatillos” típicos y excepciones"
  ]},
  { category: "10) Mantenimiento (mensual/semanal)", items: [
    "Revisar Uptime Kuma (si hubo caídas)",
    "Revisar logs si algo falló",
    "Verificar backups existen: ls -lh /root/backups | tail",
    "Probar restauración en local 1 vez"
  ]}
];

projectsRouter.get("/", (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, c.nombre_cliente, c.nombre_negocio 
    FROM projects p 
    LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY p.fecha_inicio DESC
  `).all();
  res.json(projects);
});

projectsRouter.post("/", (req, res) => {
  const id = uuidv4();
  const { client_id, nombre_proyecto, tipo, estado, fecha_inicio, fecha_entrega_objetivo, prioridad } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO projects (id, client_id, nombre_proyecto, tipo, estado, fecha_inicio, fecha_entrega_objetivo, prioridad)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, client_id, nombre_proyecto, tipo, estado, fecha_inicio, fecha_entrega_objetivo, prioridad);
  
  const newProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  
  logActivity("project", id, "crear", (req as any).user?.email || "system", `Proyecto creado: ${nombre_proyecto}`);
  
  res.json(newProject);
});

projectsRouter.put("/:id/status", (req, res) => {
  const { estado } = req.body;
  db.prepare("UPDATE projects SET estado = ? WHERE id = ?").run(estado, req.params.id);
  
  logActivity("project", req.params.id, "actualizar_estado", (req as any).user?.email || "system", `Estado cambiado a: ${estado}`);
  
  res.json({ success: true });
});

projectsRouter.get("/:id/checklists", (req, res) => {
  const checklists = db.prepare("SELECT * FROM project_checklists WHERE project_id = ?").all(req.params.id);
  res.json(checklists);
});

projectsRouter.post("/:id/checklists/init", (req, res) => {
  const projectId = req.params.id;
  
  // Check if already initialized
  const existing = db.prepare("SELECT count(*) as count FROM project_checklists WHERE project_id = ?").get(projectId) as { count: number };
  if (existing.count > 0) {
    return res.status(400).json({ error: "Checklist already initialized" });
  }

  const insertStmt = db.prepare("INSERT INTO project_checklists (id, project_id, category, item, is_completed) VALUES (?, ?, ?, ?, 0)");
  
  const transaction = db.transaction(() => {
    for (const section of CHECKLIST_TEMPLATE) {
      for (const item of section.items) {
        insertStmt.run(uuidv4(), projectId, section.category, item);
      }
    }
  });
  
  transaction();
  
  logActivity("project", projectId, "iniciar_checklist", (req as any).user?.email || "system", `Checklist inicializado`);
  
  const checklists = db.prepare("SELECT * FROM project_checklists WHERE project_id = ?").all(projectId);
  res.json(checklists);
});

projectsRouter.put("/:id/checklists/:itemId", (req, res) => {
  const { is_completed } = req.body;
  db.prepare("UPDATE project_checklists SET is_completed = ? WHERE id = ? AND project_id = ?").run(
    is_completed ? 1 : 0, 
    req.params.itemId, 
    req.params.id
  );
  
  const item = db.prepare("SELECT item FROM project_checklists WHERE id = ?").get(req.params.itemId) as any;
  if (item) {
    logActivity("project", req.params.id, "actualizar_checklist", (req as any).user?.email || "system", `Checklist item ${is_completed ? 'completado' : 'desmarcado'}: ${item.item.substring(0, 30)}...`);
  }
  
  res.json({ success: true });
});
