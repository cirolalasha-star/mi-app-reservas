// src/routes/resenas.routes.ts
import { Router } from "express";
import {
  getResenasPorTour,
  getResenaById,
  createResena,
  deleteResena,
  moderarResena,
} from "../controllers/resenas.controller";

import { protegerRuta, soloAdmin } from "../middleware/auth.middleware";

const router = Router();

// 🔓 Rutas públicas
router.get("/", getResenasPorTour);
router.get("/:id", getResenaById);

// 🔐 Crear reseña → solo usuario logueado
router.post("/", protegerRuta, createResena);

// 🔐 Eliminar reseña → solo usuario dueño o admin (lo controlarás en el controlador)
router.delete("/:id", protegerRuta, deleteResena);

// 🔐 Moderar reseña → solo admin
router.put("/:id/moderar", protegerRuta, soloAdmin, moderarResena);

export default router;
