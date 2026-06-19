import { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { surfacePose, WORLD, type PlaceDef } from './worldConfig';
import { House } from './motifs/House';
import { Balloon } from './motifs/Balloon';
import { Vortex } from './motifs/Vortex';
import type { PlaceId } from '../types';

// 町に置かれた1つの場所（モチーフ＋タップ）。world group の子として一緒に流れる。
export function PlaceMarker({ def, onTap }: { def: PlaceDef; onTap: (id: PlaceId) => void }) {
  const pose = useMemo(() => surfacePose(def.a, def.b, def.float), [def]);

  const handle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onTap(def.id);
  };

  return (
    <group position={pose.position} quaternion={pose.quaternion} onClick={handle}>
      <group scale={WORLD.motifScale}>
        {def.motif === 'house' && <House placeId={def.id} />}
        {def.motif === 'balloon' && <Balloon placeId={def.id} />}
        {def.motif === 'vortex' && <Vortex placeId={def.id} />}
      </group>
    </group>
  );
}
