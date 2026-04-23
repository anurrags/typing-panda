/**
 * POST /api/submit-test
 *
 * Server-side anti-cheat validation for typing test submissions.
 *
 * Validation pipeline:
 * 1. Signature Verification — verify HMAC token integrity
 * 2. Keystroke Hash Verification — ensure keystroke log wasn't tampered
 * 3. Replay Validation — recalculate WPM/accuracy from raw keystrokes
 * 4. Statistical Variance Analysis — detect bot-like timing patterns
 * 5. Sanity Limits — reject physically impossible scores
 * 6. Account History & Progression — detect suspicious skill jumps
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ─── Types ──────────────────────────────────────────────────────────────────

interface KeystrokeEvent {
  key: string;
  timestamp: number;
  isTrusted: boolean;
}

interface SubmitTestBody {
  testStats: {
    testId: string;
    testType: "words" | "time";
    testTypeValue: number;
    meanWpm: number;
    meanRawWpm: number;
    accuracy: number;
    testTime: number;
    charsTyped: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    statsPerSecond: Array<{
      second: number;
      wpm: number;
      rawWpm: number;
      errorRate: number;
      accuracy: number;
    }>;
    characterStats?: Record<string, { correct: number; incorrect: number }>;
  };
  antiCheat: {
    token: string;
    keystrokeHash: string;
    generatedAt: number;
    flags: {
      pasteAttempts: number;
      untrustedKeyEvents: number;
      focusLossCount: number;
      totalUnfocusedMs: number;
      automationDetected: boolean;
      isInvalidated: boolean;
      invalidationReason: string | null;
    };
    timingAnalysis: {
      meanInterval: number;
      stdDeviation: number;
      coefficientOfVariation: number;
      suspiciouslyUniformCount: number;
      isSuspicious: boolean;
    };
    keystrokeLog: KeystrokeEvent[];
  };
}

interface ValidationResult {
  passed: boolean;
  check: string;
  message: string;
}

// ─── Crypto Helpers (Node.js compatible) ────────────────────────────────────

async function sha256(message: string): Promise<string> {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(message).digest("hex");
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const { createHmac } = await import("crypto");
  return createHmac("sha256", key).update(message).digest("hex");
}

// ─── Validation Functions ───────────────────────────────────────────────────

/**
 * 1. Signature Verification
 * Recreates the HMAC token server-side and compares it to the client's token.
 */
async function verifySignature(
  body: SubmitTestBody,
): Promise<ValidationResult> {
  const { testStats, antiCheat } = body;

  const secretKey = process.env.ANTICHEAT_SECRET || "tp_default_secret";

  // Recreate the same deterministic string the frontend built
  const testDataString = [
    testStats.testId,
    testStats.meanWpm,
    testStats.meanRawWpm,
    testStats.accuracy,
    testStats.testTime,
    testStats.charsTyped,
    testStats.correctChars,
    testStats.incorrectChars,
    testStats.extraChars,
    testStats.testType,
    testStats.testTypeValue,
    antiCheat.generatedAt,
  ].join("|");

  const signingPayload = [
    testDataString,
    antiCheat.keystrokeHash,
    antiCheat.flags.pasteAttempts,
    antiCheat.flags.untrustedKeyEvents,
    antiCheat.flags.focusLossCount,
    antiCheat.flags.automationDetected,
    antiCheat.timingAnalysis.isSuspicious,
  ].join("|");

  const expectedToken = await hmacSha256(secretKey, signingPayload);

  if (expectedToken !== antiCheat.token) {
    return {
      passed: false,
      check: "signature",
      message:
        "Invalid anti-cheat signature. Payload may have been tampered with.",
    };
  }

  // Check token freshness (reject if older than 30 seconds)
  const ageMs = Date.now() - antiCheat.generatedAt;
  if (ageMs > 30_000) {
    return {
      passed: false,
      check: "signature",
      message: "Anti-cheat token expired. Submission too late.",
    };
  }

  return { passed: true, check: "signature", message: "OK" };
}

/**
 * 2. Keystroke Hash Verification
 * Verifies the keystroke log hash matches the claimed hash.
 */
