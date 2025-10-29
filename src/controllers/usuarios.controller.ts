import { PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

//Obtener todos los usuarios
export const getUsuarios = async (_req: Request, res: Response) => {
    try{
        const usuarios = await prisma.usuarios.findMany()
        res.json(usuarios)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al obtener los usuarios'})
    }
}

//Crear un nuevo usuario
import bcrypt from "bcryptjs"

export const crearUsuario = async (req: Request, res: Response) => {
  try {
    const { nombre, email, telefono, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre,
        email,
        telefono,
        password: hashedPassword, // 👈 IMPORTANTE
      },
    });

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error("❌ Error detallado al crear usuario:", error);
    res.status(500).json({ message: "Error al crear usuario", error: (error as Error).message });
  }
};


//Eliminar un usuario por ID
export const deleteUsuario = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await prisma.usuarios.delete({ where: { id: Number(id) } })
        res.json({ message: 'Usuario eliminado correctamente' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Error al eliminar el usuario'})
    }
}

/**
 * ·getUsuarios: hace un SELECT * FROM usuarios;
 * ·createUsuario: hace un INSERT INTO usuarios (...) VALUES (...)
 * ·deleteusuarios: hace un DELETE FROM usuarios WHERE id = ?
 */