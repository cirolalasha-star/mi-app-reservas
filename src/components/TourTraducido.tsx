//mostrar traducciones automáticas
import { useEffect, useState } from "react"
import { api } from "../api/client"

export default function TourTraducido({ id, idioma }: { id: number; idioma: string }) {
  const [texto, setTexto] = useState("")

  useEffect(() => {
    api.get(`/traducciones/tour/${id}`).then(res => {
      const traduccion = res.data.find((t: any) => t.idioma === idioma)
      setTexto(traduccion ? traduccion.texto : "Traducción no disponible.")
    })
  }, [id, idioma])

  return <p className="mt-2 text-gray-700">{texto}</p>
}
/**
 * Pide las traducciones guardadas (/api/traducciones/tour/:id)
 * Busca la que coincide con el idioma actual del usuario (navigator.language)
 * Si no la encuentra, muestra el texto original
 */