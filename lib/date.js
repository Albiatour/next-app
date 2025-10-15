/**
 * Convertit un objet Date en string ISO date uniquement (YYYY-MM-DD)
 * Sans conversion de fuseau horaire - utilise les valeurs locales
 * @param {Date} d - Date à convertir
 * @returns {string} Date au format "YYYY-MM-DD"
 */
export function toISODateOnly(d) {
  if (!d || !(d instanceof Date)) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Parse une date ISO (YYYY-MM-DD) vers un objet Date local
 * @param {string} isoDate - Date ISO "YYYY-MM-DD"
 * @returns {Date|null}
 */
export function fromISODateOnly(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return null
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

/**
 * Formate une date ISO en format français DD/MM/YYYY
 * @param {string} isoDate - Date ISO "YYYY-MM-DD"
 * @returns {string}
 */
export function formatFrenchDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

