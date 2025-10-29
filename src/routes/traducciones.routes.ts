import { Router } from 'express'
import { getTraduccionesTour, traducirTour } from '../controllers/traducciones.controller'

const router = Router()

// Endpoint: POST /api/traducciones/tour/:id
router.post('/tour/:id', traducirTour)
router.get('/tour/:id', getTraduccionesTour)

export default router
