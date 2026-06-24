import { useMemo } from 'react';
import { BackSide, CanvasTexture, SRGBColorSpace } from 'three';
import { WORLD } from './worldConfig';

// 3Dのグラデ空。参考の水彩画に寄せ「ほぼ白い紙＋天頂に淡い青」。
// これで空が主張せず、白の抜け・軽さが出る（水彩ポストと合わせて一枚絵に）。
function makeSkyTexture(): CanvasTexture {
  const w = 8;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, '#b8d3ea'); // 天頂（淡い青）
  g.addColorStop(0.22, '#dde9f1');
  g.addColorStop(0.45, '#f2f7f7');
  g.addColorStop(0.7, '#fbfbf6'); // ほぼ紙の白
  g.addColorStop(1.0, '#f5f2e8'); // 地平（ごく淡い暖色）
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
