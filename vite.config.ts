import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/lib.ts'),
      name: 'MiniMermaid',
      fileName: (format) => `minimermaid.${format}.js`,
    },
    rollupOptions: {
      external: [],
    }
  },
  // @ts-ignore (Mengabaikan error tipe vitest agar build tetap jalan)
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});