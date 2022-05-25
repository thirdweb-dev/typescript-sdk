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
    // now required because not defaulted anymore
    shims: true,
    // use rollup for build to get smaller bundle sizes with tree shaking
    treeshake: true,
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
    // now required because not defaulted anymore
    shims: true,
    globalName: "_thirdweb",
    format: ["iife"],
    keepNames: true,
    inject: ["./injected-shims/iife-shims.js"],
    // inject globals onto window
    banner: {
      js: 'window.global=window;window.globalThis=window;window.process={env:{NODE_ENV:"production"}};',
    },
    // inject ThirdwebSDK into window
    footer: { js: "window.ThirdwebSDK = window._thirdweb.ThirdwebSDK;" },
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
