// src/routes/index.routes.ts
import { Router } from "express";
import { health } from "../controllers/health.controller";
import reservasRoutes from "./reservas.routes";

const router = Router();

router.get("/health", health);
router.use("/reservas", reservasRoutes);

export default router;
