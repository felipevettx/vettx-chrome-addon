import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {resolve} from "path"
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name]",
        assetFileNames: "assets/[name].[ext]",
      }
    },
    outDir: "dist"
  },
  publicDir: "public",
})
