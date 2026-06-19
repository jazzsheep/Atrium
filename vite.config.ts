import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// フロントエンド完結。base を相対にして静的ホスティング（サブパス）でも動くようにする。
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    // 主要ライブラリを別チャンクに分け、初回読込の並列化とキャッシュ効率を上げる。
    // 特に three は別チャンク化（World 遅延読込と合わせ、スマホ初回描画を軽く）。
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber'],
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
