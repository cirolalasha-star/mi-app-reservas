// src/routes/salidas_programadas.routes.ts
import { Router } from "express";
import { getSalidasProgramadas } from "../controllers/salidas_programadas.controller";

// Si quieres proteger las salidas programadas, importa esto:
// import { protegerRuta } from "../middleware/auth.middleware";

const router = Router();

/**
 * 📌 GET /api/salidas_programadas
 *   Devuelve todas las salidas programadas con su tour asociado.
 *   Actualmente es pública (como los tours).
 *   Si quieres hacerla privada, solo añade protegerRuta como middleware.
 */
router.get("/", getSalidasProgramadas);

// Si alguna vez la quieres proteger sería así:
// router.get("/", protegerRuta, getSalidasProgramadas);

export default router;
