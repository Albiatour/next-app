export const dynamic = 'force-dynamic';

// --- helpers date --- //
function toIsoFromInput(input) {
  if (!input || input.trim() === '') return todayIsoInBrussels();
  const s = input.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }

  throw new Error('INVALID_DATE_FORMAT');
}

function todayIsoInBrussels() {
  // fabrique la date du jour en Europe/Brussels, format YYYY-MM-DD
  const fmt = new Intl.DateTimeFormat('fr-BE', {
    timeZone: process.env.APP_TIMEZONE || 'Europe/Brussels',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const [{ value: dd },,{ value: mm },,{ value: yyyy }] = fmt.formatToParts(new Date());
  return `${yyyy}-${mm}-${dd}`;
}

function parsePartySize(v, min=1, max=12) {
  const n = v == null ? 2 : parseInt(String(v), 10);
  if (Number.isNaN(n) || n < min || n > max) throw new Error('INVALID_PARTY_SIZE');
  return n;
}

// --- Airtable REST --- //
const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const AT_BASE = process.env.AIRTABLE_BASE_ID;
const AT_TABLE = process.env.AIRTABLE_TABLE_TIMESLOTS;

async function fetchSlots({ restaurant, isoDate }) {
  const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(AT_TABLE)}`);
  // filterByFormula: restaurant + date + is_open
  const formula = `AND({restaurant_slug}='${restaurant}', IS_SAME({date_iso}, '${isoDate}', 'day'), {is_open}=1)`;
  url.searchParams.set('filterByFormula', formula);
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('fields[]', 'time_24h');
  url.searchParams.set('fields[]', 'capacity_total');
  url.searchParams.set('fields[]', 'capacity_used');

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AT_TOKEN}` }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AIRTABLE_ERROR ${res.status}: ${txt}`);
  }
  return res.json();
}

export async function GET(req) {
  try {
    // params
    const { searchParams } = new URL(req.url);
    const restaurant = (searchParams.get('restaurant') || '').trim();
    if (!restaurant) {
      return Response.json({ status: 'error', code: 'MISSING_RESTAURANT' }, { status: 400 });
    }
    const isoDate = toIsoFromInput(searchParams.get('date') || '');
    const partySize = parsePartySize(searchParams.get('partySize'));

    // guard env
    if (!AT_TOKEN || !AT_BASE || !AT_TABLE) {
      return Response.json({ status: 'error', code: 'MISSING_ENV' }, { status: 500 });
    }

    // Airtable
    const data = await fetchSlots({ restaurant, isoDate });

    // map + tri
    const slots = (data.records || [])
      .map(r => {
        const f = r.fields || {};
        const capacityTotal = Number(f.capacity_total ?? 0);
        const capacityUsed  = Number(f.capacity_used ?? 0);
        const capacityLeft  = Math.max(capacityTotal - capacityUsed, 0);
        return {
          time: String(f.time_24h || '').padStart(5, '0'),
          capacityLeft,
          isBookable: capacityLeft >= partySize
        };
      })
      .filter(s => !!s.time)
      .sort((a,b) => a.time.localeCompare(b.time));

    console.info('[availability]', { restaurant, isoDate, partySize, count: slots.length });

    return Response.json({ restaurant, date: isoDate, partySize, slots }, { status: 200 });
  } catch (err) {
    const msg = err?.message || 'INTERNAL';
    const code = msg.includes('INVALID_DATE_FORMAT') ? 400
               : msg.includes('INVALID_PARTY_SIZE') ? 400
               : 500;
    return Response.json({ status: 'error', message: msg }, { status: code });
  }
}
