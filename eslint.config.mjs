import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extensions de base pour Next.js et TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Configuration personnalisée
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      // 🔹 Ignore les variables inutilisées qui commencent par "_"
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // 🔹 Autorise les entités non échappées dans JSX (ex: "L'app")
      "react/no-unescaped-entities": "warn",

      // 🔹 Gère l'utilisation du type "any"
      "@typescript-eslint/no-explicit-any": [
        "warn", // tu peux mettre "error" si tu veux être plus strict
        {
          ignoreRestArgs: true, // autorise ...args: any[]
          fixToUnknown: false,  // ne propose pas "unknown" à la place
        },
      ],
    },
  },
];

export default eslintConfig;
