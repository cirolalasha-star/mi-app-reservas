// src/middlewares/auth.middleware.ts
/**
 * Middleware de autenticación:
 *  - Lee el token JWT desde:
 *      · Authorization: Bearer xxx
 *      · o cookie "token"
 *  - Si es válido, añade `req.usuarioId` y `req.usuarioRol`
 *  - Si no, responde 401 (no autenticado)
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "CAMBIAR_SECRET_EN_PRODUCCION";

interface TokenPayload {
  id: number;
  rol: string;
  iat: number;
  exp: number;
}

// 🔧 Extendemos el tipo Request para guardar los datos del usuario
declare module "express-serve-static-core" {
  interface Request {
    usuarioId?: number;
    usuarioRol?: string;
  }
}

export function protegerRuta(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1) Intentamos leer Authorization: Bearer xxx
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2) Si no hay header, probamos con cookie "token"
    if (!token && (req as any).cookies?.token) {
      token = (req as any).cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "No autenticado. Falta token." });
    }

    // 3) Verificamos token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // 4) Guardamos info en req para usarla en los controladores
    req.usuarioId = decoded.id;
    req.usuarioRol = decoded.rol;

    return next();
  } catch (error) {
    console.error("❌ Error en protegerRuta:", error);
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
}
/**
 * Middleware para proteger rutas (probablemente ya lo tienes)
 * export const protegerRuta = ...
 */

/**
 * 🔐 SOLO ADMIN
 * Debe ir después de protegerRuta en las rutas:
 *   router.get("/algo", protegerRuta, soloAdmin, handler)
 */
export const soloAdmin = (req: Request, res: Response, next: NextFunction) => {
  const usuario = (req as any).usuario;

  if (!usuario) {
    return res.status(401).json({ message: "No autenticado." });
  }

  if (usuario.rol !== "admin") {
    return res
      .status(403)
      .json({ message: "Acceso reservado a administradores." });
  }

  return next();
};