"use client";

import { iconName } from "@/game/icons";
import { ICONS } from "./icons";

/** Tabler icon by name, or by one of the game's emoji ids (data still keys things by emoji). */
export function Icon({ name, emoji, size = 20, stroke = 1.75, className = "" }: { name?: string; emoji?: string; size?: number; stroke?: number; className?: string }) {
  const Cmp = ICONS[name ?? iconName(emoji)] ?? ICONS["circle-dot"];
  return <Cmp size={size} stroke={stroke} className={`shrink-0 ${className}`} aria-hidden />;
}
