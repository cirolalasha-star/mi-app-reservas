import { Router } from 'express'
import { getReservas, getReservaById, createReserva, deleteReserva } from '../controllers/reservas.controller'
import { protegerRuta } from '../middleware/auth.middleware'

const router = Router()

//rutas protegidas con JWT
router.get('/',protegerRuta, getReservas)
router.get('/:id',protegerRuta, getReservaById)
router.post('/', protegerRuta, createReserva)
router.delete('/:id',protegerRuta, deleteReserva)

export default router
