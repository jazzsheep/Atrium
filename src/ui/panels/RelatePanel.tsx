import { useState } from 'react';
import { content } from '../../data/content';

// 関わる（渦）= 4つの窓口（制作依頼/出資/ワークショップ/問い合わせ）＋ダミーのリンク。
// セクション: commission / contribution / workshop / contact。
export function RelatePanel() {
  const { channels, links, formNotice } = content.relate;
  return (
    <div className="panel-body">
      <p className="lead">ご関心に合わせて、4つの窓口があります。</p>

      <div className="channels">
        {channels.map((ch) => (
          <section key={ch.id} data-section={ch.id} className="channel panel-section">
            <h3 className="section-h">{ch.label}</h3>
            <p>{ch.desc}</p>
            {ch.id === 'contact' && <ContactForm notice={formNotice} />}
          </section>
        ))}
      </div>

      <div className="links panel-section">
        <h4 className="sub-h">
          リンク <span className="sample-badge">サンプル</span>
        </h4>
        <ul className="link-row">
          {(Object.keys(links) as Array<keyof typeof links>).map((k) => (
            <li key={k}>
              <a
                href={links[k]}
                onClick={(e) => e.preventDefault()}
                className="dummy-link"
              >
                {LINK_LABELS[k]}
              </a>
            </li>
          ))}
        </ul>
        <p className="muted">※ リンクはデモ用のダミーです（実際には遷移しません）。</p>
      </div>
    </div>
  );
}

const LINK_LABELS: Record<string, string> = {
  website: 'Website',
  instagram: 'Instagram',
  x: 'X',
  youtube: 'YouTube',
};

// 問い合わせフォーム: 見た目は作るが「送信されない」ことを明示（本物の送信機能なし）。
function ContactForm({ notice }: { notice: string }) {
  const [sent, setSent] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true); // 送信はしない。明示メッセージを出すだけ。
  };
  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>お名前</span>
        <input type="text" name="name" autoComplete="off" />
      </label>
      <label className="field">
        <span>メールアドレス</span>
        <input type="email" name="email" autoComplete="off" />
      </label>
      <label className="field">
        <span>ご用件</span>
        <textarea name="message" rows={3} />
      </label>
      <p className="form-notice" role="note">
        ⚠ {notice}
      </p>
      <button type="submit" className="btn-submit">
        送信（デモ）
      </button>
      {sent && (
        <p className="form-done" role="status">
          受け付けました——ですが、これはデモのため<strong>送信は行われていません</strong>。
        </p>
      )}
    </form>
  );
}
