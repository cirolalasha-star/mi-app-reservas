import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

// Logs para confirmar carga correcta del archivo
console.log("📁 auth.routes.ts cargado correctamente");
console.log("➡️ auth.controller importado correctamente");

const router = Router();

/**
 * ===============================
 *   RUTAS DE AUTENTICACIÓN
 * ===============================
 * Estas rutas son PÚBLICAS.
 * NO deben llevar protegerRuta porque el usuario aún no tiene token.
 */

// Registrar nuevo usuario
router.post("/register", register);

// Login de usuario — devuelve token JWT
router.post("/login", login);

/**
 * Ruta de prueba para verificar que el módulo funciona.
 * No tiene utilidad real en producción, pero sirve para debug.
 */
router.get("/ping", (_req, res) => {
  res.json({ msg: "pong desde auth.routes.ts" });
});

// Exportar router para usarlo en app.ts
export default router;
