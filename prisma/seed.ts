// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando SEED de PrimalExperience...");

  // 1️⃣ LIMPIEZA segura (en orden para evitar FK errors)
  console.log("🧹 Borrando datos anteriores...");
  await prisma.reservas.deleteMany();
  await prisma.resenas.deleteMany();
  await prisma.salidas_programadas.deleteMany();
  await prisma.tours.deleteMany();
  await prisma.usuarios.deleteMany();

  // 2️⃣ Crear usuarios (contraseñas hasheadas)
  console.log("👤 Creando usuarios...");

  const passwordHash = await bcrypt.hash("123456", 10);

  const ciro = await prisma.usuarios.create({
    data: {
      nombre: "Ciro Lalaguna",
      email: "cirolalasha@gmail.com",
      password: passwordHash,
      rol: "admin",
    },
  });

  const maria = await prisma.usuarios.create({
    data: {
      nombre: "María Sánchez",
      email: "maria@example.com",
      password: passwordHash,
    },
  });

  const pablo = await prisma.usuarios.create({
    data: {
      nombre: "Pablo Ruiz",
      email: "pablo@example.com",
      password: passwordHash,
    },
  });

  console.log("✔ Usuarios:", ciro.id, maria.id, pablo.id);

  // 3️⃣ Crear tours
  console.log("📌 Creando tours...");

  const tour1 = await prisma.tours.create({
    data: {
      titulo: "Avistamiento en Doñana",
      descripcion: "Explora la fauna de Doñana al amanecer.",
      precio_base: 120,
      cupo_maximo: 15,
      ubicacion: "Andalucía",
    },
  });

  const tour2 = await prisma.tours.create({
    data: {
      titulo: "Ruta de los Pirineos",
      descripcion: "Excursión de alta montaña con observación de aves.",
      precio_base: 180,
      cupo_maximo: 10,
      ubicacion: "Aragón",
    },
  });

  const tour3 = await prisma.tours.create({
    data: {
      titulo: "Costa Salvaje",
      descripcion: "Tour fotográfico por la costa norte.",
      precio_base: 90,
      cupo_maximo: 20,
      ubicacion: "Galicia",
    },
  });

  console.log("✔ Tours creados:", tour1.id, tour2.id, tour3.id);

  // 4️⃣ Crear reseñas reales
  console.log("⭐ Añadiendo reseñas...");

  await prisma.resenas.createMany({
    data: [
      {
        comentario: "Increíble experiencia.",
        puntuacion: 5,
        usuario_id: ciro.id,
        tour_id: tour1.id,
        aprobado: true,
      },
      {
        comentario: "Guía muy profesional.",
        puntuacion: 4,
        usuario_id: maria.id,
        tour_id: tour2.id,
        aprobado: true,
      },
      {
        comentario: "Repetiría sin duda.",
        puntuacion: 5,
        usuario_id: pablo.id,
        tour_id: tour3.id,
        aprobado: true,
      },
    ],
  });

  console.log("✔ Reseñas creadas.");

  // 5️⃣ Crear salidas programadas
  console.log("📅 Creando salidas programadas...");

  const salida = await prisma.salidas_programadas.create({
    data: {
      tour_id: tour1.id,
      fecha_inicio: new Date("2025-06-01"),
      fecha_fin: new Date("2025-06-05"),
      plazas_totales: 20,
      plazas_ocupadas: 0,
      precio_especial: 99.99,
      activo: true,
    },
  });

  console.log("✔ Salida con ID:", salida.id);

  // 6️⃣ Crear reservas reales
  console.log("📦 Creando reservas...");

  await prisma.reservas.createMany({
    data: [
      {
        usuario_id: ciro.id,
        tour_id: tour1.id,
        salida_programada_id: salida.id,
        numero_personas: 2,
        estado: "confirmada",
      },
      {
        usuario_id: maria.id,
        tour_id: tour1.id,
        salida_programada_id: salida.id,
        numero_personas: 3,
        estado: "pendiente",
      },
      {
        usuario_id: pablo.id,
        tour_id: tour3.id,
        salida_programada_id: salida.id,
        numero_personas: 1,
        estado: "pendiente",
      },
    ],
  });

  console.log("✔ Reservas creadas.");
  console.log("🎉 SEED COMPLETADO CON ÉXITO 🎉");
}

main()
  .catch((err) => {
    console.error("❌ Error en el seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
