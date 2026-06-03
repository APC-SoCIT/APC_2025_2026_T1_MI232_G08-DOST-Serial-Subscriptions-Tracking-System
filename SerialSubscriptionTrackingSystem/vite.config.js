import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    laravel(['resources/js/app.jsx']),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './resources/js'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
})