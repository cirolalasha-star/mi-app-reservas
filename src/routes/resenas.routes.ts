import { Router } from 'express'
import { getResenasPorTour, getResenaById, createResena, deleteResena, moderarResena } from '../controllers/resenas.controller'
import { protegerRuta, soloAdmin } from '../middleware/auth.middleware'

const router = Router()

router.get('/', getResenasPorTour)
router.get('/:id', getResenaById)
router.post('/', createResena)
router.delete('/:id', deleteResena)
router.put('/:id/moderar', protegerRuta, soloAdmin, moderarResena)
router.post("/", protegerRuta)

export default router
