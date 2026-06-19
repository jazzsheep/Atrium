import { useMemo } from 'react';
import { surfacePose, WORLD, PLACES } from './worldConfig';

// 小さな町の点景（家・木・岩）。探索範囲内に決定的に散在させる。
// 3つの場所モチーフと重ならないよう、home 付近は避ける。
type Kind = 'cottage' | 'tree' | 'rock';
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
  const A = WORLD.region.a * 0.92;
  const B = WORLD.region.b * 0.92;
  const clearOfPlaces = (a: number, b: number) =>
    PLACES.every((p) => Math.hypot(a - p.a, b - p.b) > 0.22);
  const add = (kind: Kind, n: number, sMin: number, sMax: number) => {
    let k = 0;
    let guard = 0;
    while (k < n && guard < n * 30) {
      guard++;
      const a = (r() * 2 - 1) * A;
      const b = (r() * 2 - 1) * B;
      if (!clearOfPlaces(a, b)) continue;
      out.push({ a, b, kind, scale: sMin + r() * (sMax - sMin), yaw: r() * Math.PI * 2, hue: r() });
      k++;
    }
  };
  add('tree', 12, 0.7, 1.15);
  add('cottage', 6, 0.85, 1.2);
  add('rock', 5, 0.5, 0.9);
  return out;
}

function Cottage({ hue }: { hue: number }) {
  const wall = hue > 0.5 ? '#f3ead7' : '#eef0e6';
  const roof = hue > 0.5 ? '#c79a78' : '#8fae7c';
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.55, 0.4, 4]} />
        <meshStandardMaterial color={roof} roughness={1} />
      </mesh>
    </group>
  );
}

function Tree() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.07, 0.09, 0.5, 6]} />
        <meshStandardMaterial color="#9c7b54" roughness={1} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <coneGeometry args={[0.34, 0.7, 7]} />
        <meshStandardMaterial color="#86b173" roughness={1} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <coneGeometry args={[0.26, 0.5, 7]} />
        <meshStandardMaterial color="#95bd80" roughness={1} />
      </mesh>
    </group>
  );
}

function Rock() {
  return (
    <mesh position={[0, 0.12, 0]}>
      <dodecahedronGeometry args={[0.22, 0]} />
      <meshStandardMaterial color="#b9c3b0" roughness={1} />
    </mesh>
  );
}

export function Town() {
  const props = useMemo(build, []);
  return (
    <group>
      {props.map((p, i) => {
        const pose = surfacePose(p.a, p.b, 0);
        return (
          <group key={i} position={pose.position} quaternion={pose.quaternion}>
            <group rotation={[0, p.yaw, 0]} scale={p.scale}>
              {p.kind === 'cottage' && <Cottage hue={p.hue} />}
              {p.kind === 'tree' && <Tree />}
              {p.kind === 'rock' && <Rock />}
            </group>
          </group>
        );
      })}
    </group>
  );
}
