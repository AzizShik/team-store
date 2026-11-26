import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import handlebars from 'vite-plugin-handlebars';

const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [
    handlebars({
      partialDirectory: fileURLToPath(new URL('src/partials', import.meta.url)),
      helpers: {
        eq: (left: unknown, right: unknown) => left === right,
      },
    }),
  ],
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
