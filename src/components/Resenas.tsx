import { useEffect, useState } from "react"
import { api } from "../api/client"

/**
 * ·Llama al endpoint /api/resenas/tour/:id
 * ·Muestra solo reseñas aprobadas(según mi backend)
 * ·Usa "⭐".repeat(r.puntuacion" para renderizar estrellas visuales
 */
interface Resena {
  id: number
  comentario: string
  puntuacion: number
  usuario: { nombre: string }
}

export default function Resenas({ tourId }: { tourId: number }) {
  const [resenas, setResenas] = useState<Resena[]>([])

  useEffect(() => {
    api.get(`/resenas/tour/${tourId}`).then(res => setResenas(res.data))
  }, [tourId])

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">Opiniones</h3>
      {resenas.length === 0 ? (
        <p>No hay reseñas aún.</p>
      ) : (
        resenas.map(r => (
          <div key={r.id} className="border-b py-2">
            <p className="font-medium text-yellow-600">
              {"⭐".repeat(r.puntuacion)}
            </p>
            <p className="italic text-gray-800">“{r.comentario}”</p>
            <p className="text-sm text-gray-500">— {r.usuario.nombre}</p>
          </div>
        ))
      )}
    </div>
  )
}

