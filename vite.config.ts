import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE is set by the GitHub Pages workflow (for example /rickwest-demo/).
// Locally it stays "/", so `npm run dev` works at http://localhost:5173.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
})
