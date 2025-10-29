import { Router } from 'express'
import { register, login } from '../controllers/auth.controller'
console.log("auth.controller importado correct")

console.log("✅ auth.routes.ts cargado correctamente")

const router = Router()

router.post('/register', register)
router.post('/login', login)

export default router
router.get('/ping', (_req, res) => {
  res.json({ msg: 'pong desde auth.routes.ts' })
})
