import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Genera una descripción atractiva de un tour.
 * @param titulo - Nombre del tour
 * @param ubicacion - Zona geográfica o ciudad
 * @param temporada - Temporada ideal (invierno, verano, etc.)
 * @returns Texto generado por el modelo
 */
export const generarDescripcionTour = async (titulo: string, ubicacion: string, temporada: string) => {
  try {
    const prompt = `
    Redacta de manera inspiradora pero natural, en español neutral,
    orientado a personas amantes de la naturaleza la descripción de un tour llamado "${titulo}",
    ubicado en ${ubicacion}, ideal para la temporada de ${temporada}.
    Menciona la fauna o paisaje si aplica, en no más de 120 palabras.
    `
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",  // modelo rápido y económico
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,      // da más creatividad al texto
      max_tokens: 150,       // límite de longitud
    })

    // Retorna el texto generado
    return response.choices[0]?.message.content?.trim() || "Descripción no disponible."
  } catch (error) {
    console.error("Error generando descripción:", error)
    return "No se pudo generar la descripción automática."
  }
}

export const detectarSpam = async (comentario: string): Promise<boolean> => {
  const prompt = `
  Analiza el siguiente texto y responde solo con "true" si parece spam, o "false" si parece una reseña real.
  Texto: "${comentario}"
  `
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 5,
  })
  return response.choices[0]?.message.content?.includes("true") || false
}


/** 
 * new OpenAI  Crear el cliente autenticado con tu API key
 * prompt   Es la "instrucción"  que se le da al modelo. Aquí se describe el tono y estilo que queremos
 * client.chat.completions.create()   Llama al modelo GPT(modo chat)
 * temperature: 0.8  Controla la creatividad: valores más altos -> más variedad
 * max_tokens  Limita la longitud del texto (evita respuestas muy largas)
 * response.choices[0].message.content  Contiene el texto generado por el modelo
*/

/**
 * Traduce un texto a un idioma específico usando OpenAI
 * @param texto Texto original (en español)
 * @param idioma Código ISO: 'en', 'fr', 'de', etc.
 * @returns Traducción breve y natural
 *                          Propósito                                         Comentario
 * generarDescripcionTour   Redacta una descripción inspiradora para un tour  Usa temperatura 0.8 para creatividad
 * detectarSpam             Detecta si un texto parece spam                   Devuelve true/false
 * traducirTexto            Traducir textos generados a otros idiomas         Precisión alta, poco creativa(temp 0.4)
 */

export const traducirTexto = async (texto: string, idioma: string): Promise<string> => {
  try {
    const prompt = `
    Traduce el siguiente texto al idioma ${idioma} manteniendo el tono natural y turístico:
    ---
    ${texto}
    ---
    Devuelve solo la traducción, sin explicaciones adicionales.
    `
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.4, // menos creatividad, más precisión
    })
    return response.choices[0]?.message.content?.trim() || texto
  } catch (error) {
    console.error(`Error traduciendo texto al idioma ${idioma}:`, error)
    return texto
  }
}