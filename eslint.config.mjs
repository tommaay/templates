import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginNext from "eslint-plugin-next";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] }, // Specify the file types to lint
  { languageOptions: { globals: globals.browser } }, // Define global variables for browser environment
  pluginJs.configs.recommended, // Use recommended rules from the ESLint JS plugin
  ...tseslint.configs.recommended, // Include recommended rules from TypeScript ESLint
  pluginReact.configs.flat.recommended, // Apply recommended rules from the React ESLint plugin
  pluginNext.configs.recommended, // Use recommended rules from the Next.js ESLint plugin
  {
    rules: {
      "import/order": [
        "error", // Set the rule to error level
        {
          groups: ["builtin", "external", "internal"], // Define the order of import groups
          alphabetize: { order: "asc", caseInsensitive: true }, // Alphabetize imports within groups
          "newlines-between": "always", // Require newlines between different groups of imports
        },
      ],
      // Disallow unused variables, allowing arguments that start with an underscore
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // Enforce consistent brace style for all control statements
      curly: ["error", "all"],
      // Warn on console statements to encourage better logging practices
      "no-console": ["warn"],
      // Require the use of const for variables that are never reassigned
      "prefer-const": "error",
    },
  },
];
