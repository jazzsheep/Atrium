import { useMemo } from 'react';
import { BackSide, CanvasTexture, SRGBColorSpace } from 'three';
import { WORLD } from './worldConfig';

// 3Dのグラデ空（天頂=淡い青 → 地平=暖色）。world を囲む大きな内向き球。
// これで背景も水彩ポスト処理に乗る（空〜地が一枚の水彩画として馴染む）。
function makeSkyTexture(): CanvasTexture {
  const w = 8;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#cfe6f5'); // 天頂（淡い青）
  g.addColorStop(0.5, '#e7f0ee');
  g.addColorStop(0.76, '#f3ecd9'); // 地平（暖色）
  g.addColorStop(1.0, '#e8ead7');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function Sky() {
  const tex = useMemo(makeSkyTexture, []);
  return (
    <mesh>
      <sphereGeometry args={[WORLD.R * 3, 32, 16]} />
      <meshBasicMaterial map={tex} side={BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}
