import { lazy, Suspense, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAtrium, TIMING } from './store/useAtrium';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { Opening } from './transitions/Opening';
import { EnterEffect } from './transitions/EnterEffect';
import { HudCaption } from './ui/HudCaption';
import { PanelHost } from './ui/PanelHost';
import { Menu } from './ui/Menu';
import { Notice } from './ui/Notice';

// World（3D）は遅延読込。オープニング表示中に裏で Three.js を読み込み、初回描画を軽くする。
// 読込中は背後の水彩スカイ（.atrium-sky）が見えるだけで破綻しない。
const World = lazy(() => import('./world/World').then((m) => ({ default: m.World })));

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
      {/* 3D が失敗しても 2D の実用経路（メニュー・パネル）で継続できるよう安全網で包む。 */}
      <ErrorBoundary>
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </ErrorBoundary>
      <EnterEffect />
      <HudCaption />
      <PanelHost />
      <Menu />
      <Notice />
      <AnimatePresence>{phase === 'opening' && <Opening />}</AnimatePresence>
    </div>
  );
}
