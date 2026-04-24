"use client";

import React, { useEffect, useState } from "react";

import { useBannerStore } from "@/store/bannerStore";

const baseStyles = `fixed top-15 left-1/2 z-50 text-black max-w-[80vw] py-2 px-4 rounded-lg flex items-center justify-center shadow-md transform -translate-x-1/2 border-4`;

const typeStyles: Record<string, { gradient: string; emoji: string }> = {
  error: {
    gradient:
      "bg-gradient-to-r from-red-400 via-red-300 to-red-400 border-red-700",
    emoji: "❌",
  },
  warning: {
    gradient:
      "bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 border-yellow-700",
    emoji: "⚠️",
  },
  info: {
    gradient:
      "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 border-blue-700",
    emoji: "ℹ️",
  },
  success: {
    gradient:
      "bg-gradient-to-r from-green-500 via-green-400 to-green-500 border-green-700",
    emoji: "✅",
  },
};

const Banner = () => {
  const { text, type, time, showCloseButton, hideBanner } = useBannerStore();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

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
      };
    } else {
      setVisible(false);
      setExiting(false);
    }
  }, [text, hideBanner, time]);
  const animationClass = exiting ? "fade-slide-up" : "fade-slide-down";

  if (!text || !visible) return null;

  const { gradient, emoji } = typeStyles[type];

  return (
    <div
      className={`${baseStyles} ${gradient} ${animationClass} gap-3`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center justify-center">
        <span className="mr-2 text-xl">{emoji}</span>
        <span>{text}</span>
      </div>
      {showCloseButton && (
        <button
          onClick={handleClose}
          className="ml-2 flex-shrink-0 text-black/60 transition-colors hover:text-black focus:outline-none"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
};

export default Banner;
