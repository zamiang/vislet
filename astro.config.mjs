import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.vislet.com',
  output: 'static',

  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // `@` -> `/src` (kills the `../../../components/...` relative-require pain
      // from the legacy code). Mirrors zamiang-dot-com-v2.
      alias: {
        '@': '/src',
      },
    },
    css: {
      // Tailwind v4 runs via the Vite plugin above, not PostCSS config loading.
      postcss: {},
    },
  },

  // Legacy URLs (/, /brooklyn, /311, /chicago, /north-carolina) are served by
  // file-based pages as they are migrated (see MIGRATION.md §3). No redirects
  // are needed yet; add entries here only for paths that actually change.
  redirects: {},

  // Security (Astro 6). CSP is emitted as a <meta http-equiv> tag; Astro
  // auto-hashes its own inline island/hydration scripts so we don't need
  // 'unsafe-inline' for scripts. Tuned for vislet's external dependencies
  // (Google Fonts, gravatar avatar). Tighten as legacy third-parties
  // (typekit, analytics) are dropped during the migration.
  security: {
    checkOrigin: true,
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://secure.gravatar.com",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: {
        resources: ["'self'"],
      },
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      },
    },
  },
});
