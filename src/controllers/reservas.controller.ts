// src/controllers/reservas.controller.ts
import { PrismaClient, estado_reserva } from "@prisma/client";
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


// 🔹 Estadísticas: reservas agrupadas por experiencia (solo admin)
export const getReservasPorExperienciaAdmin = async (
  req: Request,
  res: Response
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

    if (decoded.rol !== "admin") {
      return res.status(403).json({ message: "No autorizado (solo admin)." });
    }

    // Traemos las reservas con la info del tour
    const reservas = await prisma.reservas.findMany({
      include: {
        salidas_programadas: {
          include: { tours: true },
        },
      },
    });

    type Estat = {
      tour_id: number;
      titulo: string;
      ubicacion: string | null;
      reservas: number;
      personas: number;
    };

    const mapa = new Map<number, Estat>();

    for (const r of reservas as any[]) {
      const tour = r.salidas_programadas?.tours;
      if (!tour) continue;

      const key = tour.id as number;

      const actual = mapa.get(key) ?? {
        tour_id: key,
        titulo: tour.titulo,
        ubicacion: tour.ubicacion ?? null,
        reservas: 0,
        personas: 0,
      };

      actual.reservas += 1;
      actual.personas += r.numero_personas ?? 0;

      mapa.set(key, actual);
    }

    const resultado = Array.from(mapa.values()).sort(
      (a, b) => b.reservas - a.reservas
    );

    return res.json(resultado);
  } catch (error) {
    console.error("❌ Error en getReservasPorExperienciaAdmin:", error);
    return res.status(500).json({
      message: "Error al obtener estadísticas de reservas por experiencia",
    });
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
      salida_programada_id,
      numero_personas,
      notas,
    } = req.body;

    const numPersonas = Number(numero_personas);

    // 3) Validación mínima
    if (!tour_id || !salida_programada_id || !numPersonas) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    if (numPersonas <= 0) {
      return res
        .status(400)
        .json({ message: "El número de personas debe ser mayor que 0." });
    }

    // 4) Comprobar salida y plazas libres
    const salida = await prisma.salidas_programadas.findUnique({
      where: { id: Number(salida_programada_id) },
    });

    if (!salida || !salida.activo) {
      return res.status(400).json({
        message: "La salida seleccionada no está disponible.",
      });
    }

    const plazasLibres =
      salida.plazas_totales - salida.plazas_ocupadas;

    if (plazasLibres <= 0) {
      return res.status(400).json({
        message: "Esta salida ya no tiene plazas disponibles.",
      });
    }

    if (numPersonas > plazasLibres) {
      return res.status(400).json({
        message: `No hay plazas suficientes. Quedan solo ${plazasLibres} plazas libres.`,
      });
    }

    // 5) Transacción: actualizar plazas_ocupadas + crear reserva
    const [, nuevaReserva] = await prisma.$transaction([
      prisma.salidas_programadas.update({
        where: { id: salida.id },
        data: {
          plazas_ocupadas: {
            increment: numPersonas,
          },
        },
      }),
      prisma.reservas.create({
        data: {
          usuario_id: Number(usuarioId),
          tour_id: Number(tour_id),
          salida_programada_id: Number(salida_programada_id),
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
      }),
    ]);

    // 6) Emails (igual que antes)
    const reservaConRelaciones = nuevaReserva as any;
    const usuario = reservaConRelaciones.usuario;
    const salidaRes = reservaConRelaciones.salidas_programadas;
    const tour = salidaRes?.tours;
    const fecha = nuevaReserva.fecha;

    if (usuario && tour) {
      await sendEmail({
        to: usuario.email,
        subject: "🦅 Confirmación de tu reserva",
        html: `
          <h2>¡Hola ${usuario.nombre}!</h2>
          <p>Tu reserva para el tour <b>${tour.titulo}</b> ha sido registrada.</p>
          <p>Fecha de la reserva: <b>${new Date(
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
 *  ACTUALIZAR ESTADO DE UNA RESERVA (admin)
 *  PATCH /api/reservas/:id/estado
 *  Body: { estado: "pendiente" | "confirmada" | "cancelada" }
 * ====================================
 */
export const updateReservaEstado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body as { estado?: string };

    if (!estado) {
      return res
        .status(400)
        .json({ message: "Debe indicar un estado nuevo." });
    }

    // Tipo del enum de Prisma
    type EstadoReserva = (typeof estado_reserva)[keyof typeof estado_reserva];

    const estadosValidos: EstadoReserva[] = [
      estado_reserva.pendiente,
      estado_reserva.confirmada,
      estado_reserva.cancelada,
    ];

    // Comprobamos que el string recibido es uno de los del enum
    if (!estadosValidos.includes(estado as EstadoReserva)) {
      return res.status(400).json({
        message: `Estado inválido. Debe ser uno de: ${estadosValidos.join(
          ", "
        )}.`,
      });
    }

    const estadoEnum = estado as EstadoReserva;

    const reservaActualizada = await prisma.reservas.update({
      where: { id: Number(id) },
      data: { estado: estadoEnum }, // 👈 aquí ya es del tipo correcto
      include: {
        usuario: true,
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    });

    return res.json({
      message: "Estado de la reserva actualizado correctamente",
      reserva: reservaActualizada,
    });
  } catch (error) {
    console.error("❌ Error al actualizar el estado de la reserva:", error);
    return res.status(500).json({
      message: "Error al actualizar el estado de la reserva",
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
/**
 * ====================================
 *  GET RESERVAS (ADMIN)
 *  GET /api/reservas/admin
 * ====================================
 */
export const getReservasAdmin = async (_req: Request, res: Response) => {
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
      orderBy: { fecha: "desc" },
    });

    return res.json(reservas);
  } catch (error) {
    console.error("❌ Error en getReservasAdmin:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener las reservas (admin)" });
  }
};

/**
 * ==============================================
 *  RESUMEN RESERVAS POR EXPERIENCIA (ADMIN)
 *  GET /api/reservas/resumen-por-experiencia
 * ==============================================
 */
export const getResumenReservasPorExperiencia = async (
  _req: Request,
  res: Response
) => {
  try {
    const resumenRaw = await prisma.reservas.groupBy({
      by: ["tour_id"],
      _count: { _all: true },
      _sum: { numero_personas: true },
    });

    // IDs de tours (quitando nulls)
    const tourIds = resumenRaw
      .map((r) => r.tour_id)
      .filter((id): id is number => id !== null);

    // Info básica de los tours
    const tours = await prisma.tours.findMany({
      where: { id: { in: tourIds } },
      select: {
        id: true,
        titulo: true,
        ubicacion: true,
      },
    });

    const mapaTours = new Map(tours.map((t) => [t.id, t]));

    const resultado = resumenRaw
      .filter((r) => r.tour_id !== null)
      .map((r) => {
        const tour = mapaTours.get(r.tour_id as number);
        return {
          tour_id: r.tour_id,
          titulo: tour?.titulo ?? "Sin título",
          ubicacion: tour?.ubicacion ?? null,
          reservas: r._count._all,
          personas: r._sum.numero_personas ?? 0,
        };
      });

    return res.json(resultado);
  } catch (error) {
    console.error("❌ Error en getResumenReservasPorExperiencia:", error);
    return res.status(500).json({
      message:
        "Error al obtener el resumen de reservas por experiencia",
    });
  }
};
