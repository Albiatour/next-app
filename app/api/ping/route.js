export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    ok: true,
    router: "app",
    now: new Date().toISOString(),
    hasEnv: {
      AIRTABLE_TOKEN: !!process.env.AIRTABLE_TOKEN,
      AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_TIMESLOTS: !!process.env.AIRTABLE_TABLE_TIMESLOTS,
      AIRTABLE_TABLE_BOOKINGS: !!process.env.AIRTABLE_TABLE_BOOKINGS,
      APP_TIMEZONE: !!process.env.APP_TIMEZONE
    }
  });
}
