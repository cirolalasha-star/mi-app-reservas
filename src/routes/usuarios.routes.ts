// src/routes/usuarios.routes.ts

import { Router } from "express";
import { getUsuarios, crearUsuario, deleteUsuario } from "../controllers/usuarios.controller";
import { protegerRuta, soloAdmin } from "../middleware/auth.middleware";

const router = Router();

/**
 * =========================================
 *            RUTAS DE USUARIOS
 * =========================================
 * Para ver o eliminar usuarios → requiere autenticación.
 * Solo admin puede ver todos los usuarios o borrarlos.
 */

// 🔐 Obtener todos los usuarios (solo administradores)
router.get("/", protegerRuta, soloAdmin, getUsuarios);

// 🟢 Crear usuario (ruta pública, útil para registro externo)
// Si quieres hacerla privada, dímelo y la ajusto.
router.post("/", crearUsuario);

// 🔐 Eliminar usuario por ID (solo admins)
router.delete("/:id", protegerRuta, soloAdmin, deleteUsuario);

export default router;
