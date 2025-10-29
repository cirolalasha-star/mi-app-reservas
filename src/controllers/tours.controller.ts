// src/controllers/tours.controller.ts
import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { generarDescripcionTour, traducirTexto } from '../services/ai.services'
import { create } from 'domain'
import { connect } from 'http2'

const prisma = new PrismaClient()

// ✅ Filtro Avanzado de Tours + Paginación + Ordenamiento 
export const filtrarTours = async (req: Request, res: Response) => {
  try {
    
    const { busqueda, categoria, minPrecio, maxPrecio, temporada, page, pageSize, sort, order } = req.query

    const filtros: any = {}

    // Buscar por palabra en nombre o descripción
    if (busqueda) {
      filtros.OR = [
        { titulo: { contains: String(busqueda), mode: 'insensitive' } },
        { descripcion: { contains: String(busqueda), mode: 'insensitive' } }
      ]
    }

    // Filtrar por precio
    if (minPrecio || maxPrecio) {
      filtros.precio_base = {} // ✅ el campo correcto en tu schema es precio_base
      if (minPrecio) filtros.precio_base.gte = Number(minPrecio)
      if (maxPrecio) filtros.precio_base.lte = Number(maxPrecio)
    }

    // Filtrar por categoría
    if (categoria) {
      filtros.tour_categorias = {
        some: {
          categorias: { nombre: { contains: String(categoria), mode: 'insensitive' } }
        }
      }
    }

    // Temporada
    if (temporada) {
      filtros.temporada_inicio_mes = Number(temporada)
    }

    // Paginación
    const take = pageSize ? Number(pageSize) : 10
    const skip = page ? (Number(page) - 1) * take : 0

    // Ordenamiento
    const sortBy = sort ? String(sort) : 'id'
    const sortOrder = order === 'desc' ? 'desc' : 'asc'

    // Consulta total
    const total = await prisma.tours.count({ where: filtros })

    // Consulta principal
    const tours = await prisma.tours.findMany({
      where: filtros,
      include: {
        tour_categorias: { include: { categorias: true } }
      },
      skip,
      take,
      orderBy: { [sortBy]: sortOrder }
    })

    res.json({
      total,
      page: Number(page) || 1,
      pageSize: take,
      totalPages: Math.ceil(total / take),
      results: tours
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al filtrar los tours' })
  }
} // <-- AQUÍ FALTABA ESTA LLAVE

//Crear tour con descripción AI
export const createTourAI = async (req: Request, res: Response) => {
  try {
    const { titulo, ubicacion, temporada_inicio_mes, temporada_fin_mes, precio_base, categoriaIds, cupo_maximo } = req.body

    
    //Generar descripción automática (usa los meses para contexto)
    const descripcion = await generarDescripcionTour(
      titulo,
      ubicacion,
      `de ${temporada_inicio_mes} a ${temporada_fin_mes}`
    )

    //Guardar en la base de datos
    const nuevoTour = await prisma.tours.create({
  data: {
    titulo,
    ubicacion,
    precio_base: parseFloat(precio_base),
    descripcion,
    temporada_inicio_mes: parseInt(temporada_inicio_mes),
    temporada_fin_mes: parseInt(temporada_fin_mes),
    cupo_maximo: cupo_maximo ? Number(cupo_maximo) : 0,
    ...(categoriaIds && categoriaIds.length > 0
      ? {
          tour_categorias: {
            create: categoriaIds.map((id: number) => ({
              categorias: { connect: { id } },
            })),
          },
        }
      : {}),
  },
  include: {
    tour_categorias: { include: { categorias: true } },
  },
})


    const idiomas = ["en", "fr", "de"]
    for (const idioma of idiomas) {
      const textoTraducido = await traducirTexto(descripcion, idioma)
      await prisma.traducciones.create({
        data: { idioma, texto: textoTraducido, tourId: nuevoTour.id }
      })
    }

    res.status(201).json({
      message: "Tour creado correctamente con descripción AI",
      tour: nuevoTour,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al crear el tour"})
  }
}

/**
 * const { titulo, ubicacion, ...} Recoge los datos básicos del tour desde el body
 * generarDescripcionTour   Llama a OpenAi con los datos y recibe un texto coherente
 * prisma.tours.create   Inserta el tour en la base de datos junto con la descripción generada
 * parseFloat(precio)  Asegura que el precio se guarde como número, no string
 */
//Controlador para regenerar descripción con IA
export const regenerarDescripcionTour = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { titulo, ubicacion, temporada } = req.body

    const descripcion = await generarDescripcionTour(titulo, ubicacion, temporada)

    // Si quieres guardar la nueva descripción en la base de datos:
    const actualizado = await prisma.tours.update({
      where: { id: Number(id) },
      data: { descripcion },
    })

    res.json({
      message: "Descripción del tour regenerada correctamente con IA",
      descripcion,
      tour: actualizado,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error regenerando la descripción del tour" })
  }
}

// ✅ Obtener todos los tours con sus categorías
export const getTours = async (_req: Request, res: Response) => {
  try {
    const tours = await prisma.tours.findMany({
      include: {
        tour_categorias: { include: { categorias: true } }
      }
    })
    res.json(tours)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener los tours' })
  }
}

// ✅ Obtener un tour por ID
export const getTourById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const tour = await prisma.tours.findUnique({
      where: { id: Number(id) },
      include: {
        tour_categorias: { include: { categorias: true } }
      }
    })

    if (!tour) return res.status(404).json({ message: 'Tour no encontrado' })
    res.json(tour)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener el tour' })
  }
}

// ✅ Crear un nuevo tour
export const createTourBasic = async (req: Request, res: Response) => {
  try {
    const { titulo, descripcion, precio_base, categoriaIds, cupo_maximo, temporada_inicio_mes, temporada_fin_mes } = req.body

    const nuevoTour = await prisma.tours.create({
  data: {
    titulo,
    descripcion,
    precio_base,
    cupo_maximo,
    temporada_inicio_mes: parseInt(temporada_inicio_mes),
    temporada_fin_mes: parseInt(temporada_fin_mes),
    tour_categorias: {
      create: categoriaIds.map((id: number) => ({
        categorias: { connect: { id } },
      })),
    },
  },
  include: {
    tour_categorias: { include: { categorias: true } },
  },
})


    res.status(201).json(nuevoTour)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al crear el tour' })
  }
}

// ✅ Eliminar un tour por ID
export const deleteTour = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.tours.delete({ where: { id: Number(id) } })
    res.json({ message: 'Tour eliminado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al eliminar el tour' })
  }
}

export const updateTourImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (!req.file) return res.status(400).json({ message: 'No se subió imagen'})

      const updated = await prisma.tours.update({
        where: { id: Number(id) },
        data: { imagen_url: `/uploads/${req.file.filename}` },
      })

      res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al actualizar imagen del tour'})
  }
}

//Promedio de puntuaciones por tour
export const getPromedioPuntuacion = async (req: Request, res: Response) => {
  const { id } = req.params
  const promedio = await prisma.resenas.aggregate({
    _avg: { puntuacion: true },
    where: { tour_id: Number(id), aprobado: true },
  })
  res.json({ promedio: promedio._avg.puntuacion || 0 })
}
