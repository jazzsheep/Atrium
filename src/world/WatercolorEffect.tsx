import { forwardRef, useMemo } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';
import { NPR } from './worldConfig';

// 水彩NPR（第3段）: 「水彩画のパラパラ漫画」。
//  - 毎フレーム少しずつ描き直す（boil＝手描きアニメの沸き）。uFrame で全ノイズを揺らす。
//  - 硬い輪郭をやめ、軽いブラシ感のブラーで CG エッジを和らげる。
//  - 顔料ムラ（薄い/濃い）＋ 塗り残しの白（明部を紙白へ）＋ 紙のグレイン。
//  ※「もやもやフィルター越し」を避けるため、テクスチャを静的に固定せず毎フレーム動かす。
const fragmentShader = /* glsl */ `
uniform float paperStrength;
uniform float granulation;
uniform float whiteLift;
uniform float wobble;
uniform float boil;
uniform float uFrame;

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
const vec3 PAPER = vec3(0.99, 0.985, 0.96);

// 毎フレーム異なる小さなオフセット（boil＝描き直しの沸き）
vec2 boilOffset(float seed){
  return (vec2(hash(vec2(uFrame, seed)), hash(vec2(uFrame, seed + 5.0))) - 0.5) * boil;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec2 res = resolution;
  vec2 px = texelSize;

  // 手描きの揺らぎ（毎フレーム沸く）
  vec2 jw = boilOffset(1.0);
  vec2 wn = vec2(fbm(uv * res * 0.012 + jw * 1.5), fbm(uv * res * 0.012 + jw * 1.5 + 19.7)) - 0.5;
  vec2 wuv = uv + wn * wobble * px * 9.0;

  // 軽いブラシ感のブラー（半径1.5px）で CG の硬い輪郭を和らげる
  vec3 col = texture(inputBuffer, wuv).rgb * 0.36;
  col += texture(inputBuffer, wuv + px * vec2( 1.5, 0.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2(-1.5, 0.0)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2( 0.0, 1.5)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2( 0.0,-1.5)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2( 1.5, 1.5)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2(-1.5, 1.5)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2( 1.5,-1.5)).rgb * 0.08;
  col += texture(inputBuffer, wuv + px * vec2(-1.5,-1.5)).rgb * 0.08;

  // 脱色＋紙白へ（透明な層）
  float l = luma(col);
  col = mix(col, vec3(l), 0.12);
  col = mix(col, PAPER, 0.08);

  // 顔料のムラ（薄い/濃い）：大小2スケール＋毎フレーム沸く
  vec2 jg = boilOffset(2.0);
  float g1 = fbm(wuv * res * 0.010 + jg * 0.8);
  float g2 = fbm(wuv * res * 0.060 + jg * 0.8 + 4.0);
  float gran = mix(g1, g2, 0.45);
  col *= 1.0 + (gran - 0.5) * granulation;

  // 塗り残しの白：明部を紙の白へ飛ばす
  float b = luma(col);
  float wl = smoothstep(0.72, 0.96, b) * whiteLift;
  col = mix(col, PAPER, wl);

  // 紙のグレイン（毎フレームわずかに沸く・乗算）
  vec2 jp = boilOffset(3.0);
  float grain = fbm(uv * res * 0.55 + jp * 0.5);
  col *= mix(1.0, 0.9 + 0.1 * grain, paperStrength);

  outputColor = vec4(clamp(col, 0.0, 1.0), inputColor.a);
}
`;

class WatercolorImpl extends Effect {
  constructor() {
    super('Watercolor', fragmentShader, {
      uniforms: new Map<string, Uniform>([
        ['paperStrength', new Uniform(NPR.paper)],
        ['granulation', new Uniform(NPR.granulation)],
        ['whiteLift', new Uniform(NPR.whiteLift)],
        ['wobble', new Uniform(NPR.wobble)],
        ['boil', new Uniform(NPR.boil)],
        ['uFrame', new Uniform(0)],
      ]),
    });
  }

  // 毎レンダーで uFrame を進める（描画は約 fps に間引かれているので boil もその速さに）
  update() {
    const u = this.uniforms.get('uFrame');
    if (u) u.value = (u.value + 1) % 4096;
  }
}

export const Watercolor = forwardRef<WatercolorImpl>((_props, ref) => {
  const effect = useMemo(() => new WatercolorImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});
Watercolor.displayName = 'Watercolor';
