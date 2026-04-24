"use client";

import React, { useEffect, useState } from "react";

import { useBannerStore } from "@/store/bannerStore";

const typeConfig: Record<
  string,
  { bg: string; border: string; icon: React.ReactNode; accent: string }
> = {
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    accent: "text-red-400",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/40",
    accent: "text-yellow-400",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/40",
    accent: "text-blue-400",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/40",
    accent: "text-emerald-400",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
};

const Banner = () => {
  const { text, type, time, showCloseButton, hideBanner } = useBannerStore();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      hideBanner();
      setVisible(false);
      setExiting(false);
    }, 300);
  };

  useEffect(() => {
    if (text) {
      setVisible(true);
      setProgress(100);

      // Animate progress bar
      const startTime = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / time) * 100);
        setProgress(remaining);
        if (remaining <= 0) clearInterval(progressInterval);
      }, 30);

      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          hideBanner();
          setVisible(false);
          setExiting(false);
        }, 300);
      }, time);

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
      };
    } else {
      setVisible(false);
      setExiting(false);
    }
  }, [text, hideBanner, time]);

  if (!text || !visible) return null;

  const config = typeConfig[type];
  const animationClass = exiting ? "fade-slide-up" : "fade-slide-down";

  return (
    <div
      className={`fixed top-16 left-1/2 z-50 -translate-x-1/2 ${animationClass}`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`${config.bg} ${config.border} relative max-w-[80vw] min-w-[300px] overflow-hidden rounded-xl border shadow-lg shadow-black/30 backdrop-blur-md`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className={`${config.accent} flex-shrink-0`}>
            {config.icon}
          </span>
          <span className="text-sm font-medium text-gray-200">{text}</span>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="ml-auto flex-shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-300 focus:outline-none"
              aria-label="Close"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        {/* Progress bar */}
        <div className="h-[2px] w-full bg-white/5">
          <div
            className={`h-full ${config.accent.replace("text-", "bg-")} transition-none`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;
