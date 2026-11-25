// Eduvelto — bilingual routing unit tests (Phase 1, SSG + bilingual,
// 25 Nov 2026, feature/ssg-bilingual-support).
//
// Guards the redirect contract the whole migration rests on:
// legacy public URLs -> /bn/... (and the firebase.json 301s must
// agree — see firebaseHosting.test.ts), /:lang parsing, root
// redirect priority, and the getGuideSlugs regex reader returning
// m[1] (correction (c)).

import { describe, expect, it } from 'vitest';
import {
  alternateLangUrl,
  canonicalUrl,
  getGuideSlugs,
  hreflangUrls,
  langSwitchTarget,
  legacyRedirectTarget,
  parseLangSegment,
  resolveRootLang,
  stripLangPrefix,
  withLangPrefix,
  withoutLangParam,
} from '../langRouting';

describe('stripLangPrefix / parseLangSegment', () => {
  it('splits /:lang from the bare path', () => {
    expect(stripLangPrefix('/bn/jobs/bcs')).toEqual({ lang: 'bn', path: '/jobs/bcs' });
    expect(stripLangPrefix('/en')).toEqual({ lang: 'en', path: '/' });
    expect(stripLangPrefix('/bn/')).toEqual({ lang: 'bn', path: '/' });
    expect(stripLangPrefix('/jobs/bcs')).toEqual({ lang: null, path: '/jobs/bcs' });
    expect(stripLangPrefix('/')).toEqual({ lang: null, path: '/' });
  });

  it('does not treat a non-language first segment as a lang', () => {
    expect(parseLangSegment('/jobs/bcs')).toBeNull();
    expect(parseLangSegment('/books/hons-211001')).toBeNull();
    expect(parseLangSegment('/bn/books/x')).toBe('bn');
  });
});

describe('withLangPrefix / canonicalUrl / hreflangUrls', () => {
  it('prefixes bare and already-prefixed paths', () => {
    expect(withLangPrefix('/jobs/bcs', 'en')).toBe('/en/jobs/bcs');
    expect(withLangPrefix('/bn/jobs/bcs', 'en')).toBe('/en/jobs/bcs');
    expect(withLangPrefix('/', 'bn')).toBe('/bn');
    expect(withLangPrefix('/bn', 'en')).toBe('/en');
  });

  it('builds lang-prefixed canonicals', () => {
    expect(canonicalUrl('/jobs/bcs', 'bn')).toBe('https://eduvelto.com/bn/jobs/bcs');
    expect(canonicalUrl('/', 'en')).toBe('https://eduvelto.com/en');
  });

  it('emits reciprocal hreflang with x-default -> bn', () => {
    const h = hreflangUrls('/jobs/bcs', 'en');
    expect(h.bn).toBe('https://eduvelto.com/bn/jobs/bcs');
    expect(h.en).toBe('https://eduvelto.com/en/jobs/bcs');
    expect(h.xDefault).toBe('https://eduvelto.com/bn/jobs/bcs');
  });

  it('swaps the lang segment of an absolute canonical', () => {
    expect(alternateLangUrl('https://eduvelto.com/bn/jobs/bcs', 'en')).toBe(
      'https://eduvelto.com/en/jobs/bcs',
    );
    expect(alternateLangUrl('https://eduvelto.com/en/', 'bn')).toBe('https://eduvelto.com/bn');
  });
});

describe('resolveRootLang', () => {
  it('follows ?lang > localStorage > profile > bn', () => {
    expect(resolveRootLang({ queryLang: 'en', storedLang: 'bn', profileLang: 'bn' })).toBe('en');
    expect(resolveRootLang({ queryLang: null, storedLang: 'en', profileLang: 'bn' })).toBe('en');
    expect(resolveRootLang({ queryLang: null, storedLang: null, profileLang: 'en' })).toBe('en');
    expect(resolveRootLang({})).toBe('bn');
    expect(resolveRootLang({ queryLang: 'fr', storedLang: 'xx', profileLang: null })).toBe('bn');
  });
});

