/**
 * Convertit une couleur hex en RGB (format "r g b" pour CSS var)
 * @param {string} hex - Couleur hexadécimale (ex: "#7F4F24")
 * @returns {string} - Format RGB "r g b" (ex: "127 79 36")
 */
export function hexToRGB(hex) {
  if (!hex) return '' // Pas de couleur par défaut
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return `${r} ${g} ${b}`
}

/**
 * Convertit une couleur hex en format CSS rgb()
 * @param {string} hex - Couleur hexadécimale (ex: "#7F4F24")
 * @returns {string} - Format CSS "rgb(127, 79, 36)"
 */
export function hexToRgbCss(hex) {
  if (!hex) return ''
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Détermine si une couleur est sombre ou claire (pour le contraste du texte)
 * @param {string} hex - Couleur hexadécimale (ex: "#7F4F24")
 * @returns {boolean} - true si la couleur est sombre, false si claire
 */
export function isDark(hex) {
  if (!hex) return false
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  
  // Calcul de la luminance relative (formule W3C)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  // Si luminance < 0.5, la couleur est sombre → texte blanc
  return luminance < 0.5
}

/**
 * Alias pour compatibilité
 */
export function isDarkHex(hex) {
  return isDark(hex)
}

/**
 * Retourne la classe de couleur de texte appropriée selon le fond
 * @param {string} hex - Couleur hexadécimale du fond
 * @returns {string} - Classe Tailwind "text-white" ou "text-black"
 */
export function getTextColor(hex) {
  return isDark(hex) ? 'text-white' : 'text-black'
}

