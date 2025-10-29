import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

// ✅ Obtener todas las ofertas activas con información del tour
export const getOfertas = async (_req: Request, res: Response) => {
  try {
    const ofertas = await prisma.ofertas.findMany({
      where: { activo: true },
      include: {
        salidas_programadas: {
          include: {
            tours: true, // ✅ tours está dentro de salidas_programadas
          },
        },
      },
    })
    res.json(ofertas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener las ofertas' })
  }
}

// ✅ Obtener una oferta por ID
export const getOfertaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const oferta = await prisma.ofertas.findUnique({
      where: { id: Number(id) },
      include: {
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    })

    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' })
    }

    res.json(oferta)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener la oferta' })
  }
}

// ✅ Crear una nueva oferta
export const createOferta = async (req: Request, res: Response) => {
  try {
    const {
      salidaProgramadaId,
      descripcion,
      descuento_porcentaje,
      descuento_importe,
      fecha_inicio,
      fecha_fin,
    } = req.body

    const nuevaOferta = await prisma.ofertas.create({
      data: {
        salida_programada_id: salidaProgramadaId, // ✅ nombre real en tu modelo
        descripcion,
        descuento_porcentaje,
        descuento_importe,
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        activo: true,
      },
      include: {
        salidas_programadas: {
          include: { tours: true },
        },
      },
    })

    res.status(201).json(nuevaOferta)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al crear la oferta' })
  }
}

// ✅ Eliminar una oferta por ID
export const deleteOferta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.ofertas.delete({ where: { id: Number(id) } })
    res.json({ message: 'Oferta eliminada correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al eliminar la oferta' })
  }
}
