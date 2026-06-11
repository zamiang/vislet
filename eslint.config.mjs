import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

const eslintConfig = [
  {
    ignores: [
      '.astro/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      // Legacy stack — not migrated yet, not linted by the new toolchain.
      'apps/**',
      'components/**',
      'assets/**',
      'gulp/**',
      'gulpfile.js',
    ],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default eslintConfig;
