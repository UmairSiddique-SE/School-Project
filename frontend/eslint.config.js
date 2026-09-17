import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Allow 'any' type — needed widely in this codebase
      '@typescript-eslint/no-explicit-any': 'off',

      // Allow unused vars with underscore prefix convention
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],

      // Allow direct setState in effects (common data-fetching pattern used throughout)
      'react-hooks/set-state-in-effect': 'off',

      // Allow Date.now() and other impure calls in render (common pattern)
      'react-hooks/purity': 'off',

      // Allow hooks and non-component exports in same file (context pattern)
      'react-refresh/only-export-components': 'off',
    },
  },
])
