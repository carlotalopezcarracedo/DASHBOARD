import { Router } from "express";
import { getAuthUrl, getMissingGoogleOAuthFields, getTokens } from "../../services/googleCalendar";
import { db } from "../../db";
import { authenticateToken } from "./auth";

export const googleAuthRouter = Router();

googleAuthRouter.get("/url", authenticateToken, (req: any, res) => {
  const missing = getMissingGoogleOAuthFields();
  if (missing.length > 0) {
    return res.status(400).json({
      error: `Google OAuth no configurado. Faltan: ${missing.join(", ")}`,
      missing,
    });
  }

  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error("Error creating Google auth URL:", error);
    res.status(500).json({ error: "No se pudo generar la URL de Google OAuth" });
  }
});

googleAuthRouter.get("/callback", async (req: any, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("Falta el parámetro 'code' en el callback de Google");
  }

  try {
    const tokens = await getTokens(code as string);
    const admin = db.prepare("SELECT id FROM users WHERE role = 'admin'").get() as any;

    if (admin) {
      db.prepare(`
        INSERT INTO google_tokens (user_id, access_token, refresh_token, expiry_date)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          access_token = excluded.access_token,
          refresh_token = COALESCE(excluded.refresh_token, google_tokens.refresh_token),
          expiry_date = excluded.expiry_date
      `).run(admin.id, tokens.access_token, tokens.refresh_token, tokens.expiry_date);
    }

    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
          <p>Conexión con Google Calendar exitosa. Puedes cerrar esta ventana.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error in Google callback:", error);
    res.status(500).send("Error al conectar con Google");
  }
});

googleAuthRouter.get("/status", authenticateToken, (req: any, res) => {
  const token = db.prepare("SELECT * FROM google_tokens WHERE user_id = ?").get(req.user.id);
  const missing = getMissingGoogleOAuthFields();
  res.json({
    connected: !!token,
    configured: missing.length === 0,
    missing,
  });
});
