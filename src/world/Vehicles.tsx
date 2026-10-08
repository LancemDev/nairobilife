"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { Livery } from "./liveries";
import { Box3, CanvasTexture, Color, DoubleSide, Group, MeshStandardMaterial, SRGBColorSpace, Vector3, type Mesh, type Texture } from "three";

const DIR = "/models/vehicles/";

export type VehicleName = "airliner" | "boda" | "matatu" | "nganya" | "taxi" | "wagon" | "sedan" | "suv" | "police" | "truck" | "ambulance" | "van" | "suv-luxury";

/** Native heading (radians to turn so the nose points down -Z) and real length in metres. */
const SPEC: Record<VehicleName, { turn: number; length: number; body?: string; glass?: string; mirror?: boolean }> = {
  airliner: { turn: Math.PI, length: 32 },
  boda: { turn: Math.PI, length: 2.0 },
  // Modelled left-hand drive: mirrored so the driver sits on the right, as in Kenya.
  matatu: { turn: Math.PI / 2, length: 5.2, body: "FFFFFF", mirror: true },
  nganya: { turn: Math.PI, length: 8.6, body: "FFFFFF", glass: "039BE5" },
  taxi: { turn: Math.PI, length: 4.5 },
  wagon: { turn: Math.PI, length: 4.3 },
  sedan: { turn: Math.PI, length: 4.4 },
  suv: { turn: Math.PI, length: 4.6 },
  police: { turn: Math.PI, length: 4.6 },
  truck: { turn: Math.PI, length: 5.4 },
  ambulance: { turn: Math.PI, length: 5.6 },
  van: { turn: Math.PI, length: 4.8 },
  "suv-luxury": { turn: Math.PI, length: 4.8 },
};

// ---------------------------------------------------------------------------
// Nganya liveries (data in ./liveries).

