// src/controllers/auth.controller.ts

/**
 * Controlador de autenticación:
 * - register: crea usuario, manda email, genera JWT y lo guarda en cookie + JSON
 * - login: verifica credenciales, genera JWT y lo guarda en cookie + JSON
 * - me: devuelve el usuario actual a partir del token
 * - logout: borra la cookie
 */

import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/email.service";

const prisma = new PrismaClient();

// ⚠️ En producción, asegura que JWT_SECRET viene del entorno
const JWT_SECRET = process.env.JWT_SECRET || "CAMBIAR_SECRET_EN_PRODUCCION";

/**
 * ============================
 *  GENERADOR DE TOKEN
 * ============================
 */
function generarJWT(id: number, rol: string) {
  return jwt.sign({ id, rol }, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * ============================
 *  REGISTRO DE USUARIO
 * ============================
 */
export const register = async (req: Request, res: Response) => {
  try {
    console.log("📩 Petición recibida en /api/auth/register");

    const { nombre, email, password, rol } = req.body;

    // 1. Validar campos obligatorios
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: "Faltan datos obligatorios." });
    }

    // 2. Verificar si el usuario ya existe
    const existe = await prisma.usuarios.findUnique({ where: { email } });
    if (existe) {
      return res.status(400).json({ message: "El usuario ya existe." });
    }

    // 3. Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Crear usuario en BD
    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol || "usuario",
      },
    });

    // 5. Enviar email de bienvenida (no bloquea la respuesta)
    sendEmail({
      to: email,
      subject: "🎉 Bienvenido a Primal Experience Reservas",
      html: `
        <h2>¡Hola ${nombre}!</h2>
        <p>Gracias por registrarte en <b>PrimalExperience Reservas</b>.</p>
        <p>Ya puedes iniciar sesión y gestionar tus reservas.</p>
      `,
    }).catch((err) => console.error("Error al enviar email:", err));

    // 6. Generar token JWT
    const token = generarJWT(nuevoUsuario.id, nuevoUsuario.rol);

    // 7. Guardar token en COOKIE 🟢 (seguro)
    res.cookie("token", token, {
      httpOnly: true, // cookie no accesible por JS
      secure: true,   // obligatorio para HTTPS (Render/Vercel)
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // 8. Respuesta (incluye token para el frontend)
    return res.status(201).json({
      message: "Usuario registrado con éxito",
      usuario: {
        id: nuevoUsuario.id,
        nombre,
        email,
        rol: nuevoUsuario.rol,
      },
      token, // ⬅️ token en el JSON
    });
  } catch (error) {
    console.error("❌ Error en register:", error);
    return res.status(500).json({ message: "Error al registrar usuario." });
  }
};

/**
 * ============================
 *  INICIO DE SESIÓN
 * ============================
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validar campos
    if (!email || !password) {
      return res.status(400).json({ message: "Faltan credenciales." });
    }

    // 2. Buscar usuario
    const usuario = await prisma.usuarios.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // 3. Comparar contraseñas
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.status(401).json({ message: "Contraseña incorrecta." });
    }

    // 4. Generar token
    const token = generarJWT(usuario.id, usuario.rol);

    // 5. Guardar token en cookie segura
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 6. Respuesta (incluye token para el frontend)
    return res.json({
      message: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
      token, // ⬅️ token también aquí
    });
  } catch (error) {
    console.error("❌ Error en login:", error);
    return res.status(500).json({ message: "Error al iniciar sesión." });
  }
};

/**
 * ============================
 *  TIPO DEL PAYLOAD DEL TOKEN
 * ============================
 */
interface TokenPayload {
  id: number;
  rol: string;
  iat: number;
  exp: number;
}

/**
 * ============================
 *  ME (USUARIO ACTUAL)
 * ============================
 * Usa el token que venga en:
 * - Authorization: Bearer xxx  (frontend actual)
 * - o en cookie "token"
 */
export const me = async (req: Request, res: Response) => {
  try {
    let token: string | undefined;

    // 1) Token desde Authorization: Bearer xxx
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else if ((req as any).cookies?.token) {
      // 2) O desde la cookie "token"
      token = (req as any).cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "No hay token de autenticación." });
    }

    // 3) Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // 4) Buscar usuario en BD
    const usuario = await prisma.usuarios.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // 5) Devolver usuario actual
    return res.json({ usuario });
  } catch (error) {
    console.error("❌ Error en me:", error);
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
};

/**
 * ============================
 *  LOGOUT
 * ============================
 */
export const logout = async (_req: Request, res: Response) => {
  try {
    // Elimina la cookie del cliente
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({ message: "Sesión cerrada correctamente." });
  } catch (error) {
    console.error("❌ Error en logout:", error);
    return res.status(500).json({ message: "Error al cerrar sesión." });
  }
};
