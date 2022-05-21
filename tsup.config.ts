import alias from "esbuild-plugin-alias";
import path from "path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  sourcemap: true,
  clean: true,
  minify: true,

  platform: "browser",
  replaceNodeEnv: true,
  shims: true,
  name: "ThirdwebSDK",
  globalName: "ThirdwebSDK",
  format: ["cjs", "esm", "iife"],
  keepNames: true,

  esbuildPlugins: [
    alias({
      stream: path.resolve(
        __dirname,
        `node_modules/stream-browserify/index.js`,
      ),
      "magic-sdk": path.resolve(
        __dirname,
        "node_modules/magic-sdk/dist/cjs/index.js",
      ),
      buffer: path.resolve(__dirname, "node_modules/buffer/index.js"),
    }),
  ],
});
