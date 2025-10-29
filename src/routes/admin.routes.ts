// src/routes/admin.routes.ts
import { Router } from "express";
import { getDashboardStats } from "../admin/admin.controller";

const router = Router();

router.get("/dashboard", getDashboardStats);

export default router;
