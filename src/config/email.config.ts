import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

// 🚀 Creamos el "transporter" (conexión SMTP)
export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',       // Servidor SMTP de Gmail
  port: 587,                    // Puerto seguro TLS
  secure: false,                // false para TLS
  auth: {
    user: process.env.EMAIL_USER,  // tu dirección
    pass: process.env.EMAIL_PASS,  // contraseña o app password
  },
})



/**Explicación Línea a Línea:
 * nodemaiiler.createTransport()  Crea el canal para enviar correos
 * host: 'smtp.gmail.com  Usamos Gmail como servidor SMTP (podría ser Outlook, Hostinger etc)
 * auth.user / auth.pass Tus credenciales (no la contraseña real, sino una app password)
 * .env Cargamos las variables de entorno para no poner datos sensibles en el código
 * 
 * 
 **/
