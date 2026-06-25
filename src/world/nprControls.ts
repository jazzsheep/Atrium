// 水彩NPR スクリーン後処理のライブ調整値（エフェクトが毎フレーム同期して読む）。
// 面側（顔料ムラ/白抜き/フレネル縁）は watercolorMaterial.ts の watercolorUniforms。
export const nprState = {
  paper: 0.4, // 紙グレイン
  whiteLift: 0.5, // 明部を紙白へ
  wobble: 1.0, // 手描き揺らぎ
};
