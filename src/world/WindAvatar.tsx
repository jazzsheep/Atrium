import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { WORLD } from './worldConfig';
import { useTransition } from './transitionContext';
import { REDUCED_MOTION } from '../utils/reducedMotion';

// 操作するアバター（仮版）: 淡い半透明の球＋ふわっとした外殻。
// 位置は Scene 側（コントローラ）が親グループで決める。ここは見た目＋ゆらぎ＋不透明度のみ。
// ※次の一手で「風シェーダー＋粒子」or GLB に差し替え予定。
export function WindAvatar() {
  const inner = useRef<Group>(null!);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const core = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shell = useRef<any>(null);
  const t = useTransition();

  useFrame((state) => {
    const op = 1 - t.current.closeness; // 入るほど消える
    if (inner.current) {
      inner.current.visible = op > 0.02;
      const bob = REDUCED_MOTION ? 0 : Math.sin(state.clock.elapsedTime * 1.2) * 0.06;
      inner.current.position.y = bob;
      if (!REDUCED_MOTION) inner.current.rotation.y += 0.004;
    }
    if (core.current) core.current.opacity = 0.5 * op;
    if (shell.current) shell.current.opacity = 0.14 * op;
  });

  const s = WORLD.avatar.size;
  return (
    <group ref={inner}>
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
