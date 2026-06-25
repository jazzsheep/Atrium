// オブジェクト側の水彩マテリアル（面に乗る絵具）。
// 設計思想（重要）: 水彩の濃淡は「絵としての値（光の当たり方＋物の色）」が背骨で、
// その上に「水彩の物性」を乗せる。ランダムなムラを主役にしない。
//   - 値（明暗）は three の通常ライティングが作る（World.tsx の ambient/directional）。
//   - ここでは物性だけを足す:
//       map_fragment 後  … 顔料そのものの“ごく僅か”な地色ムラ（大スケール・低振幅）
//       normal 後        … シルエットの濡れ縁（フレネル, 控えめ）
//       末尾(ライト後)   … granulation は「暗部ほど」効き、紙の抜けは「明部ほど」出る
//                          （＝物性が値に従う。ここが“ランダムに見える”を回避する肝）

export const watercolorUniforms = {
  uDensity: { value: 0.6 }, // 顔料の濃さ＝紙にどれだけ色を乗せるか（小さいほど透明・ハイキー）
  uGran: { value: 0.8 }, // 紙目の granulation（暗部ほど顕著）
  uHole: { value: 0.4 }, // 塗り残しの白（紙が透ける塊）
  uEdge: { value: 0.5 }, // シルエットの濡れ縁（控えめ）
  uEdgeP: { value: 2.6 }, // 濡れ縁の鋭さ
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
  shader.uniforms.uDensity = watercolorUniforms.uDensity;
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
      '#include <common>\nvarying vec3 vWcPos;\nuniform float uDensity;\nuniform float uGran;\nuniform float uHole;\nuniform float uEdge;\nuniform float uEdgeP;\nfloat wcLuma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }\n' +
        noiseGLSL,
    )
    .replace(
      '#include <map_fragment>',
      `#include <map_fragment>
{
  // 顔料そのものの“ごく僅か”な地色ムラ。大スケール・低振幅で、汚れに見せない。
  float base = wcFbm(vWcPos * 0.07);
  diffuseColor.rgb *= 1.0 + (base - 0.5) * 0.08;
}`,
    )
    .replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
{
  // シルエットの濡れ縁：grazing 角で顔料が少し溜まる（深度不要・視点ごとに正しい）。
  float wcFres = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), uEdgeP);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.62, 0.66, 0.72), wcFres * uEdge);
}`,
    )
    .replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
{
  // ★透明水彩モデル: 「白い紙に薄い顔料を乗せる」。
  //   立体を陰影で塗り潰さず、紙の白を主役に残す＝ハイキー・透明・luminous。
  //   最終色 = 紙白 と 顔料色 を density で混ぜる（density 小=透けて明るい）。
  vec3 paper = vec3(0.992, 0.988, 0.972);
  vec3 pigment = gl_FragColor.rgb;          // 物の色×弱い光（値の背骨）
  float L = wcLuma(pigment);

  // 紙目の granulation（顔料の溜まりムラ）。低周波は弱め＝雲のような“もや”を避ける。
  float g1 = wcFbm(vWcPos * 1.10);
  float g2 = wcFbm(vWcPos * 3.20 + 7.0);
  float g3 = wcFbm(vWcPos * 7.50 + 13.0);
  float gran = (g1 * 0.30 + g2 * 0.40 + g3 * 0.30) - 0.5;

  // 顔料の濃さ(density)：薄い base ＋ granulation ＋ 暗部はやや濃く。
  float density = uDensity + gran * uGran * 0.5 + (1.0 - L) * 0.16;

  // 塗り残しの白：紙が覗く塊（明部ほど強い）。雲にしないよう中スケールで。
  float washN = wcFbm(vWcPos * 1.15 + 30.0);
  float leaveWhite = smoothstep(0.48, 0.66, washN) * (0.3 + 0.7 * smoothstep(0.35, 0.82, L)) * uHole;
  density = clamp(density - leaveWhite, 0.0, 1.0);

  // 透明に重ねる：薄いほど紙の白が透ける。
  gl_FragColor.rgb = mix(paper, pigment, density);
}`,
    );
}

// meshStandardMaterial のドロップイン置き換え。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function WMat(props: any) {
  return <meshStandardMaterial {...props} onBeforeCompile={watercolorOnBeforeCompile} />;
}
