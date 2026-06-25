// オブジェクト側の水彩マテリアル（面に乗る絵具）。
// MeshStandardMaterial に onBeforeCompile でシェーダ注入:
//  - map_fragment 後: ワールド空間ノイズで「面の中の濃淡」＋「紙の白の抜け」＋寒暖のゆらぎ
//  - normal 後: フレネルでシルエットに「濡れ縁（顔料だまり）」。視点ごとに正しく、深度バッファ不要。

export const watercolorUniforms = {
  uGran: { value: 1.2 }, // 面の中の濃淡ムラ
  uHole: { value: 0.55 }, // 紙の白の抜け
  uEdge: { value: 1.1 }, // 濡れ縁の強さ
  uEdgeP: { value: 2.2 }, // 濡れ縁の鋭さ（大きいほど縁だけ）
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

  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWcPos;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWcPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');

  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vWcPos;\nuniform float uGran;\nuniform float uHole;\nuniform float uEdge;\nuniform float uEdgeP;\n' +
        noiseGLSL,
    )
    .replace(
      '#include <map_fragment>',
      `#include <map_fragment>
{
  float wgA = wcFbm(vWcPos * 0.10);           // 大きな wash の濃淡（滑らか）
  float wgB = wcFbm(vWcPos * 0.42 + 4.0);     // 中スケール
  float wgran = wgA * 0.62 + wgB * 0.38;
  diffuseColor.rgb *= 1.0 + (wgran - 0.5) * uGran;                       // 面の中の濃淡
  diffuseColor.rgb += vec3(0.06, 0.0, -0.05) * (wgB - 0.5) * uGran;      // 寒暖のゆらぎ
  // 紙の白の抜け：中スケールの塊（斑点でなく、まとまった明るい部分）
  float hole = smoothstep(0.58, 0.32, wgB) * uHole;
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
    );
}

// meshStandardMaterial のドロップイン置き換え。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WMat(props: any) {
  return <meshStandardMaterial {...props} onBeforeCompile={watercolorOnBeforeCompile} />;
}
