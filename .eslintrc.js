module.exports = {
  overrides: [
    {
      env: {
        node: true,
        browser: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
    {
      env: {
        node: true,
        browser: true,
      },
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
      ],
      files: ["src/**/*.{ts,tsx,js}"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./src/tsconfig.json",
      },
      plugins: ["@typescript-eslint", "react"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off",
        "react-hooks/exhaustive-deps": "off",
        "react-hooks/rules-of-hooks": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "no-constant-condition": "off",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-floating-promises": [
          "error",
          { ignoreVoid: false, ignoreIIFE: false },
        ],
      },
    },
    {
      env: {
        node: true,
        browser: true,
      },
      files: ["./build.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      rules: {
        "react-hooks/exhaustive-deps": "off",
        "react-hooks/rules-of-hooks": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off",
        "no-constant-condition": "off",
        "@typescript-eslint/no-this-alias": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-floating-promises": [
          "error",
          { ignoreVoid: false, ignoreIIFE: false },
        ],
        "@typescript-eslint/no-misused-promises": "error",
      },
    },
  ],
  settings: {
    react: {
      version: "18.2.0",
    },
  },
};
