import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-types/**',
      '**/release/**',
      '**/renderer/**',
      '**/node_modules/**',
      '**/coverage/**',
      'legacy/**',
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'off',
    },
  },
  {
    // The simulation core must stay deterministic and platform-free.
    files: ['packages/core/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded RNG in packages/core/src/rng.' },
        { object: 'Date', property: 'now', message: 'The core has no wall clock.' },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'setTimeout', 'setInterval'],
    },
  },
  {
    files: ['apps/desktop/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { require: 'readonly', module: 'writable', __dirname: 'readonly', process: 'readonly', console: 'readonly' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
