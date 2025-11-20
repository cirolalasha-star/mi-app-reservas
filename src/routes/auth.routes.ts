// src/routes/auth.routes.ts
import { Router } from "express";
import { register, login } from "../controllers/auth.controller";

const router = Router();

/**
 * =====================================
 *   RUTAS DE AUTENTICACIÓN (PÚBLICAS)
 * =====================================
 *
 * En app.ts se montan así:
 *    app.use("/api/auth", authRoutes);
 *
 * Por tanto, los endpoints finales son:
 *    POST /api/auth/registro   → Registro de usuario
 *    POST /api/auth/login      → Login de usuario
 *
 * IMPORTANTE:
 *  - NO se usa protegerRuta aquí porque el usuario
 *    aún no tiene token cuando se registra o inicia sesión.
 */

// ✅ Registrar nuevo usuario
//    Usado por el frontend en Registro.tsx → apiPost("/auth/registro", {...})
router.post("/registro", register);

// ✅ Login de usuario — devuelve token JWT
//    Usado por el frontend en Login.tsx → apiPost("/auth/login", {...})
router.post("/login", login);

/**
 * Ruta de prueba sencilla para verificar que el módulo de auth
 * está montado correctamente:
 *    GET /api/auth/ping
 */
router.get("/ping", (_req, res) => {
  res.json({ msg: "pong desde auth.routes.ts" });
});

export default router;
