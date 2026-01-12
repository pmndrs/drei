import typescriptEslint from '@typescript-eslint/eslint-plugin'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import storybook from 'eslint-plugin-storybook'
import prettier from 'eslint-config-prettier'
import tsParser from '@typescript-eslint/parser'

export default [
  //* Global Ignores ==============================
  {
    ignores: ['.storybook/public', '**/dist/', '**/node_modules/', '**/storybook-static/', '**/examples/'],
  },

  //* Storybook Rules ==============================
  ...storybook.configs['flat/recommended'],

  //* Main Config ==============================
  {
    files: ['{src,.storybook}/**/*.{js,jsx,ts,tsx}'],

    plugins: {
      '@typescript-eslint': typescriptEslint,
      react,
      'react-hooks': reactHooks,
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    rules: {
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
    },
  },

  //* Prettier (disables conflicting rules) ==============================
  prettier,
]
