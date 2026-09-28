import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: "./",
  // Which Android store this bundle targets (see src/systems/Store.ts).
  // `npm run build:huawei` builds with --mode huawei; everything else is Play.
  define: {
    __HUAWEI_BUILD__: JSON.stringify(mode === "huawei"),
  },
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: "dist",
    assetsDir: "assets"
  }
}));
