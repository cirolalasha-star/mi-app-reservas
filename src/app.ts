//src/app.ts/donde configuramos Express, sirve para define middlewares globales y monta las rutas en /api.
import express from "express";
import cors from "cors";
import morgan from "morgan";

//rutas principales
import apiRoutes from "./routes"; //importa el index.ts del folder routes
import adminRoutes from "./routes/admin.routes";
import usuariosRoutes from './routes/usuarios.routes'
import toursRoutes from './routes/tours.routes'
import reservasRoutes from './routes/reservas.routes'
import ofertasRoutes from './routes/ofertas.routes'
import resenasRoutes from './routes/resenas.routes'
import { health } from './controllers/health.controller'
import authRoutes from './routes/auth.routes'
import uploadRoutes from './routes/upload.routes'
import statsRoutes from './routes/stats.routes'
import traduccionesRoutes from './routes/traducciones.routes'
import { timeStamp } from "console";


const app = express();

//Middleware global: CORS + JSON
//habilitar CORS para que cualquier frontend pueda hacer peticiones
app.use(cors());
// Middleware para parsear JSON
app.use(express.json());

//Configuración personalizada de CORS
const allowedOrigins = [
    "http://localhost:5173",  //Para desarrollo local
    "https://mi-frontend.com"  // dominio de producción
];

const corsOptions = {
    origin: (origin: string | undefined, callback: any) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }else{
            callback(new Error("Origen no permitido por CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

app.use("/admin", adminRoutes);

//Activar Morgan solo en desarrollo
if (process.env.NODE_ENV !== "production"){
    //Logger HTTP muestra las peticiones en consola
    app.use(morgan("dev"));
}

//Rutas
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: "ok",
        timeStamp: new Date().toISOString(),
    });
});
app.use('/api/usuarios', usuariosRoutes)
app.use('/api/tours', toursRoutes)
app.use('/api/reservas', reservasRoutes)
app.use('/api/ofertas', ofertasRoutes)
app.use('/api/resenas', resenasRoutes)
app.use('/api/auth', authRoutes)
app.use('/api', uploadRoutes)
app.use('/api/admin/stats', statsRoutes)
app.use('/api/traducciones', traduccionesRoutes)

// Ruta de la API (todas colgando de /api)
//app.use("/api", apiRoutes); ya no hace falta

// 404 para rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: "Recurso no encontrado"});
});

// Manejador de errores genérico
// (si lanzas next(err) en alguna parte, llega aquí)
app.use(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        const status = err.status || 500;
        res.status(status).json({
            error: err.message || "Error interno del servidor",
        });
    }
);


export default app;
/**
 * ·app.use(express.json()): permite recibir cuerpos JSON (como los que envías desde Postman)
 * ·app.use(cors()): habilita que tu frontend (React/Vite) haga peticiones a este backend
 * ·if (process.env.NODE_EMV !== "production"): evita logs innecesarios en producción
 * ·app.use('/api/...'): cada ruta monta su controlador
 * ·app.use((_req, res)=> {...}): captura rutas inexistentes (404)
 * ·app.use((err, ...)): último middleware, centraliza errores de toda la API
 */