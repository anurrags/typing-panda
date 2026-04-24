export interface NavTab {
  label: string;
  href: string;
}

export interface DropdownMenuItem {
  label: string;
  href?: string;
  iconPath: string;
  type: "link" | "action";
  variant?: "danger";
}

export const NAV_TABS: NavTab[] = [
  { label: "Practice", href: "/" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "About", href: "/about" },
];

export const PROFILE_ACTIVE_ROUTES = ["/profile", "/stats", "/settings"];

export const AUTHENTICATED_MENU_ITEMS: DropdownMenuItem[] = [
  {
    label: "Profile",
    href: "/profile",
    type: "link",
    iconPath:
      "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2@@M12 7 a4 4 0 1 0 0-0.01",
  },
  {
    label: "Stats",
    href: "/stats",
    type: "link",
    iconPath: "M4 21L4 10@@M12 21L12 4@@M20 21L20 14",
  },
  {
    label: "Settings",
    href: "/settings",
    type: "link",
    iconPath:
      "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z@@M12 12 a3 3 0 1 0 0-0.01",
  },
];

export const LOGOUT_MENU_ITEM: DropdownMenuItem = {
  label: "Logout",
  type: "action",
  variant: "danger",
  iconPath:
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4@@M16 17L21 12L16 7@@M21 12L9 12",
};

export const UNAUTHENTICATED_MENU_ITEM: DropdownMenuItem = {
  label: "Log In",
  href: "/auth",
  type: "link",
  iconPath: "M9 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9@@M13 12H5@@M10 7l5 5-5 5",
};
