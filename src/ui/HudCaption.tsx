import { AnimatePresence, motion } from 'framer-motion';
import { useAtrium } from '../store/useAtrium';
import { PLACE_META } from '../world/tetrahedron';

// 中央のアバター下に出る案内。寄せた場所の名前と「タップして入る」を示す（サクサクな入場の手掛かり）。
export function HudCaption() {
  const phase = useAtrium((s) => s.phase);
  const focusedPlace = useAtrium((s) => s.focusedPlace);
  const show = phase === 'idle';
  const label = focusedPlace ? PLACE_META[focusedPlace].label : null;
  const hint = focusedPlace ? 'タップして入る' : '近くの場所をタップ';

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className="hud-caption"
          key={focusedPlace ?? 'hub'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
        >
          {label && <div className="hud-place">{label}</div>}
          <div className="hud-hint">{hint}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
