import { defineConfig } from "vite";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const xpellUiRoot = dirname(require.resolve("@xpell/ui/package.json"));

export default defineConfig({
  resolve: {
    alias: {
      "@xpell/ui/xui.css": resolve(xpellUiRoot, "dist/ui.css")
    }
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.html")
    },
    cssCodeSplit: false
  }
});
