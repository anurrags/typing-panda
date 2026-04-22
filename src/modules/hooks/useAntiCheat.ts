/**
 * useAntiCheat — React hook for MonkeyType-style frontend anti-cheat.
 *
 * Monitors for:
 * 1. Paste events (Ctrl+V / Cmd+V / right-click paste)
 * 2. Untrusted (synthetic) keyboard events
 * 3. Focus/blur tracking with duration measurement
 * 4. Full keystroke timing recording
 * 5. Browser automation detection
 *
 * Usage:
 *   const antiCheat = useAntiCheat(containerRef, { isActive: testStarted && !testEnded });
 *   // In keydown handler: antiCheat.recordKeystroke(event);
 *   // On test end: const payload = await antiCheat.generatePayload(testStats);
 */

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AntiCheatFlags,
  AntiCheatPayload,
  AntiCheatState,
  KeystrokeEvent,
} from "@/modules/types";
import { TestStats } from "@/modules/types";
import {
  analyzeKeystrokeTiming,
  createAntiCheatPayload,
  detectAutomation,
  shouldInvalidateTest,
} from "@/modules/util/antiCheatUtils";

interface UseAntiCheatOptions {
  /** Whether the anti-cheat system should be actively monitoring */
  isActive: boolean;
  /** Callback fired when the test is invalidated */
  onInvalidation?: (reason: string) => void;
}

interface UseAntiCheatReturn {
  /** Record a keystroke event (call this from your keydown handler) */
  recordKeystroke: (event: KeyboardEvent) => boolean;
  /** Generate the signed anti-cheat payload for submission */
  generatePayload: (testStats: TestStats) => Promise<AntiCheatPayload>;
  /** Current anti-cheat flags (read-only) */
  flags: AntiCheatFlags;
  /** Whether the test has been invalidated */
  isInvalidated: boolean;
  /** Invalidation reason, if any */
  invalidationReason: string | null;
  /** Reset all anti-cheat state (call on test restart) */
  reset: () => void;
}

const INITIAL_FLAGS: AntiCheatFlags = {
  pasteAttempts: 0,
  untrustedKeyEvents: 0,
  focusLossCount: 0,
  totalUnfocusedMs: 0,
  automationDetected: false,
  isInvalidated: false,
  invalidationReason: null,
};

