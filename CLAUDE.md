# CLAUDE.md — Atrium 開発ガイド（エージェント向け）

このリポジトリで作業する Claude へ。**まずこの文書を最後まで読むこと。**
原案 `atrium-v1-implementation-brief.md` / `atrium-spec.md` は出発点だが、実装は反復で大きく更新された。
**現行方針はこの文書が最優先**（経緯と判断の記録は `docs/DIRECTION.md`）。

---

## 1. これは何か
美術家・奥中章人の世界観に「入って巡る」**フロントエンド完結**の体験サイト（採用プレゼン用プロトタイプ）。
判断軸＝**プレゼンで相手の心が動くか**。テーマ＝「空気・水・光」。

ひとことで言うと：**「実寸の小さな町を3人称で歩き、画面はまるで“動く水彩画”として描かれる」体験**。
そこに**3つの場所**（知る／見に行く／関わる）がランドマークとして在り、入ると経歴・作品・問い合わせのパネルが開く。

---

## 2. 現行の全体像（原案からの到達点）
| 要素 | いまの形 | 原案からの変化 |
|---|---|---|
| 世界 | 大きな実寸の球（惑星, `R=60m`）に乗った**小さな町**。3場所は町のランドマーク | 正四面体・抽象球は**撤回** |
| 操作 | **3人称**。WASD/スティックで視点基準に移動、**ドラッグで視点回転（オービット）** | タップ移動・没入固定・俯瞰なしは**撤回** |
| スケール | 実寸（1単位≒1m）。アバター≒1.3m、建物≒5m | 抽象スケールから変更 |
| 絵柄 | **3Dを“動く水彩画”として描画（NPR）**。→ §4 | 2D水彩トーンを3Dで実現する方向に深化 |
| アバター | **未確定**（当面は淡い球）。候補: 風の球体 / 3Dキャラ | 2D SVG から3Dへ |
| 配信 | GitHub Pages（Actions が `dist` をビルド配信） | 新規 |

---

## 3. 変えてはいけない背骨（不変条件）
- **入場/戻りの一本化**: `enter(focus, opts)` と `returnToHub()`（`src/store/useAtrium.ts`）。
  **タップ・メニュー・〔V2〕対話の全経路がこれを呼ぶ**。経路ごとに別実装にしない。← 最重要の継ぎ目。
- **二重経路**: 「巡る体験」と「常時の文字メニュー（実用）」。両方が同じ `enter()` を呼ぶ。
- **V2継ぎ目**: `intent+focus` 契約（`src/types.ts`）、対話UIの将来枠（`src/ui/AgentSlot.tsx`）。
- **コンテンツ規約**: 公開情報のみ・**事実を創作しない**・変動情報は `[サンプル]` 明示・作品は抽象プレースホルダー・
  問い合わせは**「送信されません」明示**・**「公開情報に基づく提案デモ」表示**。
- フロント完結 / **LLM・バックエンド・外部送信なし** / 状態はメモリ保持（リロードで初期化）。
- 軽量・**モバイル優先** / `prefers-reduced-motion` 対応 / 3D失敗時も2Dで継続（`ErrorBoundary`）。
- 演出秒数: オープニング〜3秒、入り/戻り1〜2秒。オープニングは**初回のみ**。

---

## 4. 水彩NPR（いちばん難しく、いちばん大事な所）
**狙い**：3Dの形は本物のまま（どの角度でも破綻しない）、**どの視点・どの瞬間も「1枚の水彩画として成立」**して見える。
これは NPR（ノンフォトリアル）で最難関の部類。完全な手描き一致は realtime では難しい——“様式化された水彩”として近づける。

**やってはいけない**：2Dで描いた絵をビルボード（板）で立てる手法。横から見ると破綻する＝NG（ユーザー却下済み）。

