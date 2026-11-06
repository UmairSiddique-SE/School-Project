import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['rebate-fabulous-tank-parameter.trycloudflare.com'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/]react(?:-dom)?[\\/]/,
              priority: 20,
              maxSize: 300_000,
            },
            {
              name: 'vendor',
              test: /node_modules[\\/]/,
              priority: 10,
              maxSize: 300_000,
            },
            {
              name: 'common',
              minShareCount: 2,
              minSize: 20_000,
              maxSize: 300_000,
              priority: 5,
            },
          ],
        },
      },
    },
  },
})
