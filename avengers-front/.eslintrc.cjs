module.exports = {
  root: true,
  ignorePatterns: ['dist/', 'node_modules/', '.angular/'],
  overrides: [
    {
      files: ['src/**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint', '@angular-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@angular-eslint/recommended',
        'plugin:@angular-eslint/template/process-inline-templates',
        'prettier',
      ],
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
      files: ['src/**/*.html'],
      parser: '@angular-eslint/template-parser',
      extends: ['plugin:@angular-eslint/template/recommended', 'prettier'],
      rules: {},
    },
  ],
};
