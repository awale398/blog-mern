import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/register': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/login': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/logout': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/profile': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/post': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
