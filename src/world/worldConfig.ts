import { Quaternion, Vector3 } from 'three';
import type { PlaceId } from '../types';

// 世界の設定（すべてここで調整）。単位はおおよそ 1 = 1メートル。
// モデル: 世界(球)は固定。アバターとカメラが球面上を移動する（3人称・追従カメラ）。
// アバターの状態は pos(球面上の単位ベクトル)と head(進行方向の接ベクトル)で持つ。

export type Motif = 'house' | 'balloon' | 'vortex';

export const WORLD = {
  R: 60, // 球の半径(m)
  fov: 55,
  townRadius: 0.5, // 歩ける円の半径(rad)。R×rad ≒ 30m
  // 移動（視点基準＝WASD/スティックで前左後右にストレイフ）
  move: { speed: 8 }, // m/s
  // 視点回転（ドラッグ＝オービット）
  look: { yaw: 0.005, pitch: 0.004, pitchMin: 0.28, pitchMax: 1.15 }, // 感度(rad/px)・上下角の範囲
  // オービットカメラ
  cam: { dist: 12, pitch: 0.6, lookAhead: 1.5 },
  camIn: { dist: 5 }, // 入場ドリー時
  avatar: { lift: 1.0, size: 0.65 }, // 人間より一回り小さい（直径約1.3m）
};

// 水彩NPR（ポスト処理）。enabled=false で即オフ。値は調整しやすいよう外出し。
export const NPR = { enabled: true, paper: 0.9, posterize: 0.5, desat: 0.2 };

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

export const PLACES: PlaceDef[] = [
  { id: 'know', label: '知る', caption: '経歴と理念', motif: 'house', color: '#a9c79a', a: 0.18, b: -0.34, float: 0, scale: 11 },
  { id: 'visit', label: '見に行く', caption: '作品と展示', motif: 'balloon', color: '#d6c9ec', a: 0.34, b: 0.02, float: 8, scale: 9 },
  { id: 'relate', label: '関わる', caption: '問い合わせ', motif: 'vortex', color: '#cfe6c0', a: 0.18, b: 0.34, float: 0, scale: 10 },
];

export const PLACE_BY_ID = Object.fromEntries(PLACES.map((p) => [p.id, p])) as Record<PlaceId, PlaceDef>;
export const PLACE_IDS = PLACES.map((p) => p.id);

export const NORTH = new Vector3(0, 1, 0); // 町の中心（球の真上）
const UP = NORTH;

// (a,b) の地点の地表の向き（単位ベクトル）。a=前後(X), b=左右(Z)。
export function surfaceDir(a: number, b: number): Vector3 {
  const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -a);
  const qz = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -b);
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
