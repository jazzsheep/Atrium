import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { WORLD } from './worldConfig';
import { useTransition } from './transitionContext';
import { REDUCED_MOTION } from '../utils/reducedMotion';

// 操作するアバター（仮版）: 淡い半透明の球＋ふわっとした外殻。
// 中央固定（world が下を流れる）。入るほど消える（closeness で不透明度）。
// ※次の一手で「風シェーダー＋粒子」に差し替え予定。
export function WindAvatar() {
  const ref = useRef<Group>(null!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const core = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shell = useRef<any>(null);
  const t = useTransition();

  useFrame((state) => {
    const op = 1 - t.current.closeness;
    if (ref.current) {
      ref.current.visible = op > 0.02;
      const bob = REDUCED_MOTION ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
      ref.current.position.set(0, WORLD.R + WORLD.avatar.lift + bob, 0);
      if (!REDUCED_MOTION) ref.current.rotation.y += 0.004;
    }
    if (core.current) core.current.opacity = 0.5 * op;
    if (shell.current) shell.current.opacity = 0.14 * op;
  });

  const s = WORLD.avatar.size;
  return (
    <group ref={ref} position={[0, WORLD.R + WORLD.avatar.lift, 0]}>
      <mesh scale={s}>
        <icosahedronGeometry args={[1, 3]} />
        <meshStandardMaterial ref={core} color="#eaf4ff" roughness={0.4} metalness={0} transparent opacity={0.5} />
      </mesh>
      <mesh scale={s * 1.18}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial ref={shell} color="#ffffff" transparent opacity={0.14} />
      </mesh>
    </group>
  );
}
