// src/routes/auth.routes.ts
import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

// Solo para ver que se carga el archivo al arrancar
console.log("📁 auth.routes.ts cargado correctamente");

const router = Router();

/**
 * ===============================
 *   RUTAS DE AUTENTICACIÓN
 * ===============================
 * PÚBLICAS: NO llevan protegerRuta
 */

// ✅ Alias en inglés (versión original)
router.post("/register", register);

// ✅ Alias en español (la que usa tu frontend ahora mismo)
router.post("/registro", register);

// Login de usuario
router.post("/login", login);

// Ruta de prueba rápida
router.get("/ping", (_req, res) => {
  res.json({ msg: "pong desde auth.routes.ts" });
});

export default router;
