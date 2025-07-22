"use client";

import { useTabStore } from "@/store";
import Image from "next/image";
import React from "react";

const Header: React.FC = () => {
  const { tab, setTab } = useTabStore((state) => state);
  return (
    <div className="flex justify-between items-center py-4 px-12">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-1">
          <Image src="/panda.svg" alt="icon" width={32} height={32} />
          <h1 className="text-2xl font-bold">Typing Panda</h1>
        </div>
        <div>
          <ul className="flex items-center text-xl gap-4">
            <li
              onClick={() => setTab("practice")}
              className={`${
                tab === "practice" && "text-cyan-1"
              } cursor-pointer hover:text-cyan-2`}
            >
              Practice
            </li>
            <li
              onClick={() => setTab("leaderboard")}
              className={`${
                tab === "leaderboard" && "text-cyan-1"
              } cursor-pointer hover:text-cyan-2`}
            >
              Leaderboard
            </li>
            <li
              className={`${
                tab === "about" && "text-cyan-1"
              } cursor-pointer hover:text-cyan-2`}
              onClick={() => setTab("about")}
            >
              About
            </li>
          </ul>
        </div>
      </div>
      <div>
        <ul className="flex items-center gap-4">
          <li>
            <Image src="/setting-white.svg" alt="icon" width={32} height={32} />
          </li>
          <li>
            <Image src="/profile-white.svg" alt="icon" width={32} height={32} />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
