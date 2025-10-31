import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

// 📊 Estadísticas generales del sistema
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
      include: {
        _count: { select: { reservas: true } },
        tour_categorias: { include: { categorias: true } },
      },
    })

    // 5️⃣ Ganancias estimadas (suma de precios base de tours reservados)
    const ingresos = await prisma.reservas.findMany({
      include: { tour: true },
    })

    const totalIngresos = ingresos.reduce(
      (acc, r) => acc + (Number(r.tour?.precio_base) || 0),
      0
    )

    // 6️⃣ Reservas por mes (últimos 6 meses)
    const reservasMensuales = await prisma.$queryRaw<
      { mes: string; total: number }[]
    >`
      SELECT
        TO_CHAR(fecha, 'YYYY-MM') AS mes,
        COUNT(*)::int AS total
      FROM reservas
      GROUP BY mes
      ORDER BY mes DESC
      LIMIT 6;
    `

    // 7️⃣ Promedio de reservas por usuario
    const promedioReservas = totalReservas / (totalUsuarios || 1)

    // 8️⃣ Tours sin reservas
    const toursSinReservas = await prisma.tours.findMany({
      where: { reservas: { none: {} } },
      select: { id: true, titulo: true },
    })

    // 9️⃣ Usuarios más activos (más reservas)
    const usuariosActivos = await prisma.usuarios.findMany({
      take: 3,
      orderBy: { reservas: { _count: 'desc' } },
      include: { _count: { select: { reservas: true } } },
    })

    // ✅ Respuesta final completa
    res.json({
      totalUsuarios,
      totalReservas,
      totalTours,
      totalIngresos,
      promedioReservas,
      reservasMensuales,
      topTours,
      toursSinReservas,
      usuariosActivos,
    })
  } catch (error) {
    console.error("❌ Error en getStats:", error)
    res.status(500).json({ message: 'Error al obtener estadísticas' })
  }
}
