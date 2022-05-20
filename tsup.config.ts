import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  sourcemap: true,
  clean: true,
  minify: true,
  globalName: "ThirdwebSDK",
  format: ["cjs", "esm", "iife"],
});
