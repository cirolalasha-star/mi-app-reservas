import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // ✅ evita error si falta la API key
});

/**
 * Traduce texto usando IA.
 * @param texto Texto original en español.
 * @param idiomaDestino Código ISO del idioma destino (en, fr, de...).
 * @returns Texto traducido.
 */
export const traducirTexto = async (
  texto: string,
  idiomaDestino: string
): Promise<string> => {
  try {
    const prompt = `
    Traduce el siguiente texto del español al idioma ${idiomaDestino}.
    Mantén el tono profesional y natural, adaptado al contexto de turismo.
    Texto:
    "${texto}"
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4, // más precisión, menos creatividad
      max_tokens: 400,
    });

    return response.choices?.[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("❌ Error al traducir texto:", error);
    return texto; // si falla, devolvemos el original
  }
};

/**
 * 🧠 OpenAI: Inicializa el cliente GPT con tu API key
 * 💬 prompt: Define la instrucción de traducción con contexto turístico
 * 🎯 temperature: 0.4 → Traducción más literal y profesional
 * 🔁 return: Devuelve el texto traducido limpio
 */
