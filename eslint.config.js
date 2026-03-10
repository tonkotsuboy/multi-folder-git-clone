const { defineConfig } = require('eslint/config');
const raycastConfig = require('@raycast/eslint-config');

module.exports = defineConfig([
  ...raycastConfig,
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // TypeScript推奨ルール（telemedicine-automation-toolから）
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // 一般的なESLintルール
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off', // Raycast環境ではログが必要
    },
  },
]);
