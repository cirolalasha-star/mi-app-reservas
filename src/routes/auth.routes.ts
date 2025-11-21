// src/routes/auth.routes.ts
import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { protegerRuta } from "../middleware/auth.middleware";

// Logs para confirmar carga correcta del archivo
console.log("📁 auth.routes.ts cargado correctamente");
console.log("➡️ auth.controller importado correctamente");

const router = Router();

/**
 * ===============================
 *   RUTAS DE AUTENTICACIÓN
 * ===============================
 * Estas rutas son PÚBLICAS salvo /me.
 */

// Registrar nuevo usuario
// POST /api/auth/register
router.post("/register", register);

// Login de usuario — devuelve token JWT
// POST /api/auth/login
router.post("/login", login);

// Perfil del usuario autenticado
// GET /api/auth/me  (requiere token Bearer)
router.get("/me", protegerRuta, me);

/**
 * Ruta de prueba para verificar que el módulo funciona.
 * No tiene utilidad real en producción, pero sirve para debug.
 */
router.get("/ping", (_req, res) => {
  res.json({ msg: "pong desde auth.routes.ts" });
});

export default router;
