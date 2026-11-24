# Agent notes

Read `README.md` first: it covers writing posts, the shortcodes, hosting and the URL redirects.

- **The repo is public.** Never commit Ghost exports, database dumps, `.env` files, tokens, or images with EXIF/GPS metadata (strip it first). `.gitignore` blocks the common ones.
- **Don't break old URLs.** Posts and pages live at `/<slug>/` and images at `/content/images/...`; links from elsewhere depend on them. If something has to move, add a 301 to `static/_redirects`.
- **Keep the Content-Security-Policy strict** (`static/_headers`). The one CSP error in the console on `www` is Cloudflare's injected bot-detection script, which is expected; don't loosen `script-src` for it. Add a specific origin when a post needs it; don't add `'unsafe-inline'` or `'unsafe-eval'` to `script-src`, and don't add CDNs. Third-party JS/CSS/fonts go in `static/vendor/<name>-<version>/` (pinned, with its licence in `licenses/` and a line in `THIRD_PARTY_NOTICES.md`).
- **Hugo version is pinned** (0.169.0) in three places: the Pages project's `HUGO_VERSION`, `.github/workflows/check.yml`, and the KaTeX version in `static/vendor/` (must match Hugo's bundled KaTeX). Change them together.
- **Before pushing**: `npm test && npm run build && node scripts/check-links.mjs public`. A push to `main` deploys to production.
- The theme CSS under `assets/css/ghost-shared/`, `solo.css` and `ghost-cards.min.css` is vendored from Ghost (MIT). Put site changes in `assets/css/site.css` rather than editing those.
- The Doctor's Kitchen dashboard is static (see README). Its data is frozen; if you change `assets/js/doctors-kitchen-core.js`, keep `npm test` passing, since those numbers come from the original app.