**実装は2層**（`NPR.enabled` 一行で全体ON/OFF）:
1. **面の絵具（オブジェクト側）= `src/world/watercolorMaterial.tsx`**
   `MeshStandardMaterial` に `onBeforeCompile` で注入。**世界は固定なので絵具が面に貼り付き、視点を動かしてもフィルター越しにならない**（これが核心）。
   - ワールド空間ノイズで**面の中の濃淡（顔料ムラ）**＋**紙の白の抜け（塗り残し）**＋寒暖のゆらぎ（`map_fragment` 後）
   - **フレネルでシルエットに濡れ縁（顔料だまり）**。深度バッファ不要で視点ごとに正しい（`normal_fragment_begin` 後）
   - 適用先: `Planet`（地面）と `Town`（家/木/岩/街灯/広場/道）。`<WMat>` がドロップイン置換。
   - 調整: `watercolorUniforms = { uGran, uHole, uEdge, uEdgeP }`（ライブ書換可）。
2. **仕上げ（スクリーン側）= `src/world/WatercolorEffect.tsx`**（`@react-three/postprocessing`）
   柔らかい筆致のブラー → 手描き揺らぎ → 明部を紙白へ → 紙のグレイン。調整: `nprState = { paper, whiteLift, wobble }`（`nprControls.ts`）。
   - ※**深度ベースの縁は廃止**（postprocessing の depth blit 警告＋不動作のため）。縁は上記フレネルが担う。
- **空** = `src/world/Sky.tsx`（ほぼ白い紙＋天頂に淡い青のグラデ球）。背景も水彩に乗せ一枚絵に。
- 陰影は wash 寄り（環境光0.8＋指向性0.85）。

**到達点と限界（重要）**：面の濃淡・白の抜け・濡れ縁は出る。だが**いまの頭打ちはシェーダでなく「形」**——
円錐の木・箱の家という幾何形状は、描画をどれだけ寄せても**ゆるい水彩の筆致にはならない**。
**次の最大のレバーは「有機的な3Dの形（モデル）」**（ビルボードでない本物の3D。→ §10 / DIRECTION）。

---

## 5. アーキテクチャ地図
- `src/store/useAtrium.ts` … 状態 + `enter()`/`returnToHub()`（継ぎ目）。`phase`/`location`/`focusedPlace`/`activeSection`。
- `src/types.ts` … `intent` + `focus` 契約（V2継ぎ目）。
- `src/world/worldConfig.ts` … **世界の全調整値**（`R, fov, townRadius, move, look, cam, avatar`）+ 3場所定義 `PLACES` + 球面配置 `surfaceDir/surfacePose` + `NPR`。**まずここを見る。**
- `src/world/World.tsx` … Canvas + **球面キャラコントローラ**（視点基準移動/オービットカメラ/入場ドリー）+ 入力（WASD・ドラッグ）+ `EffectComposer`。
- `src/world/Planet.tsx` … 大きな球（地面）。`<WMat>` で水彩。
- `src/world/Sky.tsx` … グラデ空ドーム。
- `src/world/Town.tsx` … 町の点景（家/木/岩/街灯）+ 広場 + 石畳の道。**手続き生成**。`<WMat>`。
- `src/world/watercolorMaterial.tsx` … 面の水彩マテリアル（`WMat` / `watercolorUniforms`）。
- `src/world/WatercolorEffect.tsx` … 仕上げのスクリーン後処理（`nprControls.ts` の `nprState` を読む）。
- `src/world/PlaceMarker.tsx` … 3場所のランドマーク（モチーフ + タップ入場）。
- `src/world/motifs/{House,Balloon,Vortex}.tsx` … 各場所固有の入り演出モチーフ（`closeness` で駆動）。
- `src/world/transitionContext.tsx` … 演出の共有信号（`closeness`/`active`）。再レンダーを起こさない。
- `src/world/WindAvatar.tsx` … アバター（仮の球）。
- `src/ui/Joystick.tsx` … スマホ用バーチャルスティック。
- `src/ui/{Menu,PanelHost,HudCaption,Notice,AgentSlot,ErrorBoundary}.tsx` … 文字メニュー/中身パネル/案内/明示表示/対話UI枠/安全網。
- `src/transitions/{Opening,EnterEffect}.tsx` … オープニング/入り・戻りの2Dオーバーレイ。
- `src/data/content.ts` … コンテンツ正本。
- `src/styles/*.css` … トーン/パネル/メニュー/演出/操作。

---

