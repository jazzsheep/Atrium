import { AnimatePresence, motion } from 'framer-motion';
import { useAtrium } from '../store/useAtrium';
import { PLACE_META } from '../world/tetrahedron';

// 中身パネルの宿主。Phase 1 は仮の枠（場所名＋戻る）で、入場/戻りの一本化を端から端まで通す。
// Phase 3 で各場所の本物のパネルに差し替える。
export function PanelHost() {
  const phase = useAtrium((s) => s.phase);
  const location = useAtrium((s) => s.location);
  const returnToHub = useAtrium((s) => s.returnToHub);

  // inside かつ場所（ハブでない）のときだけパネルを開く。place は PlaceId に絞られる。
  const place = phase === 'inside' && location !== 'hub' ? location : null;

  return (
    <AnimatePresence>
      {place && (
        <motion.div
          className="panel-scrim"
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
            <h2 className="panel-title">{PLACE_META[place].label}</h2>
            <p className="panel-note">中身は次の段階（Phase 3）で実装します。</p>
            <button className="btn-back" onClick={returnToHub}>
              風に乗って戻る
            </button>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