async function verifyKeystrokeHash(
  body: SubmitTestBody,
): Promise<ValidationResult> {
  const { antiCheat } = body;

  const keystrokeString = antiCheat.keystrokeLog
    .map((k) => `${k.key}:${k.timestamp.toFixed(2)}:${k.isTrusted}`)
    .join(",");
  const computedHash = await sha256(keystrokeString);

  if (computedHash !== antiCheat.keystrokeHash) {
    return {
      passed: false,
      check: "keystroke_hash",
      message:
        "Keystroke log integrity check failed. Data may have been modified.",
    };
  }

  return { passed: true, check: "keystroke_hash", message: "OK" };
}

/**
 * 3. Replay Validation
 * Recalculates character counts from the keystroke log and verifies
 * they match the claimed test results.
 */
function replayValidation(body: SubmitTestBody): ValidationResult {
  const { testStats, antiCheat } = body;
  const keystrokes = antiCheat.keystrokeLog;

  if (keystrokes.length === 0) {
    return {
      passed: false,
      check: "replay",
      message: "No keystroke data provided for verification.",
    };
  }

  // Count typed characters from the keystroke log (excluding Backspace, spaces, etc.)
  // Note: The frontend's charsTyped excludes spaces — spaces are word separators
  let charKeystrokes = 0;
  let backspaceCount = 0;
  for (const ks of keystrokes) {
    if (ks.key === "Backspace") {
      backspaceCount++;
    } else if (ks.key.length === 1 && ks.key !== " ") {
      charKeystrokes++;
    }
  }

  // Net characters = chars typed - backspaces (capped at 0)
  const netChars = Math.max(0, charKeystrokes - backspaceCount);

  // charsTyped from frontend = characters in final state (after backspaces)
  // Allow a tolerance because backspace deletes are already reflected in charsTyped
  const tolerance = Math.max(10, testStats.charsTyped * 0.15);
  if (Math.abs(netChars - testStats.charsTyped) > tolerance) {
    return {
      passed: false,
      check: "replay",
      message: `Replay mismatch: keystroke log shows ~${netChars} net chars, but claimed ${testStats.charsTyped}.`,
    };
  }

  // Verify test duration from keystroke timestamps
  if (keystrokes.length >= 2) {
    const firstKeystroke = keystrokes[0].timestamp;
    const lastKeystroke = keystrokes[keystrokes.length - 1].timestamp;
    const keystrokeDurationSec = (lastKeystroke - firstKeystroke) / 1000;

    // Test time should roughly match keystroke duration (within 3 seconds tolerance)
    if (Math.abs(keystrokeDurationSec - testStats.testTime) > 3) {
      return {
        passed: false,
        check: "replay",
        message: `Time mismatch: keystrokes span ${keystrokeDurationSec.toFixed(1)}s but claimed ${testStats.testTime}s.`,
      };
    }
  }

  // Recalculate WPM from keystrokes to verify it's in the right ballpark
  // Frontend formula: rawWpm = (charsTyped + spacesTyped) / 5 / timeInMinutes
  const spaceCount = keystrokes.filter((ks) => ks.key === " ").length;
  const totalCharsForWpm = netChars + spaceCount;
  const testTimeMinutes = testStats.testTime / 60;
  if (testTimeMinutes > 0) {
    const replayedRawWpm = Math.round(totalCharsForWpm / 5 / testTimeMinutes);
    const wpmDiff = Math.abs(replayedRawWpm - testStats.meanRawWpm);
    // Allow 20% tolerance or 15 WPM absolute tolerance
    const wpmTolerance = Math.max(15, testStats.meanRawWpm * 0.2);

    if (wpmDiff > wpmTolerance) {
      return {
        passed: false,
        check: "replay",
        message: `WPM mismatch: replayed ~${replayedRawWpm} raw WPM but claimed ${testStats.meanRawWpm}.`,
      };
    }
  }

  return { passed: true, check: "replay", message: "OK" };
}

/**
 * 4. Statistical Variance Analysis (Bot Detection)
 * Analyzes keystroke timing for inhuman patterns.
 */
