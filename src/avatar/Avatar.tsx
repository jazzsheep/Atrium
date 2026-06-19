// 風のアバター = 半透明の渦・流れ（透明感重視）。常に画面中央。
// spec 9.2 に従い CSS/SVG で表現。world（3D）はこの背後で回り込む。
export function Avatar() {
  return (
    <div className="avatar" aria-hidden>
      <div className="avatar-glow" />
      <svg className="avatar-svg" viewBox="0 0 200 200">
        <circle className="wind-ring ring1" cx="100" cy="100" r="58" />
        <circle className="wind-ring ring2" cx="100" cy="100" r="42" />
        <circle className="wind-ring ring3" cx="100" cy="100" r="26" />
        <circle className="wind-core" cx="100" cy="100" r="10" />
      </svg>
    </div>
  );
}
