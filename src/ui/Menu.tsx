import { useAtrium } from '../store/useAtrium';
import { content } from '../data/content';
import { MENU } from './menuConfig';
import { AgentSlot } from './AgentSlot';
import type { PlaceId, SectionId } from '../types';

// 文字メニュー（実用の経路）。PC は左サイド常駐、スマホはハンバーガーで開閉。
// ★大項目見出しも小項目も、すべて同じ enter() を呼ぶ（入場処理の一本化＝継ぎ目）。
export function Menu() {
  const location = useAtrium((s) => s.location);
  const focusedPlace = useAtrium((s) => s.focusedPlace);
  const menuOpen = useAtrium((s) => s.menuOpen);
  const setMenuOpen = useAtrium((s) => s.setMenuOpen);
  const enter = useAtrium((s) => s.enter);
  const returnToHub = useAtrium((s) => s.returnToHub);

  // 現在地ハイライト: 中にいればその場所、巡回中なら寄せている場所。
  const current: PlaceId | null = location !== 'hub' ? location : focusedPlace;

  const go = (place: PlaceId, section?: SectionId) => {
    // メニュー経由も同じ入場処理。fromMenu で演出を短くテンポよく。
    enter({ place, section: section ?? null }, { fromMenu: true });
  };
  const home = () => returnToHub();

  return (
    <>
      {/* スマホ上部バー */}
      <div className="topbar">
        <button
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={menuOpen}
        >
          <span />
          <span />
          <span />
        </button>
        <Brand />
        <button className="home-btn home-btn--icon" onClick={home} aria-label="ハブに戻る">
          ⌂
        </button>
      </div>

      {/* スマホ: ドロワーの背景 */}
      <div
        className={`menu-backdrop ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* サイドナビ（PC常駐／スマホはドロワー） */}
      <nav className={`sidenav ${menuOpen ? 'open' : ''}`} aria-label="メインメニュー">
        <Brand large />

        <button className="home-btn" onClick={home}>
          <span className="home-ico">⌂</span> ハブに戻る
        </button>

        <ul className="menu-groups">
          {MENU.map((g) => (
            <li
              key={g.place}
              className={`group ${current === g.place ? 'current' : ''}`}
            >
              <button
                className="group-head"
                onClick={() => go(g.place)}
                aria-current={current === g.place ? 'true' : undefined}
              >
                {g.label}
              </button>
              <ul className="sub">
                {g.sections.map((s) => (
                  <li key={s.id}>
                    <button className="sub-item" onClick={() => go(g.place, s.id)}>
                      {s.label}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <AgentSlot />
      </nav>
    </>
  );
}

function Brand({ large = false }: { large?: boolean }) {
  return (
    <div className={`brand ${large ? 'brand-large' : ''}`}>
      <div className="brand-logo">Atrium</div>
      <div className="brand-artist">
        {content.artist.name}
        <span className="brand-role">{content.artist.role}</span>
      </div>
    </div>
  );
}
