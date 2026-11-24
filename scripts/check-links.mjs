#!/usr/bin/env node
// Checks the built site (public/) for broken internal links, images, scripts,
// stylesheets, CSS url()s and same-page #anchors. External URLs aren't fetched.
// Usage: node scripts/check-links.mjs [public]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname, relative, posix } from 'node:path';

const root = process.argv[2] || 'public';
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(root);

// Paths handled by static/_redirects count as valid.
const redirectSources = existsSync(join(root, '_redirects'))
  ? readFileSync(join(root, '_redirects'), 'utf8').split('\n')
      .map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.split(/\s+/)[0])
  : [];
const matchesRedirect = (path) => redirectSources.some((src) => {
  const re = new RegExp('^' + src.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/:\w+/g, '[^/]+').replace(/\*/g, '.*') + '$');
  return re.test(path);
});

const exists = (urlPath) => {
  const p = decodeURIComponent(urlPath);
  const fsPath = join(root, p);
  if (p.endsWith('/')) return existsSync(join(fsPath, 'index.html'));
  if (existsSync(fsPath) && statSync(fsPath).isFile()) return true;
  return !extname(p) && existsSync(join(fsPath, 'index.html')); // Pages adds the trailing slash
};

const attrRe = /\s(href|src|srcset|poster)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const idRe = /\sid=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
const problems = [];

for (const file of files) {
  const ext = extname(file);
  if (ext !== '.html' && ext !== '.css') continue;
  const text = readFileSync(file, 'utf8');
  const pagePath = '/' + relative(root, file).split('\\').join('/');
  const refs = [];
  if (ext === '.html') {
    const ids = new Set([...text.matchAll(idRe)].map((m) => m[1] ?? m[2] ?? m[3]));
    // Skip raw XML/SVG namespace links and inline JSON-LD.
    const html = text.replace(/<script type=(?:"application\/ld\+json"|application\/ld\+json)[\s\S]*?<\/script>/g, '');
    for (const m of html.matchAll(attrRe)) {
      const value = (m[2] ?? m[3] ?? m[4] ?? '').trim();
      if (m[1].toLowerCase() === 'srcset') value.split(',').forEach((c) => refs.push(c.trim().split(/\s+/)[0]));
      else refs.push(value);
    }
    for (const ref of refs) {
      if (ref.startsWith('#') && ref.length > 1 && !ids.has(decodeURIComponent(ref.slice(1)))) {
        problems.push(`${pagePath}: missing anchor ${ref}`);
      }
    }
  } else {
    for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) refs.push(m[1]);
  }
  for (const ref of refs) {
    if (!ref || ref.startsWith('#') || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(ref)) continue; // external, data:, mailto: …
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = clean.startsWith('/') ? clean : posix.join(posix.dirname(pagePath), clean);
    if (!exists(target) && !matchesRedirect(target)) problems.push(`${pagePath}: broken link ${ref}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) found.`);
  process.exit(1);
}
console.log(`Link check OK: ${files.filter((f) => /\.(html|css)$/.test(f)).length} HTML/CSS files.`);
