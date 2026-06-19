import { Quaternion, Vector3 } from 'three';
import type { PlaceId } from '../types';

// 世界の配置 = 正四面体（brief §3 / spec §3.2）。
// ハブ＋3場所を球に内接する正四面体の4頂点に置く。4点は完全対称・特異点なし（南極問題なし）。
// 俯瞰は使わないので、この対称性は直接は見えない＝「どこへでも均質に回り込める」ための内部モデル。

export type AnchorId = 'hub' | PlaceId;
export type MotifKind = 'house' | 'balloon' | 'vortex';

/** 球（世界）の半径。 */
export const RADIUS = 2.4;
/** カメラに向く正面方向（ここに focus した場所が寄ってくる）。 */
export const FRONT = new Vector3(0, 0, 1);

const RAW: Record<AnchorId, [number, number, number]> = {
  hub: [1, 1, 1],
  know: [1, -1, -1],
  visit: [-1, 1, -1],
  relate: [-1, -1, 1],
};

export interface Anchor {
  id: AnchorId;
  dir: Vector3;
}

export const ANCHORS: Record<AnchorId, Anchor> = Object.fromEntries(
  (Object.keys(RAW) as AnchorId[]).map((id) => [
    id,
    { id, dir: new Vector3(...RAW[id]).normalize() },
  ]),
) as Record<AnchorId, Anchor>;

export const PLACE_IDS: PlaceId[] = ['know', 'visit', 'relate'];

export interface PlaceMeta {
  id: PlaceId;
  label: string;
  motif: MotifKind;
  /** 表面からの浮き（球面の端でも地平線からのぞくよう少し浮かせる）。 */
  float: number;
}

export const PLACE_META: Record<PlaceId, PlaceMeta> = {
  // float は小さめ＝地平線からのぞく「丘の向こう」の見え方。風船だけ少し空へ浮かす。
  know: { id: 'know', label: '知る', motif: 'house', float: 0.18 },
  visit: { id: 'visit', label: '見に行く', motif: 'balloon', float: 0.4 },
  relate: { id: 'relate', label: '関わる', motif: 'vortex', float: 0.16 },
};

// 各アンカーを正面(+Z)へ向ける world group クォータニオン（事前計算で毎フレームの確保を避ける）。
export const TARGET_QUAT: Record<AnchorId, Quaternion> = Object.fromEntries(
  (Object.keys(RAW) as AnchorId[]).map((id) => [
    id,
    new Quaternion().setFromUnitVectors(ANCHORS[id].dir, FRONT),
  ]),
) as Record<AnchorId, Quaternion>;

const UP = new Vector3(0, 1, 0);

/** アンカー位置（local 群空間。float で表面から浮かせる）。 */
export function anchorPosition(id: AnchorId, float = 0): Vector3 {
  return ANCHORS[id].dir.clone().multiplyScalar(RADIUS + float);
}

/** モチーフの「上」を球面の外向き(dir)に合わせるクォータニオン。 */
export function anchorQuaternion(id: AnchorId): Quaternion {
  return new Quaternion().setFromUnitVectors(UP, ANCHORS[id].dir);
}
