const withPlugins = require("next-compose-plugins");
const { createSecureHeaders } = require("next-secure-headers");
const withFonts = require("next-fonts");

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  webpack5: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  target: "server",

  images: {
    minimumCacheTTL: 31536000,
  },
  assetPrefix: isProd ? "https://image.vislet.com" : "",

  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        fs: false,
        path: false,
        os: false,
        https: false,
      },
    };
    return config;
  },

  async rewrites() {
    return [
      {
        source: "/sitemap.xml",
        destination: "/api/sitemap",
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...createSecureHeaders({
            contentSecurityPolicy: {
              directives: {
                defaultSrc: ["'self'", "https://image.vislet.com"],
                styleSrc: [
                  "'self'",
                  "'unsafe-inline'",
                  "https://image.vislet.com",
                ],
                imgSrc: [
                  "'self'",
                  "data:",
                  "https://www.googletagmanager.com",
                  "http://www.googletagmanager.com",
                  "https://image.vislet.com",
                  "https://cdn-images-1.medium.com",
                  "https://vitals.vercel-insights.com",
                ],
                fontSrc: ["'self'"],
                scriptSrc: [
                  "'self'",
                  "'unsafe-eval'",
                  "'unsafe-inline'",
                  "https://www.googletagmanager.com",
                  "http://www.googletagmanager.com",
                  "https://image.zamiang.com",
                  "https://platform.twitter.com",
                  "https://vitals.vercel-insights.com",
                ],
                frameSrc: [
                  "https://platform.twitter.com/",
                  "https://vitals.vercel-insights.com",
                ],
                connectSrc: [
                  "'self'",
                  "https://image.vislet.com",
                  "https://www.googleapis.com",
                  "https://www.google-analytics.com",
                  "https://vitals.vercel-insights.com",
                ],
              },
            },
            forceHTTPSRedirect: true,
            referrerPolicy: "same-origin",
            xssProtection: "block-rendering",
          }),
          {
            key: "Cache-Control",
            value:
              "public, max-age=604800, stale-while-revalidate=86400, stale-if-error=259200",
          },
        ],
      },
    ];
  },
};

module.exports = withPlugins(
  [
    [
      withFonts,
      {
        reactStrictMode: true,
        poweredByHeader: false,
      },
    ],
  ],
  nextConfig
);
