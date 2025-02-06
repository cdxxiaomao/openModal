module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/vue3-recommended',
    'plugin:vue/vue3-essential',
    'standard-with-typescript'
  ],
  parser: 'vue-eslint-parser',
  overrides: [
  ],
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: [
      'tsconfig.json'
    ],
    extraFileExtensions: ['.vue']
  },
  plugins: [
    'vue'
  ],
  rules: {
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off'
  }
}
