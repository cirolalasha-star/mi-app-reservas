// src/routes/reservas.routes.ts
import { Router } from "express";
import {
  getReservas,
  getReservaById,
  createReserva,
  deleteReserva,
} from "../controllers/reservas.controller";

import { protegerRuta } from "../middleware/auth.middleware";

const router = Router();

/**
 * Todas las rutas de reservas son privadas → requieren token válido
 */
router.get("/", protegerRuta, getReservas);
router.get("/:id", protegerRuta, getReservaById);
router.post("/", protegerRuta, createReserva);
router.delete("/:id", protegerRuta, deleteReserva);

export default router;
