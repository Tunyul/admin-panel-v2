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
          if (!id.includes('node_modules')) return;
          // group large libraries into their own chunks
          if (id.includes('node_modules/@mui/icons-material')) return 'vendor-mui-icons';
          if (id.includes('node_modules/@mui/material')) return 'vendor-mui-material';
          if (id.includes('node_modules/@emotion')) return 'vendor-emotion';
          if (id.includes('node_modules/recharts')) return 'vendor-recharts';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react';
          if (id.includes('node_modules/socket.io-client')) return 'vendor-socketio';
          if (id.includes('node_modules/jspdf') && id.includes('dist')) return 'vendor-jspdf-dist';
          if (id.includes('node_modules/jspdf') && !id.includes('dist')) return 'vendor-jspdf-core';
          if (id.includes('node_modules/html2canvas')) return 'vendor-html2canvas';
          if (id.includes('node_modules/canvg')) return 'vendor-canvg';
          // helpers often pulled by canvg/html2canvas
          if (id.includes('node_modules/rgbcolor')) return 'vendor-rgbcolor';
          if (id.includes('node_modules/stackblur-canvas')) return 'vendor-stackblur';
          if (id.includes('node_modules/tailwindcss') || id.includes('node_modules/postcss') || id.includes('node_modules/autoprefixer')) return 'vendor-tailwind';
          if (id.includes('node_modules/axios')) return 'vendor-axios';
          if (id.includes('node_modules/zustand')) return 'vendor-zustand';
          // fallback: put other node_modules into a generic vendor chunk but prefer splitting by package folder
          const directories = id.split('node_modules/').slice(1).map(p => p.split('/')[0]);
          if (directories && directories.length > 0) {
            return `vendor-${directories[0]}`;
          }
          return 'vendor';
        }
      }
    }
  }
})
