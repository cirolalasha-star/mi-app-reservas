// src/routes/tours.routes.ts

import { Router } from "express";
import {
  getTours,
  getTourById,
  createTourAI,
  deleteTour,
  filtrarTours,
  regenerarDescripcionTour,
  getToursDestacados,
} from "../controllers/tours.controller";

import { protegerRuta, soloAdmin } from "../middleware/auth.middleware";

const router = Router();

/**
 * =========================================
 *               RUTAS PÚBLICAS
 * =========================================
 * Cualquiera puede ver tours, filtrarlos y ver detalles.
 */

// 🟢 Lista de tours (pública)
router.get("/", getTours);

// 🟢 Tours destacados para la Home (pública)
router.get("/destacados", getToursDestacados);  

// 🟢 Filtro avanzado (pública)
router.get("/filtro", filtrarTours);

// 🟢 Obtener un tour por su ID (pública)
router.get("/:id", getTourById);

/**
 * =========================================
 *         RUTAS RESTRINGIDAS (ADMIN)
 * =========================================
 * Solo admin puede crear, eliminar o regenerar descripciones.
 */

// 🔐 Crear tour desde IA (solo admin)
router.post("/", protegerRuta, soloAdmin, createTourAI);

// 🔐 Eliminar tour (solo admin)
router.delete("/:id", protegerRuta, soloAdmin, deleteTour);

// 🔐 Generar nueva descripción desde IA (solo admin)
router.put(
  "/generar-descripcion/:id",
  protegerRuta,
  soloAdmin,
  regenerarDescripcionTour
);

export default router;
