import { Quaternion, Vector3 } from 'three';
import type { PlaceId } from '../types';

// 世界の設定（すべてここで調整）。
// モデル: 大きな球の「頂点(真上)付近」を舞台にし、カメラを地表近くに固定。
// 探索は world group を回す = 地表が舞台の下を流れる（アバターは中央固定）。
// 探索状態は2つの角度 (a,b):  a = X軸まわり(前後)、b = Z軸まわり(左右)。
//   group の向き G = Rx(a)·Rz(b)。(a,b)=(0,0) で「町の中心」が真上＝アバターの足元。

export type Motif = 'house' | 'balloon' | 'vortex';

export const WORLD = {
  R: 16, // 球の半径（大きい）
  fov: 52,
  // 探索できる角度範囲（rad）。小さな町くらい＝球の一部。
  region: { a: 0.6, b: 0.95 },
  // カメラ（地表近く・少し見下ろして地平線を見る）
  cam: { back: 4.4, height: 2.7, lookAhead: 7, lookDown: 0.6 },
  // 入場ドリー時のカメラ（場所へ寄る）
  camIn: { back: 1.7, height: 1.4 },
  avatar: { lift: 0.9, size: 1.2 },
  drag: { speed: 0.0026, ease: 7 }, // ドラッグ感度／追従の緩さ
  motifScale: 1.8, // 場所モチーフの拡大率
};

export interface PlaceDef {
  id: PlaceId;
  label: string;
  caption: string;
  motif: Motif;
  color: string;
  a: number; // 町の中での位置（前後）
  b: number; // 町の中での位置（左右）
  float: number; // 地表からの浮き（風船など）
}

// 3つの場所を町の中（探索範囲内）に配置。
export const PLACES: PlaceDef[] = [
  // a>0 = 前方(地平線側), b = 左右。3つを前方に扇状に配置（家=左／風船=中央／渦=右）。
  { id: 'know', label: '知る', caption: '経歴と理念', motif: 'house', color: '#a9c79a', a: 0.18, b: -0.55, float: 0 },
  { id: 'visit', label: '見に行く', caption: '作品と展示', motif: 'balloon', color: '#d6c9ec', a: 0.3, b: 0.0, float: 1.7 },
  { id: 'relate', label: '関わる', caption: '問い合わせ', motif: 'vortex', color: '#cfe6c0', a: 0.18, b: 0.55, float: 0 },
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
// これにより、探索が (a,b)=home のとき その地点がちょうど中央（アバターの足元）に来る。
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
