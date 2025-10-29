import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { sendEmail } from '../services/email.service'

const prisma = new PrismaClient()

// ✅ Obtener todas las reservas con datos de usuario y tour
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

// ✅ Obtener una reserva por ID
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

// ✅ Crear una nueva reserva
export const createReserva = async (req: Request, res: Response) => {
  try {
    const { usuario_id, tour_id, salida_programada_id, numero_personas, notas } = req.body;

    // Validación mínima
    if (!usuario_id || !tour_id || !salida_programada_id || !numero_personas) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Crear la nueva reserva
    const nuevaReserva = await prisma.reservas.create({
      data: {
        usuario_id,
        tour_id,
        salida_programada_id,
        numero_personas,
        notas,
        // fecha y estado se generan automáticamente
      },
      include: {
        usuario: true,
        tour: true,
      },
    });

    const usuario = nuevaReserva.usuario
    const tour = nuevaReserva.tour
    const fecha = nuevaReserva.fecha_creacion

    // 📩 Enviar email al usuario
    if (usuario && tour) {
      await sendEmail({
        to: usuario.email,
        subject: "🦅 Confirmación de tu reserva",
        html: `
          <h2>¡Hola ${usuario.nombre}!</h2>
          <p>Tu reserva para el tour <b>${tour.titulo}</b> ha sido confirmada.</p>
          <p>Fecha de la reserva: <b>${new Date(fecha).toLocaleDateString()}</b></p>
          <hr/>
          <p>Gracias por confiar en PrimalExperience Reservas 🌿</p>
        `,
      });
    }

    // 📩 Enviar email interno (al administrador)
    await sendEmail({
      to: "ciro@lalasha@gmail.com",
      subject: "📩 Nueva reserva recibida",
      html: `
        <p>El usuario <b>${usuario?.nombre}</b> ha reservado el tour <b>${tour?.titulo}</b>.</p>
        <p>Número de personas: ${numero_personas}</p>
        <p>Fecha: ${new Date(fecha).toLocaleString()}</p>
      `,
    });

    // ✅ Respuesta final
    res.status(201).json({
      message: "Reserva creada correctamente",
      reserva: nuevaReserva,
    });
  } catch (error) {
    console.error("❌ Error al crear la reserva:", error);
    res.status(500).json({
      message: "Error al crear la reserva",
      error: (error as Error).message,
    });
  }
};


// ✅ Eliminar una reserva por ID
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

