import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

// ✅ Obtener todas las reseñas con su usuario y tour
export const getResenas = async (_req: Request, res: Response) => {
  try {
    const resenas = await prisma.resenas.findMany({
      include: {
        usuario: true, // ✅ singular
        tour: true,    // ✅ singular
      },
    })
    res.json(resenas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener las reseñas' })
  }
}
// 🔹 1. Obtener reseñas aprobadas de un tour
export const getResenasPorTour = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const reseñas = await prisma.resenas.findMany({
      where: { tour_id: Number(id), aprobado: true },
      include: { usuario: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
    })
    res.json(reseñas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener reseñas' })
  }
}

// ✅ Obtener reseña por ID
export const getResenaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const resena = await prisma.resenas.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: true,
        tour: true,
      },
    })

    if (!resena) {
      return res.status(404).json({ message: 'Reseña no encontrada' })
    }

    res.json(resena)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener la reseña' })
  }
}

// 🔹 2. Crear una nueva reseña (pendiente de aprobación)
export const createResena = async (req: Request, res: Response) => {
  try {
    const { usuario_id, tour_id, comentario, puntuacion, detectarSpam } = req.body
    const nuevaResena = await prisma.resenas.create({
      data: { usuario_id, tour_id, comentario, puntuacion },
    })
    const esSpam = await detectarSpam(comentario)
    if (esSpam) return res.status(400).json({ message: "Reseña detectada como spam" })

    res.status(201).json({
      message: 'Reseña enviada correctamente. Pendiente de aprobación.',
      reseña: nuevaResena,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al crear reseña' })
  }
}
// 🔹 3. Aprobación o rechazo de reseñas por un admin
export const moderarResena = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { aprobado } = req.body

    const reseña = await prisma.resenas.update({
      where: { id: Number(id) },
      data: { aprobado },
    })
    res.json({ message: `Reseña ${aprobado ? 'aprobada' : 'rechazada'}`, reseña })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al moderar reseña' })
  }
}

// ✅ Eliminar reseña
export const deleteResena = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.resenas.delete({ where: { id: Number(id) } })
    res.json({ message: 'Reseña eliminada correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al eliminar la reseña' })
  }
}


/**
 * getResenasPorTour  Devuelve reseñas aprobadas (para mostrar al público)
 * incluude: {usuario:}  Añade el nombre del usuario que la escribió
 * createResena   Permite que un usuario cree una reseña pendiente de aprobación
 * moderarResena   Solo el admin puede cambiar aprobado a true o false
 */