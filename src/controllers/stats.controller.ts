import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

// 🔹 Estadísticas generales
export const getStats = async (_req: Request, res: Response) => {
  try {
    // 1️⃣ Total de usuarios
    const totalUsuarios = await prisma.usuarios.count()

    // 2️⃣ Total de reservas
    const totalReservas = await prisma.reservas.count()

    // 3️⃣ Total de tours disponibles
    const totalTours = await prisma.tours.count()

    // 4️⃣ Tours más populares (por número de reservas)
    const topTours = await prisma.tours.findMany({
      take: 5, // los 5 más reservados
      orderBy: { reservas: { _count: 'desc' } },
      include: { _count: { select: { reservas: true } } },
    })

    // 5️⃣ Ganancias estimadas (suma de precios de tours reservados)
    const ingresos = await prisma.reservas.findMany({
      include: { tour: true },
    })
    const totalIngresos = ingresos.reduce((acc, r) => acc + (r.tour?.precio || 0), 0)

    // 6️⃣ Reservas por mes (últimos 6 meses)
    const reservasMensuales = await prisma.$queryRaw`
      SELECT
        TO_CHAR(fecha, 'YYYY-MM') AS mes,
        COUNT(*)::int AS total
      FROM reservas
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT 6;
    `
    // Promedio reservas por usuario
    const promedioReservas = totalReservas / (totalUsuarios || 1)
    
    //Tours sin reservas(para revisar)
    const toursSinReservas = await prisma.tours.findMany({
     where: { reservas: { none: {} } },
     select: { id: true, titulo: true },
    })

    //Usuarios más activos
    const usuariosActivos = await prisma.usuarios.findMany({
        take: 3,
        orderBy: { reservas: { _count: 'desc' } },
        include: { _count: { select: { reservas: true } } },
    })



    res.json({
      totalUsuarios,
      totalReservas,
      totalTours,
      totalIngresos,
      topTours,
      reservasMensuales,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener estadísticas' })
  }
}

/**
 * prisma.usuarios.count   Cuenta todos los usuarios registrados
 * prisma.tours.findMany   Devuelve los tours más reservados
 * include: {_count: {sekect:{rservas:true}}}  Cuenta cuántas reservas tiene cada tour
 * prisma.$queryRaw   Ejecuta SQL puro(ideal para agrupar por mes)
 * reduce    Suma los precios de todos los tours reservados para estimar ingresos totales
 */