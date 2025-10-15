// Disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Map restaurant slug to Airtable view
const VIEW_MAP = {
  bistro: 'v_timeslots_bistro',
  sarrasin: 'v_timeslots_sarrasin'
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

    // Fetch from Airtable using the mapped view
    const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(AT_TABLE)}`)
    url.searchParams.set('view', viewName)
    url.searchParams.set('pageSize', '100')

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${AT_TOKEN}` },
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[timeslots] Airtable error:', response.status, errorText)
      return Response.json(
        { status: 'error', code: 'AIRTABLE_ERROR', message: `Airtable returned ${response.status}` },
        { 
          status: 500,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    }

    const data = await response.json()
    let slots = (data.records || []).map(record => ({
      id: record.id,
      start_at: record.fields.start_at || record.fields.date_iso || null,
      end_at: record.fields.end_at || null,
      capacity: record.fields.capacity_total || record.fields.capacity || null,
      time: record.fields.time_24h || null
    }))

    // Optional: filter by from/to dates in code
    if (from || to) {
      slots = slots.filter(slot => {
        const startAt = slot.start_at
        if (!startAt) return false
        
        if (from && startAt < from) return false
        if (to && startAt >= to) return false
        
        return true
      })
    }

    console.log('[timeslots]', { restaurantSlug, view: viewName, count: slots.length, from, to })

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

