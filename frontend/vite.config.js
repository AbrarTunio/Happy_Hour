// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Your Laravel backend URL
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Only if your Laravel routes didn't have /api prefix
      },
    },
  },
});