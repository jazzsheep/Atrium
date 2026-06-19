import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAtrium } from '../store/useAtrium';
import { PLACE_META } from '../world/tetrahedron';
import { content } from '../data/content';
import { KnowPanel } from './panels/KnowPanel';
import { VisitPanel } from './panels/VisitPanel';
import { RelatePanel } from './panels/RelatePanel';

// 中身パネルの宿主。入場/戻りの一本化（enter / returnToHub）の終点。
// 小項目で開いたときは activeSection へスクロール＋一瞬ハイライト。
export function PanelHost() {
  const phase = useAtrium((s) => s.phase);
  const location = useAtrium((s) => s.location);
  const activeSection = useAtrium((s) => s.activeSection);
  const returnToHub = useAtrium((s) => s.returnToHub);

  const bodyRef = useRef<HTMLDivElement>(null);
  const place = phase === 'inside' && location !== 'hub' ? location : null;

  // 小項目で開いたら該当セクションへスクロール＋一瞬ハイライト。
  useEffect(() => {
    if (!place) return;
    const el = bodyRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      if (activeSection) {
        const target = el.querySelector<HTMLElement>(`[data-section="${activeSection}"]`);
        if (target) {
          target.scrollIntoView({ block: 'start', behavior: 'auto' });
          target.classList.add('section-focus');
          window.setTimeout(() => target.classList.remove('section-focus'), 1600);
          return;
        }
      }
      el.scrollTop = 0;
    });
  }, [place, activeSection]);

  // Escape で閉じる（戻り処理は一本化された returnToHub）。
  useEffect(() => {
    if (!place) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') returnToHub();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [place, returnToHub]);

  return (
    <AnimatePresence>
      {place && (
        <motion.div
          className="panel-scrim"
          // 背景（パネルの外側）クリックで閉じる。
          onClick={(e) => {
            if (e.target === e.currentTarget) returnToHub();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.section
            className="panel"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <header className="panel-head">
              <div>
                <p className="panel-kicker">
                  {content.artist.name}・{content.artist.role}
                </p>
                <h2 className="panel-title">{PLACE_META[place].label}</h2>
              </div>
              <button
                className="panel-close"
                onClick={returnToHub}
                aria-label="閉じてハブに戻る"
              >
                ×
              </button>
            </header>

            <div className="panel-content" ref={bodyRef}>
              {place === 'know' && <KnowPanel />}
              {place === 'visit' && <VisitPanel />}
              {place === 'relate' && <RelatePanel />}
            </div>

            <footer className="panel-foot">
              <button className="btn-back" onClick={returnToHub}>
                風に乗って戻る
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
