import { useMemo } from 'react';
import { anchorPosition, anchorQuaternion } from '../tetrahedron';

// ハブ = アバターが最初に立つ出発点（中身なし）。
// 草原に灯る淡い光の輪でそっと示す。
export function HubMark() {
  const pos = useMemo(() => anchorPosition('hub', 0.02), []);
  const quat = useMemo(() => anchorQuaternion('hub'), []);
  return (
    <group position={pos} quaternion={quat}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.028, 8, 40]} />
        <meshBasicMaterial color="#f3e7ba" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
