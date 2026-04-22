import { create } from "zustand";

interface UserState {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  nickname: string | null;
  setUser: (
    firstName: string | null,
    lastName: string | null,
    username: string | null,
    nickname: string | null,
  ) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  firstName: null,
  lastName: null,
  username: null,
  nickname: null,

  setUser: (firstName, lastName, username, nickname) =>
    set({ firstName, lastName, username, nickname }, false),

  clearUser: () =>
    set(
      { firstName: null, lastName: null, username: null, nickname: null },
      false,
    ),
}));
