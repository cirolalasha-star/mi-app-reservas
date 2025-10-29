import { useEffect, useState } from "react"
import { api } from "../api/client"
/**
 * Llaman al endpoint /api/admin/stats que creamos antes
 * Muestra métricas con estilos visuales simples (puedes mejorar con Chart.js o Recharts)
 */
interface Stats {
  totalUsuarios: number
  totalReservas: number
  totalTours: number
  totalIngresos: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    api.get("/admin/stats").then(res => setStats(res.data))
  }, [])

  if (!stats) return <p>Cargando...</p>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Panel de Administración</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-blue-100 p-4 rounded shadow">
          <h3 className="font-bold">Usuarios registrados</h3>
          <p className="text-2xl">{stats.totalUsuarios}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow">
          <h3 className="font-bold">Reservas</h3>
          <p className="text-2xl">{stats.totalReservas}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow">
          <h3 className="font-bold">Tours</h3>
          <p className="text-2xl">{stats.totalTours}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded shadow">
          <h3 className="font-bold">Ingresos (€)</h3>
          <p className="text-2xl">{stats.totalIngresos.toFixed(2)}</p>
        </div>
      </div>
    </div>
  )
}
