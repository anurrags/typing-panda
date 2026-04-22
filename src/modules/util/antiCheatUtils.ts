/**
 * Anti-cheat utility functions
 * Handles keystroke timing analysis, payload hashing/signing, and automation detection.
 */

import {
  AntiCheatFlags,
  AntiCheatPayload,
  KeystrokeEvent,
  KeystrokeTimingAnalysis,
} from "@/modules/types";
import { TestStats } from "@/modules/types";

// ─── Keystroke Timing Analysis ───────────────────────────────────────────────

/**
 * Analyzes an array of keystroke events for bot-like patterns.
 * Bots/macros tend to have extremely uniform timing between keystrokes,
 * while humans have natural variation.
 */
export function analyzeKeystrokeTiming(
  keystrokes: KeystrokeEvent[],
): KeystrokeTimingAnalysis {
  if (keystrokes.length < 2) {
    return {
      intervals: [],
      meanInterval: 0,
      stdDeviation: 0,
      coefficientOfVariation: 0,
      suspiciouslyUniformCount: 0,
      isSuspicious: false,
    };
  }

  // Calculate inter-key intervals
  const intervals: number[] = [];
  for (let i = 1; i < keystrokes.length; i++) {
    intervals.push(keystrokes[i].timestamp - keystrokes[i - 1].timestamp);
  }

  // Mean
  const sum = intervals.reduce((a, b) => a + b, 0);
  const meanInterval = sum / intervals.length;

  // Standard deviation
  const squaredDiffs = intervals.map((x) => Math.pow(x - meanInterval, 2));
  const avgSquaredDiff =
    squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const stdDeviation = Math.sqrt(avgSquaredDiff);

  // Coefficient of variation
  const coefficientOfVariation =
    meanInterval === 0 ? 0 : stdDeviation / meanInterval;

  // Count suspiciously uniform consecutive intervals (< 2ms apart)
  let suspiciouslyUniformCount = 0;
  for (let i = 1; i < intervals.length; i++) {
    if (Math.abs(intervals[i] - intervals[i - 1]) < 2) {
      suspiciouslyUniformCount++;
    }
  }

  // Flag as suspicious if:
  // 1. Coefficient of variation is extremely low (< 0.1 = nearly robotic uniformity)
  // 2. More than 40% of consecutive intervals are nearly identical
  // 3. Mean interval is impossibly fast (< 30ms = 2000+ CPM, superhuman)
  const uniformRatio = suspiciouslyUniformCount / intervals.length;
  const isSuspicious =
    (coefficientOfVariation < 0.1 && intervals.length > 10) ||
    uniformRatio > 0.4 ||
    meanInterval < 30;

  return {
    intervals,
    meanInterval: Math.round(meanInterval * 100) / 100,
    stdDeviation: Math.round(stdDeviation * 100) / 100,
    coefficientOfVariation: Math.round(coefficientOfVariation * 1000) / 1000,
    suspiciouslyUniformCount,
    isSuspicious,
  };
}

// ─── Automation Detection ────────────────────────────────────────────────────

/**
 * Detects common browser automation tools (Selenium, Puppeteer, Playwright, etc.)
 * by checking for well-known global properties they inject.
 */
export function detectAutomation(): boolean {
  if (typeof window === "undefined") return false;

  const nav = navigator as unknown as Record<string, unknown>;

  // Check for webdriver flag (Selenium, Puppeteer, Playwright all set this)
  if (nav.webdriver === true) return true;

  const win = window as unknown as Record<string, unknown>;

  // Check for common automation signatures
  const automationSignatures = [
    "__webdriver_evaluate",
    "__selenium_evaluate",
    "__webdriver_script_function",
    "__webdriver_script_func",
    "__webdriver_script_fn",
    "__fxdriver_evaluate",
    "__driver_unwrapped",
    "__webdriver_unwrapped",
    "__driver_evaluate",
    "__selenium_unwrapped",
    "__fxdriver_unwrapped",
    "_phantom",
    "__nightmare",
    "_selenium",
    "callPhantom",
    "callSelenium",
    "_Recaptcha",
    "domAutomation",
    "domAutomationController",
  ];

  for (const sig of automationSignatures) {
    if (sig in win) return true;
  }

  // Check for Puppeteer/Playwright-specific chrome runtime
  if (
    win.chrome &&
    typeof win.chrome === "object" &&
    (win.chrome as Record<string, unknown>).runtime === undefined &&
    Object.keys(win.chrome as object).length === 0
  ) {
    return true;
  }

  return false;
}

