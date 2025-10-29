import { transporter } from '../config/email.config'

interface EmailData {
  to: string
  subject: string
  html: string
}

// 📬 Función genérica para enviar correos
export const sendEmail = async ({ to, subject, html }: EmailData) => {
  try {
    const info = await transporter.sendMail({
      from: `"WildWatch Reservas" <no-reply@wildwatching.com>`,
      to,
      subject,
      html,
    })
    console.log('📨 Email enviado:', info.messageId)
  } catch (error) {
    console.error('❌ Error al enviar email:', error)
  }
}

/**Explicación Línea a Línea:
 * transporter.sendMail()  Envía un correo electrónico con la configuaración previa
 * from  El nombre y dirección que verá el usuario
 * subject  Asunto del email
 * html  Cuerpo del mensaje 
 * console.log(info.messageid)  Muestra el ID del email enviado (útil para depurar)
 **/