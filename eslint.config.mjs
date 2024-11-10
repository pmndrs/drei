import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import _import from 'eslint-plugin-import'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: ['.storybook/public', '**/dist/', '**/node_modules/', '**/storybook-static/'],
  },
  ...fixupConfigRules(
    compat.extends(
      // 'plugin:import/errors',
      // 'plugin:import/warnings',
      // 'plugin:import/typescript',
      'plugin:react-hooks/recommended',
      'plugin:storybook/recommended',
      'prettier'
    )
  ),
  {
    plugins: {
      // import: fixupPluginRules(_import),
      '@typescript-eslint': typescriptEslint,
      react,
      'react-hooks': fixupPluginRules(reactHooks),
    },

    // files: ['src/**/*.{js,jsx,ts,tsx}'],
    files: ['{src,.storybook}/**/*.{js,jsx,ts,tsx}'],

    languageOptions: {
      // globals: {
      //   ...globals.browser,
      //   ...globals['shared-node-browser'],
      //   ...globals.node,
      // },

      parser: tsParser,
      // ecmaVersion: 5,
      // sourceType: 'module',

      // parserOptions: {
      //   project: ['./tsconfig.json'],
      //   ecmaFeatures: {
      //     ecmaVersion: 2018,
      //     jsx: true,
      //   },
      // },
    },

    // settings: {
    //   react: {
    //     version: 'detect',
    //   },

    //   'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],

    //   'import/parsers': {
    //     '@typescript-eslint/parser': ['.js', '.jsx', '.ts', '.tsx'],
    //   },

    //   'import/resolver': {
    //     typescript: true,
    //     node: {
    //       extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    //       paths: ['src'],
    //     },
    //   },
    // },

    rules: {
      // curly: ['error', 'multi-line', 'consistent'],
      // 'no-console': 'off',
      // 'no-empty-pattern': 'error',
      // 'no-duplicate-imports': 'error',
      // 'prefer-const': 'error',
      // 'import/no-unresolved': [
      //   'error',
      //   {
      //     commonjs: true,
      //     amd: true,
      //   },
      // ],
      // 'import/export': 'error',
      // 'import/named': 'off',
      // 'import/no-named-as-default': 'off',
      // 'import/no-named-as-default-member': 'off',
      // 'import/namespace': 'off',
      // 'import/default': 'off',
      // '@typescript-eslint/explicit-module-boundary-types': 'off',
      // 'no-unused-vars': ['off'],
      // 'react/jsx-uses-react': 'error',
      // 'react/jsx-uses-vars': 'error',
      'react-hooks/exhaustive-deps': 'off',
      // '@typescript-eslint/no-unused-vars': [
      //   'error',
      //   {
      //     argsIgnorePattern: '^_',
      //     varsIgnorePattern: '^_',
      //   },
      // ],
      // '@typescript-eslint/no-use-before-define': 'off',
      // '@typescript-eslint/no-empty-function': 'off',
      // '@typescript-eslint/no-empty-interface': 'off',
      // '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // {
  //   files: ['./src/**/*'],

  //   languageOptions: {
  //     ecmaVersion: 5,
  //     sourceType: 'script',

  //     parserOptions: {
  //       project: ['./tsconfig.json'],
  //     },
  //   },
  // },
]
