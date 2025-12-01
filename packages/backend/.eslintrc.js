/**
 * ESLint configuration for backend package
 * Extends base config with Node.js-specific rules
 */

module.exports = {
  root: true,
  extends: [
    '../../.eslintrc.base.js',
  ],
  env: {
    node: true,
    es2022: true,
  },
  rules: {
    // Node.js specific
    'no-process-exit': 'off', // Allow process.exit() in CLI scripts
  },
};