describe('legacyRedirectTarget', () => {
  it('redirects legacy public URLs to /bn/...', () => {
    expect(legacyRedirectTarget('/jobs/bcs')).toBe('/bn/jobs/bcs');
    expect(legacyRedirectTarget('/jobs/bcs/practice/english')).toBe('/bn/jobs/bcs/practice/english');
    expect(legacyRedirectTarget('/learn/bcs-preparation-guide')).toBe('/bn/learn/bcs-preparation-guide');
    expect(legacyRedirectTarget('/books/hons-211001/chapters/c1')).toBe('/bn/books/hons-211001/chapters/c1');
    expect(legacyRedirectTarget('/about')).toBe('/bn/about');
    expect(legacyRedirectTarget('/jobs/bcs', 'en')).toBe('/en/jobs/bcs');
  });

  it('redirects the bare generator/pricing/OMR URLs to /bn/... (23:00 check, 25 Nov 2026)', () => {
    // The bare URLs are linked from the homepage; firebase.json
    // 301s them server-side and this is the client-side half of the
    // same contract (see the firebaseHosting agreement test).
    expect(legacyRedirectTarget('/question-maker')).toBe('/bn/question-maker');
    expect(legacyRedirectTarget('/question-paper-generator')).toBe('/bn/question-paper-generator');
    expect(legacyRedirectTarget('/pricing')).toBe('/bn/pricing');
    expect(legacyRedirectTarget('/omr-evaluator')).toBe('/bn/omr-evaluator');
    expect(legacyRedirectTarget('/custom-paper')).toBe('/bn/custom-paper');
  });

  it('maps the old book hub /library to the canonical /books', () => {
    expect(legacyRedirectTarget('/library')).toBe('/bn/books');
    expect(legacyRedirectTarget('/library/hons-211001')).toBe('/bn/books/hons-211001');
  });

  it('maps the short aliases to real pages', () => {
    expect(legacyRedirectTarget('/bcs')).toBe('/bn/jobs/bcs');
    expect(legacyRedirectTarget('/bank')).toBe('/bn/jobs/bank');
    expect(legacyRedirectTarget('/primary')).toBe('/bn/jobs/primary-teacher');
    expect(legacyRedirectTarget('/ntrca')).toBe('/bn/jobs/ntrca');
    expect(legacyRedirectTarget('/admission')).toBe('/bn/admissions');
    expect(legacyRedirectTarget('/guides')).toBe('/bn/guides');
    // Phase 3 (25 Nov 2026): /support is a real page now — the old
    // alias to /bn/contact is replaced by the /bn/support route.
    expect(legacyRedirectTarget('/support')).toBe('/bn/support');
  });

  it('keeps the pre-existing /jobs/primary 301 target', () => {
    expect(legacyRedirectTarget('/jobs/primary')).toBe('/bn/jobs/primary-teacher');
    expect(legacyRedirectTarget('/jobs/primary/')).toBe('/bn/jobs/primary-teacher');
  });

  it('never redirects what must not move', () => {
    expect(legacyRedirectTarget('/')).toBeNull();
    expect(legacyRedirectTarget('/bn/jobs/bcs')).toBeNull();
    expect(legacyRedirectTarget('/en/learn')).toBeNull();
    for (const p of ['/admin', '/admin/users', '/ceo', '/login', '/register', '/profile', '/dashboard', '/student', '/teacher', '/guardian', '/directory', '/subjects/x', '/quiz/x', '/exam', '/routine', '/progress', '/social']) {
      expect(legacyRedirectTarget(p)).toBeNull();
    }
    expect(legacyRedirectTarget('/definitely-not-a-route')).toBeNull();
  });
});

describe('langSwitchTarget', () => {
  it('moves public pages, leaves private routes alone', () => {
    expect(langSwitchTarget('/bn/jobs/bcs', 'en')).toBe('/en/jobs/bcs');
    expect(langSwitchTarget('/jobs/bcs', 'en')).toBe('/en/jobs/bcs');
    expect(langSwitchTarget('/login', 'en')).toBeNull();
    expect(langSwitchTarget('/admin/users', 'bn')).toBeNull();
  });
});

describe('getGuideSlugs', () => {
  it('returns the slug strings (m[1]), never the match arrays', () => {
    const src = `  slug: 'bcs-preparation-guide',\n  slug: 'bank-job-preparation',\n  title: 'not a slug',\n`;
    const slugs = getGuideSlugs(src);
    expect(slugs).toEqual(['bcs-preparation-guide', 'bank-job-preparation']);
    for (const slug of slugs) expect(typeof slug).toBe('string');
  });

  it('returns [] when there are no slugs', () => {
    expect(getGuideSlugs('no slugs here')).toEqual([]);
  });
});

describe('withoutLangParam (?lang= fix, 26 Nov 2026)', () => {
  it('strips a lone ?lang= entirely', () => {
    expect(withoutLangParam('?lang=en')).toBe('');
    expect(withoutLangParam('?lang=bn')).toBe('');
  });

  it('keeps other params and drops only lang', () => {
    expect(withoutLangParam('?lang=en&a=1')).toBe('?a=1');
    expect(withoutLangParam('?a=1&lang=bn&b=2')).toBe('?a=1&b=2');
  });

  it('leaves a search without lang untouched', () => {
    expect(withoutLangParam('?a=1')).toBe('?a=1');
    expect(withoutLangParam('')).toBe('');
  });
});
