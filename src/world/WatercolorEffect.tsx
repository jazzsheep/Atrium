import { forwardRef, useMemo } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';
import { NPR } from './worldConfig';

// 水彩NPR（第2段）: 参考画像の質感に寄せる。
//  手描き揺らぎ → 脱色/高明度化 → 顔料ムラ(granulation) → 縁の顔料だまり(Sobel)
//   → 白抜き(明部を紙白へ＝塗り残し) → 紙のグレイン。
//  ハードな階調化はやめ、透明な層＋ムラで「塗った」感を出す。
const fragmentShader = /* glsl */ `
uniform float paperStrength;
uniform float granulation;
uniform float edgeStrength;
uniform float whiteLift;
uniform float wobble;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p){
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
  return v;
}
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
const vec3 PAPER = vec3(0.99, 0.985, 0.96); // 温かい紙白

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec2 res = resolution;
  vec2 px = texelSize;

  // 手描きの揺らぎ：低周波ノイズでサンプルUVをずらす（CG的な硬さを崩す）
  vec2 wn = vec2(fbm(uv * res * 0.012), fbm(uv * res * 0.012 + 19.7)) - 0.5;
  vec2 wuv = uv + wn * wobble * px * 8.0;

  vec3 col = texture(inputBuffer, wuv).rgb;

  // 脱色＋紙白へわずかに（透明な層の感じ）
  float l = luma(col);
  col = mix(col, vec3(l), 0.12);
  col = mix(col, PAPER, 0.08);

  // 顔料のムラ（granulation）：大小2スケールの濃淡
  float g1 = fbm(wuv * res * 0.02);
  float g2 = fbm(wuv * res * 0.10 + 4.0);
  float gran = mix(g1, g2, 0.4);
  col *= 1.0 + (gran - 0.5) * granulation;

  // 縁の顔料だまり（輝度Sobel）→ 縁を少し濃く・寒色寄りに
  float c00 = luma(texture(inputBuffer, wuv + px * vec2(-1.0, -1.0)).rgb);
  float c01 = luma(texture(inputBuffer, wuv + px * vec2( 0.0, -1.0)).rgb);
  float c02 = luma(texture(inputBuffer, wuv + px * vec2( 1.0, -1.0)).rgb);
  float c10 = luma(texture(inputBuffer, wuv + px * vec2(-1.0,  0.0)).rgb);
  float c12 = luma(texture(inputBuffer, wuv + px * vec2( 1.0,  0.0)).rgb);
  float c20 = luma(texture(inputBuffer, wuv + px * vec2(-1.0,  1.0)).rgb);
  float c21 = luma(texture(inputBuffer, wuv + px * vec2( 0.0,  1.0)).rgb);
  float c22 = luma(texture(inputBuffer, wuv + px * vec2( 1.0,  1.0)).rgb);
  float gx = -c00 - 2.0 * c10 - c20 + c02 + 2.0 * c12 + c22;
  float gy = -c00 - 2.0 * c01 - c02 + c20 + 2.0 * c21 + c22;
  float edge = clamp(sqrt(gx * gx + gy * gy) * edgeStrength, 0.0, 1.0);
  col *= 1.0 - edge * 0.42;
  col = mix(col, col * vec3(0.9, 0.93, 1.04), edge * 0.35);

  // 白抜き：明るい所は紙の白へ飛ばす（塗り残しの白＝水彩の命）
  float b = luma(col);
  float w = smoothstep(0.74, 0.97, b) * whiteLift;
  col = mix(col, PAPER, w);

  // 紙のグレイン（細かく・控えめに）
  float grain = fbm(uv * res * 0.6);
  col *= mix(1.0, 0.93 + 0.07 * grain, paperStrength);

  outputColor = vec4(clamp(col, 0.0, 1.0), inputColor.a);
}
`;

class WatercolorImpl extends Effect {
  constructor() {
    super('Watercolor', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['paperStrength', new Uniform(NPR.paper)],
        ['granulation', new Uniform(NPR.granulation)],
        ['edgeStrength', new Uniform(NPR.edge)],
        ['whiteLift', new Uniform(NPR.whiteLift)],
        ['wobble', new Uniform(NPR.wobble)],
      ]),
    });
  }
}

export const Watercolor = forwardRef<WatercolorImpl>((_props, ref) => {
  const effect = useMemo(() => new WatercolorImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});
Watercolor.displayName = 'Watercolor';
