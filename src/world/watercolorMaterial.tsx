// オブジェクト側の水彩マテリアル（面に乗る絵具）。
// MeshStandardMaterial に onBeforeCompile でシェーダ注入し、
//  - ワールド空間ノイズで「面の中の濃淡（顔料ムラ）」
//  - 低ノイズ域で「紙の白が抜ける（塗り残し）」
// を加える。世界は固定なので絵具が面に貼り付き、視点を動かしてもフィルター感が出ない。

// 共有ユニフォーム（後でライブ調整しやすいよう外出し）
export const watercolorUniforms = {
  uGran: { value: 0.55 }, // 濃淡ムラの強さ
  uHole: { value: 0.3 }, // 紙の白の抜け
};

const noiseGLSL = /* glsl */ `
float wcHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float wcNoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wcHash(i + vec3(0,0,0)), wcHash(i + vec3(1,0,0)), f.x),
                 mix(wcHash(i + vec3(0,1,0)), wcHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wcHash(i + vec3(0,0,1)), wcHash(i + vec3(1,0,1)), f.x),
                 mix(wcHash(i + vec3(0,1,1)), wcHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float wcFbm(vec3 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 3; i++){ v += a * wcNoise(p); p *= 2.0; a *= 0.5; } return v; }
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function watercolorOnBeforeCompile(shader: any) {
  shader.uniforms.uGran = watercolorUniforms.uGran;
  shader.uniforms.uHole = watercolorUniforms.uHole;

  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWcPos;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWcPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vWcPos;\nuniform float uGran;\nuniform float uHole;\n' + noiseGLSL,
    )
    .replace(
      '#include <map_fragment>',
      `#include <map_fragment>
{
  float wg1 = wcFbm(vWcPos * 0.28);
  float wg2 = wcFbm(vWcPos * 1.10 + 11.0);
  float wgran = mix(wg1, wg2, 0.4);
  // 面の中の濃淡（顔料ムラ）
  diffuseColor.rgb *= 1.0 + (wgran - 0.5) * uGran;
  // 紙の白が抜ける（低ノイズ域）
  float hole = smoothstep(0.55, 0.30, wg1) * uHole;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.99, 0.985, 0.965), hole);
}`,
    );
}

// meshStandardMaterial のドロップイン置き換え。色等は props で渡す。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WMat(props: any) {
  return <meshStandardMaterial {...props} onBeforeCompile={watercolorOnBeforeCompile} />;
}
