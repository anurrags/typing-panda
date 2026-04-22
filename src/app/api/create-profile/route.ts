import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  let user_id: string | undefined;

  try {
    const body = await req.json();
    user_id = body.user_id;
    const { username, firstName, lastName } = body;

    const { error } = await supabaseAdmin.from("Profile").upsert(
      {
        user_id,
        username,
        firstName,
        lastName,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("Profile creation error:", error);
      // Rollback: delete the user from Auth so they aren't left in a broken state
      if (user_id) {
        await supabaseAdmin.auth.admin.deleteUser(user_id);
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error creating profile:", err);
    // Rollback: delete the user from Auth on unexpected exception
    if (user_id) {
      await supabaseAdmin.auth.admin.deleteUser(user_id);
    }
    return NextResponse.json(
      { error: "Something went wrong. Please try signing up again." },
      { status: 500 },
    );
  }
}
