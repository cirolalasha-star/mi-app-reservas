// src/routes/auth.routes.ts
import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth.controller";

console.log("📁 auth.routes.ts cargado correctamente");

const router = Router();

/**
 * ===============================
 *   RUTAS DE AUTENTICACIÓN
 * ===============================
 * Estas rutas son PÚBLICAS (excepto /me, que requiere token)
 */

// Registrar nuevo usuario
router.post("/registro", register);   // POST /api/auth/registro

// Login de usuario — devuelve token JWT
router.post("/login", login);        // POST /api/auth/login

// Usuario actual (usa token enviado en Authorization: Bearer xxx)
router.get("/me", me);               // GET /api/auth/me

// Logout — limpia cookie (y opcionalmente podrías invalidar token en servidor)
router.post("/logout", logout);      // POST /api/auth/logout

// Ruta de prueba para verificar que el módulo funciona
router.get("/ping", (_req, res) => {
  res.json({ msg: "pong desde auth.routes.ts" });
});

export default router;
