"use client";
import { TypingTest } from "@/components";

export default function Home() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4 font-bold">Typing Test</h1>
        <TypingTest />
      </div>
    </div>
  );
}
