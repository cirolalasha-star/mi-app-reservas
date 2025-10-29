import express, { Router } from 'express'
import { upload } from '../middleware/upload.middleware'
import path from 'path'

const router = Router()

// 📸 Subir imagen y devolver la URL
router.post('/image', upload.single('imagen'), (req, res) => {//espera un único archivo con el campo imagen(como el nombre del input del formulario)
  if (!req.file) return res.status(400).json({ message: 'No se subió ninguna imagen' })//req.file contiene todos los metadatos del archivo subido(nombre, tipo, tamaño, etc)
//imageURL ruta pública del archivo, para usarla luego en el frontend
  const imageUrl = `/uploads/${req.file.filename}`

  res.status(200).json({
    message: 'Imagen subida correctamente',
    file: req.file.filename,
    url: imageUrl,
  })
})

// 🖼️ Servir las imágenes estáticas, express.static permite que las imágenes sean accesibles desde el navegador(https:// localhost: 3000...)
router.use('/uploads', express.static(path.join(__dirname, '../../uploads')))

export default router
