import { useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { WORLD } from './worldConfig';

// 水彩タッチの草原（大きな球＝惑星）。手続き的テクスチャでアセット不要・軽量。
// UVの極(つなぎ目)は左右の地平線へ逃がす（mesh を Z軸90°回転）ので、舞台の真上では破綻しない。
function makeGrassTexture(): CanvasTexture {
  const size = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;

  // 落ち着いた草色のベース（強い縦グラデは避けてタイル耐性を上げる）。
  ctx.fillStyle = '#a9cf8f';
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

  const rnd = mulberry32(20240619);
  // 濃淡の緑の滲み
  for (let i = 0; i < 90; i++) {
    const darker = rnd() > 0.45;
    blob(rnd() * size, rnd() * size, 26 + rnd() * 80, darker ? 'rgba(120,168,104,0.9)' : 'rgba(210,232,180,0.9)', 0.2);
  }
  // まばらな白い塗り残し
  for (let i = 0; i < 26; i++) {
    blob(rnd() * size, rnd() * size, 18 + rnd() * 46, 'rgba(255,255,255,0.95)', 0.22);
  }

  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.anisotropy = 4;
  return tex;
}

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
  const texture = useMemo(makeGrassTexture, []);
  return (
    // Z軸90°回転でUVの極を左右(地平線)へ逃がす。
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <sphereGeometry args={[WORLD.R, 96, 96]} />
      <meshStandardMaterial map={texture} roughness={1} metalness={0} />
    </mesh>
  );
}
