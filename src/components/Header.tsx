"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

import ProfileImage from "@/assets/profile-white.svg";
import { supabase } from "@/lib/supabaseClient";
import {
  AUTHENTICATED_MENU_ITEMS,
  type DropdownMenuItem,
  LOGOUT_MENU_ITEM,
  NAV_TABS,
  PROFILE_ACTIVE_ROUTES,
  UNAUTHENTICATED_MENU_ITEM,
} from "@/modules/constants";
import { useAuth } from "@/modules/hooks";
import { getValidAvatarUrl } from "@/modules/util";
import { useUserStore } from "@/store";
import { useBannerStore } from "@/store/bannerStore";

/**
 * Renders an SVG icon from a compact path string.
 * Path segments are separated by "@@". Segments containing " a" (arc commands
 * used for circles) are rendered as <circle> elements; all others as <path>.
 */
const MenuIcon: React.FC<{ iconPath: string }> = ({ iconPath }) => (
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
    {iconPath.split("@@").map((segment, i) => {
      const s = segment.trim();
      // Detect circle shorthand: "Mcx cy a..."
      const circleMatch = s.match(
        /^M([\d.]+)\s+([\d.]+)\s+a([\d.]+)\s+([\d.]+)/,
      );
      if (circleMatch) {
        return (
          <circle
            key={i}
            cx={circleMatch[1]}
            cy={circleMatch[2]}
            r={circleMatch[3]}
          />
        );
      }
      // Detect line shorthand: "Mx1 y1Lx2 y2"
      const lineMatch = s.match(/^M([\d.]+)\s+([\d.]+)L([\d.]+)\s+([\d.]+)$/);
      if (lineMatch) {
        return (
          <line
            key={i}
            x1={lineMatch[1]}
            y1={lineMatch[2]}
            x2={lineMatch[3]}
            y2={lineMatch[4]}
          />
        );
      }
      return <path key={i} d={s} />;
    })}
  </svg>
);

/** A single item inside the profile dropdown menu. */
const DropdownItem: React.FC<{
  item: DropdownMenuItem;
  onClick: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}> = ({ item, onClick, isFirst, isLast }) => {
  const roundedClass = [isFirst && "rounded-t-md", isLast && "rounded-b-md"]
    .filter(Boolean)
    .join(" ");

  const baseClass = `flex items-center gap-3 px-4 py-2 text-sm transition-colors ${roundedClass}`;

  const colorClass =
    item.variant === "danger"
      ? "text-red-400 hover:bg-red-500 hover:text-white"
      : item.href === "/auth"
        ? "text-cyan-3 hover:bg-cyan-3 hover:text-white"
        : "text-gray-300 hover:bg-emerald-500 hover:text-gray-900";

  const className = `${baseClass} ${colorClass}`;

  if (item.type === "link" && item.href) {
    return (
      <Link href={item.href} onClick={onClick} className={className}>
        <MenuIcon iconPath={item.iconPath} />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={`${className} cursor-pointer`}>
      <MenuIcon iconPath={item.iconPath} />
      <span>{item.label}</span>
    </div>
  );
};

const Header: React.FC = () => {
  const pathname = usePathname();
  const { showBanner } = useBannerStore();
  const setUser = useUserStore((state) => state.setUser);
  const setAvatarUrl = useUserStore((state) => state.setAvatarUrl);
  const firstName = useUserStore((state) => state.firstName);
  const nickname = useUserStore((state) => state.nickname);
  const avatarUrl = useUserStore((state) => state.avatarUrl);
  const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [isDropdownLocked, setIsDropdownLocked] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const auth = useAuth();

  const isProfileActive = PROFILE_ACTIVE_ROUTES.includes(pathname);

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
          .select("firstName, username, lastName, nickname, avatar")
          .eq("user_id", auth.id)
          .single();
        if (profile) {
          setUser(
            profile.firstName,
            profile.lastName,
            profile.username,
            profile.nickname,
          );

          // Fetch avatar signed URL if the user has one
          if (profile.avatar) {
            const url = await getValidAvatarUrl(auth.id, profile.avatar);
            if (url) setAvatarUrl(url);
          }
        }
      }
    };
    fetchUserProfile();
  }, [auth, setUser, setAvatarUrl]);

  const dropdownItems: DropdownMenuItem[] = auth
    ? AUTHENTICATED_MENU_ITEMS
    : [UNAUTHENTICATED_MENU_ITEM];

  const handleProfileIconClick = () => {
    if (isDropdownLocked) {
      closeDropdown();
    } else {
      setIsDropdownLocked(true);
      setShowProfileOptions(true);
    }
  };

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
          <nav>
            <ul className="flex items-center gap-4 text-xl">
              {NAV_TABS.map((tab) => (
                <li
                  key={tab.href}
                  className={`${
                    pathname === tab.href ? "text-cyan-1" : ""
                  } hover:text-cyan-2 cursor-pointer`}
                >
                  <Link href={tab.href}>{tab.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
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
            {auth && avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className={`h-8 w-8 rounded-full object-cover outline outline-2 outline-offset-2 transition-all ${
                  isProfileActive
                    ? "outline-cyan-1"
                    : "hover:outline-cyan-2 outline-white"
                }`}
                onClick={handleProfileIconClick}
              />
            ) : (
              <ProfileImage
                className={`h-6 w-6 rounded-full transition-colors ${
                  isProfileActive
                    ? "stroke-cyan-1 outline-cyan-1 outline outline-2 outline-offset-4"
                    : "hover:stroke-cyan-2"
                }`}
                onClick={handleProfileIconClick}
              />
            )}
            {showProfileOptions && (
              <div className="absolute top-12 right-0 z-10 mt-2 w-36 rounded-md border border-gray-700 bg-[#2d2f35] shadow-lg group-hover:block">
                <div>
                  {dropdownItems.map((item, idx) => (
                    <DropdownItem
                      key={item.label}
                      item={item}
                      onClick={item.type === "action" ? logout : closeDropdown}
                      isFirst={idx === 0}
                      isLast={!auth || idx === dropdownItems.length - 1}
                    />
                  ))}
                  {auth && (
                    <>
                      <div className="my-1 border-t border-gray-700" />
                      <DropdownItem
                        item={LOGOUT_MENU_ITEM}
                        onClick={logout}
                        isLast
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
