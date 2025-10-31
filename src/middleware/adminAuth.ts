import { Request, Response, NextFunction } from 'express'
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user // asumiendo que tu autenticación ya guarda esto
  if (!user || user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso restringido a administradores' })
  }
  next()
}
