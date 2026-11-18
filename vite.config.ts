import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const basePath = (process.env.BASE_PATH || '/').replace(/^\/*/, '/').replace(/\/*$/, '/')

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      [`${basePath}api`]: {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.slice(basePath.length - 1),
      },
    },
  },
})
