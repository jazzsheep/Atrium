import { forwardRef, useMemo } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';
import { nprState } from './nprControls';

// 水彩NPR スクリーン後処理。面マテリアル側（顔料ムラ/白抜き/フレネル縁）の上に:
//  1. 軽いにじみ（フォグにならない程度）
//  2. 輪郭の顔料だまり = スクリーン空間の輝度エッジを不均一に濃く沈める（深度バッファ不要）
//  3. 彩度を上げて鮮やかに
//  4. 明部を紙白へ（塗り残し）
//  5. 紙のグレイン ＋ 手描き揺らぎ
// 深度は使わない（postprocessing の depth blit 警告・不動作を回避）。輪郭は輝度差で取る。
const fragmentShader = /* glsl */ `
uniform float paperStrength;
uniform float whiteLift;
uniform float wobble;
uniform float edgeStrength;
uniform float saturation;
uniform float bleed;

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

// 指定半径での輝度勾配（中心差分）。輪郭検出に使う。
float gradAt(vec2 uvc, vec2 px, float r){
  float lx = luma(texture(inputBuffer, uvc + px * vec2(r, 0.0)).rgb)
           - luma(texture(inputBuffer, uvc - px * vec2(r, 0.0)).rgb);
  float ly = luma(texture(inputBuffer, uvc + px * vec2(0.0, r)).rgb)
           - luma(texture(inputBuffer, uvc - px * vec2(0.0, r)).rgb);
  return sqrt(lx * lx + ly * ly);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor){
  vec2 res = resolution;
  vec2 px = texelSize;

  // 手描きの揺らぎ
  vec2 wn = vec2(fbm(uv * res * 0.012), fbm(uv * res * 0.012 + 19.7)) - 0.5;
  vec2 wuv = uv + wn * wobble * px * 7.0;

  // 軽いにじみ（中心を強く＝フォグにしない）
  vec3 col = texture(inputBuffer, wuv).rgb * (1.0 - bleed);
  vec3 sm = texture(inputBuffer, wuv + px * vec2( 1.6, 0.0)).rgb;
  sm += texture(inputBuffer, wuv + px * vec2(-1.6, 0.0)).rgb;
  sm += texture(inputBuffer, wuv + px * vec2( 0.0, 1.6)).rgb;
  sm += texture(inputBuffer, wuv + px * vec2( 0.0,-1.6)).rgb;
  col += sm * (bleed * 0.25);

  // 輪郭の顔料だまり：輝度勾配を複数半径で取り、数px幅の柔らかい濃い帯にする。
  // （1pxの細線でなく、にじんだ縁＝水彩の pigment pooling に寄せる）
  float grad = max(gradAt(wuv, px, 1.5), max(gradAt(wuv, px, 3.0), gradAt(wuv, px, 4.5)));
  // 顔料は「暗い側」だけに溜める。明るい側(空)に縁が出ると汚れて見えるので、
  // 近傍の最大輝度より自分が暗いときだけ pool を効かせる（＝白い紙は白いまま）。
  float lc = luma(texture(inputBuffer, wuv).rgb);
  float lmax = lc;
  lmax = max(lmax, luma(texture(inputBuffer, wuv + px * vec2( 3.0, 0.0)).rgb));
  lmax = max(lmax, luma(texture(inputBuffer, wuv + px * vec2(-3.0, 0.0)).rgb));
  lmax = max(lmax, luma(texture(inputBuffer, wuv + px * vec2( 0.0, 3.0)).rgb));
  lmax = max(lmax, luma(texture(inputBuffer, wuv + px * vec2( 0.0,-3.0)).rgb));
  float darkSide = smoothstep(0.02, 0.16, lmax - lc);
  // 水彩の縁は途切れ・濃淡がある → ノイズで不均一に
  float emod = 0.5 + 0.9 * fbm(uv * res * 0.06);
  float pool = smoothstep(0.03, 0.16, grad) * edgeStrength * emod * darkSide;
  // 黒線でなく「濃い顔料」：局所色を素直に濃く沈める（わずかに寒色）
  vec3 dark = col * vec3(0.46, 0.47, 0.50);
  col = mix(col, dark, clamp(pool, 0.0, 0.8));

  // 彩度（>1で鮮やかに）
  float lm = luma(col);
  col = clamp(mix(vec3(lm), col, saturation), 0.0, 1.0);

  // 明部を紙白へ（塗り残しの白）
  float b = luma(col);
  col = mix(col, PAPER, smoothstep(0.84, 0.99, b) * whiteLift);

  // 紙のグレイン（薄く・乗算）
  float grain = fbm(uv * res * 0.55);
  col *= mix(1.0, 0.95 + 0.05 * grain, paperStrength);

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
        ['edgeStrength', new Uniform(nprState.edge)],
        ['saturation', new Uniform(nprState.saturation)],
        ['bleed', new Uniform(nprState.bleed)],
      ]),
    });
  }

  // ライブ調整値を毎フレーム同期
  update() {
    this.uniforms.get('paperStrength')!.value = nprState.paper;
    this.uniforms.get('whiteLift')!.value = nprState.whiteLift;
    this.uniforms.get('wobble')!.value = nprState.wobble;
    this.uniforms.get('edgeStrength')!.value = nprState.edge;
    this.uniforms.get('saturation')!.value = nprState.saturation;
    this.uniforms.get('bleed')!.value = nprState.bleed;
  }
}

export const Watercolor = forwardRef<WatercolorImpl>((_props, ref) => {
  const effect = useMemo(() => new WatercolorImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});
Watercolor.displayName = 'Watercolor';
