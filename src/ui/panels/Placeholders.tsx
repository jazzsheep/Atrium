// 作品画像の抽象プレースホルダー（実画像は使わない。brief §6 / spec 4.4）。
// 風船＝作品なので、ここは虹彩を宿してよい数少ない場所。

// バルーン状の作品（風船）。淡い虹彩のグラデを宿す。
export function BalloonArt() {
  return (
    <svg className="work-art" viewBox="0 0 220 170" role="img" aria-label="風船作品の抽象イメージ">
      <defs>
        <radialGradient id="art-irid" cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="32%" stopColor="#c6e6f3" />
          <stop offset="56%" stopColor="#d8c9ec" />
          <stop offset="78%" stopColor="#f7d7e6" />
          <stop offset="100%" stopColor="#d2ead0" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="86" rx="82" ry="74" fill="url(#art-irid)" opacity="0.92" />
      <ellipse cx="80" cy="56" rx="22" ry="14" fill="#ffffff" opacity="0.55" />
      <path d="M104 160 q6 -8 12 0" stroke="#cdbfe0" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
}

// 繭・光の作品。虹彩は宿さず、淡い日光の色で。
export function LightArt() {
  return (
    <svg className="work-art" viewBox="0 0 220 170" role="img" aria-label="繭・光の抽象イメージ">
      <defs>
        <radialGradient id="art-light" cx="50%" cy="42%" r="68%">
          <stop offset="0%" stopColor="#fff8e3" />
          <stop offset="55%" stopColor="#f1ead0" />
          <stop offset="100%" stopColor="#dfead0" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="88" rx="52" ry="70" fill="url(#art-light)" />
      <path d="M74 60 q36 -22 72 0" stroke="#e7dcb8" strokeWidth="2.5" fill="none" opacity="0.7" />
      <path d="M70 92 q40 -16 80 0" stroke="#e7dcb8" strokeWidth="2.5" fill="none" opacity="0.6" />
      <path d="M76 124 q34 -12 68 0" stroke="#e7dcb8" strokeWidth="2.5" fill="none" opacity="0.5" />
    </svg>
  );
}
