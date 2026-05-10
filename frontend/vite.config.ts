// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
    watch: {
      usePolling: true,
    },
    // 👇 ДОБАВЬТЕ ЭТО:
    proxy: {
      '/api': {
        target: 'http://web:8000',  // имя сервиса из docker-compose
        changeOrigin: true,
        secure: false,
        // Если Django требует CSRF:
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Можно добавить заголовки при необходимости
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
})