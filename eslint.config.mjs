import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import storybook from 'eslint-plugin-storybook'
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
  ...fixupConfigRules(compat.extends('plugin:react-hooks/recommended', 'prettier')),
  ...storybook.configs['flat/recommended'],
  {
    plugins: {
      '@typescript-eslint': typescriptEslint,
      react,
      'react-hooks': fixupPluginRules(reactHooks),
    },

    files: ['{src,.storybook}/**/*.{js,jsx,ts,tsx}'],

    languageOptions: {
      parser: tsParser,
    },

    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
]
