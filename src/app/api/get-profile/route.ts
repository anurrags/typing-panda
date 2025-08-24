import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("Profile")
    .select("firstName, username")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ...user, profile });
}
