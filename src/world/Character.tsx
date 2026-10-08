"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Object3D } from "three";
import { sanitizeLook, type Look } from "@/game/look";

const SPEED = 2.4;
const LONG = new Set(["hoodie", "shirt", "blazer", "kitenge"]);

function Part({ p, s, c }: { p: [number, number, number]; s: [number, number, number]; c: string }) {
  return (
    <mesh position={p} castShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={0.85} />
    </mesh>
  );
}

function Sphere({ p, r, c, scale }: { p: [number, number, number]; r: number; c: string; scale?: [number, number, number] }) {
  return (
    <mesh position={p} scale={scale} castShadow>
      <sphereGeometry args={[r, 18, 14]} />
      <meshStandardMaterial color={c} roughness={0.9} />
    </mesh>
  );
}

function Frustum({ p, top, bottom, h, c }: { p: [number, number, number]; top: number; bottom: number; h: number; c: string }) {
  return (
    <mesh position={p} castShadow>
      <cylinderGeometry args={[top, bottom, h, 14]} />
      <meshStandardMaterial color={c} roughness={0.85} />
    </mesh>
  );
}

/**
 * A walking 3D person. It moves itself toward `target` and calls `onArrive` once there, so the
 * world only has to say where to go.
 */
export function Character({
  look,
  start,
  target,
  anchor,
  onArrive,
  onClick,
  busy,
}: {
  look?: Partial<Look> | null;
  start: [number, number];
  target?: [number, number] | null;
  /** Registers the character's root so the DOM label layer can follow it. */
  anchor?: (obj: Object3D | null) => void;
  onArrive?: () => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  busy?: boolean;
}) {
  const l = sanitizeLook(look);
  const root = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const arrived = useRef(true);
  const lastTarget = useRef<string>("");

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const key = target ? target.join(",") : "";
    if (key !== lastTarget.current) {
      lastTarget.current = key;
      arrived.current = !target;
    }
    let walking = false;
    if (target) {
      const dx = target[0] - g.position.x;
      const dz = target[1] - g.position.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.05) {
        const step = Math.min(dist, SPEED * dt);
        g.position.x += (dx / dist) * step;
        g.position.z += (dz / dist) * step;
        g.rotation.y = Math.atan2(dx, dz);
        walking = true;
      } else if (!arrived.current) {
        arrived.current = true;
        onArrive?.();
      }
    }
    const t = state.clock.elapsedTime;
    const swing = walking ? Math.sin(t * 10) * 0.6 : busy ? Math.sin(t * 6) * 0.25 : 0;
    if (legL.current) legL.current.rotation.x = walking ? swing : 0;
    if (legR.current) legR.current.rotation.x = walking ? -swing : 0;
    if (armL.current) armL.current.rotation.x = -swing;
    if (armR.current) armR.current.rotation.x = busy && !walking ? -1.2 + swing : swing;
    g.position.y = walking ? Math.abs(Math.sin(t * 10)) * 0.04 : 0;
  });

  const dress = l.top === "dress";
  const sleeves = LONG.has(l.top) ? l.topColor : l.skin;
  const legColor = dress || l.bottom === "skirt" || l.bottom === "shorts" ? l.skin : l.bottomColor;
  const shoe = { sneakers: "#f5f5f4", official: "#1b1612", sandals: "#6b4f3a", boots: "#5a3825" }[l.shoes] ?? "#f5f5f4";

  return (
    <group
      ref={(g) => {
        root.current = g;
        anchor?.(g);
      }}
      position={[start[0], 0, start[1]]} onClick={onClick} onPointerOver={() => onClick && (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
      {/* legs pivot at the hip */}
      {[
        { ref: legL, x: -0.1 },
        { ref: legR, x: 0.1 },
      ].map((leg) => (
        <group key={leg.x} ref={leg.ref} position={[leg.x, 0.86, 0]}>
          <Part p={[0, -0.38, 0]} s={[0.15, 0.76, 0.17]} c={legColor} />
          {!dress && l.bottom === "shorts" && <Part p={[0, -0.15, 0]} s={[0.17, 0.32, 0.19]} c={l.bottomColor} />}
          <Part p={[0, -0.8, 0.04]} s={[0.17, 0.09, 0.27]} c={shoe} />
        </group>
      ))}
      {!dress && (l.bottom === "jeans" || l.bottom === "trousers" || l.bottom === "shorts") && <Part p={[0, 0.9, 0]} s={[0.4, 0.14, 0.22]} c={l.bottomColor} />}
      {!dress && l.bottom === "skirt" && <Frustum p={[0, 0.68, 0]} top={0.21} bottom={0.3} h={0.45} c={l.bottomColor} />}
      {!dress && l.bottom === "maxi" && <Frustum p={[0, 0.48, 0]} top={0.21} bottom={0.33} h={0.85} c={l.bottomColor} />}
      {dress && <Frustum p={[0, 0.78, 0]} top={0.22} bottom={0.33} h={0.55} c={l.topColor} />}

      {/* torso and arms */}
      <Part p={[0, 1.16, 0]} s={[0.44, 0.56, 0.24]} c={l.topColor} />
      {l.top === "jersey" && <Part p={[0, 1.2, 0.121]} s={[0.44, 0.07, 0.01]} c="#c8102e" />}
      {l.top === "blazer" && <Part p={[0, 1.3, 0.121]} s={[0.12, 0.25, 0.01]} c="#f5f5f4" />}
      {l.top === "kitenge" && <Part p={[0, 1.1, 0.121]} s={[0.44, 0.04, 0.01]} c="#f2b705" />}
      {[
        { ref: armL, x: -0.29 },
        { ref: armR, x: 0.29 },
      ].map((arm) => (
        <group key={arm.x} ref={arm.ref} position={[arm.x, 1.4, 0]}>
          <Part p={[0, -0.12, 0]} s={[0.12, 0.24, 0.13]} c={dress ? l.skin : l.topColor} />
          <Part p={[0, -0.36, 0]} s={[0.11, 0.26, 0.12]} c={sleeves} />
          <Sphere p={[0, -0.52, 0]} r={0.06} c={l.skin} />
        </group>
      ))}
      {l.extra === "chain" && <Part p={[0, 1.32, 0.122]} s={[0.16, 0.03, 0.01]} c="#f2b705" />}
      {l.extra === "beads" && <Part p={[0, 1.38, 0.122]} s={[0.26, 0.06, 0.01]} c="#c8102e" />}

      {/* head */}
      <Frustum p={[0, 1.47, 0]} top={0.06} bottom={0.07} h={0.1} c={l.skin} />
      <Sphere p={[0, 1.65, 0]} r={0.17} c={l.skin} />
      <Sphere p={[-0.06, 1.67, 0.15]} r={0.022} c="#1b1612" />
      <Sphere p={[0.06, 1.67, 0.15]} r={0.022} c="#1b1612" />
      <Hair l={l} />
      {(l.extra === "glasses" || l.extra === "shades") && <Part p={[0, 1.67, 0.17]} s={[0.2, 0.05, 0.01]} c={l.extra === "shades" ? "#111" : "#3f3f46"} />}

    </group>
  );
}

function Hair({ l }: { l: Look }) {
  const c = l.hairColor;
  switch (l.hair) {
    case "afro":
      return <Sphere p={[0, 1.76, -0.08]} r={0.23} c={c} />;
    case "bald":
      return null;
    case "bun":
      return (
        <>
          <Sphere p={[0, 1.71, -0.01]} r={0.175} c={c} scale={[1, 0.75, 1]} />
          <Sphere p={[0, 1.88, -0.04]} r={0.08} c={c} />
        </>
      );
    case "braids":
    case "locs":
      return (
        <>
          <Sphere p={[0, 1.71, -0.01]} r={0.177} c={c} scale={[1, 0.75, 1]} />
          {[-0.12, -0.06, 0, 0.06, 0.12].map((x) => (
            <mesh key={x} position={[x, 1.42, -0.13]} castShadow>
              <cylinderGeometry args={[l.hair === "locs" ? 0.03 : 0.018, l.hair === "locs" ? 0.03 : 0.018, 0.5, 6]} />
              <meshStandardMaterial color={c} />
            </mesh>
          ))}
        </>
      );
    case "hijab":
      return (
        <>
          <Sphere p={[0, 1.68, -0.07]} r={0.19} c={l.topColor} />
          <Frustum p={[0, 1.42, -0.02]} top={0.17} bottom={0.27} h={0.25} c={l.topColor} />
        </>
      );
    case "cap":
      return (
        <>
          <Sphere p={[0, 1.73, 0]} r={0.176} c={l.topColor} scale={[1, 0.6, 1]} />
          <Part p={[0, 1.75, 0.18]} s={[0.26, 0.02, 0.16]} c={l.topColor} />
        </>
      );
    default:
      return <Sphere p={[0, 1.73, -0.01]} r={0.176} c={c} scale={[1, 0.65, 1]} />;
  }
}
