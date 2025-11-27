// src/routes/reservas.routes.ts
import { Router } from "express";
import {
  getReservas,
  getReservaById,
  getMisReservas,
  createReserva,
  deleteReserva,
  updateReservaEstado,
  getReservasAdmin,
  getResumenReservasPorExperiencia,
} from "../controllers/reservas.controller";
import { protegerRuta, soloAdmin } from "../middleware/auth.middleware";

const router = Router();

/**
 * 🛡 Rutas ADMIN
 * (protegerRuta añade req.usuario, soloAdmin comprueba rol === "admin")
 */

// Lista completa de reservas para admin
router.get("/admin", protegerRuta, soloAdmin, getReservasAdmin);

// Resumen de reservas agrupadas por experiencia
router.get(
  "/resumen-por-experiencia",
  protegerRuta,
  soloAdmin,
  getResumenReservasPorExperiencia
);

/**
 * 👤 Reservas del usuario logado
 */
router.get("/mias", protegerRuta, getMisReservas);

/**
 * 📦 Listado general
 */
router.get("/", getReservas);

/**
 * 🔎 Detalle por ID
 */
router.get("/:id", getReservaById);

/**
 * ✏️ Cambiar estado de una reserva (solo admin)
 */
router.patch("/:id/estado", protegerRuta, soloAdmin, updateReservaEstado);

/**
 * ➕ Crear / ❌ Borrar reservas (usuario autenticado)
 */
router.post("/", protegerRuta, createReserva);
router.delete("/:id", protegerRuta, deleteReserva);

export default router;
