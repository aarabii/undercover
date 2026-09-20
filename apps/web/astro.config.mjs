import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const siteUrl = process.env.PUBLIC_SITE_URL || 'https://undercover.aarab.me';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: siteUrl,
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/play') && !page.includes('/r/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});

