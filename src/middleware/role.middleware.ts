import { Request, Response, NextFunction } from 'express'

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.body.user
    if (!user || user.rol !== role)
      return res.status(403).json({ message: 'Acceso denegado: requiere rol ' + role })
    next()
  }
}