export function useAntiCheat(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseAntiCheatOptions,
): UseAntiCheatReturn {
  const { isActive, onInvalidation } = options;

  const [state, setState] = useState<AntiCheatState>({
    keystrokeLog: [],
    flags: { ...INITIAL_FLAGS },
    isMonitoring: false,
  });

  // Use refs for high-frequency updates to avoid re-render storms
  const keystrokeLogRef = useRef<KeystrokeEvent[]>([]);
  const flagsRef = useRef<AntiCheatFlags>({ ...INITIAL_FLAGS });
  const blurTimestampRef = useRef<number | null>(null);
  const isActiveRef = useRef(isActive);

  // Keep the ref in sync
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // ─── Automation Detection (run once on mount) ─────────────────────────────
  useEffect(() => {
    const isAutomated = detectAutomation();
    if (isAutomated) {
      flagsRef.current = {
        ...flagsRef.current,
        automationDetected: true,
        isInvalidated: true,
        invalidationReason: "Browser automation detected — test invalidated.",
      };
      setState((prev) => ({
        ...prev,
        flags: { ...flagsRef.current },
      }));
      onInvalidation?.("Browser automation detected — test invalidated.");
    }
  }, [onInvalidation]);

  // ─── Paste Prevention ─────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isActiveRef.current) return;

      flagsRef.current = {
        ...flagsRef.current,
        pasteAttempts: flagsRef.current.pasteAttempts + 1,
        isInvalidated: true,
        invalidationReason: "Paste detected — test invalidated.",
      };
      setState((prev) => ({
        ...prev,
        flags: { ...flagsRef.current },
      }));
      onInvalidation?.("Paste detected — test invalidated.");
    };

    // Block paste on the container and the entire document
    container.addEventListener("paste", handlePaste, true);
    document.addEventListener("paste", handlePaste, true);

    return () => {
      container.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("paste", handlePaste, true);
    };
  }, [containerRef, onInvalidation]);

  // ─── Right-click Context Menu Prevention ──────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      if (isActiveRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    container.addEventListener("contextmenu", handleContextMenu, true);

    return () => {
      container.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [containerRef]);

  // ─── Focus / Blur Tracking ────────────────────────────────────────────────
  // Use a ref for onInvalidation to avoid re-registering listeners when it changes
  const onInvalidationRef = useRef(onInvalidation);
  useEffect(() => {
    onInvalidationRef.current = onInvalidation;
  }, [onInvalidation]);

  useEffect(() => {
    if (!isActive) return;

    const handleBlur = () => {
      if (!isActiveRef.current) return;
      blurTimestampRef.current = performance.now();

      flagsRef.current = {
        ...flagsRef.current,
        focusLossCount: flagsRef.current.focusLossCount + 1,
      };
      setState((prev) => ({
        ...prev,
        flags: { ...flagsRef.current },
      }));
    };

    const handleFocus = () => {
      if (blurTimestampRef.current !== null) {
        const unfocusedDuration = performance.now() - blurTimestampRef.current;
        blurTimestampRef.current = null;

        const newTotalUnfocused =
          flagsRef.current.totalUnfocusedMs + unfocusedDuration;

        flagsRef.current = {
          ...flagsRef.current,
          totalUnfocusedMs: newTotalUnfocused,
        };

        // Live check: invalidate if total unfocused time exceeds 10 seconds
        if (newTotalUnfocused > 10000 && !flagsRef.current.isInvalidated) {
          const reason = "Extended focus loss detected — test invalidated.";
          flagsRef.current = {
            ...flagsRef.current,
            isInvalidated: true,
            invalidationReason: reason,
          };
          setState((prev) => ({
            ...prev,
            flags: { ...flagsRef.current },
          }));
          onInvalidationRef.current?.(reason);
          return;
        }

        setState((prev) => ({
          ...prev,
          flags: { ...flagsRef.current },
        }));
      }
    };

    // Track both window-level blur (alt-tab) and document visibility changes
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isActive]);

  // ─── Keystroke Recording ──────────────────────────────────────────────────
  const recordKeystroke = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!isActiveRef.current) return true;

      // Check isTrusted flag
      if (!event.isTrusted) {
        flagsRef.current = {
          ...flagsRef.current,
          untrustedKeyEvents: flagsRef.current.untrustedKeyEvents + 1,
        };

        if (flagsRef.current.untrustedKeyEvents > 5) {
          flagsRef.current = {
            ...flagsRef.current,
            isInvalidated: true,
            invalidationReason:
              "Synthetic key events detected — test invalidated.",
          };
          setState((prev) => ({
            ...prev,
            flags: { ...flagsRef.current },
          }));
          onInvalidation?.("Synthetic key events detected — test invalidated.");
        }

        // Drop the untrusted event
        return false;
      }

      // Record the keystroke with high-resolution timing
      const keystrokeEvent: KeystrokeEvent = {
        key: event.key,
        timestamp: performance.now(),
        isTrusted: event.isTrusted,
      };

      keystrokeLogRef.current.push(keystrokeEvent);

      return true;
    },
    [onInvalidation],
  );

  // ─── Payload Generation ───────────────────────────────────────────────────
  const generatePayload = useCallback(
    async (testStats: TestStats): Promise<AntiCheatPayload> => {
      // Finalize focus tracking (in case they're still unfocused)
      if (blurTimestampRef.current !== null) {
        const unfocusedDuration = performance.now() - blurTimestampRef.current;
        blurTimestampRef.current = null;
        flagsRef.current = {
          ...flagsRef.current,
          totalUnfocusedMs:
            flagsRef.current.totalUnfocusedMs + unfocusedDuration,
        };
      }

      // Run timing analysis
      const timingAnalysis = analyzeKeystrokeTiming(keystrokeLogRef.current);

      // Check for invalidation
      const { isInvalid, reason } = shouldInvalidateTest(
        flagsRef.current,
        timingAnalysis,
      );

      if (isInvalid) {
        flagsRef.current = {
          ...flagsRef.current,
          isInvalidated: true,
          invalidationReason: reason,
        };
      }

      // Sync state one final time
      setState((prev) => ({
        ...prev,
        keystrokeLog: [...keystrokeLogRef.current],
        flags: { ...flagsRef.current },
      }));

      // Generate the signed payload
      const payload = await createAntiCheatPayload(
        testStats,
        keystrokeLogRef.current,
        flagsRef.current,
      );

      return payload;
    },
    [],
  );

  // ─── Reset ────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    keystrokeLogRef.current = [];
    flagsRef.current = { ...INITIAL_FLAGS };
    blurTimestampRef.current = null;
    setState({
      keystrokeLog: [],
      flags: { ...INITIAL_FLAGS },
      isMonitoring: false,
    });
  }, []);

  return {
    recordKeystroke,
    generatePayload,
    flags: state.flags,
    isInvalidated: state.flags.isInvalidated,
    invalidationReason: state.flags.invalidationReason,
    reset,
  };
}
