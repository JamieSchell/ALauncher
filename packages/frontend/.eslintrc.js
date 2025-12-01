/**
 * ESLint configuration for frontend package
 * Extends base config with React-specific rules
 */

module.exports = {
  root: true,
  extends: [
    '../../.eslintrc.base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  env: {
    browser: true,
    es2022: true,
    node: true, // For Electron main/preload scripts
  },
  rules: {
    // React
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'warn',
  },
  overrides: [
    {
      // Electron main/preload scripts
      files: ['electron/**/*.ts'],
      env: {
        node: true,
        browser: false,
      },
    },
  ],
};

