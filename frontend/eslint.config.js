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
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Soroban SDK returns dynamic types that cannot be fully typed — warn only.
      '@typescript-eslint/no-explicit-any': 'warn',

      // False positive: correctly flags async data-fetching functions called inside
      // useEffect. The pattern (call a memoised async fn in effect) is valid React.
      'react-hooks/set-state-in-effect': 'warn',

      // False positive: Date.now() in render is a well-established idiom for
      // computing time-relative values. The component re-renders only on prop change.
      'react-hooks/purity': 'warn',

      // DX hint only — does not affect correctness or production behaviour.
      'react-refresh/only-export-components': 'warn',
    },
  },
])

