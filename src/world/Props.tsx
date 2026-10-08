"use client";

import { Suspense, type ReactNode } from "react";
import type { PropKind } from "./layout";
import { LIVERIES } from "./liveries";
import { VehicleModel } from "./Vehicles";

type V3 = [number, number, number];

export function Box({ p = [0, 0, 0], s, c, r, e }: { p?: V3; s: V3; c: string; r?: V3; e?: string }) {
  return (
    <mesh position={p} rotation={r} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} emissive={e ?? "#000"} emissiveIntensity={e ? 0.6 : 0} roughness={0.8} />
    </mesh>
  );
}

export function Cyl({ p = [0, 0, 0], r: radius, h, c, top, rot, seg = 16 }: { p?: V3; r: number; h: number; c: string; top?: number; rot?: V3; seg?: number }) {
  return (
    <mesh position={p} rotation={rot} castShadow receiveShadow>
      <cylinderGeometry args={[top ?? radius, radius, h, seg]} />
      <meshStandardMaterial color={c} roughness={0.8} />
    </mesh>
  );
}

function Ball({ p, r, c }: { p: V3; r: number; c: string }) {
  return (
    <mesh position={p} castShadow>
      <sphereGeometry args={[r, 16, 12]} />
      <meshStandardMaterial color={c} roughness={0.9} />
    </mesh>
  );
}

const WOOD = "#b08968";
const DARK = "#2b2118";
const WHITE = "#f5f5f4";
const METAL = "#9ca3af";

function Tree({ p, h = 2.2 }: { p: V3; h?: number }) {
  return (
    <group position={p}>
      <Cyl p={[0, h / 2, 0]} r={0.12} h={h} c="#6b4423" />
      <Ball p={[0, h + 0.3, 0]} r={0.8} c="#2d6a4f" />
      <Ball p={[0.4, h, 0.2]} r={0.55} c="#40916c" />
    </group>
  );
}

function Chair({ p, c = "#c8102e", rot = 0 }: { p: V3; c?: string; rot?: number }) {
  return (
    <group position={p} rotation={[0, rot, 0]}>
      <Box p={[0, 0.45, 0]} s={[0.45, 0.06, 0.45]} c={c} />
      <Box p={[0, 0.75, -0.2]} s={[0.45, 0.55, 0.06]} c={c} />
      {[-0.18, 0.18].flatMap((x) => [-0.18, 0.18].map((z) => <Box key={`${x}${z}`} p={[x, 0.22, z]} s={[0.05, 0.45, 0.05]} c={c} />))}
    </group>
  );
}

/** Low-poly model for each prop kind, built around the origin, facing +z. */
/** Stages show the nganyas that actually run from them. */
const STAGE_NGANYA: Record<string, number> = { rongaiStage: 0, nganyaStage: 2 };

