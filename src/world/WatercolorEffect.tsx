import { forwardRef, useMemo } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';
import { nprState } from './nprControls';

// 水彩NPR スクリーン後処理（軽め）。縁/濃淡/白抜きは面マテリアル側が担う。
// ここは: 柔らかい筆致のブラー → 明部を紙白へ → 紙のグレイン → 手描き揺らぎ。
// 深度は使わない（postprocessingのdepth blit警告を回避）。
const fragmentShader = /* glsl */ `
uniform float paperStrength;
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
float fbm(vec2 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 3; i++){ v += a * vnoise(p); p *= 2.0; a *= 0.5; } return v; }
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
const vec3 PAPER = vec3(0.995, 0.99, 0.965);

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec2 res = resolution;
  vec2 px = texelSize;

  // 手描きの揺らぎ
  vec2 wn = vec2(fbm(uv * res * 0.012), fbm(uv * res * 0.012 + 19.7)) - 0.5;
  vec2 wuv = uv + wn * wobble * px * 9.0;

  // 柔らかい筆致のブラー（半径2px）
  vec3 col = texture(inputBuffer, wuv).rgb * 0.36;
  col += texture(inputBuffer, wuv + px * vec2( 2.0, 0.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2(-2.0, 0.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2( 0.0, 2.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2( 0.0,-2.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2( 2.0, 2.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2(-2.0, 2.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2( 2.0,-2.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2(-2.0,-2.0)).rgb * 0.08;

  // 明部を紙白へ（ハイライト＝塗り残しの白）
  float b = luma(col);
  col = mix(col, PAPER, smoothstep(0.82, 0.98, b) * whiteLift);

  // 紙のグレイン（薄く・乗算）
  float grain = fbm(uv * res * 0.55);
  col *= mix(1.0, 0.96 + 0.04 * grain, paperStrength);

  outputColor = vec4(clamp(col, 0.0, 1.0), inputColor.a);
}
`;

class WatercolorImpl extends Effect {
  constructor() {
    super('Watercolor', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['paperStrength', new Uniform(nprState.paper)],
        ['whiteLift', new Uniform(nprState.whiteLift)],
        ['wobble', new Uniform(nprState.wobble)],
      ]),
    });
  }

  // ライブ調整値を毎フレーム同期
  update() {
    this.uniforms.get('paperStrength')!.value = nprState.paper;
    this.uniforms.get('whiteLift')!.value = nprState.whiteLift;
    this.uniforms.get('wobble')!.value = nprState.wobble;
  }
}

export const Watercolor = forwardRef<WatercolorImpl>((_props, ref) => {
  const effect = useMemo(() => new WatercolorImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});
Watercolor.displayName = 'Watercolor';
