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
    host: '0.0.0.0',        // ← Слушать все интерфейсы
    port: 3000,
    strictPort: true,       // ← Ошибка, если порт занят
    hmr: {
      host: 'localhost',    // ← Браузер подключается к localhost
      protocol: 'ws',       // или 'wss' если используете HTTPS
    },
    watch: {
      usePolling: true,     // ← Важно для Docker на Windows/WSL2
    },
  },
  // Для production-сборки
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
})