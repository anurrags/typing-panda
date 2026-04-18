import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { KeyPressData } from "@/modules/types";

export async function POST(req: Request) {
  try {
    // 1. AUTHENTICATE USER — getUser() validates JWT server-side, cannot be spoofed
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    const userId = user.id;

    // 2. RECEIVE RAW DATA
    const body = await req.json();
    const { keyPresses, userInput, wordsArray, totalTime } = body;

    if (!keyPresses || !userInput || !wordsArray || !totalTime) {
      return NextResponse.json(
        { error: "Missing required test data" },
        { status: 400 },
      );
    }

    // 3. RUN ANTI-CHEAT HEURISTICS 🤖
    const cheatFlags = analyzeKeystrokesForCheating(keyPresses);
    if (cheatFlags.length > 0) {
      console.warn(
        `Potential cheating detected for user ${userId}:`,
        cheatFlags,
      );
      // You can choose to save this attempt with flags, or just reject it.
      return NextResponse.json(
        { error: "Invalid test submission.", flags: cheatFlags },
        { status: 403 },
      );
    }

    // 4. VALIDATE DATA INTEGRITY
    const firstPressTime = keyPresses[0]?.timestamp ?? 0;
    const lastPressTime = keyPresses[keyPresses.length - 1]?.timestamp ?? 0;
    const calculatedDuration = (lastPressTime - firstPressTime) / 1000;

    // Allow a 1.5-second margin of error for network latency/client-side lag.
    if (Math.abs(calculatedDuration - totalTime) > 1.5) {
      return NextResponse.json(
        { error: "Time mismatch detected." },
        { status: 403 },
      );
    }

    // 5. RE-CALCULATE STATS ON SERVER
    const { wpm, accuracy, charsTyped } = calculateServerSideStats(
      userInput,
      wordsArray,
      totalTime,
    );

    // 6. SAVE VERIFIED RESULT TO DATABASE
    const resultToInsert = {
      user_id: userId,
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      chars_typed: charsTyped,
      // Storing raw data is great for future re-analysis
      raw_data: { keyPresses, userInput, wordsArray, totalTime },
      // You could add other stats here
    };

    // Use the admin client for server-side inserts to bypass RLS if needed,
    // or use the session-based client if your RLS allows inserts.
    const { data, error } = await supabaseAdmin
      .from("test_results") // ❗ YOUR TABLE NAME HERE
      .insert(resultToInsert)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Could not save test result." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, resultId: data.id });
  } catch (err) {
    console.error("Error in while pesrsisting test result", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}

function calculateServerSideStats(
  userInput: string[],
  wordsArray: string[],
  totalTime: number,
) {
  let correctChars = 0,
    charsTyped = 0;

  for (let i = 0; i < userInput.length; i++) {
    const userWord = userInput[i];
    const originalWord = wordsArray[i];
    for (let j = 0; j < userWord.length; j++) {
      if (originalWord && originalWord[j] && userWord[j] === originalWord[j]) {
        correctChars++;
      }
      charsTyped++;
    }
  }

  const spaces = userInput.length > 1 ? userInput.length - 1 : 0;
  const timeInMinutes = totalTime / 60;

  const wpm =
    timeInMinutes > 0
      ? Math.round((correctChars + spaces) / 5) / timeInMinutes
      : 0;
  const accuracy =
    charsTyped > 0 ? Math.round((correctChars / charsTyped) * 100) : 0;

  return { wpm, accuracy, charsTyped, correctChars };
}

function analyzeKeystrokesForCheating(keyPresses: KeyPressData[]): string[] {
  const flags: string[] = [];
  if (!keyPresses || keyPresses.length < 20) {
    return flags; // Not enough data
  }

  const delays = keyPresses
    .map((p, i, arr) => (i > 0 ? p.timestamp - arr[i - 1].timestamp : 0))
    .slice(1);

  // 🚩 FLAG 1: Inhumanly fast typing (consistently <30ms delay)
  const inhumanDelays = delays.filter((d) => d < 30).length;
  if (inhumanDelays > delays.length * 0.2) {
    flags.push("inhuman_speed");
  }

  // 🚩 FLAG 2: "Robot Finger" - No variance in typing speed
  const meanDelay = delays.reduce((a, b) => a + b, 0) / delays.length;
  const variance =
    delays.map((d) => (d - meanDelay) ** 2).reduce((a, b) => a + b, 0) /
    delays.length;
  const stdDev = Math.sqrt(variance);
  if (stdDev < 5) {
    flags.push("zero_variance");
  }

  return flags;
}
