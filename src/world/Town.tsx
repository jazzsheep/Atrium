import { useMemo } from 'react';
import { surfacePose, WORLD, PLACES } from './worldConfig';
import { WMat } from './watercolorMaterial';

// 小さな町（実寸スケール、1単位≒1m）。広場・石畳の道・建物・木・街灯を配置。
// 歩ける円(townRadius)の中に決定的に散在。場所モチーフと中央広場は避ける。
type Kind = 'cottage' | 'cottage2' | 'tree' | 'rock' | 'lamp';
interface Prop {
  a: number;
  b: number;
  kind: Kind;
  scale: number;
  yaw: number;
  hue: number;
}

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(): Prop[] {
  const r = rng(0x5eed42);
  const out: Prop[] = [];
  const RR = WORLD.townRadius * 0.95;
  const ok = (a: number, b: number) =>
    Math.hypot(a, b) > 0.06 && PLACES.every((p) => Math.hypot(a - p.a, b - p.b) > 0.1);
  const add = (kind: Kind, n: number, sMin: number, sMax: number) => {
    let k = 0;
    let guard = 0;
    while (k < n && guard < n * 40) {
      guard++;
      const rad = Math.sqrt(r()) * RR;
      const ang = r() * Math.PI * 2;
      const a = Math.cos(ang) * rad;
      const b = Math.sin(ang) * rad;
      if (!ok(a, b)) continue;
      out.push({ a, b, kind, scale: sMin + r() * (sMax - sMin), yaw: r() * Math.PI * 2, hue: r() });
      k++;
    }
  };
  add('tree', 18, 0.85, 1.25);
  add('cottage', 12, 0.9, 1.2);
  add('cottage2', 6, 0.95, 1.15);
  add('rock', 7, 0.6, 1.0);
  add('lamp', 9, 0.9, 1.1);
  return out;
}

function Cottage({ hue, tall = false }: { hue: number; tall?: boolean }) {
  const h = tall ? 5 : 3.2;
  const wall = hue > 0.5 ? '#f3ead7' : '#eae7da';
  const roof = hue > 0.5 ? '#c79a78' : '#8fae7c';
  return (
    <group>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[4, h, 4]} />
        <WMat color={wall} roughness={1} />
      </mesh>
      <mesh position={[0, h + 1.0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[3.2, 2.0, 4]} />
        <WMat color={roof} roughness={1} />
      </mesh>
      <mesh position={[0, 1.0, 2.02]}>
        <planeGeometry args={[0.9, 1.6]} />
        <WMat color="#9c7547" roughness={1} />
      </mesh>
    </group>
  );
}

function Tree() {
  return (
    <group>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 2.4, 6]} />
        <WMat color="#9c7b54" roughness={1} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <coneGeometry args={[1.7, 3.2, 8]} />
        <WMat color="#86b173" roughness={1} />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <coneGeometry args={[1.2, 2.2, 8]} />
        <WMat color="#97c082" roughness={1} />
      </mesh>
    </group>
  );
}

function Rock() {
  return (
    <mesh position={[0, 0.4, 0]}>
      <dodecahedronGeometry args={[0.8, 0]} />
      <WMat color="#b9c3b0" roughness={1} />
    </mesh>
  );
}

function Lamp() {
  return (
    <group>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 3, 6]} />
        <WMat color="#6f6a5d" roughness={1} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color="#ffe9b0" />
      </mesh>
    </group>
  );
}

function Plaza() {
  const pose = surfacePose(0, 0, 0.04);
  return (
    <group position={pose.position} quaternion={pose.quaternion}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 40]} />
        <WMat color="#dccfb6" roughness={1} />
      </mesh>
    </group>
  );
}

function Paths() {
  const tiles = useMemo(() => {
    const arr: { a: number; b: number }[] = [];
    for (const p of PLACES) {
      const N = 8;
      for (let i = 1; i <= N; i++) {
        const t = i / (N + 1);
        arr.push({ a: p.a * t, b: p.b * t });
      }
    }
    return arr;
  }, []);
  return (
    <group>
      {tiles.map((tl, i) => {
        const pose = surfacePose(tl.a, tl.b, 0.05);
        return (
          <group key={i} position={pose.position} quaternion={pose.quaternion}>
            <mesh>
              <boxGeometry args={[2.6, 0.08, 2.6]} />
              <WMat color="#d8cdb8" roughness={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Town() {
  const props = useMemo(build, []);
  return (
    <group>
      <Plaza />
      <Paths />
      {props.map((p, i) => {
        const pose = surfacePose(p.a, p.b, 0);
        return (
          <group key={i} position={pose.position} quaternion={pose.quaternion}>
            <group rotation={[0, p.yaw, 0]} scale={p.scale}>
              {p.kind === 'cottage' && <Cottage hue={p.hue} />}
              {p.kind === 'cottage2' && <Cottage hue={p.hue} tall />}
              {p.kind === 'tree' && <Tree />}
              {p.kind === 'rock' && <Rock />}
              {p.kind === 'lamp' && <Lamp />}
            </group>
          </group>
        );
      })}
    </group>
  );
}
