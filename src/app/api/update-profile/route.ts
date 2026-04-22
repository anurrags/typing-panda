import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { user_id, username, firstName, lastName, country, avatar } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("Profile")
      .update({
        username,
        firstName,
        lastName,
        country,
        avatar,
      })
      .eq("user_id", user_id);

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
