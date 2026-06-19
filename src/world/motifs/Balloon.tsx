import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';

// 見に行く = 青空に浮かぶ風船（作品）。
// ★虹彩（ホログラム）はここだけに宿す（Three.js MeshPhysicalMaterial の iridescence）。
// 呼吸するようにゆっくり膨らむ（貫通演出 Phase 2 の素地）。
export function Balloon() {
  const ref = useRef<Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = 0.6 * (1 + Math.sin(t * 1.3) * 0.04);
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshPhysicalMaterial
        color="#eaf2ff"
        roughness={0.4}
        metalness={0}
        iridescence={1}
        iridescenceIOR={1.3}
        iridescenceThicknessRange={[120, 560]}
        clearcoat={0.35}
        transparent
        opacity={0.82}
      />
    </mesh>
  );
}
