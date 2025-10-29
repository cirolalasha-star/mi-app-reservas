import multer from 'multer'
import path from 'path'
import { Request } from 'express'

// 📦 Configuración del almacenamiento de Multer
const storage = multer.diskStorage({
  // 1️⃣ Carpeta donde se guardarán los archivos
  destination: function (_req, _file, cb) {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  // 2️⃣ Nombre del archivo final
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + extension)
  },
})

// 3️⃣ Filtro de archivos (solo imágenes)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Solo se permiten imágenes'))
  }
}

// 4️⃣ Exportamos el middleware configurado
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
})
