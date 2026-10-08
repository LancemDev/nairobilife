"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Object3D, type Group } from "three";
import type { Look } from "@/game/look";
import { Character } from "./Character";

export type RideKind = "matatu" | "boda" | "cab" | "car" | "walk" | "plane" | "train";
export type RideCam = "chase" | "side" | "inside";

const SEG = 220; // length of the repeating street
const tmp = new Object3D();
const col = new Color();

function rng(seed: number) {
  let h = seed >>> 0;
  return () => ((h = (h * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

const SHOP = ["#f1e3c6", "#e9d8c4", "#c9d7e4", "#e8c9a8", "#d9e3c7", "#f2d0d0", "#cfc6e6", "#e6e2d3"];
const AWNING = ["#c8102e", "#0b7a3b", "#f2b705", "#2563eb", "#ec4899", "#f97316"];
const CARS = ["#f5f5f4", "#1f2937", "#9ca3af", "#c8102e", "#2563eb", "#f2b705", "#14532d"];

/** A short 3D trip: the street scrolls past while your vehicle holds the middle of the frame. */
export default function RideScene({ kind, cam, look, carColor }: { kind: RideKind; cam: RideCam; look?: Partial<Look> | null; carColor?: string }) {
  const air = kind === "plane";
  const savannah = kind === "train";
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 4, 9], fov: 55 }}>
      <color attach="background" args={[air ? "#8ec5ea" : "#cfe3f0"]} />
      <fog attach="fog" args={[air ? "#cfe6f5" : "#d7e6ef", 40, 190]} />
      <hemisphereLight args={["#ffffff", "#8a9a6a", 1]} />
      <directionalLight position={[30, 50, 20]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-40} shadow-camera-right={40} shadow-camera-top={40} shadow-camera-bottom={-40} />
      <Rig kind={kind} cam={cam} />
      {air ? <Sky /> : savannah ? <Savannah /> : <Street walk={kind === "walk"} />}
      <Player kind={kind} look={look} carColor={carColor} />
    </Canvas>
  );
}

/** Forward speed in world units per second, by vehicle. */
const SPEED: Record<RideKind, number> = { matatu: 16, boda: 20, cab: 18, car: 20, walk: 3.2, plane: 45, train: 26 };

/** Shared scroll offset: every scenery piece reads it to slide toward the camera. */
const scroll = { z: 0 };

/** Which lane (x) your vehicle drives in, so cameras follow you rather than the road's centre. */
export const laneOf = (kind: RideKind) => (kind === "walk" ? 10.5 : kind === "train" || kind === "plane" ? 0 : 4.5);

function Rig({ kind, cam }: { kind: RideKind; cam: RideCam }) {
  const lane = laneOf(kind);
  useFrame((state, dt) => {
    const camera = state.camera;
    scroll.z += SPEED[kind] * dt;
    const t = state.clock.elapsedTime;
    const want =
      cam === "inside"
        ? kind === "walk"
          ? [0.2, 1.6, -0.3]
          : kind === "plane"
            ? [0, 1.2, -2]
            : [0.35, kind === "boda" ? 1.7 : 1.35, -0.4]
        : cam === "side"
          ? [kind === "plane" ? 14 : 7, kind === "plane" ? 2 : 2.2, 0]
          : kind === "plane"
            ? [0, 4, 14]
            : [0, kind === "walk" ? 2.4 : 3.6, kind === "walk" ? 5 : 8.5];
    camera.position.x += (lane + want[0] + (cam === "chase" ? Math.sin(t * 0.4) * 0.3 : 0) - camera.position.x) * Math.min(1, dt * 3);
    camera.position.y += (want[1] - camera.position.y) * Math.min(1, dt * 3);
    camera.position.z += (want[2] - camera.position.z) * Math.min(1, dt * 3);
    camera.lookAt(lane, cam === "inside" ? 1.2 : 1, cam === "side" ? 0 : -20);
  });
  return null;
}

