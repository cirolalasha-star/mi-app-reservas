// src/controllers/reservas.controller.ts

import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'                     // ⬅️ para leer el token JWT
import { sendEmail } from '../services/email.service'

const prisma = new PrismaClient()

// ⬅️ misma clave que usas en auth.controller
const JWT_SECRET = process.env.JWT_SECRET || 'CAMBIAR_SECRET_EN_PRODUCCION'

interface TokenPayload {
  id: number
  rol: string
  iat: number
  exp: number
}

/**
 * ===========================================
 *  OBTENER TODAS LAS RESERVAS (ADMIN)
 * ===========================================
 */
export const getReservas = async (_req: Request, res: Response) => {
  try {
    const reservas = await prisma.reservas.findMany({
      include: {
        usuario: true, // ✅ nombre correcto según el schema
        salidas_programadas: {
          include: {
            tours: true, // ✅ tours está dentro de salidas_programadas
          },
        },
      },
    })
    res.json(reservas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener las reservas' })
  }
}

/**
 * ===========================================
 *  OBTENER UNA RESERVA POR ID
 * ===========================================
 */
export const getReservaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const reserva = await prisma.reservas.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: true, // ✅ singular
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    })

    if (!reserva) {
      return res.status(404).json({ message: 'Reserva no encontrada' })
    }

    res.json(reserva)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener la reserva' })
  }
}

/**
 * ===========================================
 *  CREAR UNA NUEVA RESERVA
 * ===========================================
 */
export const createReserva = async (req: Request, res: Response) => {
  try {
    const {
      usuario_id,
      tour_id,
      salida_programada_id,
      numero_personas,
      notas,
    } = req.body

    // Validación mínima
    if (!usuario_id || !tour_id || !salida_programada_id || !numero_personas) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }

    // Crear la nueva reserva
    const nuevaReserva = await prisma.reservas.create({
      data: {
        usuario_id,
        tour_id,
        salida_programada_id,
        numero_personas,
        notas,
        // fecha y estado se generan automáticamente en la BD
      },
      include: {
        usuario: true,
        tour: true,
      },
    })

    const usuario = nuevaReserva.usuario
    const tour = nuevaReserva.tour
    const fecha = nuevaReserva.fecha

    // 📩 Enviar email al usuario
    if (usuario && tour) {
      await sendEmail({
        to: usuario.email,
        subject: '🦅 Confirmación de tu reserva',
        html: `
          <h2>¡Hola ${usuario.nombre}!</h2>
          <p>Tu reserva para el tour <b>${tour.titulo}</b> ha sido confirmada.</p>
          <p>Fecha de la reserva: <b>${new Date(fecha).toLocaleDateString()}</b></p>
          <hr/>
          <p>Gracias por confiar en PrimalExperience Reservas 🌿</p>
        `,
      })
    }

    // 📩 Enviar email interno (al administrador)
    await sendEmail({
      to: 'ciro@lalasha@gmail.com',
      subject: '📩 Nueva reserva recibida',
      html: `
        <p>El usuario <b>${usuario?.nombre}</b> ha reservado el tour <b>${tour?.titulo}</b>.</p>
        <p>Número de personas: ${numero_personas}</p>
        <p>Fecha: ${new Date(fecha).toLocaleString()}</p>
      `,
    })

    // ✅ Respuesta final
    res.status(201).json({
      message: 'Reserva creada correctamente',
      reserva: nuevaReserva,
    })
  } catch (error) {
    console.error('❌ Error al crear la reserva:', error)
    res.status(500).json({
      message: 'Error al crear la reserva',
      error: (error as Error).message,
    })
  }
}

/**
 * ===========================================
 *  MIS RESERVAS (USUARIO ACTUAL)
 * ===========================================
 * Lee el token (Authorization o cookie "token"),
 * saca el id del usuario y devuelve SOLO sus reservas.
 */
export const misReservas = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Sacar token del header o de la cookie
    let token: string | undefined

    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else if ((req as any).cookies?.token) {
      token = (req as any).cookies.token
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: 'No hay token de autenticación.' })
    }

    // 2️⃣ Verificar token y obtener el id del usuario
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload

    // 3️⃣ Consultar en Prisma las reservas de ese usuario
    const reservas = await prisma.reservas.findMany({
      where: { usuario_id: decoded.id },    // ⬅️ clave foránea en tu modelo
      orderBy: { fecha: 'desc' },           // ⬅️ si tu campo se llama distinto, cámbialo
      include: {
        usuario: true,
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    })

    // 4️⃣ Devolver la lista
    return res.json({ reservas })
  } catch (error) {
    console.error('❌ Error en misReservas:', error)
    return res
      .status(500)
      .json({ message: 'Error al obtener tus reservas.' })
  }
}

/**
 * ===========================================
 *  ELIMINAR UNA RESERVA POR ID
 * ===========================================
 */
export const deleteReserva = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await prisma.reservas.delete({ where: { id: Number(id) } })
    res.json({ message: 'Reserva eliminada correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al eliminar la reserva' })
  }
}
