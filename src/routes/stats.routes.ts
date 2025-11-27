// src/routes/stats.routes.ts
import { Router } from "express";
import { protegerRuta, soloAdmin } from "../middleware/auth.middleware";
import { getReservasPorTour } from "../controllers/stats.controller";

const router = Router();

/**
 * Todas las rutas de aquí cuelgan de:
 *   /api/admin/stats   (según tu app.ts)
 */

// 📊 Reservas agrupadas por experiencia (solo admin)
router.get("/reservas-por-tour", protegerRuta, soloAdmin, getReservasPorTour);

export default router;
