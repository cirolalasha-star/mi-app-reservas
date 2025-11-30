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
  getReservasResumenPorExperiencia,
  getReservasResumenPorGuia,
  getReservasPorMesAdmin,
  getReservasEstadisticasGlobales,
} from "../controllers/reservas.controller";
import { protegerRuta, soloAdmin } from "../middleware/auth.middleware";

const router = Router();

/**
 * Orden importante:
 * - Primero rutas "especiales" (/mias, /admin...).
 * - Luego las genéricas ("/", "/:id").
 */

// 👤 Reservas del usuario logado
router.get("/mias", protegerRuta, getMisReservas);

// 🛠 Listado general para admin (todas las reservas)
router.get("/admin", protegerRuta, soloAdmin, getReservasAdmin);

// 📊 Reservas por mes (para gráficas del dashboard admin)
router.get(
  "/admin/por-mes",
  protegerRuta,
  soloAdmin,
  getReservasPorMesAdmin
);

// 🧮 Resumen por experiencia (tour)
router.get(
  "/admin/resumen-por-experiencia",
  protegerRuta,
  soloAdmin,
  getReservasResumenPorExperiencia
);

// 🧮 Resumen por guía
router.get(
  "/admin/resumen-por-guia",
  protegerRuta,
  soloAdmin,
  getReservasResumenPorGuia
);

// 🌍 Estadísticas globales (si las usas en el dashboard)
router.get(
  "/admin/estadisticas-globales",
  protegerRuta,
  soloAdmin,
  getReservasEstadisticasGlobales
);

// ✏️ Cambiar estado (solo admin) – ruta explícita de admin
router.patch(
  "/admin/:id/estado",
  protegerRuta,
  soloAdmin,
  updateReservaEstado
);

// (Opcional) Mantengo también la antigua por si algo la usa
router.patch("/:id/estado", protegerRuta, soloAdmin, updateReservaEstado);

// Listado general (público o protegible más adelante)
router.get("/", getReservas);

// Detalle por id
router.get("/:id", getReservaById);

// Crear reserva (usuario logado)
router.post("/", protegerRuta, createReserva);

// Eliminar reserva (de momento protegido por login normal)
router.delete("/:id", protegerRuta, deleteReserva);

export default router;
