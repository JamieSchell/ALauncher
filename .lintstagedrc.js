/**
 * lint-staged configuration for pre-commit hooks
 * Runs linters and formatters on staged files
 */

module.exports = {
  // TypeScript/JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  
  // JSON, CSS, Markdown files
  '**/*.{json,css,md}': [
    'prettier --write',
  ],
};

