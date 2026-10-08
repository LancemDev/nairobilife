"use client";

import { MapControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Object3D, Vector3, type Group } from "three";
import type { Profile } from "@/online/api";
import { buildCity, type City, type CityId, type Landmark, type LandmarkKind, type Road } from "./city";
import { Character } from "./Character";
import { LIVERIES } from "./liveries";
import { VehicleModel, type VehicleName } from "./Vehicles";

const tmp = new Object3D();
const col = new Color();
const v = new Vector3();

export interface CityViewProps {
  city: CityId;
  homeEstate: string;
  /** Where the player is now (venue id or "home"), to centre the camera and drop their pin. */
  here: string;
  players: Profile[];
  selected: string | null;
  onSelect: (landmark: Landmark) => void;
  onPlayer: (username: string) => void;
  counts: Record<string, number>;
  /** DOM element the pins render into, positioned over the canvas. */
  pins: React.RefObject<Map<string, HTMLElement | null>>;
}

export default function CityView(props: CityViewProps) {
  const city = useMemo(() => buildCity(props.city, props.homeEstate), [props.city, props.homeEstate]);
  const focus = city.landmarks.find((l) => l.id === props.here) ?? city.landmarks[0];
  const placed = useMemo(() => placePlayers(city, props.players), [city, props.players]);
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ position: [focus.x + 30, 55, focus.z + 45], fov: 38 }} className="touch-none">
      <color attach="background" args={["#4a90b8"]} />
      <hemisphereLight args={["#ffffff", "#6b8f4e", 0.95]} />
      <directionalLight position={[60, 90, 40]} intensity={1.5} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-120} shadow-camera-right={120} shadow-camera-top={120} shadow-camera-bottom={-120} />
      <Board city={city} />
      <Roads roads={city.roads} />
      <Houses city={city} />
      <Trees city={city} />
      {city.landmarks.map((l) => (
        <LandmarkModel key={l.id} l={l} selected={props.selected === l.id} onClick={() => props.onSelect(l)} />
      ))}
      <Suspense fallback={null}>
        <Traffic roads={city.roads.filter((r) => r.w > 2)} />
        {city.runways.length > 0 && <Plane runway={city.runways[0]} />}
      </Suspense>
      <PlayersOnMap placed={placed} onPlayer={props.onPlayer} />
      <Pins city={city} placed={placed} pins={props.pins} />
      <MapControls makeDefault target={[focus.x, 0, focus.z]} enableRotate={false} screenSpacePanning={false} minDistance={20} maxDistance={180} maxPolarAngle={1.05} />
      <Bounds half={city.half} />
    </Canvas>
  );
}

/** The city sits on a thick board floating in water, like a diorama. */
function Board({ city }: { city: City }) {
  const s = city.half * 2;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.2, 0]}>
        <planeGeometry args={[s * 4, s * 4]} />
        <meshStandardMaterial color="#4a90b8" />
      </mesh>
      <mesh position={[0, -1, 0]} receiveShadow>
        <boxGeometry args={[s, 2, s]} />
        <meshStandardMaterial color="#6e5038" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[s, s]} />
        <meshStandardMaterial color="#a8c48a" />
      </mesh>
      {city.patches.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, 0.02 + i * 0.001, p.z]} receiveShadow>
          <circleGeometry args={[p.r, 40]} />
          <meshStandardMaterial color={p.color} />
        </mesh>
      ))}
      {city.water.map((w, i) => (
        <mesh key={`w${i}`} rotation={[-Math.PI / 2, 0, w.rot]} position={[w.x, 0.05, w.z]}>
          <planeGeometry args={[w.w, w.d]} />
          <meshStandardMaterial color="#3b8fc4" />
        </mesh>
      ))}
      {city.runways.map((r, i) => (
        <group key={`r${i}`} position={[r.x, 0.06, r.z]} rotation={[0, r.rot, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[r.w, r.d]} />
            <meshStandardMaterial color="#3a3f45" />
          </mesh>
          {Array.from({ length: Math.floor(Math.max(r.w, r.d) / 3) }, (_, k) => (
            <mesh key={k} rotation={[-Math.PI / 2, 0, 0]} position={r.w > r.d ? [-r.w / 2 + 1.5 + k * 3, 0.01, 0] : [0, 0.01, -r.d / 2 + 1.5 + k * 3]}>
              <planeGeometry args={r.w > r.d ? [1.4, 0.18] : [0.18, 1.4]} />
              <meshStandardMaterial color="#f5f5f4" />
            </mesh>
          ))}
        </group>
      ))}
      {city.turbines.map(([x, z], i) => (
        <Turbine key={`t${i}`} x={x} z={z} />
      ))}
    </group>
  );
}

