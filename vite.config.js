import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
    include: ['onnxruntime-web']
  },
  
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    }
  },
  
  build: {
    target: 'esnext'
  },
  
  worker: {
    format: 'es'
  },
  
  resolve: {
    alias: {
      './runtimeConfig': './runtimeConfig.browser',
    }
  }
})