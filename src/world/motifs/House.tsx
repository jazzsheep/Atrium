import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, MathUtils, type Mesh } from 'three';
import { useTransition } from '../transitionContext';
import type { PlaceId } from '../../types';

// 知る = 草原に建つ家（水彩トーン）。
// 入り演出: 近づくと窓辺のカーテンが風で舞い上がり、光が漏れて室内へ（家＝カーテン）。
export function House({ placeId }: { placeId: PlaceId }) {
  const t = useTransition();
  const curtainL = useRef<Mesh>(null!);
  const curtainR = useRef<Mesh>(null!);
  const light = useRef<Mesh>(null!);

  useFrame((state) => {
    const tr = t.current;
    const c = tr.active === placeId ? tr.closeness : 0;
    const sway = Math.sin(state.clock.elapsedTime * 2.2) * 0.06 * c; // 風の揺らぎ
    const lift = MathUtils.lerp(0, Math.PI * 0.6, c);
    if (curtainL.current) curtainL.current.rotation.x = -lift - sway;
    if (curtainR.current) curtainR.current.rotation.x = -lift + sway;
    if (light.current) {
      (light.current.material as { opacity: number }).opacity = 0.45 + 0.55 * c;
      light.current.scale.setScalar(1 + c * 0.7);
    }
  });

  return (
    <group scale={0.5}>
      {/* 壁（塗り残しの白っぽいクリーム） */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.74, 0.7, 0.74]} />
        <meshStandardMaterial color="#fbf6ea" roughness={1} metalness={0} />
      </mesh>
      {/* 屋根（淡い緑） */}
      <mesh position={[0, 0.86, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.66, 0.5, 4]} />
        <meshStandardMaterial color="#a9c79a" roughness={1} metalness={0} />
      </mesh>
      {/* 窓から漏れる光 */}
      <mesh ref={light} position={[0, 0.42, 0.382]}>
        <planeGeometry args={[0.26, 0.32]} />
        <meshBasicMaterial color="#fff3c9" transparent opacity={0.45} />
      </mesh>
      {/* カーテン（窓の上端あたりを軸に舞い上がる） */}
      <mesh ref={curtainL} position={[-0.07, 0.42, 0.4]}>
        <planeGeometry args={[0.13, 0.34]} />
        <meshStandardMaterial color="#fffdf6" roughness={1} transparent opacity={0.92} side={DoubleSide} />
      </mesh>
      <mesh ref={curtainR} position={[0.07, 0.42, 0.4]}>
        <planeGeometry args={[0.13, 0.34]} />
        <meshStandardMaterial color="#fff7ec" roughness={1} transparent opacity={0.92} side={DoubleSide} />
      </mesh>
    </group>
  );
}
