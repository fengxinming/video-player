import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'vd-player': fileURLToPath(new URL('../../packages/vd-player/src', import.meta.url)),
      'vd-player-tech-html5': fileURLToPath(new URL('../../packages/vd-player-tech-html5/src', import.meta.url))
    }
  },
  server: {
    open: true
  },
  base: '/video-player/',
  build: {
    outDir: '../../gh-pages',
    emptyOutDir: true,
    cssCodeSplit: false
  }
});
