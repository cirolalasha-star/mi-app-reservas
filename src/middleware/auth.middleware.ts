import { Request, Response, NextFunction } from "express"
import { JwtPayload } from "jsonwebtoken"
import { verificarToken } from "../services/auth.service"

// Tipo del token decodificado
interface DecodedToken extends JwtPayload {
  id: number
  rol: string
}

// Extendemos Request para incluir el usuario autenticado
interface AuthRequest extends Request {
  usuario?: DecodedToken
}

// ✅ Middleware general para proteger rutas
export const protegerRuta = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  // Verificamos que el encabezado Authorization exista y empiece con "Bearer"
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no proporcionado" })
  }

  // Extraemos el token (parte después de "Bearer ")
  const token = authHeader.split(" ")[1]

  // ⚠️ Nueva comprobación: evita pasar undefined a verificarToken()
  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado o mal formado" })
  }

  // Verificamos el token
  const payload = verificarToken(token) as DecodedToken | null

  // Si el token no es válido o expiró
  if (!payload) {
    return res.status(403).json({ message: "Token inválido o expirado" })
  }

  // Guardamos los datos del usuario en la request
  req.usuario = payload
  next()
}


// ✅ Middleware específico solo para administradores
export const soloAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.usuario || req.usuario.rol !== "admin") {
    return res.status(403).json({ message: "Acceso solo para administradores" })
  }
  next()
}
/**
 * protegerRuta  Verifica si el token JWT es válido antes de acceder
 * soloAdmin     Permite acceso solo a usuarios con rol: admin
 * (req as any).usuario  Guarda los datos decodificados del token en la request
 */