import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

// SERVICE_MODE: Utilitaires service (locaux, pas d'import)

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

async function resolveRestaurant(maybeIdOrName) {
  // SERVICE_MODE: si c'est un recordId Airtable, fetch le nom
  if (/^rec[a-zA-Z0-9]{14}$/.test(maybeIdOrName || '')) {
    try {
      const T_RESTAURANTS = process.env.AIRTABLE_TABLE_RESTAURANTS || 'Restaurants_API';
      const res = await fetch(
        `https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(T_RESTAURANTS)}/${maybeIdOrName}`,
        { headers: { Authorization: `Bearer ${AT_TOKEN}` } }
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

// Read mono-restaurant slug from env
const RESTAURANT_SLUG = process.env.NEXT_PUBLIC_RESTAURANT_SLUG;

// ---------- Validators ----------
function toIsoFromInput(input) {
  if (!input || input.trim() === '') throw new Error('INVALID_DATE_FORMAT');
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;           // YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {                  // DD/MM/YYYY
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  throw new Error('INVALID_DATE_FORMAT');
}

function assertTimeHHmm(input) {
  const s = String(input || '').trim();
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s)) throw new Error('INVALID_TIME_FORMAT');
  return s;
}

function parsePartySize(v, min=1, max=12) {
  const n = parseInt(String(v), 10);
  if (Number.isNaN(n) || n < min || n > max) throw new Error('INVALID_PARTY_SIZE');
  return n;
}

function assertNonEmpty(v, code) {
  const s = String(v || '').trim();
  if (!s) throw new Error(code);
  return s;
}

// ---------- Airtable setup ----------
const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const AT_BASE  = process.env.AIRTABLE_BASE_ID;
const T_TIMES  = process.env.AIRTABLE_TABLE_TIMESLOTS;   // Timeslots_API
const T_BOOKS  = process.env.AIRTABLE_TABLE_BOOKINGS;    // Bookings_API

if (!AT_TOKEN || !AT_BASE || !T_TIMES || !T_BOOKS) {
  console.error('[book] Missing env variables');
}

// ---------- Airtable helpers ----------
async function airtableList(table, params = {}) {
  const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AT_TOKEN}` }
  });
  if (!res.ok) throw new Error(`AIRTABLE_LIST_${table}_${res.status}`);
  return res.json();
}

async function airtableCreate(table, fields) {
  const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AIRTABLE_CREATE_${table}_${res.status}:${t}`);
  }
  return res.json(); // { id, fields, createdTime }
}

async function airtableUpdate(table, recordId, fields) {
  const res = await fetch(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}/${recordId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${AT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AIRTABLE_UPDATE_${table}_${res.status}:${t}`);
  }
  return res.json();
}

async function airtableDelete(table, recordId) {
  await fetch(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(table)}/${recordId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${AT_TOKEN}` }
  });
}

// ---------- Domain helpers ----------
async function findBookingByIdempotency(idemKey) {
  const formula = `({idempotency_key}='${idemKey}')`;
  const { records = [] } = await airtableList(T_BOOKS, { filterByFormula: formula, pageSize: '1' });
  return records[0]; // may be undefined
}

async function getSlotRecord(restaurant, isoDate, time) {
  const formula = `AND({restaurant_slug}='${restaurant}', IS_SAME({date_iso}, '${isoDate}', 'day'), {time_24h}='${time}', {is_open}=1)`;
  const { records = [] } = await airtableList(T_TIMES, { filterByFormula: formula, pageSize: '1' });
  return records[0];
}

