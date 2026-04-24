"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import ProfileImage from "@/assets/profile-white.svg";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/modules/hooks";
import { useUserStore } from "@/store";
import { useBannerStore } from "@/store/bannerStore";

const Header: React.FC = () => {
  const pathname = usePathname();
  const { showBanner } = useBannerStore();
  const setUser = useUserStore((state) => state.setUser);
  const firstName = useUserStore((state) => state.firstName);
  const nickname = useUserStore((state) => state.nickname);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [isDropdownLocked, setIsDropdownLocked] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();

  const closeDropdown = () => {
    setIsDropdownLocked(false);
    setShowProfileOptions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (isDropdownLocked) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownLocked]);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function logout() {
    closeDropdown();
    const { error } = await supabase.auth.signOut();
    if (error) {
      showBanner("Failed to log out. Please try again.", "error", 5000, true);
    } else {
      showBanner("You have been logged out successfully.", "success", 5000);
    }
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth) {
        const { data: profile } = await supabase
          .from("Profile")
          .select("firstName, username, lastName, nickname")
          .eq("user_id", auth.id)
          .single();
        if (profile)
          setUser(
            profile.firstName,
            profile.lastName,
            profile.username,
            profile.nickname,
          );
      }
    };
    fetchUserProfile();
  }, [auth, setUser]);

  return (
    <div
      className={`${scrolled && "bg-background"} fixed top-0 right-0 left-0 z-50 flex w-full justify-center px-4 pt-4`}
    >
      <div
        className={`${
          scrolled ? "bg-background" : "bg-dark-1 rounded-lg"
        } max-auto flex w-full items-center justify-between px-12`}
      >
        <div className="flex items-center gap-12 py-4">
          <Link href={"/"} className="flex items-center gap-1">
            <Image src="/panda.svg" alt="icon" width={32} height={32} />
            <h1 className="text-2xl font-bold">Typing Panda</h1>
          </Link>
          <div>
            <ul className="flex items-center gap-4 text-xl">
              <li
                className={`${
                  pathname === "/" ? "text-cyan-1" : ""
                } hover:text-cyan-2 cursor-pointer`}
              >
                <Link href="/">Practice</Link>
              </li>
              <li
                className={`${
                  pathname === "/leaderboard" ? "text-cyan-1" : ""
                } hover:text-cyan-2 cursor-pointer`}
              >
                <Link href="/leaderboard">Leaderboard</Link>
              </li>
              <li
                className={`${
                  pathname === "/about" ? "text-cyan-1" : ""
                } hover:text-cyan-2 cursor-pointer`}
              >
                <Link href="/about">About</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {auth && (nickname || firstName) && (
            <span className="mr-4 text-white">
              Hello, {nickname || firstName}!
            </span>
          )}
          <div
            ref={dropdownRef}
            className="relative cursor-pointer py-4"
            onMouseEnter={() => setShowProfileOptions(true)}
            onMouseLeave={() => {
              if (!isDropdownLocked) {
                setShowProfileOptions(false);
              }
            }}
          >
            <ProfileImage
              className={`h-6 w-6 rounded-full transition-colors ${
                ["/profile", "/stats", "/settings"].includes(pathname)
                  ? "stroke-cyan-1 outline-cyan-1 outline outline-2 outline-offset-4"
                  : "hover:stroke-cyan-2"
              }`}
              onClick={() => {
                if (isDropdownLocked) {
                  closeDropdown();
                } else {
                  setIsDropdownLocked(true);
                  setShowProfileOptions(true);
                }
              }}
            />
            {showProfileOptions && (
              <div className="absolute top-12 right-0 z-10 mt-2 w-36 rounded-md border border-gray-700 bg-[#2d2f35] shadow-lg group-hover:block">
                {auth ? (
                  <div>
                    <Link
                      href="/profile"
                      onClick={closeDropdown}
                      className="flex items-center gap-3 rounded-t-md px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500 hover:text-gray-900"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/stats"
                      onClick={closeDropdown}
                      className="flex items-center gap-3 rounded-t-md px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500 hover:text-gray-900"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <line x1="4" y1="21" x2="4" y2="10" />
                        <line x1="12" y1="21" x2="12" y2="4" />
                        <line x1="20" y1="21" x2="20" y2="14" />
                      </svg>

                      <span>Stats</span>
                    </Link>
                    <Link
                      href="/settings"
                      onClick={closeDropdown}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-emerald-500 hover:text-gray-900"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Settings</span>
                    </Link>
                    <div className="my-1 border-t border-gray-700"></div>
                    <div
                      className="flex items-center gap-3 rounded-b-md px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500 hover:text-white"
                      onClick={logout}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Logout</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Link
                      href={"/auth"}
                      onClick={closeDropdown}
                      className="text-cyan-3 hover:bg-cyan-3 flex items-center gap-3 rounded-md p-2 text-sm transition-colors hover:text-white"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9" />

                        <path d="M13 12H5" />

                        <path d="M10 7l5 5-5 5" />
                      </svg>

                      <span>Log In</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
