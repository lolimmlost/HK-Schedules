import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx,ts,tsx}', '*.{js,ts}'],
    ignores: ['dist/**', 'node_modules/**', 'build/**', 'coverage/**'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        process: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        FileReader: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        NodeJS: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        Blob: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        performance: 'readonly',
        setImmediate: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        MutationObserver: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        HTMLTableElement: 'readonly',
        HTMLTableSectionElement: 'readonly',
        HTMLTableRowElement: 'readonly',
        HTMLTableCellElement: 'readonly',
        HTMLTableCaptionElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      prettier: prettierPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      ...prettier.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/heading-has-content': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/incompatible-library': 'off',
      'no-console': ['warn', { allow: ['warn', 'error', 'log'] }],
      'prettier/prettier': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]