// ---------- API handler ----------
export async function POST(req) {
  try {
    if (!AT_TOKEN || !AT_BASE || !T_TIMES || !T_BOOKS) {
      return Response.json({ status: 'error', code: 'MISSING_ENV' }, { status: 500 });
    }

    // Check restaurant slug env var
    if (!RESTAURANT_SLUG) {
      return Response.json({ status: 'error', code: 'MISSING_ENV', message: 'NEXT_PUBLIC_RESTAURANT_SLUG not set' }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    // Ignore any client-sent restaurant slug (do NOT read restaurant_slug_raw from request)
    // Always set restaurant from ENV
    const restaurant = RESTAURANT_SLUG;
    const dateISO    = toIsoFromInput(assertNonEmpty(body.date, 'INVALID_DATE_FORMAT'));
    const time       = assertTimeHHmm(body.time);
    const partySize  = parsePartySize(body.partySize);
    const name       = assertNonEmpty(body.name, 'INVALID_NAME');
    const email      = assertNonEmpty(body.email, 'INVALID_EMAIL');   // validation simple
    const phone      = assertNonEmpty(body.phone, 'INVALID_PHONE');
    const comments   = body.comments || '';
    const idemKey    = assertNonEmpty(body.idempotencyKey, 'INVALID_IDEMPOTENCY_KEY');

    // 1) Idempotence: si on a déjà traité cette demande, renvoyer le même résultat
    const existing = await findBookingByIdempotency(idemKey);
    if (existing) {
      const bId = existing.fields?.booking_id;
      const bCode = existing.fields?.booking_code;
      console.info('[book] idempotency hit', idemKey, bId);
      return Response.json({ 
        status: 'ok', 
        booking_id: bId,
        booking_code: bCode
      }, { status: 200 });
    }

    // SERVICE_MODE: build service_key + debug logs
    const { restaurant_ref, restaurant: bodyRestaurant, restaurant_slug, restaurant_name, date_iso, time_24h } = body;
    const d = normDate(date_iso || dateISO);
    const type = getServiceType(time_24h || time);
    const resolved = await resolveRestaurant(restaurant_ref || bodyRestaurant || restaurant_slug || restaurant_name || restaurant);
    const keyLower = makeKeyLower(resolved.name, d, type);
    
    console.log('SERVICE_MODE_DEBUG', { 
      raw: restaurant_ref || bodyRestaurant || restaurant_slug || restaurant_name, 
      name: resolved.name, 
      id: resolved.id, 
      date: d, 
      type, 
      keyLower 
    });
    
    // SERVICE_MODE: Lookup dans Services_API
    const T_SERVICES = process.env.AIRTABLE_TABLE_SERVICES || 'Services_API';
    let serviceRecordId = null;
    let services = [];
    
    try {
      // Lookup 1: by service_key_lower
      let data = await airtableList(T_SERVICES, { 
        filterByFormula: `{service_key_lower} = "${keyLower}"` 
      });
      services = data.records || [];
      
      // Fallback: by record_id + date + type
      if (!services.length && resolved.id) {
        const ff = `AND({restaurant_record_id}='${resolved.id}', {date_iso}='${d}', {service_type}='${type}')`;
        console.log('SERVICE_MODE_FALLBACK', ff);
        data = await airtableList(T_SERVICES, { filterByFormula: ff });
        services = data.records || [];
      }
      
      if (!services?.length) {
        return Response.json({ code: 'SERVICE_NOT_FOUND', keyLower }, { status: 422 });
      }
      if (services.length > 1) {
        return Response.json({ code: 'SERVICE_DUPLICATE', keyLower, count: services.length }, { status: 422 });
      }
      
      const service = services[0];
      if (!!service.fields?.is_full) {
        return Response.json({ code: 'SERVICE_FULL', keyLower }, { status: 422 });
      }
      
      serviceRecordId = service.id;
      console.log('SERVICE_MODE_LINK', { serviceId: service.id, keyLower });
    } catch (err) {
      console.error('[SERVICE_MODE] Error checking service:', err);
      return Response.json({ status: 'error', code: 'SERVICE_ERROR', message: err.message }, { status: 500 });
    }

    // 2) Contrôle de capacité
    const slot = await getSlotRecord(restaurant, dateISO, time);
    if (!slot) {
      return Response.json({ status: 'error', code: 'SLOT_NOT_FOUND', message: 'Slot closed or not configured' }, { status: 409 });
    }
    const slotId        = slot.id; // Airtable record ID (for update)
    const f             = slot.fields || {};
    const capacityTotal = Number(f.capacity_total ?? 0);
    const capacityUsed  = Number(f.capacity_used ?? 0);
    const capacityLeft  = capacityTotal - capacityUsed;

    if (capacityLeft < partySize) {
      return Response.json({ status: 'error', code: 'SLOT_FULL', message: 'Not enough seats.' }, { status: 409 });
    }

    // 3) Écriture "quasi atomique"
    // 3a) Générer booking_id et booking_code uniques
    const booking_id = randomUUID();
    const ymd = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const booking_code = `BK-${ymd}-${booking_id.slice(0,6).toUpperCase()}`;

    let created; // pour rollback si update capacity échoue
    try {
      // Airtable create payload — send only existing fields
      const bookingFields = {
        booking_id,
        booking_code,
        name,
        email,
        phone,
        comments,
        party_size: partySize,
        status: 'confirmed',                 // e.g. "confirmed"
        idempotency_key: idemKey,            // from client
        restaurant_slug_raw: restaurant,     // from ENV (forced)
        date_iso_raw: dateISO,               // from client
        time_24h_raw: time                   // from client
      };

      // SERVICE_MODE: Ajouter services_ref
      if (serviceRecordId) {
        bookingFields.services_ref = [serviceRecordId];
      }

      created = await airtableCreate(T_BOOKS, bookingFields);
    } catch (e) {
      console.error('[book] create booking failed', e);
      return Response.json({ status: 'error', code: 'CREATE_FAILED', message: 'Could not create booking.' }, { status: 500 });
    }

    // 3b) Incrémenter capacity_used sur le slot
    try {
      const newUsed = capacityUsed + partySize;
      await airtableUpdate(T_TIMES, slotId, { capacity_used: newUsed });
    } catch (e) {
      console.error('[book] increment capacity failed — rolling back booking', e);
      // Best-effort rollback: annuler ou supprimer la réservation
      try {
        await airtableUpdate(T_BOOKS, created.id, { status: 'cancelled' });
      } catch {}
      try { await airtableDelete(T_BOOKS, created.id); } catch {}
      return Response.json({ status: 'error', code: 'CAPACITY_UPDATE_FAILED', message: 'Could not update capacity.' }, { status: 500 });
    }

    console.info('[book] success', { booking_id, booking_code, restaurant, dateISO, time, partySize });
    // Response payload — return IDs to the front
    return Response.json({
      status: 'ok',
      booking_id,
      booking_code
    }, { status: 200 });

  } catch (err) {
    // SERVICE_MODE_DIAG
    console.error('BOOKINGS_POST_ERROR', err);
    
    const msg = String(err?.message || 'INTERNAL');
    let http = 500, code = 'INTERNAL';
    if (msg.includes('INVALID_DATE_FORMAT')) { http = 400; code = 'INVALID_DATE_FORMAT'; }
    else if (msg.includes('INVALID_TIME_FORMAT')) { http = 400; code = 'INVALID_TIME_FORMAT'; }
    else if (msg.includes('INVALID_PARTY_SIZE')) { http = 400; code = 'INVALID_PARTY_SIZE'; }
    else if (msg.includes('INVALID_RESTAURANT')) { http = 400; code = 'INVALID_RESTAURANT'; }
    else if (msg.includes('INVALID_NAME')) { http = 400; code = 'INVALID_NAME'; }
    else if (msg.includes('INVALID_EMAIL')) { http = 400; code = 'INVALID_EMAIL'; }
    else if (msg.includes('INVALID_PHONE')) { http = 400; code = 'INVALID_PHONE'; }
    else if (msg.includes('INVALID_IDEMPOTENCY_KEY')) { http = 400; code = 'INVALID_IDEMPOTENCY_KEY'; }

    return Response.json({ status: 'error', code, message: msg }, { status: http });
  }
}
