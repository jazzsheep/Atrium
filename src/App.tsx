import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAtrium, TIMING } from './store/useAtrium';
import { World } from './world/World';
import { Avatar } from './avatar/Avatar';
import { Opening } from './transitions/Opening';
import { HudCaption } from './ui/HudCaption';
import { PanelHost } from './ui/PanelHost';
import { Notice } from './ui/Notice';

export default function App() {
  const phase = useAtrium((s) => s.phase);
  const hasSeenOpening = useAtrium((s) => s.hasSeenOpening);
  const completeOpening = useAtrium((s) => s.completeOpening);

  // オープニングは初回のみ（〜3秒）。2回目以降は即ハブから。
  useEffect(() => {
    if (phase !== 'opening') return;
    if (hasSeenOpening) {
      completeOpening();
      return;
    }
    const t = setTimeout(completeOpening, TIMING.opening);
    return () => clearTimeout(t);
  }, [phase, hasSeenOpening, completeOpening]);

  return (
    <div className="atrium-root">
      <div className="atrium-sky" />
      <World />
      <Avatar />
      <HudCaption />
      <PanelHost />
      <Notice />
      <AnimatePresence>{phase === 'opening' && <Opening />}</AnimatePresence>
    </div>
  );
}
