// Debug endpoint - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || 'sarrasin'
    const days = parseInt(searchParams.get('days') || '30', 10)
    const fromDate = searchParams.get('from') // optional YYYY-MM-DD

    // Airtable config
    const AT_TOKEN = process.env.AIRTABLE_TOKEN
    const AT_BASE = process.env.AIRTABLE_BASE_ID
    const AT_TABLE = process.env.AIRTABLE_TABLE_TIMESLOTS || 'Timeslots_API'

    if (!AT_TOKEN || !AT_BASE) {
      return Response.json(
        { error: 'Airtable credentials not configured' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Fetch ALL records avec pagination
    const allRecords = []
    let offset = undefined

    const baseUrl = `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(AT_TABLE)}`
    const filterByFormula = `{restaurant_slug}='${slug}'`

    do {
      const params = new URLSearchParams({
        pageSize: '100',
        filterByFormula,
        ...(offset && { offset })
      })

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${AT_TOKEN}` },
        cache: 'no-store',
        next: { revalidate: 0 }
      })

      if (!response.ok) {
        throw new Error(`Airtable error ${response.status}`)
      }

      const data = await response.json()
      allRecords.push(...(data.records || []))
      offset = data.offset
    } while (offset)

    // Normaliser
    const normalized = allRecords.map(r => {
      const f = r.fields || {}
      let dateISO = f.date_iso || null
      if (!dateISO && f.start_at) {
        dateISO = f.start_at.split('T')[0]
      }
      
      return {
        id: r.id,
        date_iso: dateISO,
        time_24h: f.time_24h || null,
        is_open: f.is_open ?? true,
        capacity: f.capacity_total || f.capacity || 0,
        remaining_capacity: f.remaining_capacity ?? f.capacity_total ?? f.capacity ?? 0,
        restaurant_slug: f.restaurant_slug || slug
      }
    }).filter(s => s.date_iso) // Enlever ceux sans date

    // Grouper par date
    const byDate = {}
    normalized.forEach(slot => {
      const date = slot.date_iso
      if (!byDate[date]) {
        byDate[date] = { open: [], closed: [], zero: [] }
      }
      
      if (!slot.is_open || slot.remaining_capacity <= 0) {
        if (slot.remaining_capacity === 0) {
          byDate[date].zero.push(slot.time_24h)
        } else {
          byDate[date].closed.push(slot.time_24h)
        }
      } else {
        byDate[date].open.push(slot.time_24h)
      }
    })

    // Stats par date
    const byDateMap = {}
    Object.keys(byDate).sort().forEach(date => {
      byDateMap[date] = {
        open: byDate[date].open.length,
        closed: byDate[date].closed.length,
        zero: byDate[date].zero.length,
        total: byDate[date].open.length + byDate[date].closed.length + byDate[date].zero.length
      }
    })

    // Logs
    console.log('[DEBUG] slug:', slug)
    console.log('[DEBUG] total_records:', normalized.length)
    console.log('[DEBUG] byDate:', JSON.stringify(byDateMap, null, 2))

    // Dates avec problèmes
    const problemDates = Object.entries(byDateMap)
      .filter(([date, stats]) => stats.open === 0 && stats.total > 0)
      .map(([date]) => date)

    return Response.json(
      {
        slug,
        total_records: normalized.length,
        by_date: byDateMap,
        problem_dates: problemDates,
        sample_slots: normalized.slice(0, 10).map(s => ({
          date: s.date_iso,
          time: s.time_24h,
          open: s.is_open,
          remaining: s.remaining_capacity
        }))
      },
      { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      }
    )

  } catch (err) {
    console.error('[DEBUG] Error:', err)
    return Response.json(
      { error: err.message },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store' }
      }
    )
  }
}

