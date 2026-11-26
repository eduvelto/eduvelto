// Eduvelto — firebase.json hosting tests (Phase 1, SSG + bilingual,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// Guards the server-side half of the redirect contract: the
// firebase.json 301s must agree with legacyRedirectTarget() (the
// client-side half in App.tsx), cleanUrls must be on, and /bn/**
// + /en/** must fall through to the SPA shell. Redirects evaluate
// BEFORE rewrites in Firebase Hosting.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { legacyRedirectTarget } from '../langRouting';

type HostingRedirect = { source: string; destination: string; type: number };
type HostingRewrite = { source: string; destination: string };

type HostingHeader = { key: string; value: string };
type HostingHeaderRule = { source: string; headers: HostingHeader[] };

function hosting() {
  const raw = JSON.parse(readFileSync(join(process.cwd(), 'firebase.json'), 'utf8'));
  return raw.hosting as {
    cleanUrls?: boolean;
    redirects: HostingRedirect[];
    rewrites: HostingRewrite[];
    headers: HostingHeaderRule[];
  };
}

function cacheControlOf(source: string): string | undefined {
  const rule = hosting().headers.find((h) => h.source === source);
  return rule?.headers.find((h) => h.key === 'Cache-Control')?.value;
}

describe('firebase.json hosting', () => {
  it('parses and enables cleanUrls', () => {
    expect(hosting().cleanUrls).toBe(true);
  });

  it('301s the root to /bn', () => {
    const root = hosting().redirects.find((r) => r.source === '/');
    expect(root).toEqual({ source: '/', destination: '/bn', type: 301 });
  });

  it('keeps the /jobs/primary 301, now to the lang-prefixed target', () => {
    const rule = hosting().redirects.find((r) => r.source === '/jobs/primary');
    expect(rule?.destination).toBe('/bn/jobs/primary-teacher');
    expect(rule?.type).toBe(301);
  });

  it('has glob 301s for legacy book URLs (correction (b))', () => {
    const redirects = hosting().redirects;
    expect(redirects).toContainEqual({ source: '/books/:id*', destination: '/bn/books/:id*', type: 301 });
    expect(redirects).toContainEqual({ source: '/library/:id*', destination: '/bn/books/:id*', type: 301 });
    expect(redirects).toContainEqual({ source: '/jobs/:rest*', destination: '/bn/jobs/:rest*', type: 301 });
    expect(redirects).toContainEqual({ source: '/learn/:rest*', destination: '/bn/learn/:rest*', type: 301 });
    expect(redirects).toContainEqual({ source: '/guides/:rest*', destination: '/bn/guides/:rest*', type: 301 });
    expect(redirects).toContainEqual({ source: '/class/:rest*', destination: '/bn/class/:rest*', type: 301 });
  });

  it('301s the bare generator/pricing/OMR URLs to /bn/... (23:00 check, 25 Nov 2026)', () => {
    // The bare URLs are linked from the homepage but returned HTTP
    // 404 on direct load (no prerendered file, no redirect rule).
    // The redirect is evaluated before the rewrites, so the direct
    // load 301s instead of serving 404.html.
    const redirects = hosting().redirects;
    for (const source of ['/question-maker', '/question-paper-generator', '/pricing', '/omr-evaluator', '/custom-paper']) {
      expect(redirects).toContainEqual({ source, destination: `/bn${source}`, type: 301 });
    }
    // The matching rewrites stay as belt-and-braces (same pattern as
    // /about, /support, /install): the sitemap rewrite-coverage test
    // requires a rewrite for every sitemap URL.
    const rewrites = hosting().rewrites;
    for (const source of ['/question-maker', '/question-paper-generator', '/pricing', '/omr-evaluator', '/custom-paper']) {
      expect(rewrites).toContainEqual({ source, destination: '/index.html' });
    }
  });

  it('301s the bare /suggestions store URL to /bn/suggestions, with a rewrite (Day 6, 26 Nov 2026)', () => {
    // Same pattern as the generator pages above: the bare URL is
    // linked from the footer but would 404 on direct load without
    // the redirect (evaluated before the rewrites) + the rewrite.
    const redirects = hosting().redirects;
    expect(redirects).toContainEqual({ source: '/suggestions', destination: '/bn/suggestions', type: 301 });
    const rewrites = hosting().rewrites;
    expect(rewrites).toContainEqual({ source: '/suggestions', destination: '/index.html' });
  });

  it('agrees with legacyRedirectTarget() on every exact legacy source', () => {
    // Exact (non-glob) redirect sources must produce exactly the
    // target the client-side mapping produces — one contract, two
    // layers. Glob sources are covered by the sampled test below.
    for (const rule of hosting().redirects) {
      if (rule.source.includes(':')) continue;
      if (rule.source === '/') continue; // root: RootRedirect, not legacyRedirectTarget
      const target = legacyRedirectTarget(rule.source);
      if (target === null) continue; // not a legacy source (e.g. /whatsapp 302 to wa.me)
      expect(rule.type).toBe(301);
      expect(target).toBe(rule.destination);
    }
  });

  it('agrees with legacyRedirectTarget() on glob samples', () => {
    expect(legacyRedirectTarget('/books/hons-211001')).toBe('/bn/books/hons-211001');
    expect(legacyRedirectTarget('/books/hons-211001/chapters/c1')).toBe('/bn/books/hons-211001/chapters/c1');
    expect(legacyRedirectTarget('/jobs/bcs/subjects/english')).toBe('/bn/jobs/bcs/subjects/english');
    expect(legacyRedirectTarget('/learn/bcs-preparation-guide')).toBe('/bn/learn/bcs-preparation-guide');
    expect(legacyRedirectTarget('/guides/bcs-bangla-preparation')).toBe('/bn/guides/bcs-bangla-preparation');
    expect(legacyRedirectTarget('/guides')).toBe('/bn/guides');
  });

  it('rewrites /bn, /bn/**, /en, /en/** to /index.html and keeps the legacy rewrites', () => {
    const rewrites = hosting().rewrites;
    for (const source of ['/bn', '/bn/**', '/en', '/en/**']) {
      expect(rewrites).toContainEqual({ source, destination: '/index.html' });
    }
    // Spot-check the pre-existing enumerated rewrites survived.
    expect(rewrites).toContainEqual({ source: '/jobs', destination: '/index.html' });
    expect(rewrites).toContainEqual({ source: '/guides', destination: '/index.html' });
    expect(rewrites).toContainEqual({ source: '/guides/**', destination: '/index.html' });
    expect(rewrites).toContainEqual({ source: '/login', destination: '/index.html' });
    expect(rewrites).toContainEqual({ source: '/admin/**', destination: '/index.html' });
  });

  it('does not redirect private routes', () => {
    const sources = hosting().redirects.map((r) => r.source);
    for (const p of ['/admin', '/admin/**', '/login', '/register', '/profile', '/dashboard']) {
      expect(sources).not.toContain(p);
    }
  });
});

