import { useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { RADIUS } from './tetrahedron';

// 水彩タッチの草原の球。
// 「動く水彩画」の地。手続き的に滲み・塗り残しの白を描いた CanvasTexture を貼る（アセット不要・軽量）。
function makeWatercolorTexture(): CanvasTexture {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;

  // ベースの縦グラデ（上＝日光で淡く、下＝草の深い緑）
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#eef5dd');
  g.addColorStop(0.45, '#cfe2ab');
  g.addColorStop(1, '#9cc888');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const blob = (x: number, y: number, r: number, color: string, a: number) => {
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, color);
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = a;
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  // 滲み（濃淡の緑）とまばらな白い塗り残し
  const rnd = mulberry32(20240619);
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 36 + rnd() * 90;
    const darker = rnd() > 0.5;
    blob(x, y, r, darker ? 'rgba(120,170,110,0.9)' : 'rgba(225,238,200,0.9)', 0.22);
  }
  for (let i = 0; i < 10; i++) {
    blob(rnd() * size, rnd() * size, 30 + rnd() * 60, 'rgba(255,255,255,0.95)', 0.28); // 白い余白
  }

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// 決定的な疑似乱数（毎回同じ絵柄に）。
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Planet() {
  const texture = useMemo(makeWatercolorTexture, []);
  return (
    <mesh>
      <sphereGeometry args={[RADIUS, 64, 64]} />
      {/* マットに（光沢を出さず水彩の平面感）。わずかな陰影だけ残す。 */}
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
}
