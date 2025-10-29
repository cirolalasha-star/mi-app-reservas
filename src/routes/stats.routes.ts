import { Router } from 'express'
import { getStats } from '../controllers/stats.controller'
import { adminAuth } from '../middleware/adminAuth'

const router = Router()

// 📊 Ruta principal para obtener todas las estadísticas
router.get('/', adminAuth, getStats)

export default router
