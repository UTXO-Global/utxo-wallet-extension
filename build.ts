import { build, BuildOptions, context, Plugin } from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { polyfillNode } from "esbuild-plugin-polyfill-node";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";
import { postcssModules, sassPlugin } from "esbuild-sass-plugin";
import { dynamicImport } from "esbuild-plugin-dynamic-import";

import svgPlugin from "esbuild-svg";
import postcss from "postcss";
import path from "path";

const autoprefixer = require("autoprefixer");
const tailwindcss = require("tailwindcss");

async function readJsonFile(path: string) {
  const file = Bun.file(path);
  return JSON.parse(await file.text());
}

const chrome = !Bun.argv.includes("--firefox");

const baseManifestPath = "./configs/manifests/base.json";
const chromeManifestPath = "./configs/manifests/chrome.json";
const firefoxManifestPath = "./configs/manifests/firefox.json";

const baseManifest = await readJsonFile(baseManifestPath);
const extraManifest = await readJsonFile(
  chrome ? chromeManifestPath : firefoxManifestPath
);

const isDev = Bun.argv.includes("--watch") || Bun.argv.includes("-w");

function mergeManifests(): Plugin {
  return {
    name: "merge-manifests",
    setup(build) {
      const content = {
        ...baseManifest,
        ...extraManifest,
        version: process.env.npm_package_version ?? "0.0.1",
      };
      // if (Bun.argv.includes("--watch") && !Bun.argv.includes("--firefox")) {
      //   content.chrome_url_overrides = {
      //     newtab: "index.html",
      //   };
      // }
      build.onEnd(() => {
        const path = build.initialOptions.outdir + "/manifest.json";
        Bun.write(path, JSON.stringify(content, undefined, 2)).catch((err) =>
          console.error(err)
        );
      });
    },
  };
}

console.log(
  `\n🔨 Building extension... \n` +
    `💻 Browser: ${chrome ? "Chrome" : "Firefox"}\n` +
    `💡 Version: ${process.env.npm_package_version}\n` +
    `♻️  Environment: ${isDev ? "Development" : "Production"}`
);

function dotenvPlugin(): Plugin {
  return {
    name: "dotenv",
    async setup(build) {
      let envFile = Bun.file("./.env");
      const isExists = await envFile.exists();

      let env: Record<string, string> = {};

      if (isExists) {
        let content = await envFile.text();

        content.split("\n").forEach((line: string) => {
          const [key, value] = line.split("=");
          if (key && value) {
            env[`process.env.${key}`] = JSON.stringify(
              value.trim().replace(/^["']|["']$/g, "")
            );
          }
        });
      }

      build.initialOptions.define = {
        ...build.initialOptions.define,
        ...env,
      };
    },
  };
}

const fontLoader: Plugin = {
  name: "font-loader",
  setup(build) {
    build.onResolve({ filter: /\.(ttf|woff|woff2|eot|otf)$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path),
      namespace: "file",
    }));

    build.onLoad({ filter: /\.(ttf|woff|woff2|eot|otf)$/ }, async (args) => {
      const contents = await Bun.file(args.path).arrayBuffer();
      return {
        contents: new Uint8Array(contents),
        loader: "file",
      };
    });
  },
};

const buildOptions: BuildOptions = {
  entryPoints: {
    background: "src/background/index.ts",
    "content-script": "src/content-script/index.ts",
    pageProvider: "src/content-script/pageProvider/index.ts",
    ui: "src/ui/index.tsx",
  },
  outdir: chrome ? "dist/chrome" : "dist/firefox",
  minify: false,
  bundle: true,
  logLevel: "info",
  define: {
    "import.meta.url": '""',
    "process.browser": "false",
  },
  target: ["es2020"],
  platform: "browser",
  sourcemap: Bun.argv.includes("--sourcemap") || Bun.argv.includes("-s"),
  plugins: [
    dynamicImport(),
    dotenvPlugin(),
    svgPlugin({
      typescript: true,
      svgo: true,
    }),
    sassPlugin({
      filter: /\.module\.scss$/,
      transform: postcssModules({}, [autoprefixer, tailwindcss]),
    }),
    sassPlugin({
      filter: /\.scss$/,
      async transform(source) {
        const { css } = await postcss([autoprefixer, tailwindcss]).process(
          source,
          { from: undefined }
        );
        return css;
      },
    }),
    copy({
      assets: {
        from: ["./configs/_raw/**/*"],
        to: ["."],
      },
    }),
    nodeModulesPolyfillPlugin({
      globals: {
        Buffer: true,
        process: true,
      },
      modules: {
        buffer: true,
        process: true,
      },
    }),
    mergeManifests(),
    polyfillNode({
      polyfills: {
        crypto: true,
      },
    }),
    fontLoader,
  ],
};

const makeArchive = () => {
  Bun.spawnSync({
    cmd: [
      "zip",
      "-r9",
      `../${chrome ? "chrome" : "firefox"}-${
        process.env.npm_package_version
      }.zip`,
      ".",
    ],
    cwd: `./dist/${chrome ? "chrome" : "firefox"}`,
  });

  Bun.spawnSync({
    cmd: ["rm", "-rf", `./${chrome ? "chrome" : "firefox"}`],
    cwd: "./dist",
  });
};

if (isDev) {
  const ctx = await context(buildOptions);
  await ctx.watch();
} else {
  await build(buildOptions);
  if (Bun.argv.includes("--compress") || Bun.argv.includes("-c")) {
    makeArchive();
  }
}
