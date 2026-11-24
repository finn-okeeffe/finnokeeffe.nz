# finnokeeffe.nz

Source for **https://www.finnokeeffe.nz**: a static site built with [Hugo](https://gohugo.io/) and hosted on Cloudflare Pages (free plan). It replaced a self-hosted Ghost blog in November 2026; the look is a port of Ghost's MIT-licensed "Solo" theme with the same settings.

## Writing a post

1. Create a folder with an `index.md`, plus any images next to it:

   ```
   content/posts/my-new-post/
     index.md
     chart.png
   ```

2. Start `index.md` with front matter:

   ```yaml
   ---
   title: "My new post"
   date: 2026-12-01T20:00:00+13:00
   description: "One or two sentences for search results and link previews."
   feature_image: "chart.png"            # optional; a file in the folder or an Unsplash URL
   feature_image_alt: "What the image shows"
   feature_image_caption: "Photo by [Name](https://unsplash.com/@name) / [Unsplash](https://unsplash.com)"  # optional, Markdown
   draft: true                            # remove when ready to publish
   ---
   ```

   The URL is `/<folder name>/` (set `slug:` to change it).

3. Preview with `npm run dev` (http://localhost:1313, drafts included), then commit and push to `main`. Cloudflare Pages builds and publishes it in about a minute. The repo is public, so drafts you push are public in the source, even though they're not built.

### What you can use in a post

| Want | Write |
|---|---|
| Image card | `![alt text](chart.png "Optional caption, *Markdown* works")` on its own line. Add `{.kg-width-wide}` or `{.kg-width-full}` on the next line for a wider card. Responsive sizes are generated automatically. |
| Maths | `\( inline \)`, `\[ display \]` or `$$ display $$`. Rendered by KaTeX at build time; a LaTeX error fails the build with the file and line. Write a literal dollar sign inside maths as `\$`. |
| Diagram | A ` ```mermaid ` code block. Mermaid only loads on pages that have one. |
| Code | Normal fenced code blocks (no syntax highlighting, as on Ghost). |
| Callout | `{{< callout emoji="💡" color="blue" >}}Markdown text{{< /callout >}}` (colours: grey, white, blue, green, yellow, red, pink, purple, accent) |
| Button | `{{< button url="https://…" text="Label" align="center" >}}` |
| Link preview | `{{< bookmark url="…" title="…" description="…" icon="icon.svg" publisher="GitHub" author="…" thumbnail="thumb.png" >}}` (images are local files) |
| Raw HTML | `{{< rawhtml >}} … {{< /rawhtml >}}` (or plain HTML on its own lines) |
| Doctor's Kitchen dashboard | `{{< doctors-kitchen-dashboard id="…" heading="…" >}}` (both optional), see below |

New external resources (scripts, iframes from other sites, images from hosts other than Unsplash) are blocked by the Content-Security-Policy in `static/_headers` until you add them there.

## Pages

- `content/pages/about.md` and `content/pages/other-work.md`. They're linked in the header via `[[menus.main]]` in `hugo.toml`; the footer links (GitHub, LinkedIn) are `[[menus.footer]]`.
- **Hero banner**: `hero: true` plus a `feature_image` shows the image as a short full-width banner behind the title, like the home page. `hero_position: "center 60%"` picks which part of the image shows (CSS `object-position`). Landscape images work best. Styles: `assets/css/site.css`.
- **"My other work"**: each section is a `work-section` shortcode with a Markdown list inside. To add an entry, add a list line `- [Title](https://…) (Attribution, Year)`. To add a section, copy a block. Section photos are hotlinked from Unsplash and must keep their credit (the `photographer` and `unsplash_user` parameters).

## The Doctor's Kitchen dashboard

`/the-doctors-kitchen-dashboard/`, also embedded in the recipe post. It was a Streamlit app backed by PostgreSQL on the home server until November 2026; the data never changes (the recipes were scraped in August 2023), so it's now static:

- `assets/data/the-doctors-kitchen.json`: all 108 recipes (title, link, diet, meals, times, ingredient and equipment lines), exported once from the project's database. The format is described in its `about` field.
- `assets/js/doctors-kitchen-core.js`: the filtering, top-8 counts, histogram binning (Vega's "nice" bins, as Altair used) and ingredient search, reproducing the original SQL. `assets/js/doctors-kitchen.js` draws the controls, SVG charts and results. No libraries; the script only loads on pages using the shortcode.
- `npm test` (`scripts/test-doctors-kitchen.mjs`) checks the logic against results recorded from the original SQL queries. CI runs it.

## Site settings

`hugo.toml` holds the title, description, logo, icon, home cover image, colours (`backgroundColor`, `accentColor`), heading font, author and menus. Home page header text: `params.primaryHeader`.

## Building locally

Needs Hugo extended **0.169.0** and Node 22.

```sh
npm ci            # installs Pagefind
npm run dev       # live preview; search doesn't work here (no index)
npm run build     # full build into public/, with the search index
npm test          # dashboard logic tests
node scripts/check-links.mjs public   # broken internal links/images/anchors
```

## Hosting (Cloudflare Pages)

- **Project**: Git integration with this repo, production branch `main`. Every push to `main` deploys; other branches get preview URLs on `*.pages.dev`.
- **Build settings**: build command `npm run build`, output directory `public`, environment variables `HUGO_VERSION=0.169.0` and `NODE_VERSION=22` (Production and Preview). Change `HUGO_VERSION` here, in `.github/workflows/check.yml` and in `static/vendor/katex-*` (KaTeX must match Hugo's) together.
- **Domains**: `www.finnokeeffe.nz` is canonical. The bare `finnokeeffe.nz` redirects to it with a Cloudflare Redirect Rule (`finnokeeffe.nz/*` → `https://www.finnokeeffe.nz/${1}`, 301, keep query string).
- **Free-plan limits**: 500 builds a month, 20,000 files and 25 MiB per file. This site is about 120 files.
- **Headers and redirects**: `static/_headers` (security headers, caching, `noindex` on `*.pages.dev`) and `static/_redirects`.
- **CI**: `.github/workflows/check.yml` builds the site and runs the link check on every push and pull request. It doesn't deploy.
- **Known console error**: on `www`, Cloudflare's JavaScript Detections (bot management) inject an inline script into every page. The CSP blocks it, so the browser console shows one CSP error per page. It's harmless (it doesn't affect visitors or the site) and can't be allowlisted, because the script changes on every request. Leave the CSP as it is.
- **Stale edge cache**: Cloudflare caches images for a long time. After replacing an image at the same URL, purge it (Caching → Configuration → Purge Cache).

### URLs kept from Ghost

Every post and page keeps its URL (`/<slug>/`), and images keep `/content/images/...`. `static/_redirects` covers the rest:

| Old URL | Now |
|---|---|
| `/rss/` | Served from `/rss/index.xml` (feed item GUIDs are the old Ghost post IDs, so readers don't see duplicates) |
| `/author/finn/` | `/` |
| `/sitemap-*.xml` | `/sitemap.xml` |
| `/content/images/size/w600/...` (Ghost's resized copies) | The full image |
| `/streamlit/the-doctors-kitchen-dashboard/...` | `/the-doctors-kitchen-dashboard/` (the old Streamlit app, now a static page) |
| `/ghost/...` | 404: there's no admin any more |

## Migration notes (November 2026)

- Content came from the Ghost database (Lexical JSON), converted to Markdown by a one-off script; Ghost cards became the shortcodes above. The Ghost backups (database dump, `content/` tarball) are on the home server, not in this repo.
- Fixed during migration: two formulas in the instrumental-variables post that Ghost showed as raw LaTeX (a missing `\(` and an unescaped `$`).
- The six images the Excel post hotlinked from the old `finn-okeeffe.github.io` site now live in the post's folder.
- Dropped: Ghost's photo lightbox, the "Powered by Ghost" footer line, the newsletter/members features (unused) and the Ghost admin.
- Mermaid, KaTeX and fonts are self-hosted and pinned, instead of loading the latest Mermaid from jsDelivr on every page.
