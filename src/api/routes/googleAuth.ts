import { Router } from "express";
import { getAuthUrl, getTokens } from "../../services/googleCalendar";
import { db } from "../../db";
import { authenticateToken } from "./auth";

export const googleAuthRouter = Router();

googleAuthRouter.get("/url", authenticateToken, (req: any, res) => {
  const url = getAuthUrl();
  res.json({ url });
});

googleAuthRouter.get("/callback", async (req: any, res) => {
  const { code, state } = req.query;
  // In a real app, 'state' should be used to verify the user
  // For this single-user app, we'll assume the admin is the one connecting
  
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
  res.json({ connected: !!token });
});
