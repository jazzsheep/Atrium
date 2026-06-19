# Atrium — V1 体験プロトタイプ

アーティストの世界観に「入って巡る」Webサイトの体験プロトタイプ（採用プレゼン用）。
**フロントエンド完結**・LLM／バックエンド／外部送信なし。状態はメモリ保持（リロードで初期化）。

> リファレンス実装＝美術家・奥中章人。**公開情報に基づく提案デモ**であり、変動情報は「サンプル」明示、作品画像は抽象プレースホルダー、問い合わせは送信されません。

設計の正本は [`atrium-v1-implementation-brief.md`](./atrium-v1-implementation-brief.md)、母艦仕様は [`atrium-spec.md`](./atrium-spec.md)。

## 体験の骨子
- 端のない**球面世界**。ハブ＋3場所（知る／見に行く／関わる）を**正四面体の4頂点**に配置。
- **没入型のみ**：風のアバターは常に画面中央、タップで球面世界が回り込む（俯瞰なし）。
- **二重の経路**：世界を巡る体験経路と、常時表示の文字メニュー（実用経路）。**両方が同じ入場処理 `enter()` を呼ぶ**。
- 各場所固有の入り演出（家＝カーテン／風船＝貫通／渦＝吸い込み）と、風で戻る演出。
- 絵柄＝水彩・草原・青空・日光。虹彩（ホログラム）は風船にだけ宿す。

## 技術スタック
Vite + React + TypeScript / React Three Fiber（Three.js）/ Zustand / Framer Motion。

## 開発・確認
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 型チェック＋本番ビルド（dist/）
npm run preview  # ビルド成果物をローカル確認
```
GitHub Codespaces でも `npm install && npm run dev` で、転送ポートのプレビューを**自分だけに**表示して確認できます。

## ディレクトリ
```
src/
  data/content.ts     コンテンツ正本（公開情報ベース）
  store/useAtrium.ts  状態 + enter()/returnToHub()（入場/戻りの一本化＝V2継ぎ目）
  types.ts            intent + focus 契約（V2継ぎ目）
  world/              3D 球面世界・正四面体配置・モチーフ
  avatar/             風のアバター（中央固定 SVG）
  ui/                 文字メニュー・中身パネル・明示表示・対話UIの将来枠
  transitions/        オープニング等の演出
  styles/             水彩トーン・パネル・メニュー
```

## スコープ（V1でやらないこと）
対話アバター／LLM、バックエンド／API認証／DB、本物の送信、複数アーティスト切替、音。
これらは V2 以降。V1 は「将来それらを足す継ぎ目」だけを仕込む。
