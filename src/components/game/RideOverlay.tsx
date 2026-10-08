"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import type { RideCam, RideKind } from "@/world/RideScene";
import { liveryFor } from "@/world/liveries";
import { Icon } from "./Icon";
import { useUi } from "./uiStore";

const RideScene = dynamic(() => import("@/world/RideScene"), { ssr: false });

const LINES: Record<RideKind, string[]> = {
  matatu: [
    "Makanga anagonga mlango: \"Shika mbele, shika mbele, kuna nafasi!\"",
    "\"Fare ni jongo! Lipa kabla tufike stage.\" You send it on M-Sape.",
    "The dere overlaps on Mombasa Road. Everyone holds the seat in front.",
    "Hessy at the roundabout. The makanga hops off, has a word, hops back on.",
    "Gengetone on the debe, then amapiano. Nobody complains.",
    "A hawker squeezes in at the stage: sweets, chargers, Bible verses.",
  ],
  boda: [
    "\"Boss, shika hapa vizuri.\" There's no second helmet. There never is.",
    "Your rider takes the pavement past a jam of nganyas.",
    "A shortcut through a petrol station. Classic boda.",
    "\"Umesikia hiyo ya wantam?\" Your rider wants to talk politics at 60 km/h.",
    "Hessy ahead. Your rider takes a choch you didn't know existed.",
  ],
  cab: ["The driver wants to talk about fuel prices.", "Lingala on the radio, AC on full.", "\"Boss, utanipea five stars, sindio?\"", "The driver takes the Expressway. The toll goes on your fare."],
  car: ["Hooting at the roundabout. Nairobi traffic, as usual.", "A hawker taps on your window with phone chargers.", "Smooth on the Expressway. Worth the toll.", "A nganya cuts in. You let it go. You always let it go."],
  walk: ["A hawker offers you socks, shades and a charger.", "The smell of roasting maize follows you down the street.", "You dodge a boda on the pavement. Twice.", "Kirende ya watu at the stage. You squeeze through."],
  plane: ["Tea and biscuits from the cabin crew.", "Clouds below, the Rift Valley beneath them.", "\"Cabin crew, prepare for landing.\""],
  train: ["Giraffes in Tsavo. Everyone rushes to the window.", "The first-class trolley comes round with samosas.", "Elephants by a waterhole. Phones out."],
};

/** Extra lines inside a nganya, where the ride itself is the show. */
const NGANYA_LINES = [
  "The screen up front plays a gengetone video. The whole nganya sings along.",
  "LEDs pulse to the bass. Someone films a TikTok in the back seat.",
  "\"Hii ni warena!\" The makanga turns the debe up another notch.",
  "Bucket seats, Wi-Fi and a DJ mix. This is why you waited for this one.",
];

const KIND_ICON: Record<RideKind, string> = { matatu: "bus", boda: "motorbike", cab: "car", car: "car", walk: "walk", plane: "plane", train: "train" };

/** A short 3D ride between places. Finishing (or skipping) completes the trip; turning back cancels it. */
export default function RideOverlay() {
  const ride = useUi((st) => st.ride)!;
  const startRide = useUi((st) => st.startRide);
  const send = useGame((st) => st.send);
  const look = useGame((st) => st.game?.player.look);
  const [cam, setCam] = useState<RideCam>("chase");
  const [elapsed, setElapsed] = useState(0);
  const total = Math.max(6, Math.min(16, ride.minutes / 5));
  const done = useRef(false);
  // On a nganya route you get a nganya; elsewhere it's a plain 14-seater.
  const [livery] = useState(() => (ride.kind === "matatu" && ride.areas ? (liveryFor(ride.areas[1], ride.minutes) ?? liveryFor(ride.areas[0], ride.minutes)) : null));

  const finish = () => {
    if (done.current) return;
    done.current = true;
    send(ride.finish);
    startRide(null);
  };

  // The trip clock starts once the scene is on screen, not while it loads.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ready) return;
    const start = performance.now();
    const id = setInterval(() => setElapsed(Math.min(total, (performance.now() - start) / 1000)), 200);
    return () => clearInterval(id);
  }, [ready, total]);
  useEffect(() => {
    if (elapsed >= total) queueMicrotask(finish);
  });

  const left = Math.max(0, Math.ceil(total - elapsed));
  const lines = livery ? [...NGANYA_LINES, ...LINES.matatu] : LINES[ride.kind];
  const line = lines[Math.floor(elapsed / 4) % lines.length];
  return (
    <div className="absolute inset-0 z-40 bg-[#cfe3f0]">
      <RideScene kind={ride.kind} cam={cam} look={look} livery={livery} onReady={() => setReady(true)} />
      <div className="absolute left-3 top-16 w-[min(340px,calc(100vw-24px))] rounded-3xl bg-foreground/85 p-4 text-white shadow-2xl backdrop-blur sm:top-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon name={KIND_ICON[ride.kind]} size={18} />
          <span className="truncate">{livery ? `${ride.title} · "${livery.name}"` : ride.title}</span>
        </div>
        <div className="mt-0.5 truncate text-xs opacity-80">
          {ride.from} → {ride.to}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-sun transition-[width] duration-200" style={{ width: `${Math.min(100, (elapsed / total) * 100)}%` }} />
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs opacity-80">
          <span>0:{String(left).padStart(2, "0")} to arrival</span>
          <span className={`rounded-full px-2 py-0.5 font-semibold text-white ${ready ? "bg-kgreen" : "bg-white/25"}`}>{ready ? "Moving" : "Boarding…"}</span>
        </div>
        <p className="mt-2 text-sm">{line}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={finish} className="flex-1 rounded-2xl bg-white py-2 text-sm font-semibold text-foreground">
            Skip ride ›
          </button>
          <button onClick={() => ((done.current = true), startRide(null))} className="flex-1 rounded-2xl bg-white/15 py-2 text-sm font-semibold">
            ↩ Turn back
          </button>
        </div>
      </div>
      <div className="absolute right-3 top-1/3 flex flex-col gap-1 rounded-2xl bg-white/95 p-1 shadow-xl">
        {(ride.kind === "walk" ? (["chase", "side"] as const) : (["chase", "side", "inside"] as const)).map((c) => (
          <button key={c} onClick={() => setCam(c)} className={`flex w-16 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold capitalize ${cam === c ? "bg-foreground text-background" : "text-muted"}`}>
            <Icon name={c === "chase" ? "video" : c === "side" ? "eye" : "armchair"} size={18} />
            {c === "inside" && ride.kind === "boda" ? "rider" : c === "inside" && ride.kind === "plane" ? "cabin" : c}
          </button>
        ))}
      </div>
    </div>
  );
}
