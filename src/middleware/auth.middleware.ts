// src/middleware/auth.middleware.ts
import { NextFunction, Response, Request } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "CAMBIAR_SECRET_EN_PRODUCCION";

interface TokenPayload {
  id: number;
  rol: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  usuario?: {
    id: number;
    rol: string;
  };
}

// ✔ Middleware general: comprueba token y añade req.usuario
export const protegerRuta = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const tokenCookie = (req as any).cookies?.token as string | undefined;
    const token = tokenHeader || tokenCookie;

    if (!token) {
      return res.status(401).json({ message: "No autenticado." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // Comprobamos usuario real y rol
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.id },
      select: { id: true, rol: true },
    });

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no encontrado." });
    }

    req.usuario = { id: usuario.id, rol: usuario.rol };
    next();
  } catch (error) {
    console.error("❌ Error en protegerRuta:", error);
    return res.status(401).json({ message: "Token inválido o caducado." });
  }
};

// ✔ Solo deja pasar a admins
export const soloAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.usuario) {
    return res.status(401).json({ message: "No autenticado." });
  }

  if (req.usuario.rol !== "admin") {
    return res
      .status(403)
      .json({ message: "Acceso restringido a administradores." });
  }

  return next();
};
