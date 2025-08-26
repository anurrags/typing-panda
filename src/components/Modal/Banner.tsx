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
  const { text, type, time, hideBanner } = useBannerStore();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

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
      className={`${baseStyles} ${gradient} ${animationClass}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="mr-2 text-xl">{emoji}</span>
      <span>{text}</span>
    </div>
  );
};

export default Banner;
