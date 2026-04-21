import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  let dbStatus = "ok";
  let dbError = null;

  try {
    // Simple query to keep the database instance active and check connectivity
    const { error } = await supabaseAdmin
      .from("Profile")
      .select("user_id")
      .limit(1);

    if (error) {
      dbStatus = "error";
      dbError = error.message;
      console.error("Database health check failed:", error);
    }
  } catch (err) {
    dbStatus = "exception";
    dbError = err instanceof Error ? err.message : String(err);
    console.error("Database health check exception:", err);
  }

  return NextResponse.json(
    {
      status: "ok",
      database: {
        status: dbStatus,
        error: dbError,
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: dbStatus === "ok" ? 200 : 503 },
  );
}
