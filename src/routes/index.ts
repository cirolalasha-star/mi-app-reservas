// src/routes/index.ts, Para qué sirve: tendrás un endpoint de prueba GET /api/health que devuelve un JSON.
import { Router } from "express";
import reservasRoutes from "./reservas.routes";
import adminRoutes from "./admin.routes";
import usuariosRoutes from "./usuarios.routes";
import toursRoutes from "./tours.routes";


const router = Router();

router.use("/reservas", reservasRoutes);
router.use("/admin", adminRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/tours", toursRoutes);

export default router;
