// src/routes/usuarios.routes.ts
import { Router } from 'express'
import { getUsuarios, crearUsuario, deleteUsuario } from '../controllers/usuarios.controller'

const router = Router()

router.get('/', getUsuarios)          // GET /api/usuarios
router.post('/', crearUsuario)       // POST /api/usuarios
router.delete('/:id', deleteUsuario)  // DELETE /api/usuarios/:id

export default router
