// SERVICE_MODE: Utilitaires pour gestion services (midi/soir)

export function getServiceType(time24h) {
  const h = parseInt((time24h || "").split(":")[0] || "0", 10);
  return h < 17 ? "midi" : "soir";
}

export function normalizeYYYYMMDD(dateISO) {
  return (dateISO || "").split("T")[0];
}

export function makeServiceKey(restaurantKey, dateYYYYMMDD, serviceType) {
  return `${restaurantKey} | ${dateYYYYMMDD} | ${serviceType}`;
}

