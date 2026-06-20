import { forwardRef, useMemo } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';
import { NPR } from './worldConfig';

// 水彩NPRのポスト処理（スパイク第1段）:
//  脱色 → 紙白へ持ち上げ → 階調化(ベタ塗り) → 紙の質感(乗算)。
//  ※縁の滲み(Sobel)・手描き揺らぎは第2段で追加予定（まず安全側で見え方を検証）。
const fragmentShader = /* glsl */ `
uniform float paperStrength;
uniform float posterize;
uniform float desat;

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
  for (int i = 0; i < 4; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
  return v;
}
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec3 col = inputColor.rgb;

  // 脱色（水彩の軽さ）＋ 紙白へわずかに持ち上げ
  float l = luma(col);
  col = mix(col, vec3(l), desat);
  col = mix(col, vec3(1.0), 0.05);

  // 階調化（ベタ塗りの面）
  float levels = mix(14.0, 6.0, posterize);
  col = floor(col * levels + 0.5) / levels;

  // 紙の質感（fbmノイズを乗算）
  float paper = fbm(uv * resolution * 0.08);
  col *= mix(1.0, 0.85 + 0.18 * paper, paperStrength);

  outputColor = vec4(clamp(col, 0.0, 1.0), inputColor.a);
}
`;

class WatercolorImpl extends Effect {
  constructor() {
    super('Watercolor', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['paperStrength', new Uniform(NPR.paper)],
        ['posterize', new Uniform(NPR.posterize)],
        ['desat', new Uniform(NPR.desat)],
      ]),
    });
  }
}

export const Watercolor = forwardRef<WatercolorImpl>((_props, ref) => {
  const effect = useMemo(() => new WatercolorImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});
Watercolor.displayName = 'Watercolor';
