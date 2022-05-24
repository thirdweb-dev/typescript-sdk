import { defineConfig } from "tsup";

import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

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
    globalName: "_thirdweb",
    format: ["iife"],
    banner: {
      js: "window.global=window;window.globalThis=window;",
    },
    // inject ThirdwebSDK into window
    footer: { js: "window.ThirdwebSDK = window._thirdweb.ThirdwebSDK;" },
    esbuildPlugins: [NodeModulesPolyfillPlugin()],
  },
]);
