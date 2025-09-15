import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    host: true, // Allow external connections
    proxy: {
      '/export-csv': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/export-csv/, '/export-csv'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Vite proxy error for /export-csv:', err)
          })
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Vite proxying /export-csv request:', req.method, req.url)
            console.log('Request headers:', Object.fromEntries(Object.entries(req.headers)))
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Vite proxy response for /export-csv:', proxyRes.statusCode, req.method)
            console.log('Response headers:', Object.fromEntries(Object.entries(proxyRes.headers)))
          })
        }
      }
    },
    allowedHosts: [
      'localhost',
      'appahouse.com',
      '.appahouse.com'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})