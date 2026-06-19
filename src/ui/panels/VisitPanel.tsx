import { content } from '../../data/content';
import { BalloonArt, LightArt } from './Placeholders';

// 見に行く（風船）= 作品2点・展示。セクション: works / exhibitions。
export function VisitPanel() {
  const { works, exhibitions } = content.visit;
  return (
    <div className="panel-body">
      <section data-section="works" className="panel-section">
        <h3 className="section-h">作品</h3>
        <div className="works">
          {works.map((w, i) => (
            <article className="work" key={i}>
              <div className="work-figure">
                {w.image === 'placeholder-balloon' ? <BalloonArt /> : <LightArt />}
              </div>
              <div className="work-meta">
                <h4 className="work-title">
                  {w.title}
                  {w.year && <span className="work-year">{w.year}</span>}
                </h4>
                <p className="work-desc">{w.desc}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="muted">※ 作品画像は著作権に配慮し、抽象プレースホルダーで表しています。</p>
      </section>

      <section data-section="exhibitions" className="panel-section">
        <h3 className="section-h">展示</h3>
        <ul className="exhibitions">
          {exhibitions.map((ex, i) => (
            <li className="exhibition" key={i}>
              <div className="ex-when">{ex.when}</div>
              <div className="ex-main">
                <span className="ex-what">{ex.what}</span>
                {ex.sample && <span className="sample-badge">サンプル</span>}
                <div className="ex-where">{ex.where}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
