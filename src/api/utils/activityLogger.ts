import { db } from "../../db";
import { v4 as uuidv4 } from "uuid";

export function logActivity(
  entidad: string,
  entidad_id: string,
  accion: string,
  usuario: string,
  detalle: string
) {
  try {
    const stmt = db.prepare(
      "INSERT INTO activity_log (id, entidad, entidad_id, accion, fecha, usuario, detalle) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    stmt.run(
      uuidv4(),
      entidad,
      entidad_id,
      accion,
      new Date().toISOString(),
      usuario,
      detalle
    );
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