/** The road, median, shopfronts, palms and traffic, all looping. */
function Street({ walk }: { walk: boolean }) {
  const buildings = useMemo(() => {
    const r = rng(7);
    const out: { x: number; z: number; w: number; h: number; d: number; c: string; a: string; side: number }[] = [];
    for (const side of [-1, 1])
      for (let z = 0; z < SEG; ) {
        const w = 6 + r() * 7;
        out.push({ x: side * (15 + r() * 2), z: -z - w / 2, w, h: 5 + r() * 9, d: 7, c: SHOP[Math.floor(r() * SHOP.length)], a: AWNING[Math.floor(r() * AWNING.length)], side });
        z += w + 0.4;
      }
    return out;
  }, []);
  const traffic = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 26 }, (_, i) => {
      const lane = [-7.5, -4.5, 4.5, 7.5][i % 4];
      return { lane, z: -r() * SEG, speed: lane < 0 ? -(8 + r() * 6) : 6 + r() * 8, color: CARS[Math.floor(r() * CARS.length)], matatu: r() < 0.3 };
    });
  }, []);
  const group = useRef<Group>(null);
  const cars = useRef<(Group | null)[]>([]);
  // World-space z of each car: ours drive toward -z, oncoming toward +z.
  const zs = useRef<number[] | null>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.position.z = scroll.z % SEG;
    zs.current ??= traffic.map((c) => c.z);
    traffic.forEach((c, i) => {
      const g = cars.current[i];
      if (!g) return;
      zs.current![i] += (c.lane > 0 ? -Math.abs(c.speed) : Math.abs(c.speed)) * dt;
      // Shown relative to the scrolling street, wrapped into the visible stretch.
      g.position.set(c.lane, 0, ((((zs.current![i] + scroll.z) % SEG) + SEG) % SEG) - SEG + 20);
      g.rotation.y = c.lane < 0 ? Math.PI : 0;
    });
  });
  return (
    <group>
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -80]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#9fb08a" />
      </mesh>
      <group ref={group}>
        {[0, -SEG].map((off) => (
          <group key={off} position={[0, 0, off]}>
            {/* asphalt */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -SEG / 2]} receiveShadow>
              <planeGeometry args={[19, SEG]} />
              <meshStandardMaterial color="#2f3338" />
            </mesh>
            {/* lane markings */}
            {Array.from({ length: SEG / 6 }, (_, i) => (
              <group key={i}>
                {[-6, 6].map((x) => (
                  <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, -i * 6 - 1.5]}>
                    <planeGeometry args={[0.18, 2.4]} />
                    <meshStandardMaterial color="#f5f5f4" />
                  </mesh>
                ))}
              </group>
            ))}
            {/* planted median */}
            <mesh position={[0, 0.2, -SEG / 2]} receiveShadow>
              <boxGeometry args={[3, 0.4, SEG]} />
              <meshStandardMaterial color="#3f8f3a" />
            </mesh>
            {Array.from({ length: SEG / 14 }, (_, i) => (
              <Palm key={i} x={0} z={-i * 14 - 4} />
            ))}
            {/* pavements */}
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[sd * 10.5, 0.15, -SEG / 2]} receiveShadow>
                <boxGeometry args={[3, 0.3, SEG]} />
                <meshStandardMaterial color="#c9c3b8" />
              </mesh>
            ))}
            {/* street lamps */}
            {Array.from({ length: SEG / 20 }, (_, i) =>
              [-1, 1].map((sd) => (
                <group key={`${i}${sd}`} position={[sd * 9.3, 0, -i * 20 - 8]}>
                  <mesh position={[0, 3, 0]}>
                    <cylinderGeometry args={[0.08, 0.1, 6, 6]} />
                    <meshStandardMaterial color="#4b5563" />
                  </mesh>
                  <mesh position={[-sd * 0.8, 6, 0]}>
                    <boxGeometry args={[1.6, 0.12, 0.3]} />
                    <meshStandardMaterial color="#4b5563" />
                  </mesh>
                </group>
              )),
            )}
            {/* shopfronts with awnings */}
            {buildings.map((b, i) => (
              <group key={i} position={[b.x, 0, b.z]}>
                <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
                  <boxGeometry args={[b.d, b.h, b.w]} />
                  <meshStandardMaterial color={b.c} />
                </mesh>
                <mesh position={[-b.side * (b.d / 2 + 0.9), 3, 0]} rotation={[0, 0, b.side * -0.25]}>
                  <boxGeometry args={[1.8, 0.12, b.w * 0.9]} />
                  <meshStandardMaterial color={b.a} />
                </mesh>
                {Array.from({ length: Math.floor(b.h / 3) }, (_, k) => (
                  <mesh key={k} position={[-b.side * (b.d / 2 + 0.01), 4.5 + k * 3, 0]} rotation={[0, (-b.side * Math.PI) / 2, 0]}>
                    <planeGeometry args={[b.w * 0.7, 1.2]} />
                    <meshStandardMaterial color="#1f2937" />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        ))}
      </group>
      {!walk &&
        traffic.map((c, i) => (
          <group key={i} ref={(el) => void (cars.current[i] = el)}>
            <Vehicle kind={c.matatu ? "matatu" : "car"} color={c.color} />
          </group>
        ))}
    </group>
  );
}

function Palm({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.4, z]}>
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 7, 7]} />
        <meshStandardMaterial color="#6b4423" />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[Math.sin((i * Math.PI) / 3) * 1.1, 7, Math.cos((i * Math.PI) / 3) * 1.1]} rotation={[0.5 * Math.cos((i * Math.PI) / 3), (i * Math.PI) / 3, 0.5 * Math.sin((i * Math.PI) / 3)]} castShadow>
          <boxGeometry args={[0.5, 0.06, 2.4]} />
          <meshStandardMaterial color="#2d6a4f" />
        </mesh>
      ))}
    </group>
  );
}

