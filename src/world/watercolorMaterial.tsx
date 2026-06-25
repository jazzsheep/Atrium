// オブジェクト側の水彩マテリアル（面に乗る絵具）。
// MeshStandardMaterial に onBeforeCompile でシェーダ注入:
//  - map_fragment 後: ワールド空間ノイズで「面の中の濃淡」＋「紙の白の抜け」＋寒暖のゆらぎ
//  - normal 後: フレネルでシルエットに「濡れ縁（顔料だまり）」。視点ごとに正しく、深度バッファ不要。
//  - 末尾: 明度を緩く階調化（CG的な滑らかグラデを「平らな wash」に寄せる）。

export const watercolorUniforms = {
  uGran: { value: 1.2 }, // 面の中の濃淡ムラ
  uHole: { value: 0.55 }, // 紙の白の抜け
  uEdge: { value: 1.1 }, // 濡れ縁の強さ
  uEdgeP: { value: 2.2 }, // 濡れ縁の鋭さ（大きいほど縁だけ）
  uFlat: { value: 0.5 }, // 明度の階調化（0=滑らか, 1=平ら）
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
  shader.uniforms.uEdge = watercolorUniforms.uEdge;
  shader.uniforms.uEdgeP = watercolorUniforms.uEdgeP;
  shader.uniforms.uFlat = watercolorUniforms.uFlat;

  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWcPos;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWcPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vWcPos;\nuniform float uGran;\nuniform float uHole;\nuniform float uEdge;\nuniform float uEdgeP;\nuniform float uFlat;\nfloat wcLuma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }\n' +
        noiseGLSL,
    )
    .replace(
      '#include <map_fragment>',
      `#include <map_fragment>
{
  float wgA = wcFbm(vWcPos * 0.09);           // 大きな wash の濃淡（滑らか）
  float wgB = wcFbm(vWcPos * 0.40 + 4.0);     // 中スケール blotch（水彩のムラの主役）
  float wgC = wcFbm(vWcPos * 1.30 + 11.0);    // 細かい顔料粒（granulation）
  float wgran = wgA * 0.45 + wgB * 0.55;
  diffuseColor.rgb *= 1.0 + (wgran - 0.5) * uGran;                       // 面の中の濃淡
  diffuseColor.rgb += vec3(0.05, 0.0, -0.06) * (wgB - 0.5) * uGran;      // 寒暖のゆらぎ
  diffuseColor.rgb *= 1.0 + (wgC - 0.5) * 0.13;                          // 細かい粒
  // 紙の白の抜け：中スケールの塊（斑点でなく、まとまった明るい部分）
  float hole = smoothstep(0.60, 0.33, wgB) * uHole;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.99, 0.985, 0.965), hole);
}`,
    )
    .replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
{
  float wcFres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), uEdgeP);
  // 縁に顔料が溜まる（黒線でなく、少し濃く・寒色寄り）
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.5, 0.56, 0.68), wcFres * uEdge);
}`,
    )
    .replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
{
  // 明度を緩く階調化：CG的な滑らかグラデを「平らな wash」に寄せる。
  // ワールド空間ノイズで段の境界を揺らし、機械的なバンドにしない。
  float L = wcLuma(gl_FragColor.rgb);
  if (L > 0.001) {
    float jitter = (wcFbm(vWcPos * 0.7) - 0.5) * 0.10;
    float q = floor(L * 4.0 + 0.5 + jitter) / 4.0;     // ~4段
    float Lq = mix(L, clamp(q, 0.02, 1.0), uFlat);     // uFlat で滑らか↔平ら
    gl_FragColor.rgb *= Lq / L;
  }
}`,
    );
}

// meshStandardMaterial のドロップイン置き換え。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WMat(props: any) {
  return <meshStandardMaterial {...props} onBeforeCompile={watercolorOnBeforeCompile} />;
}
