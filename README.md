# Vislet

Small interactive visualizations to help us understand the cities we live in —
a static site of D3 data visualizations (Brooklyn property sales, NYC 311 calls,
Chicago crime, North Carolina districts), historically hosted at
[vislet.com](http://www.vislet.com).

## Status

The site currently runs on a **2015-era stack** (Ezel/Backbone + CoffeeScript +
Jade + Stylus + Gulp + Browserify + **D3 v3**, deployed static to S3) and is being
**migrated to a modern stack**: **Astro + React + TypeScript + D3 v7 + Tailwind,
hosted on Cloudflare Pages** — matching the setup of
[zamiang.com](https://github.com/zamiang/homepage-notion-nextjs).

📄 **Documentation:**
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how the current site is built.
- [`docs/MIGRATION.md`](./docs/MIGRATION.md) — the modernization plan (stack,
  phased page-by-page strategy, D3 v3→v7 mapping, effort estimate).

> ⚠️ **Security:** an `airflow/.env` file (now deleted) previously contained live
> AWS keys. They are being revoked — see the security note in `ARCHITECTURE.md`.

## Visualizations

| Page | What it shows |
|------|---------------|
| `/` (home) | Landing page / project index |
| `/brooklyn` | 322,056 Brooklyn property sales, 2003–2014 |
| `/311` | 7.7M NYC 311 calls distributed across the city, 2010–2014 |
| `/chicago` | 5.7M Chicago crimes across the city, 2003–2014 |
| `/north-carolina` | Congressional district / gerrymandering analysis |

## Legacy development workflow (current stack)

> This is the existing Gulp/Ezel workflow. It will be replaced by the standard
> Astro `npm run dev` / `npm run build` flow as the migration lands — see
> `docs/MIGRATION.md`.

```sh
npm install -g gulp
npm install
gulp server      # serve ./dist
gulp watch       # recompile coffee/stylus/jade on change (in a second tab)
```

- `./dist` — development build output
- `./public` — production build output (hashed, gzipped)

### Deploying (legacy)

Create a gitignored `aws.json`:

```json
{ "key": "…", "secret": "…", "bucket": "www.url.com", "region": "us-east-1" }
```

`gulp deploy` compiles assets, hashes + rewrites references, uglifies/gzips, and
uploads HTML/JS/CSS/images to the S3 bucket.
