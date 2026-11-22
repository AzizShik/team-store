import { defineConfig } from 'vitest/config';

const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  build: {
    rollupOptions: {
      input: {
        home: 'index.html',
        catalog: 'catalog.html',
        cart: 'cart.html',
        book: 'book.html',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
