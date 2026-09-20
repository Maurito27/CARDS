import { Router } from "express";
import jwt from "jsonwebtoken";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body;

  const adminEmail = process.env.ADMIN_EMAIL || "admin@cards.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (email === adminEmail && password === adminPassword) {
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET as string, {
      expiresIn: "24h",
    });
    return res.json({ token });
  }

  res.status(401).json({ error: "Credenciales inválidas" });
});
