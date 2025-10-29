import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { sendEmail } from '../services/email.service'
import { hashPassword, verifyPassword, generarToken } from "../services/auth.service"

const prisma = new PrismaClient()

//Clave secreta para los tokens (idealmente del .env)
const JWT_SECRET = process.env.JWT_SECRET || 'vs52Gbs6J5B526bsnÑ9m'

//Registro de usuario
export const register = async (req: Request, res: Response) => {
    try {
        console.log("📩 Petición recibida en /api/auth/register");
        
        const { nombre, email, password, rol } = req.body

        sendEmail({
            to: email,
            subject: '🎉 Bienvenido a Primal Experience Reservas',
            html: `
                <h2>¡Hola ${nombre}!</h2>
                <p>Gracias por registrarte en <b>PrimalExperience Reservas</b>.</p>
                <p>A partir de ahora podrás gestionar tus tours y reservas desde tu cuenta.</p>
                <hr/>
                <p>Atentamente,<br/>El equipo de PrimalExperience</p>
            `,
        }).catch(err => console.error("Error al enviar email:", err))

        //Verififcar si ya existe el usuario
        const existe = await prisma.usuarios.findUnique({ where: { email } })
        if (existe) return res.status(400).json({ message: 'El usuario ya existe '})

        //Encriptar la contraseña antes de guardar
        const hashedPassword = await bcrypt.hash(password, 10)

        //Crear el nuevo usuario
        const nuevoUsuario = await prisma.usuarios.create({
            data: {
                nombre,
                email,
                password: hashedPassword,
                rol: rol || 'usuario',
            },
        })

        //Generar token de acceso
        const token = jwt.sign({ id: nuevoUsuario.id, rol: nuevoUsuario.rol }, JWT_SECRET, { expiresIn: '2h' })

        res.status(201).json({
            message: 'Usuario registrado con éxito',
            token,
            usuario: { id: nuevoUsuario.id, nombre, email, rol: nuevoUsuario.rol },
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al registrar usuario'})
    }
}

//Inicio de sesión
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        //Buscar usuario
        const usuario = await prisma.usuarios.findUnique({ where: { email }})
        if(!usuario) return res.status(404).json({ message: 'Usuario no encontrado' })

        //Comparar contraseñas
        const passwordCorrecta = await bcrypt.compare(password, usuario.password)
        if (!passwordCorrecta) return res.status(401).json({ message: 'Contraseña incorrecta'})
        
        //Generar token JWT
        const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '2h'})

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
        })
    }catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al iniciar sesión'})
    }
}
export const test = () => console.log("controlador cargado correct")