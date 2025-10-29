//Servicio de autenticación
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const SECRET = process.env.JWT_SECRET || ""

/** Cifra la contraseña antes de guardarla */
export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/** Compara contraseña enviada con la guardada */
export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash)
}

/** Genera un token JWT */
export const generarToken = (userId: number, rol: string) => {
  return jwt.sign({ userId, rol }, SECRET, { expiresIn: "7d" })
}

/** Verifica token recibido */
export const verificarToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}
/**
 * bcrypt.genSalt(10)  Genera una sal aleatoria para cifrar
 * jwt.sign({..}, SECRET, {expiresIn: "7d"})  Crea un token válido por 7 días
 * jwt.veroify()  Comprueba si el token sigue siendo válido
 */