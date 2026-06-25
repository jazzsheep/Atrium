import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import { useAtrium } from '../store/useAtrium';
import { WORLD, PLACES, PLACE_BY_ID, surfaceDir, NORTH, NPR } from './worldConfig';
import { Planet } from './Planet';
import { Sky } from './Sky';
import { Town } from './Town';
import { PlaceMarker } from './PlaceMarker';
import { WindAvatar } from './WindAvatar';
import { Watercolor } from './WatercolorEffect';
import { Joystick } from '../ui/Joystick';
import { EffectComposer } from '@react-three/postprocessing';
import { TransitionContext, useTransition, type TransitionState } from './transitionContext';
import type { PlaceId } from '../types';

const UP = NORTH;
const clamp = MathUtils.clamp;
function easeInOut(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

interface Refs {
  control: { current: { mx: number; my: number } }; // 移動入力（mx=右ストレイフ, my=前）
  look: { current: { dYaw: number; dPitch: number } }; // 視点ドラッグの未処理デルタ
  didDrag: { current: boolean };
}

// 描画を約 fps に間引く（パラパラ漫画化）。frameloop="demand" を一定間隔で invalidate。
function FrameThrottle({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const id = setInterval(() => invalidate(), 1000 / fps);
    return () => clearInterval(id);
  }, [invalidate, fps]);
  return null;
}

// 世界(球)は固定。アバターが視点基準で球面を移動、カメラはドラッグでオービット。
function Scene({ refs }: { refs: Refs }) {
  const phase = useAtrium((s) => s.phase);
  const location = useAtrium((s) => s.location);
  const focusPlace = useAtrium((s) => s.focusPlace);
  const t = useTransition();

  const avatarRef = useRef<Group>(null!);
  const pos = useRef(new Vector3(0, 1, 0)); // 現在地（単位）
  const camF = useRef(new Vector3(0, 0, -1)); // カメラ前方（接ベクトル）
  const pitch = useRef(WORLD.cam.pitch);
  const closeness = useRef(0);
  const nearest = useRef<PlaceId | null>(null);

  const placeDirs = useMemo(() => PLACES.map((p) => ({ id: p.id, dir: surfaceDir(p.a, p.b) })), []);
  const v = useMemo(
    () => ({ right: new Vector3(), move: new Vector3(), axis: new Vector3(), q: new Quaternion(), camPos: new Vector3(), camLook: new Vector3(), tdir: new Vector3() }),
    [],
  );

  const retangent = (vec: Vector3, n: Vector3) => {
    vec.addScaledVector(n, -vec.dot(n));
    if (vec.lengthSq() > 1e-8) vec.normalize();
  };

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.12); // 低fps（パラパラ漫画）でも動きが鈍らないよう上限を広げる
    const p = pos.current;
    const cf = camF.current;
    const lk = refs.look.current;
    const ctrl = refs.control.current;

    // 視点（ドラッグ）: idle のときだけ反映。デルタは毎フレームリセット。
    if (phase === 'idle') {
      if (lk.dYaw) cf.applyAxisAngle(p, -lk.dYaw * WORLD.look.yaw);
      pitch.current = clamp(pitch.current + lk.dPitch * WORLD.look.pitch, WORLD.look.pitchMin, WORLD.look.pitchMax);
      retangent(cf, p);
    }
    lk.dYaw = 0;
    lk.dPitch = 0;

    // 移動（視点基準ストレイフ）
    if (phase === 'idle') {
      const mag = Math.min(1, Math.hypot(ctrl.mx, ctrl.my));
      if (mag > 0.06) {
        v.right.crossVectors(cf, p).normalize(); // カメラ右
        v.move.set(0, 0, 0).addScaledVector(cf, ctrl.my).addScaledVector(v.right, ctrl.mx);
        retangent(v.move, p);
        if (v.move.lengthSq() > 1e-6) {
          const alpha = (WORLD.move.speed * mag * dt) / WORLD.R;
          v.axis.crossVectors(p, v.move).normalize();
          v.q.setFromAxisAngle(v.axis, alpha);
          p.applyQuaternion(v.q).normalize();
          cf.applyQuaternion(v.q); // カメラ前方も一緒に平行移動
          retangent(cf, p);
          // 町の円内にクランプ
          const angC = Math.acos(clamp(p.dot(UP), -1, 1));
          if (angC > WORLD.townRadius) {
            v.tdir.copy(p).addScaledVector(UP, -p.dot(UP));
            if (v.tdir.lengthSq() > 1e-6) {
              v.tdir.normalize();
              p.copy(UP).multiplyScalar(Math.cos(WORLD.townRadius)).addScaledVector(v.tdir, Math.sin(WORLD.townRadius)).normalize();
              retangent(cf, p);
            }
          }
        }
      }
    } else if ((phase === 'entering' || phase === 'inside') && location !== 'hub') {
      const def = PLACE_BY_ID[location];
      if (def) {
        p.lerp(surfaceDir(def.a, def.b), 1 - Math.exp(-3 * dt)).normalize();
        retangent(cf, p);
      }
    }

    // 入り具合
    const tgt = phase === 'entering' || phase === 'inside' ? 1 : 0;
    closeness.current += (tgt - closeness.current) * (1 - Math.exp(-4 * dt));
    const c = closeness.current;

    // アバター
    if (avatarRef.current) {
      avatarRef.current.position.copy(p).multiplyScalar(WORLD.R + WORLD.avatar.lift);
      avatarRef.current.quaternion.setFromUnitVectors(UP, p);
    }

    // オービットカメラ（入場時はドリーで寄る）
    const dist = MathUtils.lerp(WORLD.cam.dist, WORLD.camIn.dist, easeInOut(c));
    const pit = pitch.current;
    v.camPos
      .copy(p)
      .multiplyScalar(WORLD.R)
      .addScaledVector(p, Math.sin(pit) * dist)
      .addScaledVector(cf, -Math.cos(pit) * dist);
    v.camLook
      .copy(p)
      .multiplyScalar(WORLD.R)
      .addScaledVector(p, WORLD.avatar.lift)
      .addScaledVector(cf, WORLD.cam.lookAhead);
    const cam = state.camera as PerspectiveCamera;
    cam.position.copy(v.camPos);
    cam.lookAt(v.camLook);

    // 最寄りの場所（idle時のみ／変化時だけ）
    if (phase === 'idle') {
      let best: PlaceId | null = null;
      let bd = 0.14;
      for (const pd of placeDirs) {
        const dd = Math.acos(clamp(p.dot(pd.dir), -1, 1));
        if (dd < bd) {
          bd = dd;
          best = pd.id;
        }
      }
      if (best !== nearest.current) {
        nearest.current = best;
        focusPlace(best);
      }
    }

    t.current.closeness = c;
    t.current.active = location !== 'hub' ? location : nearest.current;
    t.current.entering = phase === 'entering';
    t.current.returning = phase === 'returning';
  });

  const handleTap = (id: PlaceId) => {
    if (refs.didDrag.current) return; // 視点ドラッグ後のクリックは入場にしない
    const s = useAtrium.getState();
    if (s.phase !== 'idle') return;
    s.enter({ place: id });
  };

  return (
    <>
      <Planet />
      <Town />
      {PLACES.map((pl) => (
        <PlaceMarker key={pl.id} def={pl} onTap={handleTap} />
      ))}
      <group ref={avatarRef}>
        <WindAvatar />
      </group>
    </>
  );
}

