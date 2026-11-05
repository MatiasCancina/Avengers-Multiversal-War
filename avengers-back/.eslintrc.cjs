module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/'],
  overrides: [
    {
      files: ['src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
      env: { node: true, es2022: true },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        curly: ['error', 'all'],
        eqeqeq: ['error', 'always'],
        'lines-between-class-members': ['error', 'always'],
        'max-statements-per-line': ['error', { max: 1 }],
        'one-var': ['error', 'never'],
        'padding-line-between-statements': [
          'error',
          { blankLine: 'always', prev: 'import', next: '*' },
          { blankLine: 'any', prev: 'import', next: 'import' },
        ],
      },
    },
    {
      files: ['test/**/*.cjs'],
      extends: ['eslint:recommended', 'prettier'],
      env: { node: true, es2022: true },
      parserOptions: { ecmaVersion: 2022 },
      rules: {
        curly: ['error', 'all'],
        eqeqeq: ['error', 'always'],
        'max-statements-per-line': ['error', { max: 1 }],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'one-var': ['error', 'never'],
      },
    },
  ],
};
