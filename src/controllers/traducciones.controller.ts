import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { traducirTexto } from '../services/translate.service'

const prisma = new PrismaClient()

// 🔹 Traduce y guarda la versión en la base de datos
export const traducirTour = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { idioma } = req.body // ej: "en", "fr", "de"

    const tour = await prisma.tours.findUnique({ where: { id: Number(id) } })
    if (!tour) return res.status(404).json({ message: "Tour no encontrado" })

    const textoOriginal: string = tour.descripcion ?? "";
    const textoTraducido = await traducirTexto(textoOriginal, idioma);


    // Guardamos la traducción en la tabla
    const nuevaTraduccion = await prisma.traducciones.create({
      data: {
        idioma,
        texto: textoTraducido,
        tourId: tour.id,
      },
    })

    res.json({
      message: `Traducción al ${idioma} creada correctamente`,
      traduccion: nuevaTraduccion,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al traducir el tour" })
  }
}
//mostrar traducciones guardadas desde el backend
export const getTraduccionesTour = async (req: Request, res: Response) => {
    const { id } = req.params
    const traducciones = await prisma.traducciones.findMany({
        where: { tourId: Number(id) },
    })
    res.json(traducciones)
}

/**
 * const { idioma } = req.body   Recibe el idioma destino desde la petición
 * findunique()       Busca el tour original
 * traducirTexto()    Llama al servicio IA para traducir ña descripción
 * prisma.traducciones.create()  Guarda la traducción con su idioma y referencia
 * res.json()         Devuelve el resultado traducido al cliente
 */