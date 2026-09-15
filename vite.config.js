import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('firebase')) {
            return 'firebase'
          }

          if (id.includes('lucide-react')) {
            return 'icons'
          }

          if (id.includes('react')) {
            return 'react-vendor'
          }

          return 'vendor'
        }
      }
    }
  }
})
