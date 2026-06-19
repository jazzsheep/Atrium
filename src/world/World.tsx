import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { useAtrium } from '../store/useAtrium';
import { PLACE_IDS, PLACE_META, TARGET_QUAT } from './tetrahedron';
import { Planet } from './Planet';
import { PlaceMarker } from './PlaceMarker';
import { HubMark } from './motifs/HubMark';
import { TransitionContext, useTransition, type TransitionState } from './transitionContext';
import type { PlaceId } from '../types';

const ONE = new Vector3(1, 1, 1);

// カメラ距離と「収めたい半径」（ハブ中心＋3つの地平線ランドマーク＋余白）。
const CAM_DIST = 11;
const FIT_RADIUS = 3.4;
// 場所に入り切ったときのカメラ距離（没入のままドリーイン）。
const CAM_NEAR_IN = 5.5;

function easeInOut(x: number) {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

// 画面比に応じて縦 fov を調整し、PC横・スマホ縦どちらでも世界が破綻なく収まるようにする。
// 小さい方の視野寸法が FIT_RADIUS を覆うよう fov を決める（円を内接させる）。
function ResponsiveFraming() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const fovRad = 2 * Math.atan(FIT_RADIUS / (CAM_DIST * Math.min(aspect, 1)));
    camera.position.set(0, 0, CAM_DIST);
    camera.lookAt(0, 0, 0);
    camera.fov = MathUtils.clamp(MathUtils.radToDeg(fovRad), 28, 80);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

// 没入型の3D世界。アバターは常に画面中央（2Dオーバーレイ）で、ここでは球面世界が回り込む。
// カメラは固定方向のまま、入場時だけ場所へドリーインする（俯瞰には切り替えない）。
function Scene() {
  const groupRef = useRef<Group>(null!);
  const focusedPlace = useAtrium((s) => s.focusedPlace);
  const location = useAtrium((s) => s.location);
  const phase = useAtrium((s) => s.phase);
  const t = useTransition();
  const closeness = useRef(0);

  useFrame((state, dtRaw) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05); // タブ復帰時の飛びを防ぐ

    // 回り込み: focus 先（なければハブ）を正面へ slerp。
    const targetId = focusedPlace ?? 'hub';
    g.quaternion.slerp(TARGET_QUAT[targetId], 1 - Math.exp(-4.6 * dt));

    // オープニング/移動の立ち上がり: スケールを 1 へ寄せる。
    g.scale.lerp(ONE, 1 - Math.exp(-3 * dt));

    // 入り具合（closeness）を位相に向けて緩める（〜1.2秒で収束＝秒数枠内）。
    const target = phase === 'entering' || phase === 'inside' ? 1 : 0;
    closeness.current += (target - closeness.current) * (1 - Math.exp(-4 * dt));
    const c = closeness.current;

    // カメラのドリーイン（没入のまま場所へ近づく）。
    const cam = state.camera as PerspectiveCamera;
    cam.position.z = MathUtils.lerp(CAM_DIST, CAM_NEAR_IN, easeInOut(c));
    cam.lookAt(0, 0, 0);

    // モチーフ・オーバーレイへ共有。
    t.current.closeness = c;
    t.current.active = location !== 'hub' ? location : focusedPlace;
    t.current.entering = phase === 'entering';
    t.current.returning = phase === 'returning';
  });

  // 入場操作（「寄せる→中央タップで入る」）。タップとメニューは同じ enter() を呼ぶ＝一本化。
  const handleTap = (id: PlaceId) => {
    const s = useAtrium.getState();
    if (s.phase !== 'idle') return;
    if (s.focusedPlace === id) s.enter({ place: id });
    else s.focusPlace(id);
  };

  return (
    <group ref={groupRef} scale={phase === 'opening' ? 0.82 : 1}>
      <Planet />
      <HubMark />
      {PLACE_IDS.map((id) => (
        <PlaceMarker key={id} meta={PLACE_META[id]} onTap={handleTap} />
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
  return (
    <div className="world-layer">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, CAM_DIST], fov: 45 }}
      >
        <TransitionContext.Provider value={transition}>
          <ResponsiveFraming />
          {/* 日光: 柔らかい環境光＋淡く暖かい指向性光（マットな水彩の陰影）。 */}
          <ambientLight intensity={0.95} />
          <directionalLight position={[3, 5, 4]} intensity={1.05} color="#fff6df" />
          <Scene />
        </TransitionContext.Provider>
      </Canvas>
    </div>
  );
}
