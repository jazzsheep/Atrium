import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Group, MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { useAtrium } from '../store/useAtrium';
import { WORLD, PLACES, PLACE_BY_ID, surfaceDir, NORTH } from './worldConfig';
import { Planet } from './Planet';
import { Town } from './Town';
import { PlaceMarker } from './PlaceMarker';
import { WindAvatar } from './WindAvatar';
import { Joystick } from '../ui/Joystick';
import { TransitionContext, useTransition, type TransitionState } from './transitionContext';
import type { PlaceId } from '../types';

const UP = NORTH;
const clamp = MathUtils.clamp;
function easeInOut(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

interface Control {
  current: { mx: number; my: number };
}

// 世界(球)は固定。アバターとカメラが球面上を動く（3人称・追従）。
function Scene({ control }: { control: Control }) {
  const phase = useAtrium((s) => s.phase);
  const location = useAtrium((s) => s.location);
  const focusPlace = useAtrium((s) => s.focusPlace);
  const t = useTransition();

  const avatarRef = useRef<Group>(null!);
  const pos = useRef(new Vector3(0, 1, 0)); // 球面上の現在地（単位）
  const head = useRef(new Vector3(0, 0, -1)); // 進行方向（接ベクトル）
  const camF = useRef(new Vector3(0, 0, -1)); // カメラ前方（接、headに遅れて追従）
  const closeness = useRef(0);
  const nearest = useRef<PlaceId | null>(null);

  const placeDirs = useMemo(() => PLACES.map((p) => ({ id: p.id, dir: surfaceDir(p.a, p.b) })), []);
  const v = useMemo(
    () => ({
      right: new Vector3(),
      d: new Vector3(),
      tmp: new Vector3(),
      np: new Vector3(),
      nh: new Vector3(),
      tdir: new Vector3(),
      camPos: new Vector3(),
      camLook: new Vector3(),
    }),
    [],
  );

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const p = pos.current;
    const h = head.current;
    const cf = camF.current;
    const ctrl = control.current;

    if (phase === 'idle') {
      const mag = Math.min(1, Math.hypot(ctrl.mx, ctrl.my));
      if (mag > 0.06) {
        // カメラ基準の右方向
        v.right.crossVectors(cf, p).normalize();
        // 望む進行方向（接平面に投影）
        v.d.set(0, 0, 0).addScaledVector(cf, ctrl.my).addScaledVector(v.right, ctrl.mx);
        v.d.addScaledVector(p, -v.d.dot(p));
        if (v.d.lengthSq() > 1e-6) {
          v.d.normalize();
          // head を d へ向ける（旋回）
          const ang = Math.atan2(v.tmp.crossVectors(h, v.d).dot(p), h.dot(v.d));
          h.applyAxisAngle(p, clamp(ang, -WORLD.move.turn * dt, WORLD.move.turn * dt)).normalize();
        }
        // head 方向へ前進（大円に沿って pos,head を回す）
        const alpha = (WORLD.move.speed * mag * dt) / WORLD.R;
        const ca = Math.cos(alpha);
        const sa = Math.sin(alpha);
        v.np.copy(p).multiplyScalar(ca).addScaledVector(h, sa).normalize();
        v.nh.copy(h).multiplyScalar(ca).addScaledVector(p, -sa).normalize();
        p.copy(v.np);
        h.copy(v.nh);
        // 町の円内にクランプ
        const angC = Math.acos(clamp(p.dot(UP), -1, 1));
        if (angC > WORLD.townRadius) {
          v.tdir.copy(p).addScaledVector(UP, -p.dot(UP));
          if (v.tdir.lengthSq() > 1e-6) {
            v.tdir.normalize();
            p.copy(UP)
              .multiplyScalar(Math.cos(WORLD.townRadius))
              .addScaledVector(v.tdir, Math.sin(WORLD.townRadius))
              .normalize();
            h.addScaledVector(p, -h.dot(p)).normalize();
          }
        }
      }
    } else if ((phase === 'entering' || phase === 'inside') && location !== 'hub') {
      // 入場: その場所へ歩み寄る
      const dir = PLACE_BY_ID[location] ? surfaceDir(PLACE_BY_ID[location].a, PLACE_BY_ID[location].b) : null;
      if (dir) {
        p.lerp(dir, 1 - Math.exp(-3 * dt)).normalize();
        h.addScaledVector(p, -h.dot(p)).normalize();
      }
    }

    // カメラ前方を head へ遅れて追従（接平面に保つ）
    cf.lerp(h, 1 - Math.exp(-WORLD.move.camLag * dt));
    cf.addScaledVector(p, -cf.dot(p));
    if (cf.lengthSq() > 1e-6) cf.normalize();
    else cf.copy(h);

    // 入り具合
    const tgt = phase === 'entering' || phase === 'inside' ? 1 : 0;
    closeness.current += (tgt - closeness.current) * (1 - Math.exp(-4 * dt));
    const c = closeness.current;

    // アバター配置
    if (avatarRef.current) {
      avatarRef.current.position.copy(p).multiplyScalar(WORLD.R + WORLD.avatar.lift);
      avatarRef.current.quaternion.setFromUnitVectors(UP, p);
    }

    // 追従カメラ（入場時は寄る）
    const back = MathUtils.lerp(WORLD.cam.back, WORLD.camIn.back, easeInOut(c));
    const height = MathUtils.lerp(WORLD.cam.height, WORLD.camIn.height, easeInOut(c));
    v.camPos.copy(p).multiplyScalar(WORLD.R).addScaledVector(cf, -back).addScaledVector(p, height);
    v.camLook
      .copy(p)
      .multiplyScalar(WORLD.R)
      .addScaledVector(cf, WORLD.cam.lookAhead * (1 - c))
      .addScaledVector(p, -WORLD.cam.lookDown);
    const cam = state.camera as PerspectiveCamera;
    cam.position.copy(v.camPos);
    cam.lookAt(v.camLook);

    // 最寄りの場所（idle時のみ／変化時だけ反映）
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

    // 共有
    t.current.closeness = c;
    t.current.active = location !== 'hub' ? location : nearest.current;
    t.current.entering = phase === 'entering';
    t.current.returning = phase === 'returning';
  });

  const handleTap = (id: PlaceId) => {
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
  const transition = useRef<TransitionState>({
    closeness: 0,
    active: null,
    entering: false,
    returning: false,
  });
  const control = useRef({ mx: 0, my: 0 });

  // キーボード（PC: WASD / 矢印）も同じ control に書き込む。
  useEffect(() => {
    const keys = new Set<string>();
    const upd = () => {
      let mx = 0;
      let my = 0;
      if (keys.has('w') || keys.has('arrowup')) my += 1;
      if (keys.has('s') || keys.has('arrowdown')) my -= 1;
      if (keys.has('a') || keys.has('arrowleft')) mx -= 1;
      if (keys.has('d') || keys.has('arrowright')) mx += 1;
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
    <div className="world-layer" style={{ touchAction: 'none' }}>
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, WORLD.R + WORLD.cam.height, WORLD.cam.back], fov: WORLD.fov, near: 0.1, far: WORLD.R * 4 }}
      >
        <TransitionContext.Provider value={transition}>
          <ambientLight intensity={0.95} />
          <directionalLight position={[6, 12, 6]} intensity={1.05} color="#fff6df" />
          <Scene control={control} />
        </TransitionContext.Provider>
      </Canvas>
      <Joystick control={control} />
    </div>
  );
}
