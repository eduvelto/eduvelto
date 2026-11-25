// Eduvelto — <SeoHead /> SSR output tests (Phase 1, SSG + bilingual,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// Renders SeoHead through react-helmet-async's server path
// (renderToString + helmet context) — the same path the prerender
// script reads — and asserts the exact tag set a crawler sees:
// title, description, canonical, reciprocal hreflang (bn / en /
// x-default -> bn), OG + Twitter, robots only when asked, and one
// JSON-LD script per object.

import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { SeoHead } from '../SeoHead';

function renderSeoHead(props: Parameters<typeof SeoHead>[0]) {
  const helmetContext: { helmet?: HelmetServerState } = {};
  renderToString(
    <HelmetProvider context={helmetContext}>
      <SeoHead {...props} />
    </HelmetProvider>,
  );
  const helmet = helmetContext.helmet;
  return {
    title: helmet?.title.toString() ?? '',
    meta: helmet?.meta.toString() ?? '',
    link: helmet?.link.toString() ?? '',
    script: helmet?.script.toString() ?? '',
  };
}

describe('<SeoHead />', () => {
  it('emits title, description, canonical and reciprocal hreflang', () => {
    const out = renderSeoHead({
      title: 'BCS প্রস্তুতি | Eduvelto',
      description: 'BCS প্রস্তুতির কাঠামো — সম্পূর্ণ ফ্রি।',
      canonical: 'https://eduvelto.com/bn/jobs/bcs',
      lang: 'bn',
      jsonLd: [],
    });
    expect(out.title).toContain('BCS প্রস্তুতি | Eduvelto');
    expect(out.meta).toContain('name="description"');
    expect(out.meta).toContain('BCS প্রস্তুতির কাঠামো');
    expect(out.link).toContain('rel="canonical" href="https://eduvelto.com/bn/jobs/bcs"');
    // Helmet's server string keeps React's hrefLang casing; HTML
    // attribute names are case-insensitive, so this IS hreflang to a
    // parser (the prerender script normalises it to lowercase).
    expect(out.link).toContain('hrefLang="bn" href="https://eduvelto.com/bn/jobs/bcs"');
    expect(out.link).toContain('hrefLang="en" href="https://eduvelto.com/en/jobs/bcs"');
    expect(out.link).toContain('hrefLang="x-default" href="https://eduvelto.com/bn/jobs/bcs"');
  });

  it('uses the en canonical + en locale on en pages', () => {
    const out = renderSeoHead({
      title: 'Job Preparation — BCS | Eduvelto',
      description: 'BCS preparation — free.',
      canonical: 'https://eduvelto.com/en/jobs/bcs',
      lang: 'en',
      jsonLd: [],
    });
    expect(out.link).toContain('rel="canonical" href="https://eduvelto.com/en/jobs/bcs"');
    expect(out.link).toContain('hrefLang="x-default" href="https://eduvelto.com/bn/jobs/bcs"');
    expect(out.meta).toContain('property="og:locale" content="en_US"');
    expect(out.meta).toContain('property="og:locale:alternate" content="bn_BD"');
  });

  it('emits OG + Twitter tags and one JSON-LD script per object', () => {
    const out = renderSeoHead({
      title: 'Home | Eduvelto',
      description: 'Free education platform.',
      canonical: 'https://eduvelto.com/bn',
      lang: 'bn',
      ogType: 'website',
      jsonLd: [
        { '@context': 'https://schema.org', '@type': 'Organization', name: 'Eduvelto' },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Eduvelto' },
      ],
    });
    expect(out.meta).toContain('property="og:title" content="Home | Eduvelto"');
    expect(out.meta).toContain('property="og:url" content="https://eduvelto.com/bn"');
    expect(out.meta).toContain('property="og:image" content="https://eduvelto.com/og-image.jpg"');
    expect(out.meta).toContain('name="twitter:card" content="summary_large_image"');
    expect(out.script.match(/application\/ld\+json/g)?.length).toBe(2);
    expect(out.script).toContain('"@type":"Organization"');
  });

  it('emits no robots tag when indexable, and the given robots value when not', () => {
    const indexable = renderSeoHead({
      title: 'T',
      description: 'D',
      canonical: 'https://eduvelto.com/bn/jobs',
      lang: 'bn',
    });
    expect(indexable.meta).not.toContain('name="robots"');
    const noindex = renderSeoHead({
      title: 'T',
      description: 'D',
      canonical: 'https://eduvelto.com/bn/jobs/not-an-exam',
      lang: 'bn',
      robots: 'noindex, nofollow',
    });
    expect(noindex.meta).toContain('name="robots" content="noindex, nofollow"');
  });
});
