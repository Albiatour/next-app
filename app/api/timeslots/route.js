import { NextResponse } from 'next/server'
import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const restaurant_ref = searchParams.get('restaurant_ref') || searchParams.get('restaurant')
    const date_iso = searchParams.get('date_iso') || searchParams.get('date')

    if (!restaurant_ref || !date_iso) {
      return NextResponse.json({ error: 'Missing restaurant or date' }, { status: 400 })
    }

    // 1️⃣ Normalisation du jour
    const dateKey = date_iso.split('T')[0]

    // 2️⃣ Recherche des services midi et soir pour ce restaurant et cette date
    const filter = `AND(
      {date_iso}='${dateKey}',
      OR(
        {restaurant_ref}='${restaurant_ref}',
        {restaurant_name}='${restaurant_ref}'
      )
    )`

    const services = await base('Services_API').select({ filterByFormula: filter }).firstPage()

    // 3️⃣ Création d'une map service_type -> dispo
    const serviceMap = {}
    for (const svc of services) {
      const type = svc.fields.service_type
      serviceMap[type] = {
        remaining_capacity: svc.fields.remaining_capacity ?? null,
        is_full: !!svc.fields.is_full,
      }
    }

    // 4️⃣ Récupération des timeslots existants (pour afficher les heures)
    const timeslots = await base('Timeslots_API')
      .select({ filterByFormula: `{restaurant_ref}='${restaurant_ref}'` })
      .firstPage()

    // 5️⃣ Injection des capacités selon midi / soir
    const enriched = timeslots.map(slot => {
      const time = slot.fields.time_24h
      const hour = parseInt(time.split(':')[0])
      const service_type = hour < 17 ? 'midi' : 'soir'
      const svc = serviceMap[service_type] || {}

      return {
        id: slot.id,
        time_24h: time,
        service_type,
        remaining_capacity: svc.remaining_capacity ?? null,
        is_full: svc.is_full ?? false,
      }
    })

    return NextResponse.json({ slots: enriched })
  } catch (error) {
    console.error('💥 TIMESLOTS ERROR', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
