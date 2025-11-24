// src/controllers/reservas.controller.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { sendEmail } from "../services/email.service";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "CAMBIAR_SECRET_EN_PRODUCCION";

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
    // Igual que en /auth/me: token de Authorization o cookie
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
 *  + validar plazas libres y actualizar plazas_ocupadas
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
    const usuarioId = decoded.id;

    // 2) Datos que vienen en el body
    const {
      tour_id,
      salida_programada_id, // id de la salida concreta
      numero_personas,
      notas,
    } = req.body;

    // 3) Validación mínima
    if (!tour_id || !salida_programada_id || !numero_personas) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const numPersonas = Number(numero_personas);
    const salidaId = Number(salida_programada_id);
    const tourIdBody = Number(tour_id);

    if (numPersonas <= 0) {
      return res
        .status(400)
        .json({ message: "El número de personas debe ser mayor que 0." });
    }

    // 4) Leer la salida programada para comprobar plazas y tour asociado
    const salida = await prisma.salidas_programadas.findUnique({
      where: { id: salidaId },
      select: {
        id: true,
        tour_id: true,
        activo: true,
        plazas_totales: true,
        plazas_ocupadas: true,
      },
    });

    if (!salida || salida.activo === false) {
      return res
        .status(404)
        .json({ message: "La salida seleccionada no existe o no está activa." });
    }

    // Si se manda un tour_id que no coincide con la salida, rechazamos
    if (salida.tour_id !== tourIdBody) {
      return res.status(400).json({
        message: "La salida seleccionada no pertenece al tour indicado.",
      });
    }

    const plazasTotales = salida.plazas_totales ?? 0;
    const plazasOcupadas = salida.plazas_ocupadas ?? 0;
    const plazasLibres = plazasTotales - plazasOcupadas;

    if (plazasTotales <= 0) {
      return res.status(400).json({
        message:
          "Esta salida no tiene un cupo configurado. Contacta con nosotros para reservar.",
      });
    }

    if (plazasLibres <= 0) {
      return res.status(400).json({
        message: "Esta salida ya no tiene plazas libres. Elige otra fecha.",
      });
    }

    if (numPersonas > plazasLibres) {
      return res.status(400).json({
        message: `Solo quedan ${plazasLibres} plazas libres para esta salida.`,
      });
    }

    // 5) Actualizar plazas_ocupadas y crear la reserva
    //    (no usamos transacción compleja, pero para tu escala es suficiente)
    await prisma.salidas_programadas.update({
      where: { id: salidaId },
      data: {
        plazas_ocupadas: plazasOcupadas + numPersonas,
      },
    });

    const nuevaReserva = await prisma.reservas.create({
      data: {
        usuario_id: Number(usuarioId),
        tour_id: tourIdBody,
        salida_programada_id: salidaId,
        numero_personas: numPersonas,
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

    // 6) Emails
    const reservaConRelaciones = nuevaReserva as any;
    const usuario = reservaConRelaciones.usuario;
    const salidaRelacion = reservaConRelaciones.salidas_programadas;
    const tour = salidaRelacion?.tours;
    const fecha = nuevaReserva.fecha;

    if (usuario && tour) {
      await sendEmail({
        to: usuario.email,
        subject: "🦅 Confirmación de tu reserva",
        html: `
          <h2>¡Hola ${usuario.nombre}!</h2>
          <p>Tu reserva para el tour <b>${tour.titulo}</b> ha sido registrada.</p>
          <p>Estado actual: <b>${nuevaReserva.estado}</b></p>
          <p>Fecha de la solicitud: <b>${new Date(
            fecha
          ).toLocaleDateString()}</b></p>
          <hr/>
          <p>Gracias por confiar en PrimalExperience Reservas 🌿</p>
        `,
      });
    }

    await sendEmail({
      to: "cirolalasha@gmail.com",
      subject: "📩 Nueva reserva recibida",
      html: `
        <p>El usuario <b>${usuario?.nombre}</b> ha reservado el tour <b>${tour?.titulo}</b>.</p>
        <p>Número de personas: ${numPersonas}</p>
        <p>Fecha de solicitud: ${new Date(fecha).toLocaleString()}</p>
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
