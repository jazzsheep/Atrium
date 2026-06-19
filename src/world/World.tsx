import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Group, MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { useAtrium } from '../store/useAtrium';
import { WORLD, PLACES, PLACE_BY_ID, explorationQuat } from './worldConfig';
import { Planet } from './Planet';
import { Town } from './Town';
import { PlaceMarker } from './PlaceMarker';
import { WindAvatar } from './WindAvatar';
import { TransitionContext, useTransition, type TransitionState } from './transitionContext';
import type { PlaceId } from '../types';

const R = WORLD.R;
const REST_POS = new Vector3(0, R + WORLD.cam.height, WORLD.cam.back);
const REST_LOOK = new Vector3(0, R - WORLD.cam.lookDown, -WORLD.cam.lookAhead);
const IN_POS = new Vector3(0, R + WORLD.camIn.height, WORLD.camIn.back);
const IN_LOOK = new Vector3(0, R, 0);
const clamp = MathUtils.clamp;

function easeInOut(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

// ドラッグ状態（World 直下と Scene で共有する mutable ref）。
interface DragRefs {
  target: { current: { a: number; b: number } };
  didDrag: { current: boolean };
}

function Scene({ drag }: { drag: DragRefs }) {
  const groupRef = useRef<Group>(null!);
  const phase = useAtrium((s) => s.phase);
  const location = useAtrium((s) => s.location);
  const focusPlace = useAtrium((s) => s.focusPlace);
  const t = useTransition();

  const ab = useRef({ a: 0, b: 0 });
  const closeness = useRef(0);
  const prevPhase = useRef(phase);
  const nearest = useRef<PlaceId | null>(null);
  const q = useMemo(() => new Quaternion(), []);
  const camPos = useMemo(() => new Vector3(), []);
  const camLook = useMemo(() => new Vector3(), []);

  useFrame((state, dtRaw) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);

    // 入場開始時、その場所の home を目標に（中央へ寄って入る）。
    if (phase === 'entering' && prevPhase.current !== 'entering') {
      const p = location !== 'hub' ? PLACE_BY_ID[location] : null;
      if (p) {
        drag.target.current.a = p.a;
        drag.target.current.b = p.b;
      }
    }
    prevPhase.current = phase;

    // (a,b) を目標へ緩める → world group を回す。
    const tg = drag.target.current;
    const k = 1 - Math.exp(-WORLD.drag.ease * dt);
    ab.current.a += (tg.a - ab.current.a) * k;
    ab.current.b += (tg.b - ab.current.b) * k;
    explorationQuat(ab.current.a, ab.current.b, q);
    g.quaternion.copy(q);

    // 入り具合 → カメラのドリーイン。
    const target = phase === 'entering' || phase === 'inside' ? 1 : 0;
    closeness.current += (target - closeness.current) * (1 - Math.exp(-4 * dt));
    const c = closeness.current;
    const cam = state.camera as PerspectiveCamera;
    camPos.lerpVectors(REST_POS, IN_POS, easeInOut(c));
    camLook.lerpVectors(REST_LOOK, IN_LOOK, easeInOut(c));
    cam.position.copy(camPos);
    cam.lookAt(camLook);

    // 最寄りの場所（idle のときだけ／変化時のみ store 反映）。
    if (phase === 'idle') {
      let best: PlaceId | null = null;
      let bd = 0.2;
      for (const p of PLACES) {
        const d = Math.hypot(ab.current.a - p.a, ab.current.b - p.b);
        if (d < bd) {
          bd = d;
          best = p.id;
        }
      }
      if (best !== nearest.current) {
        nearest.current = best;
        focusPlace(best);
      }
    }

    // 共有（モチーフ／アバター／オーバーレイ用）。
    t.current.closeness = c;
    t.current.active = location !== 'hub' ? location : nearest.current;
    t.current.entering = phase === 'entering';
    t.current.returning = phase === 'returning';
  });

  const handleTap = (id: PlaceId) => {
    if (drag.didDrag.current) return; // ドラッグ後のクリックは入場にしない
    const s = useAtrium.getState();
    if (s.phase !== 'idle') return;
    s.enter({ place: id });
  };

  return (
    <group ref={groupRef}>
      <Planet />
      <Town />
      {PLACES.map((p) => (
        <PlaceMarker key={p.id} def={p} onTap={handleTap} />
      ))}
    </group>
  );
}

export function World() {
  const transition = useRef<TransitionState>({
    closeness: 0,
    active: null,
    entering: false,
    returning: false,
  });
  const target = useRef({ a: 0, b: 0 });
  const didDrag = useRef(false);
  const pointer = useRef({ down: false, x: 0, y: 0, moved: 0 });

  const onDown = (e: React.PointerEvent) => {
    pointer.current = { down: true, x: e.clientX, y: e.clientY, moved: 0 };
    didDrag.current = false;
    // setPointerCapture は使わない（canvas の R3F クリック＝タップ入場を奪わないため）。
  };
  const onMove = (e: React.PointerEvent) => {
    const p = pointer.current;
    if (!p.down) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    p.moved += Math.hypot(dx, dy);
    if (p.moved > 6) didDrag.current = true;
    if (useAtrium.getState().phase !== 'idle') return; // 探索できるのは idle のときだけ
    const tg = target.current;
    tg.b = clamp(tg.b - dx * WORLD.drag.speed, -WORLD.region.b, WORLD.region.b);
    tg.a = clamp(tg.a + dy * WORLD.drag.speed, -WORLD.region.a, WORLD.region.a);
  };
  const onUp = () => {
    pointer.current.down = false;
  };

  return (
    <div
      className="world-layer"
      style={{ touchAction: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, R + WORLD.cam.height, WORLD.cam.back], fov: WORLD.fov, near: 0.1, far: R * 4 }}
      >
        <TransitionContext.Provider value={transition}>
          <ambientLight intensity={0.95} />
          <directionalLight position={[6, 12, 6]} intensity={1.05} color="#fff6df" />
          <Scene drag={{ target, didDrag }} />
          <WindAvatar />
        </TransitionContext.Provider>
      </Canvas>
    </div>
  );
}
