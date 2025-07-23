"use client";

import { useTabStore } from "@/store";
import React from "react";
import Image from "next/image";
import ProfileImage from "@/assets/profile-white.svg";
import SettingImage from "@/assets/setting-white.svg";

const Header: React.FC = () => {
  const { tab, setTab } = useTabStore((state) => state);
  return (
    <div className="flex items-center justify-between px-12 py-4">
      <div className="flex items-center gap-12">
        <div className="flex items-center gap-1">
          <Image src="/panda.svg" alt="icon" width={32} height={32} />
          <h1 className="text-2xl font-bold">Typing Panda</h1>
        </div>
        <div>
          <ul className="flex items-center gap-4 text-xl">
            <li
              onClick={() => setTab("practice")}
              className={`${
                tab === "practice" && "text-cyan-1"
              } hover:text-cyan-2 cursor-pointer`}
            >
              Practice
            </li>
            <li
              onClick={() => setTab("leaderboard")}
              className={`${
                tab === "leaderboard" && "text-cyan-1"
              } hover:text-cyan-2 cursor-pointer`}
            >
              Leaderboard
            </li>
            <li
              className={`${
                tab === "about" && "text-cyan-1"
              } hover:text-cyan-2 cursor-pointer`}
              onClick={() => setTab("about")}
            >
              About
            </li>
          </ul>
        </div>
      </div>
      <div>
        <ul className="flex items-center gap-4">
          <li className="cursor-pointer">
            <SettingImage className="hover:stroke-cyan-2 h-6 w-6" />
          </li>
          <li className="cursor-pointer">
            <ProfileImage className="hover:stroke-cyan-2 h-6 w-6" />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
