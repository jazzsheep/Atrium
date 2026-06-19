import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

// 関わる = 草原を渡るつむじ風（渦）。
// 細くなりながら積み上がるリングを回し、つむじ風に見せる（吸い込み演出 Phase 2 の素地）。
const RINGS = [0.04, 0.16, 0.28, 0.4, 0.52];

export function Vortex() {
  const ref = useRef<Group>(null!);
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 1.7;
  });
  return (
    <group ref={ref} scale={0.62}>
      {RINGS.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, i * 0.6]}>
          <torusGeometry args={[0.46 - i * 0.08, 0.022, 8, 28]} />
          <meshStandardMaterial
            color="#d3e6c6"
            roughness={1}
            metalness={0}
            transparent
            opacity={0.62 - i * 0.07}
          />
        </mesh>
      ))}
    </group>
  );
}
