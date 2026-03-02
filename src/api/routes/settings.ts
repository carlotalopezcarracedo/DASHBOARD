import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { authenticateToken } from "./auth";
import { logActivity } from "../utils/activityLogger";

export const settingsRouter = Router();

settingsRouter.use(authenticateToken);

function getActor(req: any) {
  return req.user?.email || req.user?.name || "system";
}

function toSqlBoolean(value: unknown, fallback: number) {
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    return value === 0 ? 0 : 1;
  }

  return fallback;
}

function ensureUserPreferences(userId: string) {
  const existing = db.prepare("SELECT user_id FROM user_preferences WHERE user_id = ?").get(userId);
  if (!existing) {
    db.prepare(`
      INSERT INTO user_preferences (user_id, email_tasks, email_tickets, push_messages, weekly_digest, updated_at)
      VALUES (?, 1, 1, 0, 1, ?)
    `).run(userId, new Date().toISOString());
  }
}

settingsRouter.get("/profile", (req: any, res) => {
  const user = db
    .prepare("SELECT id, email, role, name FROM users WHERE id = ?")
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  res.json(user);
});

settingsRouter.put("/profile", (req: any, res) => {
  const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const rawEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!rawName || !rawEmail) {
    return res.status(400).json({ error: "Nombre y email son obligatorios" });
  }

  const existingUser = db.prepare("SELECT id FROM users WHERE email = ? AND id <> ?").get(rawEmail, req.user.id);
  if (existingUser) {
    return res.status(409).json({ error: "Ese email ya está en uso" });
  }

  db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(rawName, rawEmail, req.user.id);

  logActivity("settings", req.user.id, "actualizar_perfil", getActor(req), `Perfil actualizado para ${rawEmail}`);

  const updatedUser = db
    .prepare("SELECT id, email, role, name FROM users WHERE id = ?")
    .get(req.user.id);

  res.json(updatedUser);
});

settingsRouter.get("/notifications", (req: any, res) => {
  ensureUserPreferences(req.user.id);

  const row = db
    .prepare(`
      SELECT email_tasks, email_tickets, push_messages, weekly_digest, updated_at
      FROM user_preferences
      WHERE user_id = ?
    `)
    .get(req.user.id) as any;

  res.json({
    emailTasks: row.email_tasks === 1,
    emailTickets: row.email_tickets === 1,
    pushMessages: row.push_messages === 1,
    weeklyDigest: row.weekly_digest === 1,
    updatedAt: row.updated_at,
  });
});

settingsRouter.put("/notifications", (req: any, res) => {
  ensureUserPreferences(req.user.id);

  const current = db
    .prepare(`
      SELECT email_tasks, email_tickets, push_messages, weekly_digest
      FROM user_preferences
      WHERE user_id = ?
    `)
    .get(req.user.id) as any;

  const next = {
    email_tasks: toSqlBoolean(req.body?.emailTasks, current.email_tasks),
    email_tickets: toSqlBoolean(req.body?.emailTickets, current.email_tickets),
    push_messages: toSqlBoolean(req.body?.pushMessages, current.push_messages),
    weekly_digest: toSqlBoolean(req.body?.weeklyDigest, current.weekly_digest),
  };

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE user_preferences
    SET email_tasks = ?, email_tickets = ?, push_messages = ?, weekly_digest = ?, updated_at = ?
    WHERE user_id = ?
  `).run(
    next.email_tasks,
    next.email_tickets,
    next.push_messages,
    next.weekly_digest,
    now,
    req.user.id
  );

  logActivity("settings", req.user.id, "actualizar_notificaciones", getActor(req), "Preferencias de notificación actualizadas");

  res.json({
    emailTasks: next.email_tasks === 1,
    emailTickets: next.email_tickets === 1,
    pushMessages: next.push_messages === 1,
    weeklyDigest: next.weekly_digest === 1,
    updatedAt: now,
  });
});

settingsRouter.put("/password", (req: any, res) => {
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Debes completar todos los campos" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
  }

  const user = db.prepare("SELECT id, password FROM users WHERE id = ?").get(req.user.id) as any;
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const isValid = bcrypt.compareSync(currentPassword, user.password);
  if (!isValid) {
    return res.status(401).json({ error: "La contraseña actual no es correcta" });
  }

  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedPassword, req.user.id);

  logActivity("settings", req.user.id, "actualizar_password", getActor(req), "Contraseña actualizada");

  res.json({ success: true });
});

settingsRouter.get("/api-key", (req: any, res) => {
  const key = db
    .prepare("SELECT key_preview, created_at FROM api_keys WHERE user_id = ?")
    .get(req.user.id) as any;

  if (!key) {
    return res.json({ hasKey: false });
  }

  res.json({
    hasKey: true,
    keyPreview: key.key_preview,
    createdAt: key.created_at,
  });
});

settingsRouter.post("/api-key/regenerate", (req: any, res) => {
  const generatedKey = `karr_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(generatedKey).digest("hex");
  const keyPreview = `${generatedKey.slice(0, 16)}...${generatedKey.slice(-6)}`;
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO api_keys (id, user_id, key_hash, key_preview, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      id = excluded.id,
      key_hash = excluded.key_hash,
      key_preview = excluded.key_preview,
      created_at = excluded.created_at
  `).run(uuidv4(), req.user.id, keyHash, keyPreview, createdAt);

  logActivity("settings", req.user.id, "regenerar_api_key", getActor(req), "API key regenerada");

  res.json({
    hasKey: true,
    keyPreview,
    createdAt,
    apiKey: generatedKey,
  });
});