describe('firebase.json cache headers (bandwidth, 26 Nov 2026)', () => {
  // Firebase Hosting is at 8.61/10 GB monthly transfer (Spark). The
  // entry chunk is ~2.5 MB, so returning visitors and crawlers must
  // NOT re-download it. `immutable` is safe ONLY for Vite's hashed
  // assets under /assets/** (the hash changes when content changes).
  // It must NEVER cover unhashed files: index.html, the service
  // worker, or public/ files — those must revalidate.
  it('gives hashed /assets/** a 1-year immutable cache', () => {
    expect(cacheControlOf('/assets/**')).toBe('public, max-age=31536000, immutable');
  });

  it('is the ONLY immutable rule — nothing else is immutable', () => {
    const immutable = hosting().headers.filter((h) =>
      h.headers.some((x) => x.key === 'Cache-Control' && x.value.includes('immutable')),
    );
    expect(immutable.map((h) => h.source)).toEqual(['/assets/**']);
  });

  it('keeps the service worker revalidating (no-cache, after the js/css rule)', () => {
    const rules = hosting().headers;
    const jsIdx = rules.findIndex((h) => h.source === '**/*.@(js|css)');
    const swIdx = rules.findIndex((h) => h.source === '/sw.js');
    expect(jsIdx).toBeGreaterThanOrEqual(0);
    expect(swIdx).toBeGreaterThan(jsIdx); // later rule wins for sw.js
    expect(cacheControlOf('/sw.js')).toBe('no-cache');
    expect(cacheControlOf('**/*.@(js|css)')).not.toContain('immutable');
  });

  it('keeps unhashed documents revalidating (html/json/xml/txt/webmanifest)', () => {
    expect(cacheControlOf('**/*.@(html|json|xml|txt|webmanifest)')).toBe('no-cache');
  });

  it('does not set Cache-Control on the ** security-headers rule', () => {
    const all = hosting().headers.find((h) => h.source === '**');
    expect(all?.headers.map((x) => x.key)).not.toContain('Cache-Control');
  });
});
