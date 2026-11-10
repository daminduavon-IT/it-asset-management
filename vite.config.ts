import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    // Not the default "assets": the app has a page at /assets, and on Vercel a reload of that
    // page was answered with a file from the build folder of the same name instead of the app.
    assetsDir: 'static',
  },
})
