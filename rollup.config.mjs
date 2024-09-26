import terser from "@rollup/plugin-terser";

export default (command) => {
  console.log(command);
  const isFirefox = command.environment === "firefox";
  let inputFile = "./dist/chrome/ui.js";
  let outputFile = "./dist/chrome/ui.js";

  if (isFirefox) {
    inputFile = "./dist/firefox/ui.js";
    outputFile = "./dist/firefox/ui.js";
  }

  return {
    type: "module",
    input: inputFile,
    output: {
      file: outputFile,
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
