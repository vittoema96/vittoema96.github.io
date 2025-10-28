import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        navigator: 'readonly',
        location: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        getComputedStyle: 'readonly',
        CustomEvent: 'readonly',
        EventTarget: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
        ResizeObserver: 'readonly',
        IntersectionObserver: 'readonly',
        MutationObserver: 'readonly',
        // Libraries made global
        Papa: 'readonly',
        Panzoom: 'readonly',
        i18next: 'readonly',
        // App globals
        PROJECT_VERSION: 'readonly',
        cardFactory: 'readonly',
        getVariableFontSize: 'readonly',
        // Popup functions
        alertPopup: 'readonly',
        confirmPopup: 'readonly',
        openD20Popup: 'readonly',
        openD6Popup: 'readonly',
        openAddItemModal: 'readonly',
        openSellItemPopup: 'readonly',
        // App functions
        changeLanguage: 'readonly',
        changeTheme: 'readonly',
        translate: 'readonly',
        // DOM globals
        Option: 'readonly',
        requestAnimationFrame: 'readonly'
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
    },
    ignores: [
      'dist/**',
      'node_modules/**',
      '*.min.js',
      '**/*.ts'  // Skip TypeScript files for now
    ]
  }
];
