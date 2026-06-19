import { content } from '../data/content';

// 必須表示: 「公開情報に基づく提案デモ」である旨（brief §1 / 受け入れ条件 A）。
// 画面の隅に常時、控えめだが読める形で出す。
export function Notice() {
  return (
    <div className="atrium-notice" role="note">
      {content.artist.note}
    </div>
  );
}
