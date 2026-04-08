import eslint from "@eslint/js";
// @ts-check
import { defineConfig, globalIgnores } from "eslint/config";
import path from "path";
import tsEslint from "typescript-eslint";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tsEslint.config(
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  defineConfig([
    globalIgnores([
      "**/*/dist/*",
      ".husky/",
      "dist/",
      "node_modules/",
      "**/worker-configuration.d.ts",
      "**/.wrangler/**/*",
    ]),
    {
      languageOptions: {
        parserOptions: { tsconfigRootDir: __dirname },
      },
      rules: {
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-empty-object-type": "off",
        "@typescript-eslint/no-explicit-any": "off",
        // "@typescript-eslint/no-require-imports": "off",
        // "@typescript-eslint/no-empty-object-type": "off",
        // "@typescript-eslint/array-type": "off",
      },
    },
  ]),
);
