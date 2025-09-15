// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['store/**', 'store.ts'],
    rules: {
      // Prevent store internals from importing the root store re-export which causes circular/conflicts
      'no-restricted-imports': ['error', {
        'paths': [{ name: '@/store', message: 'Import from local store files directly (e.g. "./index"), not from "@/store" to avoid circular type/import conflicts.' }]
      }],
    },
  },
]);