## 6. 操作の内部モデル（World.tsx）
世界（球）は**固定**。アバターは `pos`（単位ベクトル）で球面上を移動、カメラは `camF`（接ベクトル）＋`pitch` でオービット。
- WASD/スティック = **視点基準ストレイフ**（大円移動。移動時に `camF` も平行移動）。
- ドラッグ = `camF` 回転(yaw) + `pitch`（上下、範囲制限）。
- 町は `townRadius` でクランプ。場所近接で `focusedPlace` 更新、タップ/クリックで `enter()`。
- 入場/戻りは `closeness`（0→1）でカメラのドリー＋モチーフ演出を駆動（`transitionContext`）。

---

## 7. ★自分で結果を見るループ（視覚調整は必ずこれを使う）
**この環境はヘッドレスChromium＋Playwrightが使える。**`github.io` への外部アクセスは制限だが、**ローカルで自分の描画をスクショして自分で確認できる**。
視覚（特に水彩NPR）の調整は、ユーザーに毎回スクショを頼まず**自分で回すこと**。

```bash
npm run dev                                   # dev サーバ（localhost:5173）を一度起動（背景）
node scripts/shot.mjs http://localhost:5173/ /tmp/shot.png   # ヘッドレスで描画→PNG。文字UIは隠す。console/pageエラーも表示
# 出力の PNG を Read で「見て」、編集→再スクショ で反復
```
- Playwright は導入済み。ブラウザは `/opt/pw-browsers` の既存Chromiumを `executablePath` で直接使う（`shot.mjs` が自動検出）。WebGLは swiftshader 引数で動く。
- **シェーダのコンパイルエラーも console に出る**ので、黒画面の原因をその場で特定できる（深度縁の不動作もこれで判明した）。
- dev は GLSL を実行時コンパイルするので、`.tsx` を編集→ページ再読込（毎回新規 goto）で最新が反映。

---

## 8. 開発・確認・配信
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック + 本番ビルド（dist/）
npm run preview
```
- push で Actions が `dist` をビルドし **GitHub Pages** へ自動配信。**Pages Source = GitHub Actions**。URL: https://jazzsheep.github.io/Atrium/
- 配信ブランチ＝`main`（と作業ブランチ）。ワークフローは `.github/workflows/deploy-pages.yml`。
- 配信成否は MCP（`actions_*`）で確認（出力が大きい時はファイル保存される→Pythonで抽出）。
- ⚠️ 外部egress制限あり：素材の直接DL不可＝**ユーザーがGLB等をアップロードする運用**。`github.io` への curl も不可（確認は §7 のローカルスクショで）。

---

## 9. ハマりどころ
- Pages は **`dist` を配信**（Source=GitHub Actions）。リポジトリ直下の `index.html` は**dev用ソース**＝そのまま配信すると白画面。
- 水彩NPR は `MeshStandardMaterial`+`onBeforeCompile` の**チャンク名**（`#include <map_fragment>` 等）に依存。three を更新したらチャンク名を確認。
- postprocessing は fiber8 のため **v2系**（`@react-three/postprocessing@^2`）。v3 は fiber9/React19 要求。
- `@react-three/postprocessing` の **DEPTH 属性は depth blit 警告＋不動作**だった→使わない（縁はフレネルで）。
- 大きな MCP 出力（`actions_list` 等）はトークン超過でファイル保存→ Python でスライス/抽出。

---

## 10. いま進行中 / 次の一手
1. **水彩NPRの自走改善**（§7のループで参考画に寄せる）。頭打ちはあるが描画はまだ詰められる。
2. **「形」のレバー**＝木・家を**有機的な3Dモデル**へ（Blender自作 / CC0の有機ローポリ / ユーザー提供のGLB）。
   ※ビルボード（2D板）はNG。glTFローダ（`drei useGLTF`）＋レジストリ＋instancing を用意して差し替え。素材は形重視・簡素マテリアル（水彩は描画側）。
3. **既知ギャップ**：場所モチーフ（House/Vortex）はまだ `WMat` 未適用＝町と質感が不揃い。Balloon は虹彩（意図的に別）。整える予定。
4. **アバター最終像**の決定（風の球体 / 3Dキャラ）。
5. **パラパラ漫画（boil/低fps）**は後回し（一度実装し撤去済み。再開する時は frameloop 間引き＋ノイズの毎フレーム描き直し）。
