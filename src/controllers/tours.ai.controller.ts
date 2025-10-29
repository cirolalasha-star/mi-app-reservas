import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { generarDescripcionTour } from '../services/ai.service'

const prisma = new PrismaClient()

export const generarDescripcionAI = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tour = await prisma.tours.findUnique({ where: { id: Number(id) } })

    if (!tour) return res.status(404).json({ message: 'Tour no encontrado' })

    // Generar nueva descripción basada en sus datos
    const nuevaDescripcion = await generarDescripcionTour(
      tour.titulo,
      tour.ubicacion || "Ubicación desconocida",
      tour.temporada || "toda temporada"
    )

    const actualizado = await prisma.tours.update({
      where: { id: Number(id) },
      data: { descripcion: nuevaDescripcion },
    })

    res.json({
      message: "Descripción regenerada con éxito",
      descripcion: nuevaDescripcion,
      tour: actualizado,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al regenerar la descripción' })
  }
}
