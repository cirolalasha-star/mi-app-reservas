import { PrismaClient } from "@prisma/client/extension";
const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Iniciando seed de datos de prueba...')

    // 1. Crear usuarios
    const usuarios = await prisma.usuarios.createMany({
        data: [
            { nombre: 'Ciro Lalaguna', email: 'cirolalasha@gmail.com' },
            { nombre: 'María Sánchez', email: 'maria@example.com' },
            { nombre: 'Pablo Ruiz', email: 'pablo@example.com' }
        ]
    })

    // 2. Crear tours
    const tours = await prisma.tours.createMany({
         data: [
            { nombre: 'Avistamiento en Doñana', descripcion: 'Explora la fauna de Doñana al amanecer.' },
            { nombre: 'Ruta de los Pirineos', descripcion: 'Excursión de alta montaña con observación de aves.' },
            { nombre: 'Costa Salvaje', descripcion: 'Tour fotográfico por la costa norte.' }
        ]
     })

    // 3. Crear reseñas
    await prisma.resenas.createMany({
        data: [
            { comentario: 'Increíble experiencia', usuario_id: 1, tour_id: 1 },
            { comentario: 'Guía muy profesional', usuario_id: 2, tour_id: 2 },
            { comentario: 'Repetiría sin duda', usuario_id: 3, tour_id: 3 }
        ]
    })
    // 4. Crear reservas
    await prisma.reservas.createMany({
         data: [
            { usuario_id: 1, tour_id: 1 },
            { usuario_id: 2, tour_id: 2 },
            { usuario_id: 3, tour_id: 3 }
        ]
    })

    console.log('Seed completo con éxito')

}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

    