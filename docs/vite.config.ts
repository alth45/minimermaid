import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Arahkan ke source code library utama agar hot-reload saat diedit
      'minimermaid': resolve(__dirname, '../src/lib.ts'),
    },
  },
});