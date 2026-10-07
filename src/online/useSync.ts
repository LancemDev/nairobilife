"use client";

import { useEffect, useRef } from "react";
import { CAREER } from "@/game/data";
import { netWorth, placeOf } from "@/game/engine";
import { useGame } from "@/game/store";
import { api } from "./api";
import { useOnline } from "./store";

const HEARTBEAT_MS = 30_000;
const SAVE_DEBOUNCE_MS = 8_000;

/**
 * Keeps an online player in sync: heartbeat (presence, unread count, incoming M-Pesa),
 * who's online per area, and a debounced cloud save. Pauses while the tab is hidden.
 */
export function useSync() {
  const me = useOnline((s) => s.me);
  const location = useGame((s) => s.game?.location);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!me) return;
    let stopped = false;

    const beat = async () => {
      const game = useGame.getState().game;
      if (!game || document.hidden) return;
      const place = placeOf(game);
      const job = game.job ? CAREER[game.job.career].levels[game.job.level].title : "Mwananchi";
      try {
        const res = await api.presence({ area: place.area, venue: game.location, title: job, money: Math.max(0, Math.round(game.money)), netWorth: netWorth(game) });
        if (stopped) return;
        useOnline.getState().setUnread(res.unread);
        if (res.incoming.length) {
          const { claimed } = await api.claim(res.incoming.map((t) => t.id));
          for (const t of claimed) useGame.getState().send({ type: "transferIn", from: t.from, amount: t.amount, note: t.note });
        }
        const counts = await api.online();
        if (!stopped) useOnline.getState().setAreaCounts(counts.areas);
      } catch (e) {
        if ((e as { status?: number }).status === 401) useOnline.getState().setMe(null);
      }
    };

    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    const onVisible = () => !document.hidden && beat();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [me]);

  // Tell the server promptly when we move, so the map stays fresh.
  useEffect(() => {
    if (!me || !location) return;
    const game = useGame.getState().game;
    if (!game) return;
    const place = placeOf(game);
    api.presence({ area: place.area, venue: game.location, title: "", money: Math.max(0, Math.round(game.money)), netWorth: netWorth(game) }).catch(() => {});
  }, [me, location]);

  // Debounced cloud save on every change, plus a last-chance save when the tab is hidden.
  useEffect(() => {
    if (!me) return;
    const flush = (keepalive = false) => {
      const game = useGame.getState().game;
      if (game) api.putSave(game, keepalive).catch(() => {});
    };
    const unsub = useGame.subscribe((s, prev) => {
      if (s.game === prev.game || !s.game) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => flush(), SAVE_DEBOUNCE_MS);
    });
    const onHide = () => document.hidden && flush(true);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", onHide);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [me]);
}
