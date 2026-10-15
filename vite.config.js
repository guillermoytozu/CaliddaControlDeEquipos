import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

export default defineConfig({
  // Agregamos la ruta base para GitHub Pages
  base: '/CaliddaControlDeEquipos/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})