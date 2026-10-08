"use client";

import { create } from "zustand";

export type Overlay = "map" | "phone" | "buy" | null;
export type PhoneApp = "messages" | "contacts" | "watu" | "profile" | "houses" | "mpesa" | "benki" | "chakula" | "kazi" | "mali" | "ndege" | "siasa" | "gist";

interface UiStore {
  overlay: Overlay;
  app: PhoneApp | null;
  /** Open conversation inside the Messages app. */
  chatWith: string | null;
  open: (overlay: Overlay) => void;
  /** Opens the phone on an app, optionally straight into a chat. */
  openApp: (app: PhoneApp | null, chatWith?: string | null) => void;
  setChat: (username: string | null) => void;
}

export const useUi = create<UiStore>()((set) => ({
  overlay: null,
  app: null,
  chatWith: null,
  open: (overlay) => set({ overlay }),
  openApp: (app, chatWith = null) => set({ overlay: "phone", app, chatWith }),
  setChat: (chatWith) => set({ chatWith }),
}));
