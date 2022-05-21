window.global = window;
window.globalThis = window;
window.process = {
  env: {
    NODE_ENV: "production",
  },
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
window.Buffer = require("buffer/").Buffer;
