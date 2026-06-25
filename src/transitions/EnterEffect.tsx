import { AnimatePresence, motion } from 'framer-motion';
import { useAtrium } from '../store/useAtrium';

// 入り/戻りの「2D水彩タッチ」。3Dのカメラ＋モチーフ演出に重ね、パネルへ滑らかに橋渡しする。
// 入り: モチーフ色の水彩ウォッシュが満ちる。戻り: 風のスジが流れる。
export function EnterEffect() {
  const phase = useAtrium((s) => s.phase);
  const location = useAtrium((s) => s.location);
  const active = location !== 'hub' ? location : null;

  return (
    <AnimatePresence>
      {phase === 'entering' && active && (
        <motion.div
          key="wash"
          className={`enter-wash wash-${active}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.95 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeOut' } }}
          transition={{ duration: 0.95, ease: 'easeIn' }}
        />
      )}
      {phase === 'returning' && (
        <motion.div
          key="wind"
          className="return-wind"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.3 }}
        >
          <span />
          <span />
          <span />
          <span />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
