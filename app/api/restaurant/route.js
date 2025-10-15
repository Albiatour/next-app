// Force dynamic - pas de cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return Response.json({ error: 'Missing slug parameter' }, { status: 400 })
    }

    // TODO: Remplacer par vrai fetch Airtable
    // const AT_TOKEN = process.env.AIRTABLE_TOKEN
    // const AT_BASE = process.env.AIRTABLE_BASE_ID
    // const AT_TABLE = 'Restaurants_API'
    // const formula = `{slug}='${slug}'`
    // const url = `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(AT_TABLE)}?filterByFormula=${encodeURIComponent(formula)}`
    // 
    // const airtableRes = await fetch(url, {
    //   headers: { Authorization: `Bearer ${AT_TOKEN}` },
    //   cache: 'no-store' // ⚠️ IMPORTANT: Pas de cache pour MAJ sans redéploiement
    // })
    // 
    // if (!airtableRes.ok) throw new Error(`Airtable error: ${airtableRes.status}`)
    // const data = await airtableRes.json()
    // const record = data.records[0]
    // 
    // if (!record) {
    //   return Response.json({ error: 'Restaurant not found' }, { status: 404 })
    // }
    // 
    // return Response.json({
    //   slug: record.fields.slug,
    //   display_name: record.fields.display_name || record.fields.name,
    //   brand_hex: record.fields.brand_hex
    // })

    // Mock pour l'instant (simule Airtable avec champs explicites)
    // fields: ['slug','name','brand_hex','hero_image_url']
    const mockRestaurants = {
      bistro: { 
        slug: 'bistro', 
        name: 'Bistro',
        display_name: 'Bistro', 
        brand_hex: '#7F4F24',
        hero_image_url: null
      },
      sarrasin: { 
        slug: 'sarrasin', 
        name: 'Sarrasin',
        display_name: 'Sarrasin', 
        brand_hex: '#0E7490',
        hero_image_url: null
      }
    }

    const restaurant = mockRestaurants[slug]

    if (!restaurant) {
      console.warn('[restaurant] Restaurant not found:', slug)
      return Response.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    console.log('THEME', slug, restaurant.brand_hex)
    return Response.json(restaurant)

  } catch (err) {
    console.error('[restaurant] Error:', err)
    return Response.json({ 
      error: 'Internal error', 
      message: err.message 
    }, { status: 500 })
  }
}

