// src/routes/reservas.routes.ts
import { Router } from "express";
import {
  getReservas,
  getReservaById,
  createReserva,
  deleteReserva,
} from "../controllers/reservas.controller";

import { protegerRuta } from "../middleware/auth.middleware";
import { misReservas } from "../controllers/reservas.controller";

const router = Router();

/**
 * Todas las rutas de reservas son privadas → requieren token válido
 */
router.get("/", protegerRuta, getReservas);
router.get("/:id", protegerRuta, getReservaById);
router.post("/", protegerRuta, createReserva);
router.delete("/:id", protegerRuta, deleteReserva);
// Lista SOLO las reservas del usuario autenticado
router.get("/mias", misReservas);

export default router;
