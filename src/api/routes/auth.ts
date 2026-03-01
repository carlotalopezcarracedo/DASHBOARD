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

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
