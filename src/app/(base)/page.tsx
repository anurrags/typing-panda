"use client";
import { TestDuration, TypingTest } from "@/components";

export default function Home() {
  return (
    <div className="flex h-[90vh] flex-col items-center justify-center gap-8">
      <TestDuration />
      <div className="border-cyan-2 bg-dark-1 relative w-[80vw] rounded-lg border px-6 py-12 shadow-lg">
        <img
          src="/panda-bg-image.png"
          alt="panda-bg-image"
          className="fixed -top-20 -left-30 -z-10 w-[80vh] object-cover"
        />

        <TypingTest />
      </div>
    </div>
  );
}
