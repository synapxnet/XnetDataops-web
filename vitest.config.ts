import Vue from '@vitejs/plugin-vue';
import VueJsx from '@vitejs/plugin-vue-jsx';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [Vue(), VueJsx()],
  test: {
    environment: 'happy-dom',
    // 原生 Node 证据测试由 test:evidence 执行。 Native Node evidence tests run through test:evidence.
    exclude: [...configDefaults.exclude, '**/e2e/**', '**/feature-drift/model.test.mjs'],
  },
});
