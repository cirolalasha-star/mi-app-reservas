import { Router } from 'express'
import { getOfertas, getOfertaById, createOferta, deleteOferta } from '../controllers/ofertas.controller'

const router = Router()

router.get('/', getOfertas)
router.get('/:id', getOfertaById)
router.post('/', createOferta)
router.delete('/:id', deleteOferta)

export default router
