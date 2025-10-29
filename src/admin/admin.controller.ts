// src/admin/admin.controller.ts
//Explicación: Importamos Prisma para acceder a labase de datos, creamos una función que devuelve estadísticas generales(cuentas de ususarios, tours, reservas, reseñas), esto es lo que luego veré en mi panel web o en un gráfico
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const totalUsuarios = await prisma.usuarios.count();
    const totalTours = await prisma.tours.count();
    const totalReservas = await prisma.reservas.count();
    const totalResenas = await prisma.resenas.count();

    const datos = {
      usuarios: totalUsuarios,
      tours: totalTours,
      reservas: totalReservas,
      resenas: totalResenas,
    };

    res.json(datos);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