export function World() {
  const transition = useRef<TransitionState>({ closeness: 0, active: null, entering: false, returning: false });
  const control = useRef({ mx: 0, my: 0 });
  const look = useRef({ dYaw: 0, dPitch: 0 });
  const didDrag = useRef(false);
  const pointer = useRef({ down: false, x: 0, y: 0 });

  // 視点ドラッグ（PCマウス／スマホは画面ドラッグ。スティックは別divで stopPropagation 済み）
  const onDown = (e: React.PointerEvent) => {
    pointer.current = { down: true, x: e.clientX, y: e.clientY };
    didDrag.current = false;
  };
  const onMove = (e: React.PointerEvent) => {
    const pt = pointer.current;
    if (!pt.down) return;
    const dx = e.clientX - pt.x;
    const dy = e.clientY - pt.y;
    pt.x = e.clientX;
    pt.y = e.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 2) didDrag.current = true;
    look.current.dYaw += dx;
    look.current.dPitch += dy;
  };
  const onUp = () => {
    pointer.current.down = false;
  };

  // PC: WASD / 矢印 で移動（視点基準）
  useEffect(() => {
    const keys = new Set<string>();
    const upd = () => {
      let mx = 0;
      let my = 0;
      if (keys.has('w') || keys.has('arrowup')) my += 1;
      if (keys.has('s') || keys.has('arrowdown')) my -= 1;
      if (keys.has('d') || keys.has('arrowright')) mx += 1;
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
      control.current.mx = mx;
      control.current.my = my;
    };
    const kd = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      upd();
    };
    const ku = (e: KeyboardEvent) => {
      keys.delete(e.key.toLowerCase());
      upd();
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

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
        frameloop={NPR.flipbook ? 'demand' : 'always'}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, WORLD.R + 7, 10], fov: WORLD.fov, near: 0.1, far: WORLD.R * 4 }}
      >
        <TransitionContext.Provider value={transition}>
          {/* wash の濃淡が出るよう、ほどよい明暗（環境光＋指向性） */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[6, 12, 6]} intensity={0.85} color="#fff6df" />
          <Sky />
          {NPR.flipbook && <FrameThrottle fps={NPR.fps} />}
          <Scene refs={{ control, look, didDrag }} />
          {NPR.enabled && (
            <EffectComposer multisampling={0}>
              <Watercolor />
            </EffectComposer>
          )}
        </TransitionContext.Provider>
      </Canvas>
      <Joystick control={control} />
    </div>
  );
}
