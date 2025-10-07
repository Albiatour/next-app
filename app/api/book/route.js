export const dynamic = 'force-dynamic';

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

    const body = await req.json().catch(() => ({}));
    const restaurant = assertNonEmpty(body.restaurant, 'INVALID_RESTAURANT');
    const dateISO    = toIsoFromInput(assertNonEmpty(body.date, 'INVALID_DATE_FORMAT'));
    const time       = assertTimeHHmm(body.time);
    const partySize  = parsePartySize(body.partySize);
    const name       = assertNonEmpty(body.name, 'INVALID_NAME');
    const email      = assertNonEmpty(body.email, 'INVALID_EMAIL');   // validation simple
    const phone      = assertNonEmpty(body.phone, 'INVALID_PHONE');
    const idemKey    = assertNonEmpty(body.idempotencyKey, 'INVALID_IDEMPOTENCY_KEY');

    // 1) Idempotence: si on a déjà traité cette demande, renvoyer le même résultat
    const existing = await findBookingByIdempotency(idemKey);
    if (existing) {
      const bId = existing.fields?.booking_id;
      console.info('[book] idempotency hit', idemKey, bId);
      return Response.json({ status: 'ok', bookingId: bId }, { status: 200 });
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
    // 3a) Créer la réservation
    const bookingId = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    const slot_id_value = `${dateISO}|${restaurant}|${time}`;

    let created; // pour rollback si update capacity échoue
    try {
      created = await airtableCreate(T_BOOKS, {
        booking_id: bookingId,
        restaurant_slug: restaurant,
        slot_id: slot_id_value,
        date_iso: dateISO,
        time_24h: time,
        party_size: partySize,
        name, email, phone,
        status: 'confirmed',
        idempotency_key: idemKey
      });
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

    console.info('[book] success', { bookingId, restaurant, dateISO, time, partySize });
    return Response.json({ status: 'ok', bookingId }, { status: 200 });

  } catch (err) {
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
