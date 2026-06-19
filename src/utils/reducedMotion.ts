// OS の「視差効果を減らす（prefers-reduced-motion）」設定を一度だけ読む。
// V1 ではセッション中の切替は考慮しない（読み込み時の値を使う）。
export const REDUCED_MOTION: boolean =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
