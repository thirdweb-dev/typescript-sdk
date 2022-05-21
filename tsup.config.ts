import alias from "esbuild-plugin-alias";
import path from "path";
import { defineConfig } from "tsup";

export default defineConfig([
  // build normal build
  {
    name: "package",
    entry: ["src/index.ts"],
    sourcemap: true,
    // we'll just manually "clean" the dist dir before running this (to avoid potential race conditions)
    clean: false,
    minify: true,
    platform: "node",
    replaceNodeEnv: true,
    globalName: "ThirdwebSDK",
    format: ["cjs", "esm"],
  },
  // also build iife (UMD build for <script> tag use)
  {
    name: "script",
    entry: ["src/index.ts"],
    sourcemap: true,
    // we'll just manually "clean" the dist dir before running this (to avoid potential race conditions
    clean: false,
    minify: true,
    platform: "browser",
    replaceNodeEnv: true,
    shims: true,
    globalName: "ThirdwebSDK",
    format: ["iife"],
    keepNames: true,
    inject: ["./injected-shims/iife-shims.js"],
    esbuildPlugins: [
      alias({
        stream: path.resolve(
          __dirname,
          `node_modules/stream-browserify/index.js`,
        ),
      }),
    ],
  },
]);