function statisticalAnalysis(body: SubmitTestBody): ValidationResult {
  const keystrokes = body.antiCheat.keystrokeLog;

  if (keystrokes.length < 10) {
    return { passed: true, check: "timing", message: "OK (insufficient data)" };
  }

  // Calculate inter-key intervals
  const intervals: number[] = [];
  for (let i = 1; i < keystrokes.length; i++) {
    intervals.push(keystrokes[i].timestamp - keystrokes[i - 1].timestamp);
  }

  // ── Zero Variance Check ──
  // If a macro is typing, intervals are perfectly uniform
  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) /
    intervals.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean === 0 ? 0 : stdDev / mean;

  if (cv < 0.08 && intervals.length > 20) {
    return {
      passed: false,
      check: "timing",
      message: `Bot-like uniformity detected. Coefficient of variation: ${cv.toFixed(4)} (threshold: 0.08).`,
    };
  }

  // ── Impossible Bursts Check ──
  // Flag if multiple characters appear within 1ms window
  let burstCount = 0;
  for (const interval of intervals) {
    if (interval < 5) {
      burstCount++;
    }
  }
  const burstRatio = burstCount / intervals.length;
  if (burstRatio > 0.1) {
    return {
      passed: false,
      check: "timing",
      message: `Impossible keystroke bursts: ${burstCount}/${intervals.length} intervals under 5ms.`,
    };
  }

  // ── Suspiciously Uniform Consecutive Intervals ──
  let uniformPairs = 0;
  for (let i = 1; i < intervals.length; i++) {
    if (Math.abs(intervals[i] - intervals[i - 1]) < 2) {
      uniformPairs++;
    }
  }
  const uniformRatio = uniformPairs / intervals.length;
  if (uniformRatio > 0.35) {
    return {
      passed: false,
      check: "timing",
      message: `Suspiciously uniform timing: ${(uniformRatio * 100).toFixed(1)}% of consecutive intervals nearly identical.`,
    };
  }

  return { passed: true, check: "timing", message: "OK" };
}

/**
 * 5. Sanity Limits
 * Enforces hard human limits on typing speed.
 */
function sanityLimits(body: SubmitTestBody): ValidationResult {
  const { testStats } = body;

  // World record is ~300 WPM sustained. Cap at 350 for some headroom.
  if (testStats.meanWpm > 350) {
    return {
      passed: false,
      check: "sanity",
      message: `WPM of ${testStats.meanWpm} exceeds maximum human capability (350 WPM limit).`,
    };
  }

  // Raw WPM shouldn't exceed 400 (typing gibberish quickly)
  if (testStats.meanRawWpm > 400) {
    return {
      passed: false,
      check: "sanity",
      message: `Raw WPM of ${testStats.meanRawWpm} is physically impossible.`,
    };
  }

  // Test must have lasted at least 3 seconds to be meaningful
  if (testStats.testTime < 3) {
    return {
      passed: false,
      check: "sanity",
      message: "Test duration too short to be valid.",
    };
  }

  // Accuracy can't exceed 100%
  if (testStats.accuracy > 100) {
    return {
      passed: false,
      check: "sanity",
      message: "Accuracy cannot exceed 100%.",
    };
  }

  // Characters typed must be positive
  if (testStats.charsTyped <= 0) {
    return {
      passed: false,
      check: "sanity",
      message: "No characters were typed.",
    };
  }

  return { passed: true, check: "sanity", message: "OK" };
}

/**
 * 6. Account History & Progression Tracking
 * Flags accounts with suspicious sudden improvements.
 */
async function checkAccountHistory(
  userId: string,
  newWpm: number,
): Promise<ValidationResult> {
  // Fetch the user's recent test history
  const { data: recentTests, error } = await supabaseAdmin
    .from("testData")
    .select("meanWpm, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !recentTests || recentTests.length < 5) {
    // Not enough history to judge — pass
    return {
      passed: true,
      check: "history",
      message: "OK (insufficient history)",
    };
  }

  // Calculate their historical average
  const historicalWpms = recentTests.map((t: { meanWpm: number }) => t.meanWpm);
  const avgWpm =
    historicalWpms.reduce((a: number, b: number) => a + b, 0) /
    historicalWpms.length;
  const maxHistoricalWpm = Math.max(...historicalWpms);

  // Flag if the new score is more than 2.5x their average
  // AND more than 80 WPM above their best ever
  if (newWpm > avgWpm * 2.5 && newWpm > maxHistoricalWpm + 80) {
    return {
      passed: false,
      check: "history",
      message: `Suspicious improvement: ${newWpm} WPM vs historical average of ${Math.round(avgWpm)} WPM (best: ${maxHistoricalWpm}).`,
    };
  }

  return { passed: true, check: "history", message: "OK" };
}

