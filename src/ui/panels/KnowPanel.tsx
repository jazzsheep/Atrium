import { content } from '../../data/content';

// 知る（家）= 経歴・理念。セクション: career / statement。
export function KnowPanel() {
  const { profile, career, awards, statement } = content.know;
  return (
    <div className="panel-body">
      <p className="lead">{profile}</p>

      <section data-section="career" className="panel-section">
        <h3 className="section-h">経歴</h3>
        <ul className="timeline">
          {career.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        <h4 className="sub-h">受賞</h4>
        <ul className="awards">
          {awards.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </section>

      <section data-section="statement" className="panel-section">
        <h3 className="section-h">理念</h3>
        <p className="statement">{statement}</p>
      </section>
    </div>
  );
}
