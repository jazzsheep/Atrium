# CLAUDE.md — Atrium 開発ガイド（エージェント向け）

このリポジトリで作業する Claude へ。**まずこの文書を読むこと。**
原案 `atrium-v1-implementation-brief.md` / `atrium-spec.md` は出発点だが、実装は反復の中で意図的に更新されている。
**現行方針はこの文書が優先**（経緯と判断は `docs/DIRECTION.md`）。

## プロダクト一言
美術家・奥中章人の世界観に「入って巡る」**フロントエンド完結**の体験サイト（採用プレゼン用プロトタイプ）。
判断軸＝**プレゼンで相手の心が動くか**。テーマ＝「空気・水・光」。

## 現行の方針（原案からの主な更新点）
- **世界** = 大きな実寸の球（惑星, `R≒60`）に乗った**小さな町**。3場所（知る/見に行く/関わる）は町のランドマーク。〔原案の正四面体・抽象球は撤回〕
- **操作** = **3人称**。WASD/バーチャルスティックで**視点基準に移動**、**ドラッグで視点回転（オービット）**。〔原案の「タップ移動・没入のみ・俯瞰なし」は撤回〕
- **スケール** = 実寸（1単位≒1m）。アバター≒1.3m、建物≒5m。
- **絵柄** = **「3Dで動くが、描画は2Dの水彩画」= NPR（ノンフォトリアル）で水彩表現**。原案の水彩トーンを3D上で実現する方向。実装は post-processing のスパイクで検証予定（→ DIRECTION）。
- **造形** = Blender / CC0 の **glTF(GLB)** を読み込む。ただし水彩レンダのため**フォトリアルにしない**＝形重視・簡素なマテリアル（水彩感は描画側で付与）。
- **アバター** = **未確定**（当面は仮の淡い球）。候補: 風の球体 / 3Dキャラ。
- **配信** = GitHub Pages（`.github/workflows/deploy-pages.yml` が `dist` をビルドして配信。**Pages Source = GitHub Actions**）。

## 変えてはいけない背骨（不変条件）
- **入場/戻りの一本化**: `enter(focus, opts)` と `returnToHub()`（`src/store/useAtrium.ts`）。**タップ・メニュー・〔V2〕対話の全経路がこれを呼ぶ**。経路ごとに別実装にしない。← 最重要の継ぎ目。
- **二重経路**: 「巡る体験」と「常時の文字メニュー（実用）」の両立。両方が同じ `enter()` を呼ぶ。
- **V2継ぎ目**: `intent+focus` 契約（`src/types.ts`）、対話UIの将来枠（`src/ui/AgentSlot.tsx`）。
- **コンテンツ規約**: 公開情報のみ・**事実を創作しない**・変動情報は `[サンプル]` 明示・作品は抽象プレースホルダー・問い合わせは**「送信されません」明示**・**「公開情報に基づく提案デモ」表示**。
- フロント完結 / **LLM・バックエンド・外部送信なし** / 状態はメモリ保持（リロードで初期化）。
- 軽量・**モバイル優先** / `prefers-reduced-motion` 対応 / 3D失敗時も2Dで継続（`ErrorBoundary`）。
- 演出秒数: オープニング〜3秒、入り/戻り1〜2秒。オープニングは**初回のみ**。

## アーキテクチャ地図
- `src/store/useAtrium.ts` … 状態 + `enter()`/`returnToHub()`（継ぎ目）。`phase`/`location`/`focusedPlace`/`activeSection`。
- `src/types.ts` … `intent` + `focus` 契約（V2継ぎ目）。
- `src/world/worldConfig.ts` … **世界の全調整値**（`R, fov, townRadius, move, look, cam, avatar`）+ 3場所定義 `PLACES` + 球面配置ヘルパ `surfaceDir/surfacePose`。**まずここを見る。**
- `src/world/World.tsx` … Canvas + **球面キャラコントローラ**（移動/オービットカメラ/入場ドリー）+ 入力（WASD・ドラッグ）。
- `src/world/Planet.tsx` … 大きな球（地面）+ 水彩テクスチャ。
- `src/world/Town.tsx` … 町の点景（家/木/岩/街灯）+ 広場 + 石畳の道。**手続き生成（→ glTF に差し替え予定）**。
- `src/world/PlaceMarker.tsx` … 3場所のランドマーク（モチーフ + タップ入場）。
- `src/world/motifs/{House,Balloon,Vortex}.tsx` … 各場所固有の入り演出モチーフ（`closeness` で駆動）。
- `src/world/transitionContext.tsx` … 演出の共有信号（`closeness`/`active`）。再レンダーを起こさない。
- `src/world/WindAvatar.tsx` … アバター（仮）。
- `src/ui/Joystick.tsx` … スマホ用バーチャルスティック。
- `src/ui/{Menu,PanelHost,HudCaption,Notice,AgentSlot}.tsx` … 文字メニュー/中身パネル/案内/明示表示/対話UI枠。
- `src/transitions/{Opening,EnterEffect}.tsx` … オープニング/入り・戻りの2Dオーバーレイ。
- `src/data/content.ts` … コンテンツ正本。
- `src/styles/*.css` … トーン/パネル/メニュー/演出/操作。

## 操作の内部モデル（World.tsx）
世界（球）は固定。アバターは `pos`（単位ベクトル）で球面上を移動。カメラは `camF`（接ベクトル）＋`pitch` でオービット。
WASD/スティック=視点基準ストレイフ（大円移動、移動時に `camF` を平行移動）、ドラッグ=`camF` 回転(yaw)+`pitch`。
町は `townRadius` でクランプ。場所近接で `focusedPlace` 更新、タップ/クリックで `enter()`。

## 開発・確認・配信
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック + 本番ビルド（dist/）
npm run preview
```
- push（開発ブランチ `claude/charming-dijkstra-5qsv0l`）で Actions が `dist` をビルドし **GitHub Pages** へ自動配信。URL: https://jazzsheep.github.io/Atrium/
- ⚠️ この実行環境は**外部egress制限あり**（`github.io` 等へ curl 不可）。素材の直接DL不可＝**ユーザーがGLBをアップロードする運用**。Pages反映確認は MCP（`actions_*`）で。

## いま進行中 / 次の一手
1. **水彩NPRレンダのスパイク**（`@react-three/postprocessing`：紙テクスチャ + 縁の滲み + トゥーン + 手描き揺らぎ。モバイルは品質ティア）。
2. **glTFパイプライン**（`drei useGLTF` + モデルレジストリ + instancing）。CC0/Blender 素材をユーザーがアップ → `public/models/` → 差し替え。素材は**形重視・簡素マテリアル**。
3. **アバター最終像**の決定（風の球体 / 3Dキャラ）。

## ハマりどころ
- Pages は **`dist` を配信**（Source=GitHub Actions）。リポジトリ直下の `index.html` は**dev用ソース**＝そのまま配信すると白画面。
- `@react-three/drei` は現在**未使用**（glTF導入時に再追加）。
- 原案の正四面体／没入固定／2Dアバターのコードは**撤去済み**。
- 大きな出力（`actions_list` 等）はトークン超過でファイル保存される→ Python でスライス/抽出して読む。
