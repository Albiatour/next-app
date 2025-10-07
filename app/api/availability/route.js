export const dynamic = 'force-dynamic';

function toIsoFromInput(input) {
  if (!input || input.trim() === '') return todayIsoInBrussels();
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  throw new Error('INVALID_DATE_FORMAT');
}

function todayIsoInBrussels() {
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

const AT_TOKEN = process.env.AIRTABLE_TOKEN;
const AT_BASE = process.env.AIRTABLE_BASE_ID;
const AT_TABLE = process.env.AIRTABLE_TABLE_TIMESLOTS;

async function fetchSlots({ restaurant, isoDate }) {
  const url = new URL(`https://api.airtable.com/v0/${AT_BASE}/${encodeURIComponent(AT_TABLE)}`);
  const formula = `AND({restaurant_slug}='${restaurant}', IS_SAME({date_iso}, '${isoDate}', 'day'), {is_open}=1)`;
  url.searchParams.set('filterByFormula', formula);
  url.searchParams.set('pageSize', '100');
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${AT_TOKEN}` }
  });
  if (!res.ok) throw new Error(`AIRTABLE_ERROR ${res.status}`);
  return res.json();
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurant = (searchParams.get('restaurant') || '').trim();
    if (!restaurant) return Response.json({ status: 'error', code: 'MISSING_RESTAURANT' }, { status: 400 });

    const isoDate = toIsoFromInput(searchParams.get('date') || '');
    const partySize = parsePartySize(searchParams.get('partySize'));

    if (!AT_TOKEN || !AT_BASE || !AT_TABLE) {
      return Response.json({ status: 'error', code: 'MISSING_ENV' }, { status: 500 });
    }

    const data = await fetchSlots({ restaurant, isoDate });

    const slots = (data.records || [])
      .map(r => {
        const f = r.fields || {};
        const timeRaw = f.time_24h || '';
        const time = typeof timeRaw === 'string' ? timeRaw : Array.isArray(timeRaw) ? timeRaw[0] : '';
        const capacityTotal = Number(f.capacity_total ?? 0);
        const capacityUsed  = Number(f.capacity_used ?? 0);
        const capacityLeft  = Math.max(capacityTotal - capacityUsed, 0);
        return {
          time: time || 'N/A',
          capacityLeft,
          isBookable: capacityLeft >= partySize
        };
      })
      .filter(s => s.time !== 'N/A')
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
