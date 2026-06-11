# npm audit — informational (Phase 0)

Captured per p0-cleanup. **Informational only — no `audit fix`, no dep bumps**
(legacy tree must stay deployable; the new tree's only findings are dev-tooling).

## New Astro toolchain (this branch)

`npm audit` → **5 moderate** severity, all the same transitive chain:

```
yaml 2.0.0–2.8.2  (moderate: stack overflow via deeply nested YAML)
└─ yaml-language-server
   └─ volar-service-yaml
      └─ @astrojs/language-server
         └─ @astrojs/check   (our devDependency)
```

- **Runtime impact: none.** `@astrojs/check` is a dev-only typecheck tool; `yaml`
  here is not in the shipped client bundle.
- Fix would require `npm audit fix --force` → downgrades `@astrojs/check` to
  0.9.2 (breaking). Not worth it for a dev-only moderate; revisit when
  `@astrojs/check` publishes a patched release.

## Legacy tree (apps/, gulp, browserify, jade…)

Not separately audited: the 2015 `npm-shrinkwrap.json` was removed on the
migration branch and those deps don't install on Node 24. The legacy stack is
known-ancient (Gulp 3, Browserify, old Jade) and is being **deleted** in P2.4,
so auditing it has no actionable outcome. If a number is needed, run
`npm audit` against a `master` checkout.
