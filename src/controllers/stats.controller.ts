// src/controllers/stats.controller.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

/**
 * GET /api/admin/stats/reservas-por-tour
 *
 * Devuelve métricas agregadas por experiencia (tour):
 * - total de reservas
 * - total de personas
 * - reservas por estado (pendiente / confirmada / cancelada)
 */
export const getReservasPorTour = async (_req: Request, res: Response) => {
  try {
    // 1) Sacamos todas las reservas (solo campos que nos interesan)
    const reservas = await prisma.reservas.findMany({
      select: {
        tour_id: true,
        numero_personas: true,
        estado: true,
      },
    });

    // 2) Sacamos todos los tours (para título y ubicación)
    const tours = await prisma.tours.findMany({
      select: {
        id: true,
        titulo: true,
        ubicacion: true,
      },
    });

    // 3) Mapa base por tour
    const mapa = new Map<
      number,
      {
        tour_id: number;
        titulo: string;
        ubicacion: string | null;
        total_reservas: number;
        total_personas: number;
        pendientes: number;
        confirmadas: number;
        canceladas: number;
      }
    >();

    for (const t of tours) {
      mapa.set(t.id, {
        tour_id: t.id,
        titulo: t.titulo,
        ubicacion: t.ubicacion,
        total_reservas: 0,
        total_personas: 0,
        pendientes: 0,
        confirmadas: 0,
        canceladas: 0,
      });
    }

    // 4) Recorremos reservas y vamos sumando
    for (const r of reservas) {
      if (!r.tour_id) continue;

      const stats = mapa.get(r.tour_id);
      if (!stats) continue;

      const personas = Number(r.numero_personas ?? 0);
      const estado = (r.estado || "").toLowerCase();

      stats.total_reservas += 1;
      stats.total_personas += isNaN(personas) ? 0 : personas;

      if (estado === "pendiente") stats.pendientes += 1;
      else if (estado === "confirmada") stats.confirmadas += 1;
      else if (estado === "cancelada") stats.canceladas += 1;
    }

    // 5) Solo devolvemos tours que tengan al menos 1 reserva
    const resultado = Array.from(mapa.values()).filter(
      (t) => t.total_reservas > 0
    );

    return res.json(resultado);
  } catch (error) {
    console.error("❌ Error en getReservasPorTour:", error);
    return res.status(500).json({
      message: "Error al obtener estadísticas de reservas por experiencia",
    });
  }
};
