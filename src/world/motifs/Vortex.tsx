import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useTransition } from '../transitionContext';
import type { PlaceId } from '../../types';

// 関わる = 草原を渡るつむじ風（渦）。
// 入り演出: 近づくと回転が速まり、中心へ収束して吸い込まれていく（渦＝吸い込み）。
const RINGS = [0.04, 0.16, 0.28, 0.4, 0.52];

export function Vortex({ placeId }: { placeId: PlaceId }) {
  const ref = useRef<Group>(null!);
  const t = useTransition();
  useFrame((_, dt) => {
    const tr = t.current;
    const c = tr.active === placeId ? tr.closeness : 0;
    ref.current.rotation.y += dt * (1.7 + c * 9); // 入るほど速く
    ref.current.scale.setScalar(0.62 * (1 - c * 0.5)); // 中心へ収束
    ref.current.position.y = -c * 0.22; // わずかに沈み込む
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
