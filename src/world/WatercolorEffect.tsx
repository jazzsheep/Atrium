import { forwardRef, useMemo } from 'react';
import { Uniform } from 'three';
import { Effect } from 'postprocessing';
import { nprState } from './nprControls';

// 水彩NPR スクリーン後処理。面マテリアル（値＝光＋色＋granulation）の上に、
// 「筆で絵具を置いたから起こる」縁の挙動を足す:
//  - にじみ: 縁の近くだけ低周波ノイズで“サンプル位置をずらす”→ 境界が本来の線を
//    またいだり・手前で止まったりする（＝濡れた筆の置き方の不規則さ）。
//  - 顔料だまり: 縁の“暗い側だけ”に、低周波ノイズで途切れる濃い帯（黒線にしない）。
//  - 仕上げ: 彩度／明部を紙白へ／紙のグレイン。
// 深度は使わない（postprocessing の depth blit 不動作を回避）。縁は輝度差で取る。
const fragmentShader = /* glsl */ `
uniform float paperStrength;
uniform float whiteLift;
uniform float wobble;
uniform float edgeStrength;
uniform float edgeWarp;
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

  // 縁の近さ（大半径の勾配）。にじみ＝サンプルずらしは“縁にだけ”強く効かせる。
  float prox = smoothstep(0.03, 0.26, max(gradAt(uv, px, 5.0), gradAt(uv, px, 9.0)));

  // 低周波の“濡れ”ワープ：縁ほど大きく揺れ、境界を本来の線からはみ出させたり引っ込めたり。
  vec2 warp = vec2(fbm(uv * res * 0.016 + 3.0), fbm(uv * res * 0.016 + 31.0)) - 0.5;
  vec2 wuv = uv + warp * px * (wobble * 3.0 + prox * edgeWarp * 16.0);

  // 軽いにじみ（中心強め＝フォグにしない）
  vec3 col = texture(inputBuffer, wuv).rgb * (1.0 - bleed);
  vec3 sm = texture(inputBuffer, wuv + px * vec2( 1.4, 0.0)).rgb
          + texture(inputBuffer, wuv + px * vec2(-1.4, 0.0)).rgb
          + texture(inputBuffer, wuv + px * vec2( 0.0, 1.4)).rgb
          + texture(inputBuffer, wuv + px * vec2( 0.0,-1.4)).rgb;
  col += sm * (bleed * 0.25);

  // 縁の顔料だまり：暗い側だけ・低周波ノイズで途切れる濃い帯。
  float grad = max(gradAt(wuv, px, 1.6), max(gradAt(wuv, px, 3.2), gradAt(wuv, px, 5.0)));
  float lc = luma(texture(inputBuffer, wuv).rgb);
  float lmax = lc;
  lmax = max(lmax, luma(texture(inputBuffer, wuv + px * vec2( 3.0, 0.0)).rgb));
  lmax = max(lmax, luma(texture(inputBuffer, wuv + px * vec2(-3.0, 0.0)).rgb));
  lmax = max(lmax, luma(texture(inputBuffer, wuv + px * vec2( 0.0, 3.0)).rgb));
  lmax = max(lmax, luma(texture(inputBuffer, wuv + px * vec2( 0.0,-3.0)).rgb));
  float darkSide = smoothstep(0.02, 0.16, lmax - lc);
  float broken = 0.30 + 1.05 * fbm(uv * res * 0.02);   // 低周波で“濃い所と薄い所”
  float pool = smoothstep(0.04, 0.18, grad) * edgeStrength * broken * darkSide;
  vec3 dark = col * vec3(0.50, 0.52, 0.56);
  col = mix(col, dark, clamp(pool, 0.0, 0.78));

  // 彩度（>1で鮮やかに）
  float lm = luma(col);
  col = clamp(mix(vec3(lm), col, saturation), 0.0, 1.0);

  // 明部を紙白へ（塗り残しの白）
  float b = luma(col);
  col = mix(col, PAPER, smoothstep(0.85, 0.99, b) * whiteLift);

  // 紙のグレイン（薄く・乗算）
  float grain = fbm(uv * res * 0.5);
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
        ['edgeWarp', new Uniform(nprState.edgeWarp)],
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
    this.uniforms.get('edgeWarp')!.value = nprState.edgeWarp;
    this.uniforms.get('saturation')!.value = nprState.saturation;
    this.uniforms.get('bleed')!.value = nprState.bleed;
  }
}

export const Watercolor = forwardRef<WatercolorImpl>((_props, ref) => {
  const effect = useMemo(() => new WatercolorImpl(), []);
  return <primitive ref={ref} object={effect} dispose={null} />;
});
Watercolor.displayName = 'Watercolor';
