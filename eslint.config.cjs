const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname
});

module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', '*.json', 'eslint.config.cjs']
  },
  ...compat.config({
    env: {
      browser: true,
      node: true
    },
    extends: [
      'plugin:vue/vue3-recommended',
      'plugin:@typescript-eslint/recommended',
      'standard'
    ],
    parser: 'vue-eslint-parser',
    parserOptions: {
      parser: '@typescript-eslint/parser',
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    plugins: ['vue', '@typescript-eslint'],
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      semi: ['error', 'always'],
      camelcase: [2, { properties: 'always' }],
      quotes: ['error', 'single'],
      'no-param-reassign': 0,
      'no-empty-function': 1,
      'no-extra-semi': 2,
      'no-nested-ternary': 1,
      indent: [2, 2],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 2,
      '@typescript-eslint/no-explicit-any': 'warn',
      'vue/html-indent': ['error', 2],
      'vue/no-v-model-argument': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': ['off'],
      'vue/multi-word-component-names': 'off',
      'vue/html-closing-bracket-newline': ['error', {
        singleline: 'never',
        multiline: 'always'
      }]
    }
  }),
  {
    // env.node 经 FlatCompat 转换后会附带 ecmaFeatures.globalReturn: true，
    // 导致 vue-eslint-parser 无法把模板 v-for 变量关联到 key，这里显式关掉。
    files: ['**/*.{js,ts,vue}'],
    languageOptions: { parserOptions: { ecmaFeatures: { globalReturn: false } } }
  },
  {
    files: ['**/*.vue'],
    plugins: {
      vue: require('eslint-plugin-vue'),
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'vue/no-unused-vars': 'error'
    }
  }
];
