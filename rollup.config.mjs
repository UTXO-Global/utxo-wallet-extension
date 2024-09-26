import terser from "@rollup/plugin-terser";

export default (command) => {
  const isFirefox = command.environment === "firefox";
  let inputFile = {
    ui: "./dist/chrome/ui.js",
    background: "./dist/chrome/background.js",
  };

  if (isFirefox) {
    inputFile = {
      ui: "./dist/firefox/ui.js",
      background: "./dist/firefox/background.js",
    };
  }

  return {
    type: "module",
    input: inputFile,
    output: {
      dir: `dist/${isFirefox ? "firefox" : "chrome"}`,
      format: "cjs",
      minifyInternalExports: command.minifyInternalExports,
      compact: command.compact,
      sourcemap: command.sourcemap,
    },
    plugins: [
      terser({
        compress: true,
        mangle: true,
      }),
    ],
  };
};
