// 水彩NPR スクリーン後処理のライブ調整値（エフェクトが毎フレーム同期して読む）。
// 面側（顔料ムラ/白抜き/フレネル縁）は watercolorMaterial.ts の watercolorUniforms。
export const nprState = {
  paper: 0.5, // 紙グレイン
  whiteLift: 0.42, // 明部を紙白へ
  wobble: 1.0, // 手描き揺らぎ
  edge: 1.0, // 輪郭の顔料だまり（スクリーン空間エッジ）
  saturation: 1.34, // 彩度（>1で鮮やかに）
  bleed: 0.14, // 筆致のにじみ（弱め＝フォグ回避）
};
