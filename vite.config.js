import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [tailwindcss()],
  publicDir: 'public',
  esbuild: { jsx: 'automatic' },
  build: { target: 'es2022' },
});
