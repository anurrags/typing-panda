import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { error } = await supabaseAdmin
    .from("Profile")
    .select("user_id")
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
