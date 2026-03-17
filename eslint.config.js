import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // App-specific globals injected by Vite
        __APP_VERSION__: 'readonly'
      }
    },
    rules: {
      // Disable some rules that might be too strict for game development
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console.log for debugging
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error'
      ,
      // Disallow hardcoded colors in code (keep colors in CSS tokens/vars)
      'no-restricted-syntax': [
        'error',
        // Hex colors like '#fff' or '#a1b2c3'
        { selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/]", message: 'Hardcoded color hex is not allowed; use CSS variables/tokens.' },
        // Numeric color functions like rgb(), rgba(), hsl(), hsla() (allows rgba(from var(--token) ...))
        { selector: "Literal[value=/^(?:rgb|rgba|hsl|hsla)\\(\\s*\\d/i]", message: 'Hardcoded color function is not allowed; use CSS variables/tokens.' },
        // Common named colors
        { selector: "Literal[value=/(?:^|\\b)(?:black|white|red|green|blue|yellow|cyan|magenta|grey|gray|orange|purple|violet|pink|brown)(?:\\b|$)/i]", message: 'Hardcoded color name is not allowed; use CSS variables/tokens.' }
      ]
    }
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        // App-specific globals injected by Vite
        __APP_VERSION__: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react': react,
      'react-hooks': reactHooks
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // React-specific rules
      'react/jsx-uses-react': 'off', // Not needed with React 17+ JSX transform
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+ JSX transform
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',
      'react/no-deprecated': 'warn',
      'react/no-direct-mutation-state': 'error',
      'react/no-unescaped-entities': 'warn',

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
      ,
      // Disallow hardcoded colors in code (keep colors in CSS tokens/vars)
      'no-restricted-syntax': [
        'error',
        // Hex colors like '#fff' or '#a1b2c3'
        { selector: "Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/]", message: 'Hardcoded color hex is not allowed; use CSS variables/tokens.' },
        // Numeric color functions like rgb(), rgba(), hsl(), hsla() (allows rgba(from var(--token) ...))
        { selector: "Literal[value=/^(?:rgb|rgba|hsl|hsla)\\(\\s*\\d/i]", message: 'Hardcoded color function is not allowed; use CSS variables/tokens.' },
        // Common named colors
        { selector: "Literal[value=/(?:^|\\b)(?:black|white|red|green|blue|yellow|cyan|magenta|grey|gray|orange|purple|violet|pink|brown)(?:\\b|$)/i]", message: 'Hardcoded color name is not allowed; use CSS variables/tokens.' }
      ]
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.min.js',
      'build/**'
    ]
  }
];
