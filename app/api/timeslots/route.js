// Disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// SERVICE_MODE
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
function makeKeyLower(name, dateYYYYMMDD, type) { 
  return (clean(name) + ' | ' + dateYYYYMMDD + ' | ' + type).toLowerCase(); 
}

// Map restaurant slug to Airtable view
const VIEW_MAP = {
  bistro: 'v_timeslots_bistro',
  sarrasin: 'v_timeslots_sarrasin'
}

/**
 * Fetch tous les records d'Airtable avec pagination complète
 */
async function fetchAllAirtableRecords({ baseUrl, view, filterByFormula, token }) {
  const allRecords = []
  let offset = undefined

  do {
    const params = new URLSearchParams({
      pageSize: '100',
      ...(view && { view }),
      ...(offset && { offset }),
      ...(filterByFormula && { filterByFormula })
    })

    const url = `${baseUrl}?${params.toString()}`
    
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Airtable error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    allRecords.push(...(data.records || []))
    offset = data.offset // undefined si pas de page suivante
    
    console.log('[fetchAllAirtableRecords] Fetched page, records:', data.records?.length || 0, 'offset:', offset)
  } while (offset)

  return allRecords
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurantSlug = searchParams.get('restaurantSlug')
    const from = searchParams.get('from') // optional ISO date
    const to = searchParams.get('to')     // optional ISO date

    // Validation: restaurantSlug required
    if (!restaurantSlug) {
      return Response.json(
        { status: 'error', code: 'MISSING_RESTAURANT_SLUG', message: 'restaurantSlug query param is required' },
        { 
          status: 400,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    }

    // Map slug to view
    const viewName = VIEW_MAP[restaurantSlug]
    if (!viewName) {
      return Response.json(
        { status: 'error', code: 'UNKNOWN_RESTAURANT', message: `Unknown restaurant: ${restaurantSlug}. Valid: ${Object.keys(VIEW_MAP).join(', ')}` },
        { 
          status: 400,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    }

    // Airtable config
    const AT_TOKEN = process.env.AIRTABLE_TOKEN
    const AT_BASE = process.env.AIRTABLE_BASE_ID
    const AT_TABLE = process.env.AIRTABLE_TABLE_TIMESLOTS || 'Timeslots_API'

    if (!AT_TOKEN || !AT_BASE) {
      return Response.json(
        { status: 'error', code: 'MISSING_ENV', message: 'Airtable credentials not configured' },
        { 
          status: 500,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    }

    // Filtrer par restaurant_slug avec formula Airtable
    const filterByFormula = `{restaurant_slug}='${restaurantSlug}'`
    const baseUrl = `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(AT_TABLE)}`

    // Fetch ALL records avec pagination
    const records = await fetchAllAirtableRecords({
      baseUrl,
      view: viewName,
      filterByFormula,
      token: AT_TOKEN
    })

    console.log('[timeslots] Total records fetched:', records.length, 'for', restaurantSlug)

    // Normaliser les slots
    let slots = records.map(record => {
      const fields = record.fields || {}
      
      // Extraire date_iso (priorité: date_iso > start_at extraction)
      let dateISO = fields.date_iso || null
      if (!dateISO && fields.start_at) {
        // Extraire YYYY-MM-DD depuis start_at
        dateISO = fields.start_at.split('T')[0]
      }
      
      return {
        id: record.id,
        date_iso: dateISO,
        time_24h: fields.time_24h || null,
        start_at: fields.start_at || null,
        end_at: fields.end_at || null,
        is_open: fields.is_open ?? true,
        capacity: fields.capacity_total || fields.capacity || 0,
        remaining_capacity: fields.remaining_capacity ?? fields.capacity_total ?? fields.capacity ?? 0,
        restaurant_slug: fields.restaurant_slug || restaurantSlug,
        time: fields.time_24h || null
      }
    })

    // Filtrer les slots sans date_iso valide
    slots = slots.filter(s => s.date_iso)

    // Filtrer par from/to si fournis
    if (from || to) {
      slots = slots.filter(slot => {
        const dateISO = slot.date_iso
        if (!dateISO) return false
        
        if (from && dateISO < from) return false
        if (to && dateISO >= to) return false
        
        return true
      })
    }

    // Trier par date puis heure
    slots.sort((a, b) => {
      if (a.date_iso !== b.date_iso) {
        return a.date_iso.localeCompare(b.date_iso)
      }
      return (a.time_24h || '').localeCompare(b.time_24h || '')
    })

    console.log('[timeslots] Filtered & sorted:', {
      restaurantSlug,
      view: viewName,
      count: slots.length,
      from,
      to,
      sample: slots.slice(0, 3).map(s => ({ date: s.date_iso, time: s.time_24h, cap: s.remaining_capacity }))
    })

    // SERVICE_MODE: Enrichir slots avec Services_API
    const uniqueDates = [...new Set(slots.map(s => s.date_iso).filter(Boolean))]
    if (uniqueDates.length > 0) {
      const T_SERVICES = process.env.AIRTABLE_TABLE_SERVICES || 'Services_API'
      const serviceKeys = []
      uniqueDates.forEach(d => {
        const dateNorm = normDate(d)
        serviceKeys.push(makeKeyLower(restaurantSlug, dateNorm, 'midi'))
        serviceKeys.push(makeKeyLower(restaurantSlug, dateNorm, 'soir'))
      })
      
      // SERVICE_MODE: Lookup unique avec OR()
      const orCond = serviceKeys.map(k => `{service_key_lower}="${k}"`).join(', ')
      const serviceFormula = serviceKeys.length === 1 ? orCond : `OR(${orCond})`
      
      try {
        const serviceUrl = `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(T_SERVICES)}`
        const serviceParams = new URLSearchParams({ filterByFormula: serviceFormula, pageSize: '100' })
        const serviceRes = await fetch(`${serviceUrl}?${serviceParams}`, {
          headers: { Authorization: `Bearer ${AT_TOKEN}` },
          cache: 'no-store'
        })
        
        if (serviceRes.ok) {
          const serviceData = await serviceRes.json()
          const serviceMap = {}
          (serviceData.records || []).forEach(rec => {
            const sk = rec.fields?.service_key_lower
            if (sk) {
              serviceMap[sk] = {
                is_full: rec.fields.is_full ?? false,
                remaining_capacity: rec.fields.remaining_capacity ?? null
              }
            }
          })
          
          // SERVICE_MODE: Enrichir chaque slot
          slots = slots.map(slot => {
            if (!slot.time_24h || !slot.date_iso) return slot
            const t = getServiceType(slot.time_24h)
            const d = normDate(slot.date_iso)
            const k = makeKeyLower(restaurantSlug, d, t)
            if (serviceMap[k]) {
              return {
                ...slot,
                is_full: serviceMap[k].is_full,
                ...(serviceMap[k].remaining_capacity !== null && { remaining_capacity: serviceMap[k].remaining_capacity })
              }
            } else {
              console.warn('service_not_found_for_slot', k)
            }
            return slot
          })
          
          console.log('[SERVICE_MODE] Enriched', slots.length, 'slots with', Object.keys(serviceMap).length, 'services')
        }
      } catch (err) {
        console.warn('[SERVICE_MODE] Error fetching services:', err.message)
      }
    }

    return Response.json(
      { 
        status: 'ok', 
        restaurant: restaurantSlug,
        view: viewName,
        count: slots.length,
        slots 
      },
      { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      }
    )

  } catch (err) {
    console.error('[timeslots] Error:', err)
    return Response.json(
      { status: 'error', code: 'INTERNAL', message: err.message || 'Internal error' },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store' }
      }
    )
  }
}

