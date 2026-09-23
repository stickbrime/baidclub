import devServer from "@hono/vite-dev-server"
import path from "path"
const __dirname = import.meta.dirname
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: './',
  root: path.resolve(__dirname, "web"),
  plugins: [
    // Only include dev-only plugins in serve mode (dev server)
    ...(command === 'serve'
      ? [
          devServer({ entry: path.resolve(__dirname, "server/api/boot.ts"), exclude: [/^\/(?!api\/).*$/] }),
        ]
      : []),
    react(),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web/src"),
      "@contracts": path.resolve(__dirname, "./server/contracts"),
      "@db": path.resolve(__dirname, "./server/db"),
      "db": path.resolve(__dirname, "./server/db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
}));
