"use client";

import { create } from "zustand";
import { api, type Profile } from "./api";

interface OnlineStore {
  /** undefined while we check the session cookie; null when logged out. */
  me: Profile | null | undefined;
  unread: number;
  areaCounts: Record<string, number>;
  /** Player whose profile sheet is open, and the chat partner if a conversation is open. */
  viewing: string | null;
  chatWith: string | null;
  setMe: (me: Profile | null) => void;
  setUnread: (n: number) => void;
  setAreaCounts: (c: Record<string, number>) => void;
  view: (username: string | null) => void;
  chat: (username: string | null) => void;
  refresh: () => Promise<void>;
}

export const useOnline = create<OnlineStore>()((set) => ({
  me: undefined,
  unread: 0,
  areaCounts: {},
  viewing: null,
  chatWith: null,
  setMe: (me) => set({ me }),
  setUnread: (unread) => set({ unread }),
  setAreaCounts: (areaCounts) => set({ areaCounts }),
  view: (viewing) => set({ viewing }),
  chat: (chatWith) => set({ chatWith, viewing: null }),
  refresh: async () => {
    try {
      const { user } = await api.me();
      set({ me: user });
    } catch {
      set({ me: null });
    }
  },
}));
