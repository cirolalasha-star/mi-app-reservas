// ===============================
//  IMPORTS
// ===============================
import express from "express";
// 🔽 Añadimos el tipo para las opciones de CORS
import cors, { CorsOptions } from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// Rutas
import adminRoutes from "./routes/admin.routes";
import usuariosRoutes from "./routes/usuarios.routes";
import toursRoutes from "./routes/tours.routes";
import reservasRoutes from "./routes/reservas.routes";
import ofertasRoutes from "./routes/ofertas.routes";
import resenasRoutes from "./routes/resenas.routes";
import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";
import statsRoutes from "./routes/stats.routes";
import traduccionesRoutes from "./routes/traducciones.routes";
import salidasRoutes from "./routes/salidas_programadas.routes";

const app = express();

// ===========================================
// 1️⃣ COOKIES — Necesario para JWT con cookies
// ===========================================
app.use(cookieParser());

// ===========================================
// 2️⃣ CORS CONFIG — FRONTEND + COOKIES
// ===========================================
const allowedOrigins = [
  "http://localhost:5173",                      // Dev Vite
  "https://primalexperience.es",                // Dominio producción
  "https://www.primalexperience.es",
  "https://primalexperience-frontend.vercel.app" // Vercel
];

// ✅ Config más simple y robusta
const corsOptions: CorsOptions = {
  origin: allowedOrigins,                       // Deja pasar solo estos orígenes
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,                            // Permite cookies/credenciales
};

app.use(cors(corsOptions));

// 🔥 Asegura que TODAS las rutas respondan al preflight OPTIONS
app.options("*", cors(corsOptions));

// ===========================================
// 3️⃣ JSON BODY PARSER
// ===========================================
app.use(express.json());

// ===========================================
// 4️⃣ LOGS SOLO EN DESARROLLO
// ===========================================
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ===========================================
// 5️⃣ RUTAS DE LA API
// ===========================================
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timeStamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/tours", toursRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/ofertas", ofertasRoutes);
app.use("/api/resenas", resenasRoutes);
app.use("/api/admin/stats", statsRoutes);
app.use("/api/traducciones", traduccionesRoutes);
app.use("/api/salidas_programadas", salidasRoutes);
app.use("/api", uploadRoutes);

// ===========================================
// 6️⃣ 404 — RUTA NO ENCONTRADA
// ===========================================
app.use((req, res) => {
  res.status(404).json({ error: "Recurso no encontrado" });
});

// ===========================================
// 7️⃣ MANEJADOR GLOBAL DE ERRORES
// ===========================================
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Error interno del servidor",
    });
  }
);

// ===========================================
// 8️⃣ RUTA PRINCIPAL
// ===========================================
app.get("/", (_req, res) => {
  res.send("✅ Servidor activo y corriendo en Render!");
});

export default app;
