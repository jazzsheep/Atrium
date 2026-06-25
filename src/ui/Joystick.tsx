import { useRef, useState } from 'react';
import { useAtrium } from '../store/useAtrium';

// スマホ向けバーチャルスティック（左親指）。idle のときだけ表示。
// 出力は control ref に書き込む（mx: 右, my: 前）。Scene が毎フレーム読む。
const RADIUS = 56; // px

export function Joystick({ control }: { control: { current: { mx: number; my: number } } }) {
  const phase = useAtrium((s) => s.phase);
  const baseRef = useRef<HTMLDivElement>(null);
  const activeId = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  const update = (e: React.PointerEvent<HTMLDivElement>) => {
    const base = baseRef.current;
    if (!base) return;
    const b = base.getBoundingClientRect();
    let dx = e.clientX - (b.left + b.width / 2);
    let dy = e.clientY - (b.top + b.height / 2);
    const len = Math.hypot(dx, dy);
    const m = len > 0 ? Math.min(1, len / RADIUS) : 0;
    if (len > 0) {
      dx = (dx / len) * m * RADIUS;
      dy = (dy / len) * m * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    control.current.mx = dx / RADIUS;
    control.current.my = -dy / RADIUS; // 画面上方向 = 前進
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); // 視点ドラッグ（world-layer）に伝播させない
    activeId.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    update(e);
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeId.current !== e.pointerId) return;
    update(e);
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeId.current !== e.pointerId) return;
    activeId.current = null;
    setKnob({ x: 0, y: 0 });
    control.current.mx = 0;
    control.current.my = 0;
  };

  if (phase !== 'idle') return null;

  return (
    <div
      className="joystick"
      ref={baseRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      aria-hidden
    >
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
