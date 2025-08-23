import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user_id, username, firstName, lastName } = await req.json();

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
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error creating profile:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