const liveryCache = new Map<string, Texture>();
/** Paints a livery onto a canvas: the side of the bus, front at the left. */
function liveryTexture(l: Livery): Texture {
  const hit = liveryCache.get(l.name);
  if (hit) return hit;
  const W = 1024;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, l.base[0]);
  grad.addColorStop(1, l.base[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const rnd = (() => {
    let s = l.name.length * 977;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();

  if (l.motif === "stripes" || l.motif === "lions") {
    g.fillStyle = l.accent;
    for (let i = 0; i < 3; i++) g.fillRect(0, H * 0.72 + i * 14, W, 6);
    g.fillStyle = l.base[1];
    g.beginPath();
    g.moveTo(W * 0.55, H);
    g.lineTo(W * 0.75, 0);
    g.lineTo(W * 0.85, 0);
    g.lineTo(W * 0.65, H);
    g.fill();
  }
  if (l.motif === "bee") {
    g.fillStyle = l.base[1];
    for (let x = -H; x < W; x += 90) {
      g.beginPath();
      g.moveTo(x, H);
      g.lineTo(x + 45, H);
      g.lineTo(x + 45 + H, 0);
      g.lineTo(x + H, 0);
      g.fill();
    }
    g.fillStyle = l.base[0];
    g.fillRect(W * 0.18, H * 0.18, W * 0.64, H * 0.5);
  }
  if (l.motif === "dollars") {
    g.font = "bold 64px Impact, sans-serif";
    g.globalAlpha = 0.25;
    g.fillStyle = l.ink;
    for (let i = 0; i < 40; i++) g.fillText("$", rnd() * W, 40 + rnd() * H);
    g.globalAlpha = 1;
  }
  if (l.motif === "graffiti" || l.motif === "wick") {
    // Spray-paint blobs and drips.
    const cols = l.motif === "wick" ? [l.accent, "#3f3f46", l.base[1]] : [l.accent, "#f97316", "#22c55e", "#facc15", l.base[1]];
    for (let i = 0; i < 70; i++) {
      g.globalAlpha = 0.35 + rnd() * 0.4;
      g.fillStyle = cols[Math.floor(rnd() * cols.length)];
      g.beginPath();
      g.arc(rnd() * W, rnd() * H, 6 + rnd() * 34, 0, Math.PI * 2);
      g.fill();
      if (rnd() < 0.3) g.fillRect(rnd() * W, rnd() * H * 0.6, 3, 20 + rnd() * 60);
    }
    g.globalAlpha = 1;
    if (l.motif === "wick") {
      // A silhouette in a suit with a pencil, John Wick style.
      g.fillStyle = "#0a0a0a";
      g.beginPath();
      g.arc(W * 0.86, H * 0.3, 26, 0, Math.PI * 2);
      g.fill();
      g.fillRect(W * 0.86 - 40, H * 0.42, 80, H * 0.6);
      g.strokeStyle = l.accent;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(W * 0.86 + 40, H * 0.55);
      g.lineTo(W * 0.86 + 80, H * 0.4);
      g.stroke();
    }
  }
  // The name: big, outlined, slightly tilted, like the real ones.
  g.save();
  g.translate(W * 0.42, H * 0.47);
  g.rotate(-0.06);
  g.font = `900 ${l.name.length > 7 ? 92 : 118}px Impact, "Arial Black", sans-serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 14;
  g.strokeStyle = l.motif === "bee" ? "#f2b705" : "#000000";
  g.strokeText(l.name, 0, 0);
  g.fillStyle = l.ink;
  g.fillText(l.name, 0, 0);
  g.restore();
  g.font = "bold 26px sans-serif";
  g.fillStyle = l.ink;
  g.textAlign = "left";
  g.fillText(l.route.toUpperCase(), 24, H - 24);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  liveryCache.set(l.name, tex);
  return tex;
}

/** Projects the livery onto the sides of the body (object space), leaving the roof and ends plain. */
function liveried(base: MeshStandardMaterial, tex: Texture, box: Box3, roof: string) {
  const mat = base.clone();
  mat.color = new Color("#ffffff");
  mat.side = DoubleSide;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLivery = { value: tex };
    sh.uniforms.uMin = { value: box.min.clone() };
    sh.uniforms.uSize = { value: box.getSize(new Vector3()) };
    sh.uniforms.uRoof = { value: new Color(roof) };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvObjPos = position;\nvObjNormal = normal;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vObjPos;\nvarying vec3 vObjNormal;\nuniform sampler2D uLivery;\nuniform vec3 uMin;\nuniform vec3 uSize;\nuniform vec3 uRoof;")
      .replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        vec3 q = (vObjPos - uMin) / uSize;
        // Long axis is the model's own Z here (front at +Z), height is Y.
        float side = step(0.45, abs(vObjNormal.x));
        float u = vObjNormal.x > 0.0 ? 1.0 - q.z : q.z;
        vec3 paint = texture2D(uLivery, vec2(u, q.y)).rgb;
        diffuseColor.rgb = mix(uRoof, paint, side);`,
      );
  };
  mat.customProgramCacheKey = () => "nl-livery";
  return mat;
}

/**
 * A real vehicle model, nose pointing down -Z, wheels on y=0, scaled to its real length.
 * `color` repaints the body; `livery` wraps a nganya in its route's art.
 */
export function VehicleModel({ name, color, livery, interior = false }: { name: VehicleName; color?: string; livery?: Livery | null; interior?: boolean }) {
  const gltf = useGLTF(`${DIR}${name}.glb`);
  const spec = SPEC[name];
  const object = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const nativeBox = new Box3().setFromObject(scene);
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mats = (Array.isArray(m.material) ? m.material : [m.material]) as MeshStandardMaterial[];
      const next = mats.map((mat) => {
        if (spec.body && mat.name === spec.body) {
          if (livery) {
            // Quantized meshes keep positions in their own space: use the geometry's box, not the scene's.
            m.geometry.computeBoundingBox();
            return liveried(mat, liveryTexture(livery), m.geometry.boundingBox ?? nativeBox, livery.base[0]);
          }
          if (color) {
            const c = mat.clone();
            c.color = new Color(color);
            return c;
          }
        }
        if (interior) {
          const c = mat.clone();
          c.side = DoubleSide;
          // From inside, glass should be see-through (tinted), not a solid block.
          if (spec.glass && mat.name === spec.glass) {
            c.transparent = true;
            c.opacity = 0.22;
            c.depthWrite = false;
          }
          return c;
        }
        return mat;
      });
      m.material = Array.isArray(m.material) ? next : next[0];
    });
    // Kenney cars and others without a named body: tint everything that isn't dark trim.
    if (color && !spec.body)
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        const tint = (mat: MeshStandardMaterial) => {
          const hsl = { h: 0, s: 0, l: 0 };
          mat.color.getHSL(hsl);
          if (hsl.s <= 0.25 || hsl.l <= 0.2) return mat;
          const c = mat.clone();
          c.color = new Color(color);
          return c;
        };
        m.material = Array.isArray(m.material) ? (m.material as MeshStandardMaterial[]).map(tint) : tint(m.material as MeshStandardMaterial);
      });
    const wrap = new Group();
    const inner = new Group();
    inner.add(scene);
    inner.rotation.y = spec.turn;
    // The model's sideways axis is its own Z (it was built nose-to +X).
    if (spec.mirror) inner.scale.z = -1;
    wrap.add(inner);
    wrap.updateMatrixWorld(true);
    const box = new Box3().setFromObject(wrap);
    const size = box.getSize(new Vector3());
    const k = spec.length / Math.max(size.z, 0.0001);
    const center = box.getCenter(new Vector3());
    inner.position.set(-center.x, -box.min.y, -center.z);
    wrap.scale.setScalar(k);
    return wrap;
  }, [gltf.scene, spec, color, livery, interior]);
  return <primitive object={object} />;
}

/** Real-world sizes after scaling, for placing riders and passengers. */
export const vehicleLength = (name: VehicleName) => SPEC[name].length;

for (const n of ["matatu", "nganya", "boda", "airliner", "sedan", "suv", "taxi", "wagon"]) useGLTF.preload(`${DIR}${n}.glb`);