// ─── Main Handler ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Extract the user's auth token from the request
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 },
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    // Verify the user with Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired authentication." },
        { status: 401 },
      );
    }

    // Parse the request body
    const body: SubmitTestBody = await req.json();

    if (!body.testStats || !body.antiCheat) {
      return NextResponse.json(
        { error: "Missing testStats or antiCheat payload." },
        { status: 400 },
      );
    }

    // Skip saving if WPM is 0
    if (body.testStats.meanWpm === 0) {
      return NextResponse.json(
        { error: "Cannot save a test with 0 WPM." },
        { status: 400 },
      );
    }

    // Check if frontend already flagged the test
    if (body.antiCheat.flags.isInvalidated) {
      return NextResponse.json(
        {
          error: "Test was already invalidated by the client.",
          reason: body.antiCheat.flags.invalidationReason,
        },
        { status: 403 },
      );
    }

    // ─── Run Validation Pipeline ──────────────────────────────────────

    const results: ValidationResult[] = [];

    // 1. Signature Verification
    const sigResult = await verifySignature(body);
    results.push(sigResult);
    if (!sigResult.passed) {
      return NextResponse.json(
        {
          error: "Anti-cheat validation failed.",
          validation: results,
        },
        { status: 403 },
      );
    }

    // 2. Keystroke Hash Verification
    const hashResult = await verifyKeystrokeHash(body);
    results.push(hashResult);
    if (!hashResult.passed) {
      return NextResponse.json(
        {
          error: "Anti-cheat validation failed.",
          validation: results,
        },
        { status: 403 },
      );
    }

    // 3. Sanity Limits (fast check, run before expensive analysis)
    const sanityResult = sanityLimits(body);
    results.push(sanityResult);
    if (!sanityResult.passed) {
      return NextResponse.json(
        {
          error: "Anti-cheat validation failed.",
          validation: results,
        },
        { status: 403 },
      );
    }

    // 4. Replay Validation
    const replayResult = replayValidation(body);
    results.push(replayResult);
    if (!replayResult.passed) {
      return NextResponse.json(
        {
          error: "Anti-cheat validation failed.",
          validation: results,
        },
        { status: 403 },
      );
    }

    // 5. Statistical Variance Analysis
    const timingResult = statisticalAnalysis(body);
    results.push(timingResult);
    if (!timingResult.passed) {
      return NextResponse.json(
        {
          error: "Anti-cheat validation failed.",
          validation: results,
        },
        { status: 403 },
      );
    }

    // 6. Account History Check
    const historyResult = await checkAccountHistory(
      user.id,
      body.testStats.meanWpm,
    );
    results.push(historyResult);
    if (!historyResult.passed) {
      return NextResponse.json(
        {
          error: "Anti-cheat validation failed.",
          validation: results,
        },
        { status: 403 },
      );
    }

    // ─── All Checks Passed — Save to Database ─────────────────────────

    const { testStats, antiCheat } = body;

    const { error: insertError } = await supabaseAdmin.from("testData").insert([
      {
        user_id: user.id,
        testId: testStats.testId,
        testType: testStats.testType,
        testTypeValue: testStats.testTypeValue,
        meanWpm: testStats.meanWpm,
        meanRawWpm: testStats.meanRawWpm,
        accuracy: testStats.accuracy,
        testTime: testStats.testTime,
        charsTyped: testStats.charsTyped,
        correctChars: testStats.correctChars,
        incorrectChars: testStats.incorrectChars,
        extraChars: testStats.extraChars,
        statsPerSecond: testStats.statsPerSecond,
        characterStats: testStats.characterStats,
        antiCheatToken: antiCheat.token,
        keystrokeHash: antiCheat.keystrokeHash,
        antiCheatGeneratedAt: antiCheat.generatedAt,
        timingAnalysis: antiCheat.timingAnalysis,
      },
    ]);

    if (insertError) {
      console.error("Database insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save test result." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      validation: results,
    });
  } catch (err) {
    console.error("Error in submit-test:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
