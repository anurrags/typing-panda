// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import simpleImportSort from "eslint-plugin-simple-import-sort";

// Replicate __dirname functionality in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use FlatCompat for older eslintrc-style configs
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default tseslint.config(
  // Core configs for Next.js, including React and TypeScript basics
  ...compat.extends("next/core-web-vitals"),

  // Accessibility rules for JSX
  // jsxA11y.flatConfigs.recommended,

  // Powerful, type-aware linting rules for TypeScript
  ...tseslint.configs.recommended,

  // Plugin for sorting imports and exports automatically
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },

  // Prettier config must be last to override styling rules
  ...compat.extends("prettier"),
);
