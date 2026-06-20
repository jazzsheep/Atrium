# Atrium — 体験プロトタイプ

美術家・奥中章人の世界観に「入って巡る」Webサイトの体験プロトタイプ（採用プレゼン用）。
**フロントエンド完結**・LLM／バックエンド／外部送信なし。状態はメモリ保持（リロードで初期化）。

> リファレンス実装＝美術家・奥中章人。**公開情報に基づく提案デモ**であり、変動情報は「サンプル」明示、作品画像は抽象プレースホルダー、問い合わせは送信されません。

## ドキュメントの読み方
- **現行方針・アーキテクチャ（エージェントはまずこれ）→ [`CLAUDE.md`](./CLAUDE.md)**
- 方針の背景・意思決定ログ・ロードマップ → [`docs/DIRECTION.md`](./docs/DIRECTION.md)
- 原案（出発点・**一部は実装で更新済み**）→ [`atrium-v1-implementation-brief.md`](./atrium-v1-implementation-brief.md) / [`atrium-spec.md`](./atrium-spec.md)

## 体験の骨子（現行）
- 大きな実寸の球（惑星）に乗った**小さな町**を歩く。3場所（知る／見に行く／関わる）は町のランドマーク。
- **3人称操作**：WASD／バーチャルスティックで移動、ドラッグで視点回転。場所をタップ/クリックで入場。
- **二重の経路**：世界を巡る体験経路と、常時表示の文字メニュー（実用経路）。**両方が同じ入場処理 `enter()` を呼ぶ**（最重要の継ぎ目）。
- 各場所固有の入り演出（家＝カーテン／風船＝貫通／渦＝吸い込み）と、戻り演出。
- **絵柄＝「3Dで動くが、描画は2Dの水彩画」**（NPR）。空気・水・光のトーン。〔実装はスパイクで検証中〕

## 技術スタック
Vite + React + TypeScript / React Three Fiber（Three.js）/ Zustand / Framer Motion。

## 開発・確認
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック＋本番ビルド（dist/）
npm run preview  # ビルド成果物をローカル確認
```

## 配信（GitHub Pages）
`.github/workflows/deploy-pages.yml` が push 時に `dist` をビルドして Pages へ配信。
**Settings → Pages → Source = 「GitHub Actions」**にすること（ブランチ直配信だと未ビルドのソースが出て白画面）。
公開URL: https://jazzsheep.github.io/Atrium/

## ディレクトリ
```
src/
  data/content.ts      コンテンツ正本（公開情報ベース）
  store/useAtrium.ts   状態 + enter()/returnToHub()（入場/戻りの一本化＝V2継ぎ目）
  types.ts             intent + focus 契約（V2継ぎ目）
  world/               3D世界（worldConfig=調整値 / World=コントローラ / Planet / Town / 場所 / motifs / avatar）
  ui/                  文字メニュー・中身パネル・案内・明示表示・スティック・対話UIの将来枠
  transitions/         オープニング・入り/戻りの2Dオーバーレイ
  styles/              トーン・パネル・メニュー・演出・操作
```

## スコープ（V1でやらないこと）
対話アバター／LLM、バックエンド／API認証／DB、本物の送信、複数アーティスト切替、音。
これらは V2 以降。V1 は「将来それらを足す継ぎ目」だけを仕込む（`enter()` / `intent+focus` / `AgentSlot`）。
