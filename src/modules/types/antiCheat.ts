/**
 * Anti-cheat type definitions
 * Modeled after MonkeyType's frontend anti-cheat approach
 */

export interface KeystrokeEvent {
  /** The key that was pressed */
  key: string;
  /** High-resolution timestamp (performance.now()) when the key was pressed */
  timestamp: number;
  /** Whether the browser flagged this event as trusted (physical keypress) */
  isTrusted: boolean;
}

export interface AntiCheatFlags {
  /** Number of paste attempts detected during the test */
  pasteAttempts: number;
  /** Number of untrusted (synthetic) keystroke events detected */
  untrustedKeyEvents: number;
  /** Number of times the typing area lost focus during the test */
  focusLossCount: number;
  /** Total milliseconds the test area was unfocused */
  totalUnfocusedMs: number;
  /** Whether automation tools were detected (e.g. webdriver) */
  automationDetected: boolean;
  /** Whether the test was invalidated by any anti-cheat rule */
  isInvalidated: boolean;
  /** Human-readable reason for invalidation, if any */
  invalidationReason: string | null;
}

export interface KeystrokeTimingAnalysis {
  /** Full array of inter-key intervals in milliseconds */
  intervals: number[];
  /** Mean inter-key interval */
  meanInterval: number;
  /** Standard deviation of inter-key intervals */
  stdDeviation: number;
  /** Coefficient of variation (stdDev / mean) — bots tend to have very low CV */
  coefficientOfVariation: number;
  /** Count of suspiciously identical consecutive intervals (< 2ms difference) */
  suspiciouslyUniformCount: number;
  /** Whether timing patterns appear bot-like */
  isSuspicious: boolean;
}

export interface AntiCheatPayload {
  /** Anti-cheat token (HMAC signature of the test data) */
  token: string;
  /** Hash of the keystroke timing array for integrity verification */
  keystrokeHash: string;
  /** Timestamp when the payload was generated */
  generatedAt: number;
  /** Anti-cheat flags summary */
  flags: AntiCheatFlags;
  /** Keystroke timing analysis summary (individual keystrokes are NOT sent) */
  timingAnalysis: KeystrokeTimingAnalysis;
}

export interface AntiCheatState {
  /** Full keystroke event log (kept client-side only) */
  keystrokeLog: KeystrokeEvent[];
  /** Current anti-cheat violation flags */
  flags: AntiCheatFlags;
  /** Whether the anti-cheat system is actively monitoring */
  isMonitoring: boolean;
}
