import { create } from "zustand";

interface UserState {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  setUser: (firstName: string, lastName: string, username: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  firstName: null,
  lastName: null,
  username: null,

  setUser: (firstName, lastName, username) =>
    set({ firstName, lastName, username }, false),

  clearUser: () =>
    set({ firstName: null, lastName: null, username: null }, false),
}));
