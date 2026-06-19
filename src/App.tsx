import { content } from './data/content';
import { Notice } from './ui/Notice';

// Phase 0（足場）: ブートと世界観トーンの確認のみ。
// Phase 1 以降で 3D 世界・アバター・メニュー・パネル・演出を載せていく。
export default function App() {
  return (
    <div className="atrium-root">
      <div className="atrium-sky" />
      <main className="atrium-stage">
        <p className="hub-hint">{content.artist.role}</p>
        <h1 className="artist-name">{content.artist.name}</h1>
        <div className="avatar-placeholder" aria-hidden>
          ༄
        </div>
      </main>
      <Notice />
    </div>
  );
}
