//Detectar idioma del usuario(para traducciones)
export const useIdioma = () => {
  const lang = navigator.language.split("-")[0]
  return ["es", "en", "fr", "de"].includes(lang) ? lang : "es"
}
