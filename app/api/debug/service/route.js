// SERVICE_MODE_DIAG: Endpoint de diagnostic pour SERVICE_MODE
export const dynamic = 'force-dynamic'
export const revalidate = 0

// SERVICE_MODE: Réutiliser les mêmes utilitaires que dans /api/book
function getServiceType(t) { 
  const h = parseInt((t || '').split(':')[0] || '0', 10); 
  return h < 17 ? 'midi' : 'soir'; 
}

function normDate(d) { 
  return (d || '').split('T')[0]; 
}

function clean(s) { 
  return String(s || '').replace(/\s+/g, ' ').trim(); 
}

async function resolveRestaurant(maybeIdOrName, atToken, atBase) {
  // SERVICE_MODE: si c'est un recordId Airtable, fetch le nom
  if (/^rec[a-zA-Z0-9]{14}$/.test(maybeIdOrName || '')) {
    try {
      const T_RESTAURANTS = process.env.AIRTABLE_TABLE_RESTAURANTS || 'Restaurants_API';
      const res = await fetch(
        `https://api.airtable.com/v0/${atBase}/${encodeURIComponent(T_RESTAURANTS)}/${maybeIdOrName}`,
        { headers: { Authorization: `Bearer ${atToken}` } }
      );
      if (res.ok) {
        const rec = await res.json();
        const name = rec?.fields?.name || rec?.fields?.restaurant_name || rec?.fields?.slug || maybeIdOrName;
        return { name: clean(name), id: rec?.id || null };
      }
    } catch {
      return { name: clean(maybeIdOrName), id: maybeIdOrName };
    }
  }
  return { name: clean(maybeIdOrName), id: null };
}

function makeKeyLower(name, dateYYYYMMDD, type) { 
  return (clean(name) + ' | ' + dateYYYYMMDD + ' | ' + type).toLowerCase(); 
}

async function airtableList(table, params, atToken, atBase) {
  const url = new URL(`https://api.airtable.com/v0/${atBase}/${encodeURIComponent(table)}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${atToken}` }
  });
  if (!res.ok) throw new Error(`AIRTABLE_LIST_${table}_${res.status}`);
  return res.json();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurant = searchParams.get('restaurant')
    const date = searchParams.get('date')
    const time = searchParams.get('time')

    // Validation
    if (!restaurant || !date || !time) {
      return Response.json(
        { error: 'Missing params. Required: restaurant, date (YYYY-MM-DD), time (HH:mm)' },
        { status: 400 }
      )
    }

    // Airtable config
    const AT_TOKEN = process.env.AIRTABLE_TOKEN
    const AT_BASE = process.env.AIRTABLE_BASE_ID
    const T_SERVICES = process.env.AIRTABLE_TABLE_SERVICES || 'Services_API'

    if (!AT_TOKEN || !AT_BASE) {
      return Response.json(
        { error: 'Airtable credentials not configured' },
        { status: 500 }
      )
    }

    // SERVICE_MODE_DIAG: Calculer les paramètres
    const serviceType = getServiceType(time)
    const d = normDate(date)
    const resolved = await resolveRestaurant(restaurant, AT_TOKEN, AT_BASE)
    const keyLower = makeKeyLower(resolved.name, d, serviceType)

    // SERVICE_MODE_DIAG: Lookup 1 - Par service_key_lower
    const byKeyFormula = `{service_key_lower} = "${keyLower}"`
    let byKeyData
    let byKeyFound = false
    let byKeyCount = 0
    let byKeyIds = []

    try {
      byKeyData = await airtableList(T_SERVICES, { filterByFormula: byKeyFormula }, AT_TOKEN, AT_BASE)
      byKeyFound = (byKeyData.records || []).length > 0
      byKeyCount = (byKeyData.records || []).length
      byKeyIds = (byKeyData.records || []).map(r => r.id)
    } catch (err) {
      byKeyFound = false
    }

    // SERVICE_MODE_DIAG: Lookup 2 - Fallback par restaurant_record_id + date + service_type
    const rid = resolved.id || restaurant
    const fallbackFormula = `AND({restaurant_record_id}='${rid}', {date_iso}='${d}', {service_type}='${serviceType}')`
    let byFallbackData
    let byFallbackUsed = !byKeyFound
    let byFallbackFound = false
    let byFallbackCount = 0
    let byFallbackIds = []

    if (!byKeyFound && rid) {
      try {
        byFallbackData = await airtableList(T_SERVICES, { filterByFormula: fallbackFormula }, AT_TOKEN, AT_BASE)
        byFallbackFound = (byFallbackData.records || []).length > 0
        byFallbackCount = (byFallbackData.records || []).length
        byFallbackIds = (byFallbackData.records || []).map(r => r.id)
      } catch (err) {
        byFallbackFound = false
      }
    }

    // SERVICE_MODE_DIAG: Résultat
    return Response.json({
      input: { restaurant, date, time, serviceType },
      resolved: { name: resolved.name, id: resolved.id },
      keyLower,
      byKey: { 
        found: byKeyFound, 
        count: byKeyCount, 
        ids: byKeyIds,
        formula: byKeyFormula
      },
      byFallback: { 
        used: byFallbackUsed, 
        found: byFallbackFound, 
        count: byFallbackCount, 
        ids: byFallbackIds,
        formula: byFallbackUsed ? fallbackFormula : null
      }
    }, { 
      status: 200,
      headers: { 'Cache-Control': 'no-store' }
    })

  } catch (err) {
    console.error('[debug/service] Error:', err)
    return Response.json(
      { error: err.message || 'Internal error' },
      { status: 500 }
    )
  }
}

