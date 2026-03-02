import { db } from "./index";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export function initDb() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      email_tasks INTEGER DEFAULT 1,
      email_tickets INTEGER DEFAULT 1,
      push_messages INTEGER DEFAULT 0,
      weekly_digest INTEGER DEFAULT 1,
      updated_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE,
      key_hash TEXT,
      key_preview TEXT,
      created_at TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS google_tokens (
      user_id TEXT PRIMARY KEY,
      access_token TEXT,
      refresh_token TEXT,
      expiry_date INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      nombre_cliente TEXT,
      nombre_negocio TEXT,
      sector TEXT,
      direccion TEXT,
      ciudad TEXT,
      provincia TEXT,
      web TEXT,
      instagram TEXT,
      notas TEXT,
      estado_relacion TEXT,
      prioridad TEXT,
      fecha_alta TEXT,
      fuente TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      nombre TEXT,
      cargo TEXT,
      telefono TEXT,
      email TEXT,
      preferencia_contacto TEXT,
      horario_preferido TEXT,
      notas TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      nombre_proyecto TEXT,
      tipo TEXT,
      descripcion TEXT,
      estado TEXT,
      fecha_inicio TEXT,
      fecha_entrega_objetivo TEXT,
      fecha_entrega_real TEXT,
      prioridad TEXT,
      alcance_resumen TEXT,
      stack TEXT,
      enlaces TEXT,
      horas_estimadas REAL,
      horas_reales REAL,
      notas TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      titulo TEXT,
      descripcion TEXT,
      estado TEXT,
      tipo TEXT,
      fecha_vencimiento TEXT,
      fecha_creacion TEXT,
      fecha_completada TEXT,
      etiquetas TEXT,
      checklists TEXT,
      notas TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      nombre_hito TEXT,
      descripcion TEXT,
      estado TEXT,
      fecha_objetivo TEXT,
      fecha_entregado TEXT,
      archivos TEXT,
      notas TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS services_catalog (
      id TEXT PRIMARY KEY,
      nombre_servicio TEXT,
      tipo_precio TEXT,
      precio_setup REAL,
      precio_mensual REAL,
      descripcion TEXT,
      incluye TEXT,
      no_incluye TEXT,
      duracion_estimada_dias INTEGER,
      requisitos_cliente TEXT,
      activo INTEGER
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      project_id TEXT,
      version TEXT,
      estado TEXT,
      fecha_envio TEXT,
      fecha_caducidad TEXT,
      total_setup REAL,
      total_mensual REAL,
      descripcion TEXT,
      archivo_pdf TEXT,
      notas TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      project_id TEXT,
      servicio_id TEXT,
      estado TEXT,
      periodicidad TEXT,
      importe_mensual REAL,
      dia_cobro_mes INTEGER,
      fecha_inicio TEXT,
      fecha_fin TEXT,
      metodo_pago TEXT,
      notas TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY(servicio_id) REFERENCES services_catalog(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      project_id TEXT,
      subscription_id TEXT,
      tipo TEXT,
      numero_factura TEXT,
      fecha_emision TEXT,
      fecha_vencimiento TEXT,
      estado TEXT,
      subtotal REAL,
      impuestos REAL,
      total REAL,
      archivo_pdf TEXT,
      notas TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY(subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      fecha_pago TEXT,
      importe REAL,
      metodo TEXT,
      referencia TEXT,
      comprobante TEXT,
      notas TEXT,
      FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      categoria TEXT,
      proveedor TEXT,
      importe REAL,
      fecha TEXT,
      recurrente INTEGER,
      periodicidad TEXT,
      archivo_factura TEXT,
      notas TEXT
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      project_id TEXT,
      titulo TEXT,
      descripcion TEXT,
      prioridad TEXT,
      estado TEXT,
      tipo TEXT,
      fecha_creacion TEXT,
      fecha_resolucion TEXT,
      notas TEXT,
      archivos_adjuntos TEXT,
      FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS project_checklists (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      category TEXT,
      item TEXT,
      is_completed INTEGER DEFAULT 0,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      entidad TEXT,
      entidad_id TEXT,
      accion TEXT,
      fecha TEXT,
      usuario TEXT,
      detalle TEXT
    );
  `);

  // Seed Admin User
  const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@karr.ai");
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    db.prepare("INSERT INTO users (id, email, password, role, name) VALUES (?, ?, ?, ?, ?)").run(
      uuidv4(),
      "admin@karr.ai",
      hashedPassword,
      "admin",
      "KARR.AI"
    );
    
    // Seed initial data
    seedData();
  }

  ensureUserDefaults();
}

function ensureUserDefaults() {
  const users = db.prepare("SELECT id FROM users").all() as Array<{ id: string }>;
  const now = new Date().toISOString();
  const insertPreference = db.prepare(`
    INSERT INTO user_preferences (user_id, email_tasks, email_tickets, push_messages, weekly_digest, updated_at)
    VALUES (?, 1, 1, 0, 1, ?)
    ON CONFLICT(user_id) DO NOTHING
  `);

  const transaction = db.transaction(() => {
    for (const user of users) {
      insertPreference.run(user.id, now);
    }
  });

  transaction();
}

function seedData() {
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Clients
  const client1Id = uuidv4();
  const client2Id = uuidv4();
  const client3Id = uuidv4();

  const insertClient = db.prepare("INSERT INTO clients (id, nombre_cliente, nombre_negocio, sector, estado_relacion, prioridad, fecha_alta) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertClient.run(client1Id, "Ana López", "Estética Ana", "estética", "activo", "alta", today);
  insertClient.run(client2Id, "Carlos Ruiz", "Clínica Dental Ruiz", "clínica", "negociacion", "media", today);
  insertClient.run(client3Id, "María Gómez", "Peluquería María", "peluquería", "activo", "baja", today);

  // Projects
  const proj1Id = uuidv4();
  const proj2Id = uuidv4();
  const proj3Id = uuidv4();

  const insertProject = db.prepare("INSERT INTO projects (id, client_id, nombre_proyecto, tipo, estado, fecha_inicio, fecha_entrega_objetivo, prioridad) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertProject.run(proj1Id, client1Id, "Bot WhatsApp Citas", "IA_whatsapp_citas", "en_desarrollo", today, nextWeek, "alta");
  insertProject.run(proj2Id, client2Id, "CRM + Automatización", "CRM", "en_propuesta", today, nextWeek, "media");
  insertProject.run(proj3Id, client3Id, "Recordatorios Calendar", "automatizacion_interna", "entregado", today, today, "baja");

  // Tasks
  const insertTask = db.prepare("INSERT INTO tasks (id, project_id, titulo, estado, fecha_vencimiento, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)");
  insertTask.run(uuidv4(), proj1Id, "Configurar Evolution API", "en_progreso", nextWeek, today);
  insertTask.run(uuidv4(), proj1Id, "Crear flujos n8n", "por_hacer", nextWeek, today);
  insertTask.run(uuidv4(), proj2Id, "Redactar propuesta", "lista", today, today);
  insertTask.run(uuidv4(), proj3Id, "Revisión final", "lista", today, today);
  insertTask.run(uuidv4(), proj1Id, "Pruebas con cliente", "por_hacer", nextWeek, today);
  insertTask.run(uuidv4(), proj2Id, "Reunión discovery", "lista", today, today);
  insertTask.run(uuidv4(), proj3Id, "Soporte post-entrega", "por_hacer", nextWeek, today);
  insertTask.run(uuidv4(), proj1Id, "Documentación", "por_hacer", nextWeek, today);

  // Invoices
  const insertInvoice = db.prepare("INSERT INTO invoices (id, client_id, project_id, tipo, numero_factura, fecha_emision, fecha_vencimiento, estado, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insertInvoice.run(uuidv4(), client1Id, proj1Id, "setup", "2026-0001", today, nextWeek, "pendiente", 500);
  insertInvoice.run(uuidv4(), client3Id, proj3Id, "setup", "2026-0002", today, today, "pagada", 300);
  insertInvoice.run(uuidv4(), client1Id, null, "mensualidad", "2026-0003", today, nextWeek, "pendiente", 50);
  insertInvoice.run(uuidv4(), client3Id, null, "mensualidad", "2026-0004", today, today, "pagada", 50);
  insertInvoice.run(uuidv4(), client2Id, proj2Id, "setup", "2026-0005", today, nextWeek, "pendiente", 800);
  
  // Subscriptions
  const insertSub = db.prepare("INSERT INTO subscriptions (id, client_id, estado, importe_mensual, dia_cobro_mes, fecha_inicio) VALUES (?, ?, ?, ?, ?, ?)");
  insertSub.run(uuidv4(), client1Id, "activa", 50, 1, today);
  insertSub.run(uuidv4(), client3Id, "activa", 50, 15, today);
}
