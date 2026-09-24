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
    plugins: [
      tailwindcss(),
      {
        name: 'vite-rewrite-r-to-play',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && /^\/r\/[a-zA-Z0-9]+/i.test(req.url)) {
              req.url = '/play';
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && /^\/r\/[a-zA-Z0-9]+/i.test(req.url)) {
              req.url = '/play';
            }
            next();
          });
        },
      },
    ],
  },
});