export function PropModel({ kind, accent, venue }: { kind: PropKind; accent: string; venue?: string }): ReactNode {
  switch (kind) {
    case "bed":
      return (
        <group>
          <Box p={[0, 0.2, 0]} s={[1.5, 0.4, 2.1]} c={WOOD} />
          <Box p={[0, 0.45, 0.05]} s={[1.4, 0.18, 2]} c={WHITE} />
          <Box p={[0, 0.56, 0.4]} s={[1.42, 0.08, 1.2]} c={accent} />
          <Box p={[0, 0.6, -0.75]} s={[0.9, 0.14, 0.35]} c="#fff" />
          <Box p={[0, 0.6, -1.05]} s={[1.5, 0.9, 0.08]} c={WOOD} />
        </group>
      );
    case "toilet":
      return (
        <group>
          <Cyl p={[0, 0.25, 0.1]} r={0.25} h={0.5} c={WHITE} />
          <Box p={[0, 0.65, -0.25]} s={[0.5, 0.5, 0.2]} c={WHITE} />
          <Box p={[0, 0.7, -0.45]} s={[1.2, 1.4, 0.06]} c="#cbd5e1" />
        </group>
      );
    case "shower":
      return (
        <group>
          <Box p={[0, 0.05, 0]} s={[1.1, 0.1, 1.1]} c="#e2e8f0" />
          <Cyl p={[-0.45, 1.1, -0.45]} r={0.03} h={2.2} c={METAL} />
          <Cyl p={[-0.3, 2.1, -0.3]} r={0.12} h={0.05} c={METAL} />
          <Box p={[0.55, 0.7, 0]} s={[0.02, 1.2, 1.1]} c="#60a5fa" />
          <Cyl p={[0.2, 0.2, 0.2]} r={0.2} h={0.35} c="#38bdf8" />
        </group>
      );
    case "stove":
      return (
        <group>
          <Box p={[0, 0.45, 0]} s={[1.8, 0.9, 0.7]} c={WOOD} />
          <Box p={[0, 0.92, 0]} s={[1.82, 0.05, 0.72]} c="#57534e" />
          <Cyl p={[-0.4, 0.98, 0]} r={0.15} h={0.04} c={DARK} />
          <Cyl p={[0.2, 0.98, 0]} r={0.15} h={0.04} c={DARK} />
          <Cyl p={[0.2, 1.1, 0]} r={0.16} h={0.2} c="#9ca3af" />
          <Box p={[0.65, 1.05, 0]} s={[0.3, 0.2, 0.3]} c="#0b7a3b" />
        </group>
      );
    case "fridge":
      return (
        <group>
          <Box p={[0, 0.9, 0]} s={[0.8, 1.8, 0.7]} c="#e5e7eb" />
          <Box p={[0.3, 1.2, 0.36]} s={[0.04, 0.5, 0.04]} c={METAL} />
          <Box p={[0, 1.25, 0.351]} s={[0.78, 0.02, 0.01]} c={METAL} />
        </group>
      );
    case "sofa":
      return (
        <group>
          <Box p={[0, 0.25, 0]} s={[2, 0.5, 0.9]} c={accent} />
          <Box p={[0, 0.65, -0.35]} s={[2, 0.6, 0.2]} c={accent} />
          <Box p={[-0.95, 0.45, 0]} s={[0.15, 0.4, 0.9]} c={accent} />
          <Box p={[0.95, 0.45, 0]} s={[0.15, 0.4, 0.9]} c={accent} />
          <Box p={[-0.5, 0.55, 0.05]} s={[0.4, 0.15, 0.4]} c="#fff7ed" />
        </group>
      );
    case "tv":
    case "console":
      return (
        <group>
          <Box p={[0, 0.3, 0]} s={[1.6, 0.6, 0.5]} c={WOOD} />
          <Box p={[0, 1.15, -0.05]} s={[1.5, 0.85, 0.06]} c="#111827" />
          <Box p={[0, 1.15, -0.01]} s={[1.38, 0.73, 0.01]} c="#1e3a8a" e="#3b82f6" />
          {kind === "console" && <Box p={[0.4, 0.66, 0.05]} s={[0.35, 0.1, 0.25]} c={WHITE} />}
        </group>
      );
    case "radio":
      return (
        <group>
          <Cyl p={[0, 0.3, 0]} r={0.25} h={0.6} c={WOOD} />
          <Box p={[0, 0.72, 0]} s={[0.5, 0.25, 0.18]} c="#7f1d1d" />
          <Cyl p={[-0.1, 0.72, 0.1]} r={0.07} h={0.02} rot={[Math.PI / 2, 0, 0]} c={DARK} />
        </group>
      );
    case "speaker":
      return (
        <group>
          <Box p={[0, 0.6, 0]} s={[0.6, 1.2, 0.5]} c="#111827" />
          <Cyl p={[0, 0.85, 0.26]} r={0.18} h={0.02} rot={[Math.PI / 2, 0, 0]} c="#374151" />
          <Cyl p={[0, 0.4, 0.26]} r={0.22} h={0.02} rot={[Math.PI / 2, 0, 0]} c="#374151" />
        </group>
      );
    case "shelf":
      return (
        <group>
          <Box p={[0, 1, 0]} s={[1.4, 2, 0.4]} c={WOOD} />
          {[0.45, 1, 1.55].map((y) => (
            <group key={y}>
              {[-0.45, -0.25, -0.05, 0.2, 0.4].map((x, i) => (
                <Box key={x} p={[x, y, 0.1]} s={[0.14, 0.4, 0.26]} c={["#c8102e", "#0b7a3b", "#f2b705", "#1d4ed8", "#7c3aed"][i]} />
              ))}
            </group>
          ))}
        </group>
      );
    case "desk":
      return (
        <group>
          <Box p={[0, 0.75, 0]} s={[1.5, 0.06, 0.7]} c={WOOD} />
          {[-0.65, 0.65].map((x) => (
            <Box key={x} p={[x, 0.37, 0]} s={[0.06, 0.74, 0.6]} c={WOOD} />
          ))}
          <Box p={[0, 0.8, 0]} s={[0.5, 0.02, 0.35]} c="#6b7280" />
          <Box p={[0, 0.95, -0.17]} s={[0.5, 0.3, 0.02]} c="#111827" e="#2563eb" />
          <Chair p={[0, 0, 0.6]} c="#374151" rot={Math.PI} />
        </group>
      );
    case "guitar":
      return (
        <group rotation={[0, 0, 0.25]}>
          <Cyl p={[0, 0.4, 0]} r={0.28} h={0.1} rot={[Math.PI / 2, 0, 0]} c="#b45309" />
          <Box p={[0, 1, 0]} s={[0.08, 1, 0.05]} c={DARK} />
        </group>
      );
    case "rack":
      return (
        <group>
          {[-0.7, 0.7].map((x) => (
            <Box key={x} p={[x, 0.8, 0]} s={[0.08, 1.6, 0.08]} c={DARK} />
          ))}
          <Cyl p={[0, 1.3, 0]} r={0.03} h={1.8} rot={[0, 0, Math.PI / 2]} c={METAL} />
          <Cyl p={[-0.8, 1.3, 0]} r={0.22} h={0.08} rot={[0, 0, Math.PI / 2]} c={DARK} />
          <Cyl p={[0.8, 1.3, 0]} r={0.22} h={0.08} rot={[0, 0, Math.PI / 2]} c={DARK} />
          <Box p={[0, 0.1, 0.6]} s={[1.6, 0.06, 0.8]} c="#334155" />
        </group>
      );
    case "mirror":
      return (
        <group>
          <Box p={[0, 1, 0]} s={[0.8, 1.8, 0.08]} c={WOOD} />
          <Box p={[0, 1, 0.045]} s={[0.66, 1.62, 0.01]} c="#cfe8ff" e="#93c5fd" />
          <Chair p={[0, 0, 0.7]} c={DARK} rot={Math.PI} />
        </group>
      );
    case "ringLight":
      return (
        <group>
          <Cyl p={[0, 0.8, 0]} r={0.03} h={1.6} c={DARK} />
          <mesh position={[0, 1.65, 0]}>
            <torusGeometry args={[0.28, 0.04, 8, 24]} />
            <meshStandardMaterial color="#fff" emissive="#fff7cc" emissiveIntensity={1} />
          </mesh>
        </group>
      );
    case "dog":
      return (
        <group>
          <Box p={[0, 0.35, 0]} s={[0.35, 0.3, 0.7]} c="#a16207" />
          <Box p={[0, 0.55, 0.42]} s={[0.28, 0.26, 0.28]} c="#a16207" />
          {[-0.12, 0.12].flatMap((x) => [-0.25, 0.25].map((z) => <Box key={`${x}${z}`} p={[x, 0.12, z]} s={[0.08, 0.24, 0.08]} c="#854d0e" />))}
          <Box p={[0, 0.45, -0.4]} s={[0.06, 0.06, 0.25]} r={[0.6, 0, 0]} c="#854d0e" />
        </group>
      );
    case "jacuzzi":
    case "pool":
      return (
        <group>
          <Box p={[0, 0.25, 0]} s={kind === "pool" ? [3, 0.5, 2] : [1.8, 0.5, 1.8]} c="#e2e8f0" />
          <Box p={[0, 0.48, 0]} s={kind === "pool" ? [2.7, 0.04, 1.7] : [1.5, 0.04, 1.5]} c="#38bdf8" e="#0ea5e9" />
        </group>
      );
    case "cinema":
    case "screen":
      return (
        <group>
          <Box p={[0, 1.6, -0.3]} s={[2.4, 1.3, 0.08]} c="#111827" />
          <Box p={[0, 1.6, -0.25]} s={[2.25, 1.15, 0.01]} c="#312e81" e="#6366f1" />
          {[-0.7, 0, 0.7].map((x) => (
            <Chair key={x} p={[x, 0, 1]} c="#7f1d1d" rot={Math.PI} />
          ))}
        </group>
      );
    case "poolTable":
      return (
        <group>
          <Box p={[0, 0.75, 0]} s={[2, 0.1, 1.1]} c="#166534" />
          <Box p={[0, 0.7, 0]} s={[2.1, 0.1, 1.2]} c={WOOD} />
          {[-0.85, 0.85].flatMap((x) => [-0.45, 0.45].map((z) => <Box key={`${x}${z}`} p={[x, 0.35, z]} s={[0.12, 0.7, 0.12]} c={WOOD} />))}
          <Ball p={[0.3, 0.84, 0.1]} r={0.04} c="#fff" />
          <Ball p={[-0.3, 0.84, -0.1]} r={0.04} c="#c8102e" />
        </group>
      );
    case "plant":
      return (
        <group>
          <Cyl p={[0, 0.2, 0]} r={0.22} top={0.28} h={0.4} c="#c2410c" />
          <mesh position={[0, 0.75, 0]} castShadow>
            <coneGeometry args={[0.35, 0.9, 6]} />
            <meshStandardMaterial color="#2d6a4f" />
          </mesh>
        </group>
      );
    case "art":
      return (
        <group>
          <Box p={[0, 1.5, -0.4]} s={[1.1, 0.8, 0.05]} c={WOOD} />
          <Box p={[0, 1.5, -0.37]} s={[0.95, 0.65, 0.01]} c={accent} />
          <Box p={[-0.15, 1.45, -0.36]} s={[0.3, 0.4, 0.01]} c="#c8102e" />
        </group>
      );
    case "lamp":
      return (
        <group>
          <Cyl p={[0, 0.7, 0]} r={0.03} h={1.4} c={DARK} />
          <Cyl p={[0, 1.45, 0]} r={0.28} top={0.15} h={0.3} c="#fde68a" />
        </group>
      );
    case "generator":
      return (
        <group>
          <Box p={[0, 0.35, 0]} s={[0.9, 0.6, 0.6]} c="#eab308" />
          <Box p={[0, 0.7, 0]} s={[0.95, 0.06, 0.65]} c={DARK} />
        </group>
      );
    case "solar":
      return (
        <group>
          <Box p={[0, 0.5, 0]} s={[0.5, 1, 0.4]} c="#334155" />
          <Box p={[0, 1.2, 0]} s={[1.2, 0.05, 0.8]} r={[-0.5, 0, 0]} c="#1e3a8a" e="#1d4ed8" />
        </group>
      );
    case "tank":
      return <Cyl p={[0, 0.8, 0]} r={0.55} h={1.6} c="#1f2937" />;
    case "chairs":
      return (
        <group>
          <Chair p={[-0.35, 0, 0]} c="#f5f5f4" />
          <Chair p={[0.35, 0, 0]} c="#c8102e" />
        </group>
      );
    case "door":
      return (
        <group>
          <Box p={[0, 1.05, 0]} s={[1, 2.1, 0.1]} c="#7c2d12" />
          <Ball p={[0.35, 1.05, 0.07]} r={0.05} c="#f2b705" />
          <Box p={[0, 0.02, 0.6]} s={[1, 0.03, 0.6]} c={accent} />
        </group>
      );
    case "stall":
    case "kiosk":
      return (
        <group>
          <Box p={[0, 0.5, 0]} s={[1.8, 1, 0.8]} c={kind === "kiosk" ? "#0b7a3b" : WOOD} />
          {[-0.85, 0.85].map((x) => (
            <Cyl key={x} p={[x, 1.4, 0.3]} r={0.04} h={1.8} c={DARK} />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <Box key={i} p={[-0.8 + i * 0.4, 2.25, 0.25]} s={[0.4, 0.06, 1.1]} r={[0.25, 0, 0]} c={i % 2 ? WHITE : accent} />
          ))}
          <Cyl p={[-0.4, 1.12, 0]} r={0.15} h={0.25} c="#f97316" />
          <Cyl p={[0.2, 1.12, 0]} r={0.15} h={0.25} c="#84cc16" />
          <Ball p={[0.6, 1.1, 0]} r={0.14} c="#facc15" />
        </group>
      );
    case "grill":
      return (
        <group>
          <Cyl p={[0, 0.7, 0]} r={0.45} h={1.2} rot={[0, 0, Math.PI / 2]} c="#1f2937" />
          <Box p={[0, 1.25, 0]} s={[1.1, 0.04, 0.7]} c={METAL} />
          {[-0.3, 0, 0.3].map((x) => (
            <Box key={x} p={[x, 1.32, 0]} s={[0.2, 0.08, 0.15]} c="#7f1d1d" />
          ))}
          <Box p={[0, 1.18, 0]} s={[0.9, 0.02, 0.5]} c="#f97316" e="#ea580c" />
          <Box p={[1.2, 0.4, 0.2]} s={[0.8, 0.8, 0.6]} c={WOOD} />
        </group>
      );
    case "table":
      return (
        <group>
          <Cyl p={[0, 0.75, 0]} r={0.6} h={0.06} c={WHITE} />
          <Cyl p={[0, 0.37, 0]} r={0.06} h={0.74} c={DARK} />
          <Chair p={[-0.85, 0, 0]} rot={Math.PI / 2} c={accent} />
          <Chair p={[0.85, 0, 0]} rot={-Math.PI / 2} c={accent} />
          <Cyl p={[0.1, 0.83, 0.1]} r={0.18} h={0.06} c="#fef3c7" />
        </group>
      );
    case "counter":
    case "checkin":
      return (
        <group>
          <Box p={[0, 0.55, 0]} s={[2.4, 1.1, 0.7]} c={kind === "checkin" ? "#1e3a8a" : "#334155"} />
          <Box p={[0, 1.12, 0]} s={[2.5, 0.06, 0.8]} c={WHITE} />
          <Box p={[-0.6, 1.3, -0.1]} s={[0.4, 0.3, 0.05]} c="#111827" e="#22c55e" />
          <Box p={[0.6, 1.3, -0.1]} s={[0.4, 0.3, 0.05]} c="#111827" e="#22c55e" />
          {kind === "checkin" && <Box p={[1.6, 0.3, 0.3]} s={[0.5, 0.6, 0.35]} c="#c8102e" />}
        </group>
      );
    case "dancefloor":
      return (
        <group>
          {[0, 1, 2, 3].flatMap((i) =>
            [0, 1, 2].map((j) => <Box key={`${i}${j}`} p={[-1.05 + i * 0.7, 0.03, -0.7 + j * 0.7]} s={[0.66, 0.04, 0.66]} c={["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b"][(i + j) % 4]} e={["#ec4899", "#8b5cf6", "#06b6d4", "#f59e0b"][(i + j) % 4]} />),
          )}
          <Ball p={[0, 2.6, 0]} r={0.25} c="#e5e7eb" />
        </group>
      );
    case "dj":
      return (
        <group>
          <Box p={[0, 0.55, 0]} s={[1.8, 1.1, 0.7]} c="#111827" />
          <Cyl p={[-0.45, 1.13, 0]} r={0.22} h={0.04} c="#374151" />
          <Cyl p={[0.45, 1.13, 0]} r={0.22} h={0.04} c="#374151" />
          <Box p={[0, 0.55, 0.36]} s={[1.6, 0.2, 0.01]} c="#a855f7" e="#a855f7" />
        </group>
      );
    case "trees":
      return (
        <group>
          <Tree p={[-0.7, 0, -0.3]} />
          <Tree p={[0.7, 0, 0.2]} h={1.8} />
          <Tree p={[0, 0, -0.8]} h={2.6} />
        </group>
      );
    case "board":
      return (
        <group>
          <Box p={[0, 1.4, -0.3]} s={[2.2, 1.1, 0.06]} c="#14532d" />
          <Box p={[0, 1.4, -0.26]} s={[2.3, 1.2, 0.02]} c={WOOD} />
          {[-0.6, 0.6].map((x) => (
            <group key={x}>
              <Box p={[x, 0.7, 0.7]} s={[0.9, 0.05, 0.5]} c={WOOD} />
              <Box p={[x, 0.35, 0.7]} s={[0.05, 0.7, 0.4]} c={WOOD} />
            </group>
          ))}
        </group>
      );
    case "podium":
      return (
        <group>
          <Box p={[0, 0.6, 0]} s={[0.8, 1.2, 0.6]} c={WOOD} />
          <Box p={[0, 1.25, 0.05]} s={[0.9, 0.08, 0.6]} r={[0.25, 0, 0]} c={WOOD} />
          <Cyl p={[0.8, 1.2, -0.2]} r={0.02} h={2.4} c={METAL} />
          {["#1b1612", "#c8102e", "#0b7a3b"].map((c, i) => (
            <Box key={c} p={[1.15, 2.2 - i * 0.18, -0.2]} s={[0.65, 0.18, 0.02]} c={c} />
          ))}
        </group>
      );
    case "hospitalBed":
      return (
        <group>
          <Box p={[0, 0.5, 0]} s={[1, 0.15, 2]} c="#e2e8f0" />
          <Box p={[0, 0.62, 0]} s={[0.95, 0.1, 1.9]} c="#bfdbfe" />
          {[-0.45, 0.45].map((x) => (
            <Box key={x} p={[x, 0.75, 0]} s={[0.04, 0.2, 1.6]} c={METAL} />
          ))}
          <Cyl p={[0.8, 0.9, -0.8]} r={0.02} h={1.8} c={METAL} />
          <Box p={[0.8, 1.7, -0.8]} s={[0.15, 0.25, 0.05]} c="#e0f2fe" />
        </group>
      );
    case "matatu": {
      const n = venue ? STAGE_NGANYA[venue] : undefined;
      // Slightly scaled down so a whole bus fits in a room slot.
      return (
        <group scale={n === undefined ? 0.7 : 0.6}>
          <Suspense fallback={null}>
            <VehicleModel name={n === undefined ? "matatu" : "nganya"} livery={n === undefined ? null : LIVERIES[n]} />
          </Suspense>
        </group>
      );
    }
    case "motorbike":
      return (
        <group>
          <Suspense fallback={null}>
            <VehicleModel name="boda" />
          </Suspense>
        </group>
      );
    case "pews":
      return (
        <group>
          {[0, 0.9].map((z) => (
            <group key={z}>
              <Box p={[0, 0.45, z]} s={[2.2, 0.06, 0.45]} c={WOOD} />
              <Box p={[0, 0.75, z - 0.22]} s={[2.2, 0.55, 0.05]} c={WOOD} />
            </group>
          ))}
          <Box p={[0, 1.4, -0.9]} s={[0.1, 0.8, 0.06]} c="#f2b705" />
          <Box p={[0, 1.55, -0.9]} s={[0.5, 0.1, 0.06]} c="#f2b705" />
        </group>
      );
    case "mic":
      return (
        <group>
          <Cyl p={[0, 0.75, 0]} r={0.025} h={1.5} c={DARK} />
          <Ball p={[0, 1.55, 0.05]} r={0.07} c="#6b7280" />
          <Box p={[-0.9, 0.6, -0.2]} s={[0.5, 1.2, 0.45]} c="#111827" />
          <Box p={[0.9, 0.6, -0.2]} s={[0.5, 1.2, 0.45]} c="#111827" />
        </group>
      );
    case "washroom":
      return (
        <group>
          <Box p={[0, 1.05, 0]} s={[1, 2.1, 0.1]} c="#1d4ed8" />
          <Box p={[0, 2.35, 0.06]} s={[0.5, 0.3, 0.02]} c={WHITE} />
          <Box p={[0, 2.35, 0.075]} s={[0.3, 0.12, 0.01]} c="#1d4ed8" />
        </group>
      );
    case "alley":
      return (
        <group>
          <Box p={[-0.4, 0.3, 0]} s={[0.6, 0.6, 0.6]} c="#78350f" />
          <Box p={[0.3, 0.25, 0.2]} s={[0.5, 0.5, 0.5]} c="#92400e" />
          <Cyl p={[0.5, 0.45, -0.4]} r={0.25} h={0.9} c="#374151" />
          <Box p={[0, 0.01, 0]} s={[2, 0.02, 1.6]} c="#1f2937" />
        </group>
      );
    case "goal":
      return (
        <group>
          {[-1.2, 1.2].map((x) => (
            <Cyl key={x} p={[x, 0.7, 0]} r={0.05} h={1.4} c={WHITE} />
          ))}
          <Cyl p={[0, 1.4, 0]} r={0.05} h={2.4} rot={[0, 0, Math.PI / 2]} c={WHITE} />
          <Ball p={[0, 0.12, 1]} r={0.12} c={WHITE} />
          <Box p={[0, 0.01, 0.8]} s={[3, 0.02, 2]} c="#15803d" />
        </group>
      );
    case "rug":
      return <Box p={[0, 0.015, 0]} s={[3.2, 0.03, 2.2]} c={accent} />;
    case "bench":
      return (
        <group>
          <Box p={[0, 0.45, 0]} s={[2, 0.08, 0.5]} c="#1f2937" />
          <Box p={[0, 0.75, -0.22]} s={[2, 0.5, 0.06]} c="#1f2937" />
          {[-0.85, 0.85].map((x) => (
            <Box key={x} p={[x, 0.22, 0]} s={[0.06, 0.44, 0.45]} c={METAL} />
          ))}
        </group>
      );
    case "palm":
      return (
        <group>
          <Cyl p={[0, 0.25, 0]} r={0.3} top={0.35} h={0.5} c="#e5e7eb" />
          <Cyl p={[0, 1.3, 0]} r={0.08} top={0.06} h={2} c="#8b5a2b" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Box key={i} p={[Math.sin((i * Math.PI) / 3) * 0.55, 2.25, Math.cos((i * Math.PI) / 3) * 0.55]} s={[0.25, 0.04, 1.1]} r={[0.35, (i * Math.PI) / 3, 0]} c="#2d6a4f" />
          ))}
        </group>
      );
    case "seats":
      return (
        <group>
          {[-0.75, -0.25, 0.25, 0.75].map((x) => (
            <group key={x}>
              <Box p={[x, 0.45, 0]} s={[0.45, 0.06, 0.45]} c="#111827" />
              <Box p={[x, 0.75, -0.2]} s={[0.45, 0.55, 0.05]} c="#111827" />
            </group>
          ))}
          <Box p={[0, 0.22, 0]} s={[2, 0.05, 0.1]} c={METAL} />
        </group>
      );
    case "piano":
      // A black grand piano with its lid propped open and a bench in front.
      return (
        <group>
          <Box p={[0, 0.78, -0.25]} s={[1.5, 0.3, 1.4]} c="#0a0a0a" />
          <Box p={[0.2, 0.78, -1.05]} s={[1.0, 0.3, 0.5]} c="#0a0a0a" />
          <Box p={[0, 1.25, -0.45]} s={[1.4, 0.04, 1.3]} c="#111" r={[-0.5, 0, 0]} />
          <Box p={[0, 0.94, 0.38]} s={[1.3, 0.04, 0.18]} c={WHITE} />
          {Array.from({ length: 9 }, (_, i) => (
            <Box key={i} p={[-0.56 + i * 0.14, 0.97, 0.34]} s={[0.05, 0.03, 0.09]} c="#0a0a0a" />
          ))}
          {[[-0.6, 0.2], [0.6, 0.2], [0.1, -1.1]].map(([x, z]) => (
            <Box key={`${x}${z}`} p={[x, 0.32, z]} s={[0.1, 0.64, 0.1]} c="#0a0a0a" />
          ))}
          <Box p={[0, 0.45, 0.95]} s={[0.9, 0.08, 0.35]} c="#0a0a0a" />
          <Box p={[0, 0.22, 0.95]} s={[0.8, 0.44, 0.25]} c="#1f1f1f" />
        </group>
      );
    case "window":
      // Floor-to-ceiling glass looking out on the apron, with a plane parked outside.
      return (
        <group>
          <Box p={[0, 1.4, 0]} s={[3, 2.8, 0.05]} c="#bae6fd" e="#7dd3fc" />
          {[-1.5, -0.5, 0.5, 1.5].map((x) => (
            <Box key={x} p={[x, 1.4, 0.03]} s={[0.06, 2.8, 0.06]} c={METAL} />
          ))}
          <Box p={[0, 0.9, 0.04]} s={[3, 0.05, 0.05]} c={METAL} />
          <Box p={[0, 0.85, 0.06]} s={[1.6, 0.25, 0.04]} c="#f5f5f4" />
          <Box p={[0.3, 0.98, 0.06]} s={[2.4, 0.05, 0.02]} c="#e5e7eb" />
          <Box p={[-0.6, 1.08, 0.06]} s={[0.06, 0.3, 0.02]} c="#c8102e" />
          <Box p={[0, 0.5, 0.6]} s={[2, 0.08, 0.3]} c="#334155" />
        </group>
      );
    case "lounge":
      // Armchairs round a low table, a lamp and a side bar.
      return (
        <group>
          {[-0.8, 0.8].map((x) => (
            <group key={x} position={[x, 0, 0]}>
              <Box p={[0, 0.25, 0]} s={[0.9, 0.5, 0.85]} c={accent} />
              <Box p={[0, 0.65, -0.35]} s={[0.9, 0.6, 0.18]} c={accent} />
              <Box p={[-0.4, 0.45, 0]} s={[0.12, 0.35, 0.85]} c={accent} />
              <Box p={[0.4, 0.45, 0]} s={[0.12, 0.35, 0.85]} c={accent} />
            </group>
          ))}
          <Box p={[0, 0.25, 0.85]} s={[1.1, 0.06, 0.6]} c={WOOD} />
          <Box p={[0, 0.12, 0.85]} s={[0.1, 0.24, 0.1]} c={DARK} />
          <Box p={[0.05, 0.33, 0.85]} s={[0.12, 0.12, 0.12]} c={WHITE} />
          <Box p={[1.5, 0.75, -0.2]} s={[0.05, 1.5, 0.05]} c={METAL} />
          <Box p={[1.5, 1.55, -0.2]} s={[0.35, 0.25, 0.35]} c="#fde68a" e="#fbbf24" />
        </group>
      );
    case "dutyFree":
      // Glass shelves of perfume bottles and gift boxes.
      return (
        <group>
          <Box p={[0, 0.9, -0.1]} s={[2.2, 1.8, 0.5]} c="#f8fafc" />
          {[0.5, 1.0, 1.5].map((y, i) => (
            <group key={y}>
              <Box p={[0, y, 0.16]} s={[2.1, 0.03, 0.05]} c={METAL} />
              {[-0.8, -0.4, 0, 0.4, 0.8].map((x, k) => (
                <Box key={x} p={[x, y + 0.12, 0.1]} s={[0.12, 0.22, 0.12]} c={["#c084fc", "#f472b6", "#fbbf24", "#34d399", "#60a5fa"][(i + k) % 5]} />
              ))}
            </group>
          ))}
          <Box p={[0, 1.95, 0.15]} s={[1.4, 0.25, 0.04]} c="#1d4ed8" />
        </group>
      );
    case "departures":
      return (
        <group>
          <Box p={[0, 1.9, 0]} s={[2.6, 1.2, 0.1]} c="#111827" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Box key={i} p={[-0.2, 2.3 - i * 0.2, 0.06]} s={[1.9, 0.08, 0.01]} c="#f59e0b" e="#f59e0b" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <Box key={`s${i}`} p={[1.05, 2.3 - i * 0.2, 0.06]} s={[0.3, 0.08, 0.01]} c={i === 2 ? "#ef4444" : "#22c55e"} e={i === 2 ? "#ef4444" : "#22c55e"} />
          ))}
        </group>
      );
    case "luggage":
      return (
        <group>
          <Box p={[0, 0.35, 0]} s={[0.45, 0.7, 0.28]} c="#c8102e" />
          <Box p={[0.55, 0.28, 0.1]} s={[0.4, 0.56, 0.26]} c="#1d4ed8" />
          <Box p={[0, 0.78, 0]} s={[0.2, 0.1, 0.04]} c={DARK} />
        </group>
      );
    case "train":
      return (
        <group>
          <Box p={[0, 1.1, 0]} s={[4, 1.8, 2]} c="#f5f5f4" />
          <Box p={[0, 1.4, 1.01]} s={[3.6, 0.5, 0.02]} c="#1e3a8a" />
          <Box p={[0, 0.55, 1.01]} s={[4, 0.18, 0.02]} c="#c8102e" />
          <Box p={[0, 0.1, 0]} s={[4.6, 0.12, 2.2]} c="#57534e" />
        </group>
      );
    case "speakers":
      return (
        <group>
          <Box p={[0, 0.8, 0]} s={[0.7, 1.6, 0.6]} c="#111827" />
          <Cyl p={[0, 1.1, 0.31]} r={0.22} h={0.02} rot={[Math.PI / 2, 0, 0]} c="#374151" />
          <Cyl p={[0, 0.5, 0.31]} r={0.26} h={0.02} rot={[Math.PI / 2, 0, 0]} c="#374151" />
          <Box p={[0, 1.7, 0]} s={[0.6, 0.12, 0.5]} c="#ec4899" e="#ec4899" />
        </group>
      );
    case "crates":
      return (
        <group>
          <Box p={[0, 0.25, 0]} s={[0.6, 0.5, 0.6]} c="#a16207" />
          <Box p={[0.55, 0.2, 0.2]} s={[0.45, 0.4, 0.45]} c="#ca8a04" />
          <Box p={[0.15, 0.62, 0.05]} s={[0.5, 0.25, 0.5]} c="#f97316" />
        </group>
      );
    default:
      return <Box p={[0, 0.4, 0]} s={[0.8, 0.8, 0.8]} c={accent} />;
  }
}