// ─── Payload Hashing & Signing ───────────────────────────────────────────────

/**
 * Generates a SHA-256 hash of the given string using the Web Crypto API.
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates an HMAC-SHA256 signature using the Web Crypto API.
 */
async function hmacSha256(key: string, message: string): Promise<string> {
  const keyBuffer = new TextEncoder().encode(key);
  const msgBuffer = new TextEncoder().encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgBuffer);
  const sigArray = Array.from(new Uint8Array(signature));
  return sigArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Creates a signed anti-cheat payload for a completed test.
 * This hashes the test results + keystroke data together so that
 * modifying any value in transit will invalidate the signature.
 */
export async function createAntiCheatPayload(
  testStats: TestStats,
  keystrokes: KeystrokeEvent[],
  flags: AntiCheatFlags,
): Promise<AntiCheatPayload> {
  const timingAnalysis = analyzeKeystrokeTiming(keystrokes);
  const generatedAt = Date.now();

  // Build a deterministic string of the critical test data
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
    generatedAt,
  ].join("|");

  // Hash the keystroke timestamps for integrity
  const keystrokeString = keystrokes
    .map((k) => `${k.key}:${k.timestamp.toFixed(2)}:${k.isTrusted}`)
    .join(",");
  const keystrokeHash = await sha256(keystrokeString);

  // Create HMAC token signing the test data + keystroke hash + flags
  const signingPayload = [
    testDataString,
    keystrokeHash,
    flags.pasteAttempts,
    flags.untrustedKeyEvents,
    flags.focusLossCount,
    flags.automationDetected,
    timingAnalysis.isSuspicious,
  ].join("|");

  // Use a client-side secret key (in production this would be
  // an environment variable or fetched from the server at test start)
  const secretKey = `tp_ac_${testStats.testId}_${generatedAt}`;
  const token = await hmacSha256(secretKey, signingPayload);

  return {
    token,
    keystrokeHash,
    generatedAt,
    flags,
    timingAnalysis: {
      ...timingAnalysis,
      // Don't send the raw intervals array to keep payload small
      intervals: [],
    },
  };
}

// ─── Invalidation Logic ──────────────────────────────────────────────────────

/**
 * Determines whether a test should be invalidated based on anti-cheat flags
 * and keystroke timing analysis.
 */
export function shouldInvalidateTest(
  flags: AntiCheatFlags,
  timingAnalysis: KeystrokeTimingAnalysis,
): { isInvalid: boolean; reason: string | null } {
  if (flags.pasteAttempts > 0) {
    return {
      isInvalid: true,
      reason: "Paste detected — test invalidated.",
    };
  }

  if (flags.untrustedKeyEvents > 5) {
    return {
      isInvalid: true,
      reason: "Synthetic key events detected — test invalidated.",
    };
  }

  if (flags.automationDetected) {
    return {
      isInvalid: true,
      reason: "Browser automation detected — test invalidated.",
    };
  }

  if (timingAnalysis.isSuspicious) {
    return {
      isInvalid: true,
      reason: "Inhuman keystroke patterns detected — test invalidated.",
    };
  }

  // Allow some focus loss (alt-tabbing once or twice is normal)
  // but invalidate if they were unfocused for >10 seconds total
  if (flags.totalUnfocusedMs > 10000) {
    return {
      isInvalid: true,
      reason: "Extended focus loss detected — test invalidated.",
    };
  }

  return { isInvalid: false, reason: null };
}
