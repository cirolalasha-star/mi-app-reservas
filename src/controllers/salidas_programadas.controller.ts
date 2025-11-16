// src/controllers/salidas_programadas.controller.ts
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

/**
 * 📌 GET /api/salidas_programadas
 * Devuelve todas las salidas programadas activas + datos del tour asociado.
 */
export const getSalidasProgramadas = async (_req: Request, res: Response) => {
  try {
    const salidas = await prisma.salidas_programadas.findMany({
      where: { activo: true },        // solo las activas
      include: {
        tours: {                      // relación del modelo Prisma
          select: {
            titulo: true,
            ubicacion: true,
          },
        },
      },
      orderBy: {
        fecha_inicio: "asc",
      },
    });

    res.json(salidas);
  } catch (error) {
    console.error("❌ Error al obtener salidas programadas:", error);
    res.status(500).json({ error: "Error al obtener salidas programadas" });
  }
};
