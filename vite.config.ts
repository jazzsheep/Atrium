import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// フロントエンド完結。base を相対にして静的ホスティング（サブパス）でも動くようにする。
export default defineConfig({
  plugins: [react()],
  base: './',
});
