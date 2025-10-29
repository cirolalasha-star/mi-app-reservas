import { useEffect, useState } from "react"
import { api } from "../api/client"
import { useIdioma } from "../hooks/useIdioma" //Importa el hook
import TourTraducido from "../components/TourTraducido"  //Importa el componente
//mostrar lista de tours
interface Tour {
  id: number
  titulo: string
  descripcion: string
  precio: number
}

export default function Tours() {
  const [tours, setTours] = useState<Tour[]>([])
  const idioma = useIdioma()  //Detecta idioma del navegador

  useEffect(() => {
    api.get("/tours").then(res => setTours(res.data))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Nuestros Tours</h1>
      <div className="grid grid-cols-3 gap-4">
        {tours.map(tour => (
          <div key={tour.id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{tour.titulo}</h2>
            <p className="text-gray-700 mt-2">{tour.descripcion}</p>
            <p className="text-green-600 font-bold mt-2">{tour.precio} €</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * useEffect() ejecuta la llamada solo una vez al cargar la página
 * api.get("/tours")  llama al endpoint que ya tienes en tu backend (GET /api/tours)
 * map()  recorre todos los tours y los muestra como tarjetas
 */
