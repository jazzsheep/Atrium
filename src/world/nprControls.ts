// 水彩NPR スクリーン後処理のライブ調整値（エフェクトが毎フレーム同期して読む）。
// 面側（granulation/紙抜き/濡れ縁）は watercolorMaterial.ts の watercolorUniforms。
export const nprState = {
  paper: 0.6, // 紙グレイン
  whiteLift: 0.15, // 明部を紙白へ（マテリアルが透明化を担うので控えめ）
  wobble: 0.5, // 全体の手ぶれ（弱め）
  edge: 1.4, // 縁の顔料だまりの濃さ（淡い面でも形が決まるよう強め）
  edgeWarp: 1.0, // 縁のにじみ＝境界の不規則さ（筆の置き方）
  saturation: 1.06, // 彩度（低め＝くすんだ土気色）
  bleed: 0.12, // 筆致の僅かなにじみ
};
