import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de datos de prueba...");

  // 🧹 LIMPIEZA PREVIA
  await prisma.reservas.deleteMany();
  await prisma.resenas.deleteMany();
  await prisma.salidas_programadas.deleteMany();
  await prisma.tours.deleteMany();
  await prisma.usuarios.deleteMany();

  // 1️⃣ Crear usuarios individualmente
  const usuario1 = await prisma.usuarios.create({
    data: {
      nombre: "Ciro Lalaguna",
      email: "cirolalasha@gmail.com",
      password: "123456",
    },
  });
  const usuario2 = await prisma.usuarios.create({
    data: {
      nombre: "María Sánchez",
      email: "maria@example.com",
      password: "123456",
    },
  });
  const usuario3 = await prisma.usuarios.create({
    data: {
      nombre: "Pablo Ruiz",
      email: "pablo@example.com",
      password: "123456",
    },
  });
  console.log("✅ Usuarios creados:", usuario1.id, usuario2.id, usuario3.id);

  // 2️⃣ Crear tours individualmente
  const tour1 = await prisma.tours.create({
    data: {
      titulo: "Avistamiento en Doñana",
      descripcion: "Explora la fauna de Doñana al amanecer.",
      precio_base: 120.0,
      cupo_maximo: 15,
    },
  });
  const tour2 = await prisma.tours.create({
    data: {
      titulo: "Ruta de los Pirineos",
      descripcion: "Excursión de alta montaña con observación de aves.",
      precio_base: 180.0,
      cupo_maximo: 10,
    },
  });
  const tour3 = await prisma.tours.create({
    data: {
      titulo: "Costa Salvaje",
      descripcion: "Tour fotográfico por la costa norte.",
      precio_base: 90.0,
      cupo_maximo: 20,
    },
  });
  console.log("✅ Tours creados:", tour1.id, tour2.id, tour3.id);

  // 3️⃣ Crear reseñas usando los IDs reales
  await prisma.resenas.createMany({
    data: [
      {
        comentario: "Increíble experiencia",
        puntuacion: 5,
        usuario_id: usuario1.id,
        tour_id: tour1.id,
        aprobado: true,
      },
      {
        comentario: "Guía muy profesional",
        puntuacion: 4,
        usuario_id: usuario2.id,
        tour_id: tour2.id,
        aprobado: true,
      },
      {
        comentario: "Repetiría sin duda",
        puntuacion: 5,
        usuario_id: usuario3.id,
        tour_id: tour3.id,
        aprobado: true,
      },
    ],
  });
  console.log("✅ Reseñas creadas correctamente.");

  // 4️⃣ Crear salida programada
  const salida = await prisma.salidas_programadas.create({
    data: {
      tour_id: tour1.id,
      fecha_inicio: new Date("2025-12-01"),
      fecha_fin: new Date("2025-12-05"),
      plazas_totales: 20,
      precio_especial: 99.99,
    },
  });
  console.log("✅ Salida programada creada con ID:", salida.id);

  // 5️⃣ Crear reservas usando los IDs reales
  await prisma.reservas.createMany({
    data: [
      {
        usuario_id: usuario1.id,
        tour_id: tour1.id,
        salida_programada_id: salida.id,
        numero_personas: 2,
        estado: "confirmada",
      },
      {
        usuario_id: usuario2.id,
        tour_id: tour2.id,
        salida_programada_id: salida.id,
        numero_personas: 3,
        estado: "pendiente",
      },
      {
        usuario_id: usuario3.id,
        tour_id: tour3.id,
        salida_programada_id: salida.id,
        numero_personas: 1,
        estado: "pendiente",
      },
    ],
  });
  console.log("✅ Reservas creadas correctamente.");

  console.log("🌱 Seed completado con éxito 🎉");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
