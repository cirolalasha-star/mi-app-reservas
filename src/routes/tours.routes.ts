// src/routes/tours.routes.ts
import { Router } from 'express'
import { getTours, getTourById, createTourAI, deleteTour, filtrarTours, regenerarDescripcionTour } from '../controllers/tours.controller'

const router = Router()

router.get('/', getTours)       // GET /api/tours
router.get('/filtro', filtrarTours)  // nueva ruta avanzada
router.get('/:id', getTourById)
router.post('/', createTourAI)    // POST /api/tours
router.delete('/:id', deleteTour)
router.put('/generar-descripcion/:id', regenerarDescripcionTour) //Nueva ruta para regenerar la descripción de un tour extra

export default router
