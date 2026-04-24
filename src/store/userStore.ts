import { create } from "zustand";

interface UserState {
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  setUser: (
    firstName: string | null,
    lastName: string | null,
    username: string | null,
    nickname: string | null,
  ) => void;
  setAvatarUrl: (url: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  firstName: null,
  lastName: null,
  username: null,
  nickname: null,
  avatarUrl: null,

  setUser: (firstName, lastName, username, nickname) =>
    set({ firstName, lastName, username, nickname }, false),

  setAvatarUrl: (avatarUrl) => set({ avatarUrl }, false),

  clearUser: () =>
    set(
      {
        firstName: null,
        lastName: null,
        username: null,
        nickname: null,
        avatarUrl: null,
      },
      false,
    ),
}));
