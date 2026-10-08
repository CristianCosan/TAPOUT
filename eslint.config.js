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
      'scripts/**',
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
    // v12's own code, moved over as it was. Its style is JavaScript's, not ours; the rules that
    // still apply to it are the determinism ones above.
    files: ['packages/core/src/v12/**/*.ts', 'packages/core/src/game.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'prefer-const': 'off',
      // False positive: v12 chains `rand() < p` checks, which are different draws each time.
      'no-dupe-else-if': 'off',
    },
  },
  {
    files: ['packages/harness/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    files: ['apps/desktop/**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { require: 'readonly', module: 'writable', __dirname: 'readonly', process: 'readonly', console: 'readonly' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
);