/** Low-poly vehicles, facing -z (forward). */
function Vehicle({ kind, color }: { kind: "matatu" | "car" | "cab" | "boda" | "plane" | "train"; color: string }) {
  if (kind === "boda")
    return (
      <group>
        {[-0.75, 0.75].map((z) => (
          <mesh key={z} position={[0, 0.35, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 0.15, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
        <mesh position={[0, 0.75, 0]} castShadow>
          <boxGeometry args={[0.35, 0.4, 1.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 1.15, -0.7]}>
          <boxGeometry args={[0.9, 0.06, 0.06]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
      </group>
    );
  if (kind === "plane")
    return (
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.9, 0.7, 10, 16]} />
          <meshStandardMaterial color="#f5f5f4" />
        </mesh>
        <mesh position={[0, 0, -5.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.9, 1.4, 16]} />
          <meshStandardMaterial color="#f5f5f4" />
        </mesh>
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[11, 0.15, 2]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        <mesh position={[0, 1.4, 4.4]}>
          <boxGeometry args={[0.15, 2.2, 1.6]} />
          <meshStandardMaterial color="#c8102e" />
        </mesh>
        <mesh position={[0, 0.3, 4.6]}>
          <boxGeometry args={[3.6, 0.12, 1]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
        {[-3, 3].map((x) => (
          <mesh key={x} position={[x, -0.6, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 1.6, 12]} />
            <meshStandardMaterial color="#9ca3af" />
          </mesh>
        ))}
      </group>
    );
  if (kind === "train")
    return (
      <group>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0, i * 9.4]}>
            <mesh position={[0, 1.8, 0]} castShadow>
              <boxGeometry args={[3, 3, 9]} />
              <meshStandardMaterial color="#f5f5f4" />
            </mesh>
            <mesh position={[0, 2.2, 0]}>
              <boxGeometry args={[3.02, 0.8, 8.4]} />
              <meshStandardMaterial color="#1e3a8a" />
            </mesh>
            <mesh position={[0, 0.9, 0]}>
              <boxGeometry args={[3.02, 0.25, 9]} />
              <meshStandardMaterial color="#c8102e" />
            </mesh>
          </group>
        ))}
      </group>
    );
  const m = kind === "matatu";
  return (
    <group>
      <mesh position={[0, m ? 1.2 : 0.75, 0]} castShadow>
        <boxGeometry args={m ? [2.1, 1.8, 5.2] : [1.8, 0.8, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {!m && (
        <mesh position={[0, 1.4, 0.2]} castShadow>
          <boxGeometry args={[1.6, 0.6, 2.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      <mesh position={[0, m ? 1.55 : 1.4, m ? 0 : 0.2]}>
        <boxGeometry args={m ? [2.12, 0.6, 4.6] : [1.62, 0.45, 2.1]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {m && (
        <mesh position={[1.06, 0.8, 0]}>
          <boxGeometry args={[0.02, 0.35, 4.6]} />
          <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.8} />
        </mesh>
      )}
      {kind === "cab" && (
        <mesh position={[0, 1.8, 0.2]}>
          <boxGeometry args={[0.6, 0.2, 0.3]} />
          <meshStandardMaterial color="#f2b705" emissive="#f2b705" emissiveIntensity={0.5} />
        </mesh>
      )}
      {[-0.95, 0.95].flatMap((x) =>
        [-1.4, 1.4].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.38, z * (m ? 1.2 : 1)]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.28, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        )),
      )}
      <mesh position={[0, m ? 0.8 : 0.7, m ? 2.61 : 2.01]}>
        <boxGeometry args={[1.4, 0.25, 0.05]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function Player({ kind, look, carColor }: { kind: RideKind; look?: Partial<Look> | null; carColor?: string }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime;
    // A little life: road bumps, a wobble on the boda, gentle banking in the air.
    g.current.position.y = kind === "plane" ? Math.sin(t * 0.8) * 0.3 : kind === "walk" ? 0 : Math.abs(Math.sin(t * 7)) * 0.03;
    g.current.rotation.z = kind === "boda" ? Math.sin(t * 1.3) * 0.05 : kind === "plane" ? Math.sin(t * 0.5) * 0.06 : 0;
  });
  return (
    <group ref={g} position={[laneOf(kind), kind === "walk" ? 0.3 : 0, 0]}>
      {kind === "walk" ? (
        <group rotation={[0, Math.PI, 0]}>
          <Character look={look} start={[0, 0]} target={[0, -1000]} />
        </group>
      ) : kind === "boda" ? (
        <>
          <Vehicle kind="boda" color="#c8102e" />
          <group position={[0, 0.25, 0.15]} rotation={[0, Math.PI, 0]}>
            <Character look={look} start={[0, 0]} pose="sit" poseAt={{ x: 0, z: 0, rot: Math.PI, y: 0.75 }} />
          </group>
        </>
      ) : kind === "plane" ? (
        <Vehicle kind="plane" color="#f5f5f4" />
      ) : kind === "train" ? (
        <Vehicle kind="train" color="#f5f5f4" />
      ) : (
        <Vehicle kind={kind === "car" ? "car" : kind} color={kind === "matatu" ? "#f2b705" : kind === "cab" ? "#f5f5f4" : (carColor ?? "#1f2937")} />
      )}
    </group>
  );
}

/** Clouds drifting past below and around the plane. */
function Sky() {
  const ref = useRef<InstancedMesh>(null);
  const clouds = useMemo(() => {
    const r = rng(3);
    return Array.from({ length: 90 }, () => ({ x: (r() - 0.5) * 140, y: -8 + r() * 14, z: -r() * SEG, s: 2 + r() * 5 }));
  }, []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    clouds.forEach((c, i) => {
      tmp.position.set(c.x, c.y, ((c.z + scroll.z * 0.6) % SEG) - SEG + 30);
      tmp.scale.set(c.s * 1.8, c.s * 0.6, c.s);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -40, -100]}>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color="#7da35f" />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, clouds.length]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </instancedMesh>
    </group>
  );
}

/** Tsavo out of the SGR window: grass, acacias and the odd giraffe. */
function Savannah() {
  const trees = useRef<InstancedMesh>(null);
  const items = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 80 }, () => ({ x: (r() < 0.5 ? -1 : 1) * (8 + r() * 60), z: -r() * SEG, s: 0.8 + r() * 1.2 }));
  }, []);
  const giraffes = useRef<(Group | null)[]>([]);
  useLayoutEffect(() => {
    const m = trees.current;
    if (!m) return;
    items.forEach((it, i) => m.setColorAt(i, col.set(i % 2 ? "#4d7c35" : "#5f8f3e")));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [items]);
  useFrame(() => {
    const m = trees.current;
    if (m) {
      items.forEach((it, i) => {
        tmp.position.set(it.x, 3 * it.s, ((it.z + scroll.z) % SEG) - SEG + 30);
        tmp.scale.set(3 * it.s, 0.7 * it.s, 3 * it.s);
        tmp.updateMatrix();
        m.setMatrixAt(i, tmp.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }
    giraffes.current.forEach((g, i) => {
      if (g) g.position.z = ((-i * 70 + scroll.z * 0.9) % SEG) - SEG + 30;
    });
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -80]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#c9b27a" />
      </mesh>
      <mesh position={[0, 0.1, -80]}>
        <boxGeometry args={[4, 0.2, 500]} />
        <meshStandardMaterial color="#6b5b4a" />
      </mesh>
      <instancedMesh ref={trees} args={[undefined, undefined, items.length]} castShadow>
        <cylinderGeometry args={[1, 0.6, 1, 8]} />
        <meshStandardMaterial />
      </instancedMesh>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (giraffes.current[i] = el)} position={[-14 - i * 6, 0, 0]}>
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[0.8, 1, 1.8]} />
            <meshStandardMaterial color="#d6a35a" />
          </mesh>
          <mesh position={[0, 3.6, -0.8]} rotation={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[0.3, 2.6, 0.3]} />
            <meshStandardMaterial color="#d6a35a" />
          </mesh>
          {[-0.3, 0.3].flatMap((x) => [-0.7, 0.7].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.75, z]}>
              <boxGeometry args={[0.15, 1.5, 0.15]} />
              <meshStandardMaterial color="#b98a46" />
            </mesh>
          )))}
        </group>
      ))}
    </group>
  );
}
