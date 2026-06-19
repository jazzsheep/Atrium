import { useMemo, useRef } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { anchorPosition, anchorQuaternion, RADIUS, type PlaceMeta } from './tetrahedron';
import { House } from './motifs/House';
import { Balloon } from './motifs/Balloon';
import { Vortex } from './motifs/Vortex';
import type { PlaceId } from '../types';

// 球面に置かれた1つの場所（モチーフ＋タップ）。world group の子として一緒に回り込む。
export function PlaceMarker({
  meta,
  onTap,
}: {
  meta: PlaceMeta;
  onTap: (id: PlaceId) => void;
}) {
  const ref = useRef<Group>(null!);
  const pos = useMemo(() => anchorPosition(meta.id, meta.float), [meta]);
  const quat = useMemo(() => anchorQuaternion(meta.id), [meta]);
  const tmp = useMemo(() => new Vector3(), []);

  const handle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    // 球の裏に隠れている（中心より奥 かつ シルエット円の内側）ときだけ無視。
    // 地平線からのぞく浮いた場所（rho >= RADIUS）は見えているのでタップ可。
    ref.current.getWorldPosition(tmp);
    const rho = Math.hypot(tmp.x, tmp.y);
    if (tmp.z < 0 && rho < RADIUS) return;
    onTap(meta.id);
  };

  return (
    <group ref={ref} position={pos} quaternion={quat} onClick={handle}>
      {meta.motif === 'house' && <House placeId={meta.id} />}
      {meta.motif === 'balloon' && <Balloon placeId={meta.id} />}
      {meta.motif === 'vortex' && <Vortex placeId={meta.id} />}
    </group>
  );
}
