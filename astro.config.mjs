import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  base: process.env.GITHUB_ACTIONS ? '/garden' : '/',
  vite: {
    cacheDir: '/tmp/vite-cache-marys-garden',
  },
});
