// src/routes/reservas.routes.ts
import { Router } from "express";
import {
  getReservas,
  getReservaById,
  getMisReservas,
  createReserva,
  deleteReserva,
} from "../controllers/reservas.controller";
import { protegerRuta } from "../middleware/auth.middleware";

const router = Router();

/**
 * Orden MUY importante:
 * - Primero rutas "especiales" como /mias
 * - Luego las genéricas con parámetros (/:id)
 */

// 👤 Reservas del usuario logado
router.get("/mias", protegerRuta, getMisReservas);

// Listado general (admin / futuras vistas)
router.get("/", getReservas);

// Detalle por id
router.get("/:id", getReservaById);

// Crear / borrar (normalmente protegidas)
router.post("/", protegerRuta, createReserva);
router.delete("/:id", protegerRuta, deleteReserva);

export default router;
