# Atrium — 体験プロトタイプ

美術家・（作家名）の世界観に「入って巡る」Webサイトの体験プロトタイプ（採用プレゼン用）。
**フロントエンド完結**・LLM／バックエンド／外部送信なし。状態はメモリ保持（リロードで初期化）。

> リファレンス実装＝美術家・（作家名）。**公開情報に基づく提案デモ**であり、変動情報は「サンプル」明示、作品画像は抽象プレースホルダー、問い合わせは送信されません。

## ドキュメントの読み方（ここから）
- **現行方針・アーキテクチャ・自分で確認する方法（エージェントはまずこれ）→ [`CLAUDE.md`](./CLAUDE.md)**
- 方針の背景・意思決定ログ・水彩NPRの試行と学び → [`docs/DIRECTION.md`](./docs/DIRECTION.md)
- 原案（出発点・**一部は実装で更新済み**）→ [`atrium-v1-implementation-brief.md`](./atrium-v1-implementation-brief.md) / [`atrium-spec.md`](./atrium-spec.md)

## 体験の骨子（現行）
- 大きな実寸の球（惑星）に乗った**小さな町**を**3人称で歩く**。3場所（知る／見に行く／関わる）は町のランドマーク。
- 操作：**WASD／スティックで移動、ドラッグで視点回転**。場所をタップ/クリックで入場。
- **二重の経路**：世界を巡る体験経路と、常時表示の文字メニュー（実用経路）。**両方が同じ入場処理 `enter()` を呼ぶ**（最重要の継ぎ目）。
- 各場所固有の入り演出（家＝カーテン／風船＝貫通／渦＝吸い込み）と、戻り演出。
- **絵柄＝3Dを“動く水彩画”として描画（NPR）**。面に絵具が乗る水彩マテリアル＋仕上げのスクリーン処理（→ CLAUDE.md §4）。

## 技術スタック
Vite + React + TypeScript / React Three Fiber（Three.js）/ @react-three/postprocessing / Zustand / Framer Motion。

## 開発・確認
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック＋本番ビルド（dist/）
npm run preview

# 描画を自分で確認（ヘッドレスChromium）。視覚調整時に使う。
node scripts/shot.mjs http://localhost:5173/ /tmp/shot.png
```

## 配信（GitHub Pages）
`.github/workflows/deploy-pages.yml` が push 時に `dist` をビルドして Pages へ配信。
**Settings → Pages → Source = 「GitHub Actions」**（ブランチ直配信だと未ビルドのソースが出て白画面）。
公開URL: https://jazzsheep.github.io/Atrium/

## ディレクトリ
```
src/
  data/content.ts      コンテンツ正本（公開情報ベース）
  store/useAtrium.ts   状態 + enter()/returnToHub()（入場/戻りの一本化＝V2継ぎ目）
  types.ts             intent + focus 契約（V2継ぎ目）
  world/               3D世界
    worldConfig.ts       全調整値・3場所定義・球面配置・NPRトグル
    World.tsx            球面キャラコントローラ＋オービットカメラ＋EffectComposer
    Planet / Sky / Town  地面 / グラデ空 / 町の点景（手続き生成）
    watercolorMaterial   面に乗る水彩マテリアル（WMat）
    WatercolorEffect     仕上げのスクリーン後処理
    PlaceMarker / motifs 3場所のランドマークと入り演出
    WindAvatar           仮アバター
  ui/                  文字メニュー・中身パネル・案内・明示表示・スティック・対話UI枠・安全網
  transitions/         オープニング・入り/戻りの2Dオーバーレイ
  styles/              トーン・パネル・メニュー・演出・操作
scripts/shot.mjs       ヘッドレスChromiumで描画をスクショ（自走確認用）
```

## スコープ（V1でやらないこと）
対話アバター／LLM、バックエンド／API認証／DB、本物の送信、複数アーティスト切替、音。
これらは V2 以降。V1 は「将来それらを足す継ぎ目」だけを仕込む（`enter()` / `intent+focus` / `AgentSlot`）。
