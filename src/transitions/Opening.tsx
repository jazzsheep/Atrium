import { motion } from 'framer-motion';
import { content } from '../data/content';

// オープニング（初回のみ・〜3秒）: 風が吹いて世界が立ち上がる。
// Phase 1 は光のウォッシュ＋タイトルの最小版。仕上げで風の motif を足す。
export function Opening() {
  return (
    <motion.div
      className="opening"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <motion.div
        className="opening-wash"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.95, 0], scale: 1.5 }}
        transition={{ duration: 2.4, ease: 'easeOut' }}
      />
      <motion.div
        className="opening-title"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: [0, 1, 1, 0], y: 0 }}
        transition={{ duration: 2.6, ease: 'easeInOut', times: [0, 0.3, 0.75, 1] }}
      >
        <div className="opening-name">{content.artist.name}</div>
        <div className="opening-sub">{content.artist.note}</div>
      </motion.div>
    </motion.div>
  );
}
