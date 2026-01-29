import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // 改為相對路徑，同時支援 GitHub Pages 與 Vercel
  server: {
    host: '0.0.0.0',
  }
});