module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  globals: {
    // Vite define 注入的构建时间戳
    __BUILD_TIMESTAMP__: 'readonly',
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: { 
    ecmaVersion: 'latest', 
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: { 
    react: { version: '17.0' }
  },
  plugins: ['react-refresh', 'prettier'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'prettier/prettier': 'error',
  },
  overrides: [
    {
      // 类型声明文件中声明变量是正常行为，禁用 no-unused-vars
      files: ['**/*.d.ts'],
      rules: {
        'no-unused-vars': 'off',
      },
    },
  ],
};