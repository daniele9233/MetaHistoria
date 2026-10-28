import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    watch: {
      // gli editor scrivono file temporanei accanto al target: su Windows
      // il watcher nativo va in EBUSY, quindi li escludiamo
      ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/node_modules/**'],
    },
  },
  build: {
    target: 'es2020',
    cssMinify: true,
  },
});
