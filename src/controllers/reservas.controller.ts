// src/controllers/reservas.controller.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { sendEmail } from "../services/email.service";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "CAMBIAR_SECRET_EN_PRODUCCION"
interface TokenPayload {
  id: number;
  rol: string;
  iat: number;
  exp: number;
}
/**
 * ====================================
 *  GET TODAS LAS RESERVAS
 * ====================================
 */
export const getReservas = async (_req: Request, res: Response) => {
  try {
    const reservas = await prisma.reservas.findMany({
      include: {
        // 👇 nombre del relation field en el schema (singular)
        usuario: true,
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    });

    return res.json(reservas);
  } catch (error) {
    console.error("❌ Error en getReservas:", error);
    return res.status(500).json({ message: "Error al obtener las reservas" });
  }
};

/**
 * ====================================
 *  GET RESERVA POR ID
 * ====================================
 */
export const getReservaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reserva = await prisma.reservas.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: true,
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    });

    if (!reserva) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    return res.json(reserva);
  } catch (error) {
    console.error("❌ Error en getReservaById:", error);
    return res.status(500).json({ message: "Error al obtener la reserva" });
  }
};
/**
 * ====================================
 *  GET MIS RESERVAS (del usuario logueado)
 * ====================================
 */
export const getMisReservas = async (req: Request, res: Response) => {
  try {
    // 1) Sacar token de Authorization o cookie (igual que en /auth/me)
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

    // 2) Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    // 3) Buscar reservas de ese usuario
    const reservas = await prisma.reservas.findMany({
      where: { usuario_id: decoded.id },
      include: {
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return res.json(reservas);
  } catch (error) {
    console.error("❌ Error en getMisReservas:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener tus reservas" });
  }
};


/**
 * ====================================
 *  CREAR RESERVA (usa usuario del JWT)
 * ====================================
 */
export const createReserva = async (req: Request, res: Response) => {
  try {
    // 1) Sacar token igual que en getMisReservas
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
    const usuarioId = decoded.id; // 👈 este es el usuario real

    // 2) Datos que SÍ vienen en el body
    const {
      tour_id,
      salida_programada_id, // 👈 id de la salida concreta
      numero_personas,
      notas,
    } = req.body;

    // 3) Validación mínima
    if (!tour_id || !salida_programada_id || !numero_personas) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // 4) Crear reserva en BD
    const nuevaReserva = await prisma.reservas.create({
      data: {
        usuario_id: Number(usuarioId),              // 👈 viene del token
        tour_id: Number(tour_id),
        salida_programada_id: Number(salida_programada_id),
        numero_personas: Number(numero_personas),
        notas: notas ?? null,
      },
      include: {
        usuario: true,
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    });

    // 5) Para emails, casteamos a any para no pelearnos con tipos
    const reservaConRelaciones = nuevaReserva as any;
    const usuario = reservaConRelaciones.usuario;
    const salida = reservaConRelaciones.salidas_programadas;
    const tour = salida?.tours;
    const fecha = nuevaReserva.fecha;

    // 📩 Email al usuario
    if (usuario && tour) {
      await sendEmail({
        to: usuario.email,
        subject: "🦅 Confirmación de tu reserva",
        html: `
          <h2>¡Hola ${usuario.nombre}!</h2>
          <p>Tu reserva para el tour <b>${tour.titulo}</b> ha sido confirmada.</p>
          <p>Fecha de la reserva: <b>${new Date(
            fecha
          ).toLocaleDateString()}</b></p>
          <hr/>
          <p>Gracias por confiar en PrimalExperience Reservas 🌿</p>
        `,
      });
    }

    // 📩 Email interno
    await sendEmail({
      to: "cirolalasha@gmail.com",
      subject: "📩 Nueva reserva recibida",
      html: `
        <p>El usuario <b>${usuario?.nombre}</b> ha reservado el tour <b>${tour?.titulo}</b>.</p>
        <p>Número de personas: ${numero_personas}</p>
        <p>Fecha: ${new Date(fecha).toLocaleString()}</p>
      `,
    });

    return res.status(201).json({
      message: "Reserva creada correctamente",
      reserva: nuevaReserva,
    });
  } catch (error) {
    console.error("❌ Error al crear la reserva:", error);
    return res.status(500).json({
      message: "Error al crear la reserva",
      error: (error as Error).message,
    });
  }
};

/**
 * ====================================
 *  ELIMINAR RESERVA
 * ====================================
 */
export const deleteReserva = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.reservas.delete({ where: { id: Number(id) } });

    return res.json({ message: "Reserva eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar la reserva:", error);
    return res.status(500).json({ message: "Error al eliminar la reserva" });
  }
};