function Turbine({ x, z }: { x: number; z: number }) {
  const blades = useRef<Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * 1.5;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.2, 6, 8]} />
        <meshStandardMaterial color="#f5f5f4" />
      </mesh>
      <group ref={blades} position={[0, 6, 0.25]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]} position={[0, 0, 0]}>
            <boxGeometry args={[0.18, 3, 0.05]} />
            <meshStandardMaterial color="#f5f5f4" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Roads({ roads }: { roads: Road[] }) {
  return (
    <group>
      {roads.map((r, i) => {
        const dx = r.b[0] - r.a[0];
        const dz = r.b[1] - r.a[1];
        const len = Math.hypot(dx, dz);
        return (
          <group key={i} position={[(r.a[0] + r.b[0]) / 2, 0.08 + (r.w > 2 ? 0.01 : 0), (r.a[1] + r.b[1]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[len + r.w, r.w]} />
              <meshStandardMaterial color={r.w > 2 ? "#6b7280" : "#8b919a"} />
            </mesh>
            {r.w > 2 && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <planeGeometry args={[len, 0.12]} />
                <meshStandardMaterial color="#f2b705" />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** Every house and tower in two instanced draws (walls and roofs). */
function Houses({ city }: { city: City }) {
  const walls = useRef<InstancedMesh>(null);
  const roofs = useRef<InstancedMesh>(null);
  const roofed = useMemo(() => city.buildings.filter((b) => b.roof), [city]);
  useLayoutEffect(() => {
    const w = walls.current;
    const r = roofs.current;
    if (!w || !r) return;
    city.buildings.forEach((b, i) => {
      tmp.position.set(b.x, b.h / 2, b.z);
      tmp.rotation.set(0, b.rot, 0);
      tmp.scale.set(b.w, b.h, b.d);
      tmp.updateMatrix();
      w.setMatrixAt(i, tmp.matrix);
      w.setColorAt(i, col.set(b.color));
    });
    roofed.forEach((b, i) => {
      tmp.position.set(b.x, b.h + b.w * 0.28, b.z);
      tmp.rotation.set(0, b.rot + Math.PI / 4, 0);
      tmp.scale.set(b.w * 0.74, b.w * 0.56, b.d * 0.74);
      tmp.updateMatrix();
      r.setMatrixAt(i, tmp.matrix);
      r.setColorAt(i, col.set(b.roof!));
    });
    w.instanceMatrix.needsUpdate = true;
    r.instanceMatrix.needsUpdate = true;
    if (w.instanceColor) w.instanceColor.needsUpdate = true;
    if (r.instanceColor) r.instanceColor.needsUpdate = true;
  }, [city, roofed]);
  return (
    <group>
      <instancedMesh ref={walls} args={[undefined, undefined, city.buildings.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={roofs} args={[undefined, undefined, Math.max(1, roofed.length)]} castShadow>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

function Trees({ city }: { city: City }) {
  const crowns = useRef<InstancedMesh>(null);
  const trunks = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const c = crowns.current;
    const t = trunks.current;
    if (!c || !t) return;
    city.trees.forEach((tr, i) => {
      tmp.position.set(tr.x, tr.s * 1.4, tr.z);
      tmp.rotation.set(0, 0, 0);
      tmp.scale.setScalar(tr.s * (tr.palm ? 0.8 : 1));
      tmp.updateMatrix();
      c.setMatrixAt(i, tmp.matrix);
      c.setColorAt(i, col.set(tr.palm ? "#3f8f4e" : i % 3 ? "#2d6a4f" : "#40916c"));
      tmp.position.set(tr.x, tr.s * 0.5, tr.z);
      tmp.scale.set(tr.s * 0.25, tr.s, tr.s * 0.25);
      tmp.updateMatrix();
      t.setMatrixAt(i, tmp.matrix);
    });
    c.instanceMatrix.needsUpdate = true;
    t.instanceMatrix.needsUpdate = true;
    if (c.instanceColor) c.instanceColor.needsUpdate = true;
  }, [city]);
  return (
    <group>
      <instancedMesh ref={crowns} args={[undefined, undefined, Math.max(1, city.trees.length)]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, Math.max(1, city.trees.length)]}>
        <cylinderGeometry args={[0.5, 0.6, 1, 6]} />
        <meshStandardMaterial color="#6b4423" />
      </instancedMesh>
    </group>
  );
}

const KIND_STYLE: Record<LandmarkKind, { base: string; body: string; h: number; w: number }> = {
  tower: { base: "#d6d3d1", body: "#7f9bb3", h: 9, w: 3.4 },
  mall: { base: "#d6d3d1", body: "#e5e7eb", h: 3, w: 6 },
  market: { base: "#d6c8ae", body: "#c8102e", h: 1.4, w: 5 },
  club: { base: "#3f3f46", body: "#1f2937", h: 3, w: 4 },
  hospital: { base: "#e5e7eb", body: "#f8fafc", h: 6, w: 4.6 },
  church: { base: "#e5e7eb", body: "#f1e7d6", h: 4, w: 3.6 },
  mosque: { base: "#e5e7eb", body: "#f5f5f4", h: 3.4, w: 4 },
  stadium: { base: "#d6d3d1", body: "#e5e7eb", h: 2.2, w: 8 },
  terminal: { base: "#d6d3d1", body: "#dbeafe", h: 3, w: 9 },
  campus: { base: "#e7e5e4", body: "#b45309", h: 3.6, w: 5 },
  park: { base: "#86b36a", body: "#6b4423", h: 0.6, w: 4 },
  civic: { base: "#e5e7eb", body: "#cbd5e1", h: 7, w: 4 },
  restaurant: { base: "#e7e5e4", body: "#f59e0b", h: 2.4, w: 3.6 },
  station: { base: "#d6d3d1", body: "#f5f5f4", h: 2.6, w: 7 },
  hotel: { base: "#e7e5e4", body: "#f8fafc", h: 7, w: 4 },
  beach: { base: "#f4e4bc", body: "#f59e0b", h: 0.8, w: 4 },
  home: { base: "#c5d9b0", body: "#fef3c7", h: 2, w: 2.6 },
};

/** A recognisable building for each place, on a plaza. */
function LandmarkModel({ l, selected, onClick }: { l: Landmark; selected: boolean; onClick: () => void }) {
  const s = KIND_STYLE[l.kind];
  return (
    <group
      position={[l.x, 0, l.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[s.w + 1.6, 0.2, s.w + 1.6]} />
        <meshStandardMaterial color={selected ? "#f2b705" : s.base} />
      </mesh>
      <mesh position={[0, s.h / 2 + 0.2, 0]} castShadow>
        <boxGeometry args={[s.w, s.h, s.w * 0.75]} />
        <meshStandardMaterial color={s.body} />
      </mesh>
      {l.kind === "hospital" && (
        <group position={[0, s.h + 0.25, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.1, 0.5]} />
            <meshStandardMaterial color="#c8102e" />
          </mesh>
          <mesh>
            <boxGeometry args={[0.5, 0.1, 1.6]} />
            <meshStandardMaterial color="#c8102e" />
          </mesh>
        </group>
      )}
      {l.kind === "church" && (
        <mesh position={[0, s.h + 1.4, 0]} castShadow>
          <coneGeometry args={[0.8, 2.6, 4]} />
          <meshStandardMaterial color="#7c2d12" />
        </mesh>
      )}
      {l.kind === "mosque" && (
        <mesh position={[0, s.h + 0.3, 0]} castShadow>
          <sphereGeometry args={[1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#0b7a3b" />
        </mesh>
      )}
      {l.kind === "stadium" && (
        <mesh position={[0, s.h + 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[s.w * 0.7, s.w * 0.45]} />
          <meshStandardMaterial color="#15803d" />
        </mesh>
      )}
      {l.kind === "club" && (
        <mesh position={[0, s.h + 0.3, 0]}>
          <boxGeometry args={[s.w * 0.9, 0.2, 0.3]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.8} />
        </mesh>
      )}
      {(l.kind === "market" || l.kind === "restaurant") && (
        <mesh position={[0, s.h + 0.5, 0]} castShadow>
          <coneGeometry args={[s.w * 0.62, 1, 4]} />
          <meshStandardMaterial color={l.kind === "market" ? "#f2b705" : "#c8102e"} />
        </mesh>
      )}
      {l.kind === "home" && (
        <mesh position={[0, s.h + 0.9, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[2, 1.6, 4]} />
          <meshStandardMaterial color="#c8102e" />
        </mesh>
      )}
    </group>
  );
}

/** Ambient matatus and cars driving along the arterials. */
function Traffic({ roads }: { roads: Road[] }) {
  const cars = useMemo(
    () =>
      Array.from({ length: Math.min(60, roads.length * 4) }, (_, i) => ({
        road: roads[i % roads.length],
        t: (i * 0.37) % 1,
        speed: 0.03 + ((i * 7) % 5) * 0.008,
        dir: i % 2 ? 1 : -1,
        color: ["#f2b705", "#c8102e", "#f5f5f4", "#2563eb", "#7c3aed", "#0b7a3b"][i % 6],
        model: (["matatu", "sedan", "nganya", "wagon", "boda", "taxi", "suv", "matatu", "van"] as VehicleName[])[i % 9],
      })),
    [roads],
  );
  const refs = useRef<(Group | null)[]>([]);
  useFrame((_, dt) => {
    cars.forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;
      c.t = (c.t + c.speed * dt * c.dir + 1) % 1;
      const [ax, az] = c.road.a;
      const [bx, bz] = c.road.b;
      const ang = Math.atan2(bz - az, bx - ax);
      const off = c.dir * 0.5;
      g.position.set(ax + (bx - ax) * c.t - Math.sin(ang) * off, 0.35, az + (bz - az) * c.t + Math.cos(ang) * off);
      g.rotation.y = -ang + (c.dir < 0 ? Math.PI : 0);
    });
  });
  return (
    <group>
      {cars.map((c, i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          {/* Real models, nose turned to +X (the road direction), at map scale. */}
          <group rotation={[0, -Math.PI / 2, 0]} position={[0, -0.23, 0]} scale={c.model === "boda" ? 0.32 : 0.24}>
            <VehicleModel name={c.model} color={c.model === "sedan" || c.model === "suv" ? c.color : undefined} livery={c.model === "nganya" ? LIVERIES[i % LIVERIES.length] : null} />
          </group>
        </group>
      ))}
    </group>
  );
}

/** A plane that taxis, takes off over the city, and comes round again. */
function Plane({ runway }: { runway: City["runways"][number] }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    const p = g.current;
    if (!p) return;
    const t = (clock.elapsedTime % 24) / 24;
    const roll = Math.min(1, t / 0.35);
    const along = -runway.w / 2 + roll * runway.w;
    const climb = Math.max(0, t - 0.25) * 60;
    p.position.set(runway.x + Math.cos(runway.rot) * (along + climb * 2), 0.6 + climb, runway.z - Math.sin(runway.rot) * (along + climb * 2));
    p.rotation.set(0, runway.rot, t > 0.25 ? 0.15 : 0);
  });
  return (
    <group ref={g}>
      <group rotation={[0, -Math.PI / 2, 0]} position={[0, -0.6, 0]} scale={0.14}>
        <VehicleModel name="airliner" />
      </group>
    </group>
  );
}

/** Where each online player stands: around the landmark of the place they're at. */
export function placePlayers(city: City, players: Profile[]) {
  const byPlace = new Map<string, number>();
  const out: { p: Profile; x: number; z: number }[] = [];
  for (const p of players) {
    const l = city.landmarks.find((x) => x.id === p.venue && p.venue !== "home") ?? city.landmarks.find((x) => x.area === p.area && x.kind !== "home");
    if (!l) continue;
    const n = byPlace.get(l.id) ?? 0;
    byPlace.set(l.id, n + 1);
    const ang = n * 2.1 + 0.4;
    out.push({ p, x: l.x + Math.cos(ang) * (3.4 + n * 0.4), z: l.z + Math.sin(ang) * (3.4 + n * 0.4) });
  }
  return out;
}

function PlayersOnMap({ placed, onPlayer }: { placed: ReturnType<typeof placePlayers>; onPlayer: (u: string) => void }) {
  return (
    <group>
      {placed.map(({ p, x, z }) => (
        <group key={p.username} position={[x, 0, z]} scale={1.6}>
          <Character
            look={p.look}
            start={[0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onPlayer(p.username);
            }}
          />
        </group>
      ))}
    </group>
  );
}

/** Projects landmark and player pins (DOM elements) over the canvas each frame. */
function Pins({ city, placed, pins }: { city: City; placed: ReturnType<typeof placePlayers>; pins: CityViewProps["pins"] }) {
  useFrame(({ camera, size }) => {
    const map = pins.current;
    const put = (key: string, x: number, y: number, z: number) => {
      const el = map.get(key);
      if (!el) return;
      v.set(x, y, z).project(camera);
      el.style.transform = v.z > 1 ? "translate(-9999px,0)" : `translate(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px) translate(-50%, -100%)`;
    };
    for (const l of city.landmarks) put(l.id, l.x, KIND_STYLE[l.kind].h + 3, l.z);
    for (const { p, x, z } of placed) put(`player:${p.username}`, x, 3.8, z);
  });
  return null;
}

/** Keeps panning on the board. */
function Bounds({ half }: { half: number }) {
  useFrame(({ controls: c, camera }) => {
    const controls = c as unknown as { target: Vector3 } | null;
    if (!controls) return;
    const t = controls.target;
    const cx = Math.max(-half, Math.min(half, t.x));
    const cz = Math.max(-half, Math.min(half, t.z));
    if (cx !== t.x || cz !== t.z) {
      camera.position.x += cx - t.x;
      camera.position.z += cz - t.z;
      t.x = cx;
      t.z = cz;
    }
  });
  return null;
}
