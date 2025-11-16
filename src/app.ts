// ===============================
//  IMPORTS
// ===============================
import express from "express";
import cors from "cors";
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
// Ahora Express puede leer req.cookies["token"]


// ===========================================
// 2️⃣ CORS CONFIG — NECESARIO PARA FRONTEND + COOKIES
// ===========================================
// OBLIGATORIO incluir tu dominio real de producción (Vercel)
const allowedOrigins = [
  "http://localhost:5173",                 // Desarrollo
  "https://primalexperience.es",           // Tu dominio real
  "https://www.primalexperience.es",
  "https://primalexperience-frontend.vercel.app" // Frontend Vercel
];

const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    // Permite peticiones sin origin (como Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origen NO permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // ⬅️ PERMITIR COOKIES
};

app.use(cors(corsOptions));


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

// Ruta de prueba del servidor
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: "ok",
    timeStamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);               // Login, registro, logout
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/tours', toursRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/ofertas', ofertasRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/admin/stats', statsRoutes);
app.use('/api/traducciones', traduccionesRoutes);
app.use("/api/salidas_programadas", salidasRoutes);
app.use('/api', uploadRoutes);

// Nota: ya NO usas apiRoutes porque ahora montas rutas individualmente


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
app.get("/", (req, res) => {
  res.send("✅ Servidor activo y corriendo en Render!");
});


export default app;

/**
 * 🔍 EXPLICACIÓN GENERAL
 * 
 * cookieParser(): permite leer/escribir cookies → necesario para JWT en cookies.
 *
 * cors(credentials: true): permite enviar cookies entre frontend y backend.
 *
 * allowedOrigins: lista de dominios permitidos (LOCAL + PRODUCCIÓN).
 *
 * express.json(): permite recibir JSON desde el frontend.
 *
 * morgan(): muestra logs solo en desarrollo.
 *
 * Todas las rutas se montan bajo /api.
 *
 * Manejador 404 + manejador centralizado de errores.
 *
 */
