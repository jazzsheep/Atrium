// 水彩NPR スクリーン後処理のライブ調整値（エフェクトが毎フレーム同期して読む）。
// 面側（granulation/紙抜き/濡れ縁）は watercolorMaterial.ts の watercolorUniforms。
export const nprState = {
  paper: 0.62, // 紙グレイン
  whiteLift: 0.4, // 明部を紙白へ
  wobble: 0.5, // 全体の手ぶれ（弱め）
  edge: 1.2, // 縁の顔料だまりの濃さ
  edgeWarp: 1.0, // 縁のにじみ＝境界の不規則さ（筆の置き方）
  saturation: 1.14, // 彩度
  bleed: 0.12, // 筆致の僅かなにじみ
};
