import { NextResponse } from 'next/server'
import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

export async function POST(req) {
  try {
    const body = await req.json()
    const { restaurant_ref, restaurant_name, date_iso, time_24h, party_size } = body

    // 1️⃣ Vérification des données
    if (!restaurant_ref && !restaurant_name) {
      return NextResponse.json({ error: 'Missing restaurant reference' }, { status: 400 })
    }
    if (!date_iso || !time_24h) {
      return NextResponse.json({ error: 'Missing date or time' }, { status: 400 })
    }

    // 2️⃣ Calcul du type de service (midi/soir)
    const hour = parseInt(time_24h.split(':')[0])
    const service_type = hour < 17 ? 'midi' : 'soir'

    // 3️⃣ Normalisation du nom du restaurant
    const restaurantNameClean = (restaurant_name || restaurant_ref || '').trim()

    // 4️⃣ Génération de la clé service
    const dateKey = date_iso.split('T')[0]
    const service_key = `${restaurantNameClean} | ${dateKey} | ${service_type}`
    const service_key_lower = service_key.toLowerCase()

    console.log('🧭 Service recherché:', service_key_lower)

    // 5️⃣ Recherche du service existant dans Services_API
    let services = await base('Services_API')
      .select({ filterByFormula: `{service_key_lower} = "${service_key_lower}"` })
      .firstPage()

    // 6️⃣ Si aucun service n'existe → on le crée automatiquement
    if (services.length === 0) {
      console.log('⚙️ Création automatique du service', service_key_lower)
      const createdService = await base('Services_API').create({
        restaurant_ref: [restaurant_ref],
        date_iso: dateKey,
        service_type: service_type,
      })
      services = [createdService]
    }

    const service = services[0]

    // 7️⃣ Vérifie la capacité
    const remaining = service.fields?.remaining_capacity ?? 999
    if (remaining <= 0) {
      return NextResponse.json({ error: 'SERVICE_FULL' }, { status: 422 })
    }

    // 8️⃣ Création du booking lié au service
    const bookingPayload = {
      restaurant_ref: [restaurant_ref],
      date_iso: dateKey,
      time_24h,
      party_size,
      service_type,
      services_ref: [service.id],
    }

    const booking = await base('Bookings_API').create(bookingPayload)

    console.log('✅ Booking créé', booking.id)

    return NextResponse.json({ ok: true, id: booking.id, service_key })

  } catch (error) {
    console.error('💥 BOOK ERROR', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
