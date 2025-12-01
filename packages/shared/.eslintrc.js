/**
 * ESLint configuration for shared package
 * Extends base config
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
};

