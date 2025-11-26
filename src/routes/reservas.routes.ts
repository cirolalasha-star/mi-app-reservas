// src/routes/reservas.routes.ts
import { Router } from "express";
import {
  getReservas,
  getReservaById,
  getMisReservas,
  createReserva,
  deleteReserva,
  updateReservaEstado,
} from "../controllers/reservas.controller";
import { protegerRuta, soloAdmin } from "../middleware/auth.middleware";

const router = Router();

/**
 * Orden MUY importante:
 * - Primero rutas "especiales" como /mias
 * - Luego las genéricas con parámetros (/:id)
 */

// 👤 Reservas del usuario logado
router.get("/mias", protegerRuta, getMisReservas);

// 📋 Listado general (solo admin, para el panel)
router.get("/", protegerRuta, soloAdmin, getReservas);

// 🔎 Detalle por id (también solo admin)
router.get("/:id", protegerRuta, soloAdmin, getReservaById);

// ➕ Crear reserva (usuario logado)
router.post("/", protegerRuta, createReserva);

// 🔁 Cambiar estado de una reserva (pendiente/confirmada/cancelada) – solo admin
router.patch("/:id/estado", protegerRuta, soloAdmin, updateReservaEstado);

// 🗑 Eliminar reserva (solo admin)
router.delete("/:id", protegerRuta, soloAdmin, deleteReserva);

export default router;
