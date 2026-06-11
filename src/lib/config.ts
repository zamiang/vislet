/**
 * Centralized site configuration.
 */

function getEnv(key: string, defaultValue: string): string {
  return (typeof process !== 'undefined' && process.env?.[key]) || defaultValue;
}

export const config = {
  site: {
    url: getEnv('SITE_URL', 'https://www.vislet.com'),
    title: 'Vislet — Small interactive visualizations of open data by Brennan Moore',
    description:
      'Small interactive visualizations to help us understand the cities we live in. All visualizations are open source.',
    author: 'Brennan Moore',
  },
  /**
   * The shared site navigation. Mirrors the legacy header/intro links
   * (components/layout/header/intro.jade). Pages are migrated one at a time;
   * every entry is a legacy URL that must keep resolving (MIGRATION.md §3).
   */
  nav: [
    { href: '/brooklyn', label: 'Brooklyn Residential Sales' },
    { href: '/311', label: 'NYC 311 Calls' },
    { href: '/chicago', label: 'Chicago Crime' },
    { href: '/north-carolina', label: 'North Carolina Districts' },
  ],
} as const;
