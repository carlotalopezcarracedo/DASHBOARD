import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "../../db";

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-karr-ai-2026";

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Credenciales inválidas" });
  }

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);

    if (user?.id && !user?.email) {
      const dbUser = db.prepare("SELECT email, role, name FROM users WHERE id = ?").get(user.id) as any;
      req.user = dbUser ? { ...user, ...dbUser } : user;
    } else {
      req.user = user;
    }

    next();
  });
};
