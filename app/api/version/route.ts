import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    commit: "1f6ab9c277758da25783cf548f95e82d0cef4f71",
    mode: "legacy"
  });
}

