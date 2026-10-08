"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { dispatch, newGame, type Command, type NewLife } from "./engine";
import type { GameState } from "./types";

interface GameStore {
  game: GameState | null;
  /** Username whose life is saved on this device, so accounts never see each other's saves. */
  owner: string | null;
  start: (life: NewLife, owner: string) => void;
  send: (cmd: Command) => void;
  /** Replace the local life with one from the cloud. */
  load: (game: GameState | null, owner: string) => void;
  reset: () => void;
}

const safeStorage = createJSONStorage(() => ({
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
}));

export const useGame = create<GameStore>()(
  persist(
    (set) => ({
      game: null,
      owner: null,
      start: (life, owner) => set({ game: newGame(life), owner }),
      send: (cmd) => set((s) => (s.game ? { game: dispatch(s.game, cmd) } : s)),
      load: (game, owner) => set({ game, owner }),
      reset: () => set({ game: null, owner: null }),
    }),
    {
      name: "nairobilife-save",
      version: 2,
      storage: safeStorage,
      skipHydration: true,
      // v1 saves predate the life-sim rewrite; start fresh.
      migrate: (persisted, version) => (version < 2 ? { game: null } : persisted) as GameStore,
    },
  ),
);
