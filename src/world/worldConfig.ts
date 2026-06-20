import { Quaternion, Vector3 } from 'three';
import type { PlaceId } from '../types';

// 世界の設定（すべてここで調整）。単位はおおよそ 1 = 1メートル。
// モデル: 大きな球の「頂点(真上)付近」を町にし、カメラを3人称で後方やや上に置く。
// 探索は world group を回す = 地表が下を流れる（アバターは中央固定）。
// 探索状態は2角度 (a,b): a = 前後(X軸まわり)、b = 左右(Z軸まわり)。G = Rx(a)·Rz(b)。

export type Motif = 'house' | 'balloon' | 'vortex';

export const WORLD = {
  R: 60, // 球の半径(m)。大きいほど局所が平ら＝実寸の町が自然に乗る。
  fov: 55,
  // 探索できる角度範囲(rad)。R×角度 ≒ 物理サイズ。小さな町（約±26m四方）。
  region: { a: 0.4, b: 0.44 },
  // カメラ（3人称：後方やや上から通りを見下ろす）。単位m。
  cam: { back: 12, height: 8, lookAhead: 22, lookDown: 1.5 },
  // 入場ドリー時（場所へ寄る）
  camIn: { back: 5, height: 4 },
  // アバター：人間より一回り小さい（直径約1.3m）。
  avatar: { lift: 1.0, size: 0.65 },
  drag: { speed: 0.0012, ease: 7 },
};

export interface PlaceDef {
  id: PlaceId;
  label: string;
  caption: string;
  motif: Motif;
  color: string;
  a: number; // 町の中での位置（前後）
  b: number; // 町の中での位置（左右）
  float: number; // 地表からの浮き(m)
  scale: number; // モチーフの実寸スケール
}

// 3つの場所を町の前方に配置（家=左／風船=中央奥／渦=右）。実寸スケール。
export const PLACES: PlaceDef[] = [
  { id: 'know', label: '知る', caption: '経歴と理念', motif: 'house', color: '#a9c79a', a: 0.16, b: -0.3, float: 0, scale: 11 },
  { id: 'visit', label: '見に行く', caption: '作品と展示', motif: 'balloon', color: '#d6c9ec', a: 0.3, b: 0.02, float: 8, scale: 9 },
  { id: 'relate', label: '関わる', caption: '問い合わせ', motif: 'vortex', color: '#cfe6c0', a: 0.16, b: 0.3, float: 0, scale: 10 },
];

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<PlaceId, PlaceDef>;
export const PLACE_IDS = PLACES.map((p) => p.id);

const X = new Vector3(1, 0, 0);
const Z = new Vector3(0, 0, 1);
const UP = new Vector3(0, 1, 0);

// 探索状態 (a,b) → world group のクォータニオン G = Rx(a)·Rz(b)。
export function explorationQuat(a: number, b: number, out = new Quaternion()): Quaternion {
  const qx = new Quaternion().setFromAxisAngle(X, a);
  const qz = new Quaternion().setFromAxisAngle(Z, b);
  return out.copy(qx).multiply(qz);
}

// home (a,b) が真上に来るときの地表の向き D = G^{-1}·UP = Rz(-b)·Rx(-a)·UP。
export function surfaceDir(a: number, b: number): Vector3 {
  const qx = new Quaternion().setFromAxisAngle(X, -a);
  const qz = new Quaternion().setFromAxisAngle(Z, -b);
  return UP.clone().applyQuaternion(qz.multiply(qx));
}

export interface Pose {
  position: Vector3;
  quaternion: Quaternion;
}

// 地表に置く姿勢（float で法線方向に浮かす／「上」を法線に合わせる）。
export function surfacePose(a: number, b: number, float = 0): Pose {
  const dir = surfaceDir(a, b);
  return {
    position: dir.clone().multiplyScalar(WORLD.R + float),
    quaternion: new Quaternion().setFromUnitVectors(UP, dir),
  };
}
