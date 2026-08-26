import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// GitHub Pages sirve en usuario.github.io/<repo>/ → el base path tiene que
// coincidir con el nombre del repo. El workflow lo inyecta vía VITE_BASE.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE ?? '/Matematicas-Gamificadas/',
  // Solo desarrollo: permite abrir el servidor local desde el móvil (Wi-Fi) o por un túnel (ngrok / Cloudflare).
  server: {
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io', '.trycloudflare.com'],
  },
})
