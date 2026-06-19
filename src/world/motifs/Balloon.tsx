import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { useTransition } from '../transitionContext';
import { REDUCED_MOTION } from '../../utils/reducedMotion';
import type { PlaceId } from '../../types';

// 見に行く = 青空に浮かぶ風船（作品）。★虹彩はここだけ。
// 入り演出: 呼吸するように膨らみ、近づくと膜を押し広げて貫通していく（風船＝貫通）。
export function Balloon({ placeId }: { placeId: PlaceId }) {
  const ref = useRef<Mesh>(null!);
  const t = useTransition();
  useFrame((state) => {
    const tr = t.current;
    const c = tr.active === placeId ? tr.closeness : 0;
    // 呼吸（装飾）は reduced-motion では止める。
    const breathe = 1 + (REDUCED_MOTION ? 0 : Math.sin(state.clock.elapsedTime * 1.3) * 0.04);
    const grow = 1 + c * 1.7; // 入るほど膨らんで視界を満たす
    ref.current.scale.setScalar(0.6 * breathe * grow);
    (ref.current.material as { opacity: number }).opacity = 0.82 - c * 0.22; // 膜が薄れ内側へ
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
