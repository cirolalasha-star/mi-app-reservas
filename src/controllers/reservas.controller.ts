// src/controllers/reservas.controller.ts
import { PrismaClient, estado_reserva } from "@prisma/client";
import { Request, Response } from "express";
import { sendEmail } from "../services/email.service";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "CAMBIAR_SECRET_EN_PRODUCCION";

interface TokenPayload {
  id: number;
  rol: string;
  iat: number;
  exp: number;
}

/**
 * ====================================
 *  GET TODAS LAS RESERVAS (uso general)
 *  GET /api/reservas
 * ====================================
 */
export const getReservas = async (_req: Request, res: Response) => {
  try {
    const reservas = await prisma.reservas.findMany({
      include: {
        usuario: true,
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return res.json(reservas);
  } catch (error) {
    console.error("❌ Error en getReservas:", error);
    return res.status(500).json({ message: "Error al obtener las reservas" });
  }
};
/**
 * ====================================
 *  GET TODAS LAS RESERVAS (ADMIN)
 *  GET /api/reservas/admin
 *  Soporta filtros:
 *   - ?tour_id=10
 *   - ?guia_id=5   (ID del guía asociado al tour)
 *   - ?fecha_desde=2025-01-01
 *   - ?fecha_hasta=2025-01-31
 * ====================================
 */
export const getReservasAdmin = async (req: Request, res: Response) => {
  try {
    const { tour_id, guia_id, fecha_desde, fecha_hasta } = req.query as {
      tour_id?: string;
      guia_id?: string;
      fecha_desde?: string;
      fecha_hasta?: string;
    };

    const where: any = {};

    // Filtro por experiencia (tour)
    if (tour_id) {
      where.tour_id = Number(tour_id);
    }

    // Filtro por rango de fechas (fecha de solicitud de la reserva)
    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) {
        const desde = new Date(fecha_desde);
        if (!isNaN(desde.getTime())) {
          where.fecha.gte = desde;
        }
      }
      if (fecha_hasta) {
        const hasta = new Date(fecha_hasta);
        if (!isNaN(hasta.getTime())) {
          // Límite al final del día
          hasta.setHours(23, 59, 59, 999);
          where.fecha.lte = hasta;
        }
      }
    }

    // Filtro por guía (guia_id en tours)
    if (guia_id) {
      where.salidas_programadas = {
        tours: {
          guia_id: Number(guia_id),
        },
      };
    }

    const reservas = await prisma.reservas.findMany({
      where,
      include: {
        usuario: true,
        salidas_programadas: {
          include: { tours: true },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return res.json(reservas);
  } catch (error) {
    console.error("❌ Error en getReservasAdmin:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener las reservas (admin)" });
  }
};



/**
 * ====================================
 *  GET RESERVA POR ID
 *  GET /api/reservas/:id
 * ====================================
 */
export const getReservaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reserva = await prisma.reservas.findUnique({
      where: { id: Number(id) },
      include: {
        usuario: true,
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    });

    if (!reserva) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    return res.json(reserva);
  } catch (error) {
    console.error("❌ Error en getReservaById:", error);
    return res.status(500).json({ message: "Error al obtener la reserva" });
  }
};

/**
 * ====================================
 *  GET MIS RESERVAS (del usuario logueado)
 *  GET /api/reservas/mias
 * ====================================
 */
export const getMisReservas = async (req: Request, res: Response) => {
  try {
    // Igual que en /auth/me: token de Authorization o cookie
    const authHeader = req.headers.authorization;
    const tokenHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const tokenCookie = (req as any).cookies?.token as string | undefined;
    const token = tokenHeader || tokenCookie;

    if (!token) {
      return res.status(401).json({ message: "No autenticado." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    const reservas = await prisma.reservas.findMany({
      where: { usuario_id: decoded.id },
      include: {
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
      orderBy: { fecha: "desc" },
    });

    return res.json(reservas);
  } catch (error) {
    console.error("❌ Error en getMisReservas:", error);
    return res
      .status(500)
      .json({ message: "Error al obtener tus reservas" });
  }
};

/**
 * ====================================
 *  CREAR RESERVA (usa usuario del JWT)
 *  + validar plazas libres y actualizar plazas_ocupadas
 *  POST /api/reservas
 * ====================================
 */
export const createReserva = async (req: Request, res: Response) => {
  try {
    // 1) Sacar token igual que en getMisReservas
    const authHeader = req.headers.authorization;
    const tokenHeader =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    const tokenCookie = (req as any).cookies?.token as string | undefined;
    const token = tokenHeader || tokenCookie;

    if (!token) {
      return res.status(401).json({ message: "No autenticado." });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const usuarioId = decoded.id;

    // 2) Datos que vienen en el body
    const { tour_id, salida_programada_id, numero_personas, notas } = req.body;

    const numPersonas = Number(numero_personas);

    // 3) Validación mínima
    if (!tour_id || !salida_programada_id || !numPersonas) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    if (numPersonas <= 0) {
      return res
        .status(400)
        .json({ message: "El número de personas debe ser mayor que 0." });
    }

    // 4) Comprobar salida y plazas libres
    const salida = await prisma.salidas_programadas.findUnique({
      where: { id: Number(salida_programada_id) },
    });

    if (!salida || !salida.activo) {
      return res.status(400).json({
        message: "La salida seleccionada no está disponible.",
      });
    }

    const plazasLibres = salida.plazas_totales - salida.plazas_ocupadas;

    if (plazasLibres <= 0) {
      return res.status(400).json({
        message: "Esta salida ya no tiene plazas disponibles.",
      });
    }

    if (numPersonas > plazasLibres) {
      return res.status(400).json({
        message: `No hay plazas suficientes. Quedan solo ${plazasLibres} plazas libres.`,
      });
    }

    // 5) Transacción: actualizar plazas_ocupadas + crear reserva
    const [, nuevaReserva] = await prisma.$transaction([
      prisma.salidas_programadas.update({
        where: { id: salida.id },
        data: {
          plazas_ocupadas: {
            increment: numPersonas,
          },
        },
      }),
      prisma.reservas.create({
        data: {
          usuario_id: Number(usuarioId),
          tour_id: Number(tour_id),
          salida_programada_id: Number(salida_programada_id),
          numero_personas: numPersonas,
          notas: notas ?? null,
        },
        include: {
          usuario: true,
          salidas_programadas: {
            include: {
              tours: true,
            },
          },
        },
      }),
    ]);

    // 6) Emails
    const reservaConRelaciones = nuevaReserva as any;
    const usuario = reservaConRelaciones.usuario;
    const salidaRes = reservaConRelaciones.salidas_programadas;
    const tour = salidaRes?.tours;
    const fecha = nuevaReserva.fecha;

    if (usuario && tour) {
      await sendEmail({
        to: usuario.email,
        subject: "🦅 Confirmación de tu reserva",
        html: `
          <h2>¡Hola ${usuario.nombre}!</h2>
          <p>Tu reserva para el tour <b>${tour.titulo}</b> ha sido registrada.</p>
          <p>Fecha de la reserva: <b>${new Date(
            fecha
          ).toLocaleDateString()}</b></p>
          <hr/>
          <p>Gracias por confiar en PrimalExperience Reservas 🌿</p>
        `,
      });
    }

    await sendEmail({
      to: "cirolalasha@gmail.com",
      subject: "📩 Nueva reserva recibida",
      html: `
        <p>El usuario <b>${usuario?.nombre}</b> ha reservado el tour <b>${tour?.titulo}</b>.</p>
        <p>Número de personas: ${numPersonas}</p>
        <p>Fecha: ${new Date(fecha).toLocaleString()}</p>
      `,
    });

    return res.status(201).json({
      message: "Reserva creada correctamente",
      reserva: nuevaReserva,
    });
  } catch (error) {
    console.error("❌ Error al crear la reserva:", error);
    return res.status(500).json({
      message: "Error al crear la reserva",
      error: (error as Error).message,
    });
  }
};

/**
 * ====================================
 *  PATCH /api/reservas/:id/estado  (ADMIN)
 * ====================================
 */
export const updateReservaEstado = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado } = req.body as { estado?: string };

    if (!estado) {
      return res
        .status(400)
        .json({ message: "Falta el campo 'estado' en el body." });
    }

    // Normalizamos a minúsculas
    const estadoNormalizado = estado.toLowerCase() as estado_reserva;

    const estadosValidos: estado_reserva[] = [
      estado_reserva.pendiente,
      estado_reserva.confirmada,
      estado_reserva.cancelada,
    ];

    if (!estadosValidos.includes(estadoNormalizado)) {
      return res
        .status(400)
        .json({ message: "Estado de reserva no válido." });
    }

    const reservaActualizada = await prisma.reservas.update({
      where: { id: Number(id) },
      data: {
        estado: estadoNormalizado,
      },
      include: {
        usuario: true,
        salidas_programadas: {
          include: { tours: true },
        },
      },
    });

    return res.json(reservaActualizada);
  } catch (error) {
    console.error("❌ Error en updateReservaEstado:", error);
    return res.status(500).json({
      message: "Error al actualizar el estado de la reserva.",
    });
  }
};

/**
 * ====================================
 *  ESTADÍSTICAS GLOBALES (solo admin)
 *  GET /api/reservas/admin/estadisticas-globales
 * ====================================
 */
export const getReservasEstadisticasGlobales = async (
  _req: Request,
  res: Response
) => {
  try {
    const reservas = await prisma.reservas.findMany({
      include: {
        salidas_programadas: {
          include: { tours: true },
        },
      },
    });

    let total_reservas = 0;
    let pendientes = 0;
    let confirmadas = 0;
    let canceladas = 0;
    let total_personas = 0;
    let ingresos_totales = 0;

    for (const r of reservas as any[]) {
      total_reservas += 1;
      total_personas += r.numero_personas ?? 0;

      if (r.estado === estado_reserva.pendiente) pendientes += 1;
      if (r.estado === estado_reserva.confirmada) confirmadas += 1;
      if (r.estado === estado_reserva.cancelada) canceladas += 1;

      // Solo sumamos ingresos de las confirmadas
      if (r.estado === estado_reserva.confirmada) {
        const salida = r.salidas_programadas;
        const tour = salida?.tours;
        if (!tour) continue;

        const precioBase = tour.precio_base
          ? Number(tour.precio_base)
          : 0;

        const precioEspecial = salida?.precio_especial
          ? Number(salida.precio_especial)
          : null;

        const precioUnitario = precioEspecial ?? precioBase;
        const personas = r.numero_personas ?? 0;

        ingresos_totales += precioUnitario * personas;
      }
    }

    return res.json({
      total_reservas,
      pendientes,
      confirmadas,
      canceladas,
      total_personas,
      ingresos_totales,
    });
  } catch (error) {
    console.error("❌ Error en getReservasEstadisticasGlobales:", error);
    return res.status(500).json({
      message: "Error al obtener estadísticas globales de reservas",
    });
  }
};
// 🔹 Estadísticas por mes (solo reservas confirmadas)
//    GET /api/reservas/admin/por-mes
export const getReservasPorMesAdmin = async (_req: Request, res: Response) => {
  try {
    const reservas = await prisma.reservas.findMany({
      where: {
        estado: estado_reserva.confirmada, // solo confirmadas
      },
      select: {
        fecha: true,
        numero_personas: true,
      },
      orderBy: { fecha: "asc" },
    });

    type ItemMes = {
      anio: number;
      mes: number; // 1-12
      reservas: number;
      personas: number;
    };

    const mapa = new Map<string, ItemMes>();

    for (const r of reservas) {
      const fecha = r.fecha instanceof Date ? r.fecha : new Date(r.fecha);
      if (isNaN(fecha.getTime())) continue;

      const anio = fecha.getFullYear();
      const mes = fecha.getMonth() + 1; // 0-11 → 1-12
      const key = `${anio}-${mes}`;

      const existente =
        mapa.get(key) || {
          anio,
          mes,
          reservas: 0,
          personas: 0,
        };

      existente.reservas += 1;
      existente.personas += r.numero_personas ?? 0;

      mapa.set(key, existente);
    }

    const resultado = Array.from(mapa.values()).sort((a, b) => {
      if (a.anio !== b.anio) return a.anio - b.anio;
      return a.mes - b.mes;
    });

    return res.json(resultado);
  } catch (error) {
    console.error("❌ Error en getReservasPorMesAdmin:", error);
    return res.status(500).json({
      message: "Error al obtener estadísticas de reservas por mes",
    });
  }
};

// 👇 Resumen de reservas agrupadas por experiencia (tour)
//   · Solo cuenta reservas CONFIRMADAS
//   · Calcula personas, ingresos estimados y ocupación
export const getReservasResumenPorExperiencia = async (
  req: Request,
  res: Response
) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    const where: any = {
      estado: estado_reserva.confirmada, // solo confirmadas
    };

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};
      if (fecha_desde) {
        where.fecha.gte = new Date(fecha_desde as string);
      }
      if (fecha_hasta) {
        const hasta = new Date(fecha_hasta as string);
        // incluir todo el día
        hasta.setHours(23, 59, 59, 999);
        where.fecha.lte = hasta;
      }
    }

    const reservas = await prisma.reservas.findMany({
      where,
      include: {
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    });

    type ResumenItem = {
      tour_id: number;
      titulo: string;
      ubicacion: string | null;
      total_reservas: number;
      total_personas: number;
      total_ingresos: number;
      total_plazas: number;
      total_ocupadas: number;
      porcentaje_ocupacion: number;
    };

    const mapa = new Map<number, ResumenItem>();
    // Para no sumar la misma salida varias veces
    const salidasPorTour = new Map<number, Set<number>>();

    for (const r of reservas as any[]) {
      const salida = r.salidas_programadas;
      const tour = salida?.tours;
      if (!tour || !salida) continue;

      const tourId = tour.id;

      let resumen = mapa.get(tourId);
      if (!resumen) {
        resumen = {
          tour_id: tourId,
          titulo: tour.titulo,
          ubicacion: tour.ubicacion ?? null,
          total_reservas: 0,
          total_personas: 0,
          total_ingresos: 0,
          total_plazas: 0,
          total_ocupadas: 0,
          porcentaje_ocupacion: 0,
        };
        mapa.set(tourId, resumen);
      }

      const numPersonas = r.numero_personas ?? 0;

      // Reservas / personas
      resumen.total_reservas += 1;
      resumen.total_personas += numPersonas;

      // Ingresos estimados (precio_base * personas)
      const precioBase = Number((tour as any).precio_base ?? 0);
      resumen.total_ingresos += precioBase * numPersonas;

      // Capacidad por salida → solo la contamos una vez por salida
      let setSalidas = salidasPorTour.get(tourId);
      if (!setSalidas) {
        setSalidas = new Set<number>();
        salidasPorTour.set(tourId, setSalidas);
      }

      if (!setSalidas.has(salida.id)) {
        setSalidas.add(salida.id);

        const plazasTotales = salida.plazas_totales ?? 0;
        const plazasOcupadas = salida.plazas_ocupadas ?? 0;

        resumen.total_plazas += plazasTotales;
        resumen.total_ocupadas += plazasOcupadas;
      }
    }

    const resultado = Array.from(mapa.values()).map((item) => {
      const porcentaje =
        item.total_plazas > 0
          ? (item.total_ocupadas / item.total_plazas) * 100
          : 0;

      return {
        ...item,
        porcentaje_ocupacion: Number(porcentaje.toFixed(1)),
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error en getReservasResumenPorExperiencia:", error);
    res.status(500).json({
      message: "Error al obtener el resumen de reservas por experiencia",
    });
  }
};


// 👇 Resumen de reservas agrupadas por GUÍA (solo reservas confirmadas)
//   · Acepta ?fecha_desde=YYYY-MM-DD y ?fecha_hasta=YYYY-MM-DD (fecha de salida)
export const getReservasResumenPorGuia = async (
  req: Request,
  res: Response
) => {
  try {
    const { fecha_desde, fecha_hasta } = req.query;

    let fechaDesde: Date | undefined;
    let fechaHasta: Date | undefined;

    if (typeof fecha_desde === "string" && fecha_desde.trim() !== "") {
      fechaDesde = new Date(fecha_desde);
    }
    if (typeof fecha_hasta === "string" && fecha_hasta.trim() !== "") {
      fechaHasta = new Date(fecha_hasta);
    }

    const where: any = {
      estado: estado_reserva.confirmada,
    };

    if (fechaDesde || fechaHasta) {
      where.salidas_programadas = {
        is: {
          ...(fechaDesde ? { fecha_inicio: { gte: fechaDesde } } : {}),
          ...(fechaHasta ? { fecha_inicio: { lte: fechaHasta } } : {}),
        },
      };
    }

    const reservas = await prisma.reservas.findMany({
      where,
      include: {
        salidas_programadas: {
          include: {
            tours: true,
          },
        },
      },
    });

    type ResumenGuiaInterno = {
      guia_id: number | null;
      total_reservas: number;
      total_personas: number;
      total_ingresos: number;
      total_plazas: number;
      total_ocupadas: number;
    };

    const mapa = new Map<number | null, ResumenGuiaInterno>();
    const salidasPorGuia = new Map<number | null, Set<number>>();

    for (const r of reservas as any[]) {
      const salida = r.salidas_programadas;
      const tour = salida?.tours;
      if (!tour) continue;

      const guiaId: number | null = tour.guia_id ?? null;

      let resumen = mapa.get(guiaId);
      if (!resumen) {
        resumen = {
          guia_id: guiaId,
          total_reservas: 0,
          total_personas: 0,
          total_ingresos: 0,
          total_plazas: 0,
          total_ocupadas: 0,
        };
        mapa.set(guiaId, resumen);
      }

      const numPersonas = r.numero_personas ?? 0;
      const precioBase = Number(tour.precio_base ?? 0);

      resumen.total_reservas += 1;
      resumen.total_personas += numPersonas;
      resumen.total_ingresos += precioBase * numPersonas;

      let setSalidas = salidasPorGuia.get(guiaId);
      if (!setSalidas) {
        setSalidas = new Set<number>();
        salidasPorGuia.set(guiaId, setSalidas);
      }

      if (!setSalidas.has(salida.id)) {
        setSalidas.add(salida.id);

        const plazasTotales = salida.plazas_totales ?? 0;
        const plazasOcupadas = salida.plazas_ocupadas ?? 0;

        resumen.total_plazas += plazasTotales;
        resumen.total_ocupadas += plazasOcupadas;
      }
    }

    const guiaIds = Array.from(mapa.keys()).filter(
      (id): id is number => id !== null
    );

    let guiaMap = new Map<number, { nombre: string; email: string | null }>();

    if (guiaIds.length > 0) {
      const guias = await prisma.usuarios.findMany({
        where: { id: { in: guiaIds } },
        select: { id: true, nombre: true, email: true },
      });

      guiaMap = new Map(
        guias.map((g) => [
          g.id,
          { nombre: g.nombre, email: g.email ?? null },
        ])
      );
    }

    const resultado = Array.from(mapa.values()).map((item) => {
      const porcentaje =
        item.total_plazas > 0
          ? (item.total_ocupadas / item.total_plazas) * 100
          : 0;

      const guiaInfo =
        item.guia_id !== null ? guiaMap.get(item.guia_id) : null;

      return {
        guia_id: item.guia_id,
        guia_nombre:
          guiaInfo?.nombre ??
          (item.guia_id ? `Guía #${item.guia_id}` : "Sin guía asignado"),
        guia_email: guiaInfo?.email ?? null,
        total_reservas: item.total_reservas,
        total_personas: item.total_personas,
        total_ingresos: item.total_ingresos,
        total_plazas: item.total_plazas,
        total_ocupadas: item.total_ocupadas,
        porcentaje_ocupacion: Number(porcentaje.toFixed(1)),
      };
    });

    resultado.sort((a, b) => b.total_ingresos - a.total_ingresos);

    return res.json(resultado);
  } catch (error) {
    console.error("Error en getReservasResumenPorGuia:", error);
    return res.status(500).json({
      message: "Error al obtener el resumen de reservas por guía",
    });
  }
};


/**
 * ====================================
 *  ELIMINAR RESERVA
 *  DELETE /api/reservas/:id
 * ====================================
 */
export const deleteReserva = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.reservas.delete({ where: { id: Number(id) } });

    return res.json({ message: "Reserva eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar la reserva:", error);
    return res.status(500).json({ message: "Error al eliminar la reserva" });
  }
};
