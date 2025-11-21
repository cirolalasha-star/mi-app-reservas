import { Router } from "express";
import { register, login, logout, me } from "../controllers/auth.controller";

const router = Router();

/**
 * Rutas de autenticación (públicas para login/registro)
 */

// Registrar nuevo usuario
router.post("/register", register);

// Login de usuario
router.post("/login", login);

// Usuario actual
router.get("/me", me);

// Logout (opcional, si la usas)
router.post("/logout", logout);

// Ruta de prueba
router.get("/ping", (_req, res) => {
  res.json({ msg: "pong desde auth.routes.ts" });
});

export default router;
