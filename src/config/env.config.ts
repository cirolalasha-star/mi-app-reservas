// src/config/env.config.ts
import dotenv from "dotenv";


dotenv.config();
//centraliza la lectura de variables del .env y nos da valores por defecto.
export const env = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
};
