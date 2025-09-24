import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), visualizer({ filename: 'dist/stats.html', open: false })],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Proxy API requests to backend running on localhost:3000 during dev
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // keep the /api prefix so client can use relative `/api` baseURL
        // (no rewrite)
      }
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) return 'vendor-recharts';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            return 'vendor';
          }
        }
      }
    }
  }
})
