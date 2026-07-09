import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Appwrite（http://localhost）を同一オリジンでアクセスするためのプロキシ。
// これにより 5173↔80 のクロスオリジンによるセッション(Cookie)の不安定さを解消する。
// フロントは /v1/... を叩き、Vite が Appwrite 本体へ中継する。
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
