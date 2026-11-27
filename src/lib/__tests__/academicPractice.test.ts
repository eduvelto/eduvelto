// Eduvelto — Academic chapter practice tests (Education Hub, 26 Nov 2026).
//
// Source-level route wiring + renderToString first-paint checks
// (following the legalPages.test.ts pattern: renderToString in plain
// node, useAuth mocked, window faked per language, modules re-imported
// per scenario so the LanguageProvider reads the fresh fake window).
// Effects do not run under renderToString, so this proves the FIRST
// paint — the copy a crawler and a first visitor see. Interaction
// (click an option → feedback + progress) is covered by the Playwright
// rendered check in the deployment evidence.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveRouteSeo } from '../seo';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');

function setupWindow(pathname: string) {
  (globalThis as unknown as { window: unknown }).window = {
    location: { pathname, search: '', href: `https://eduvelto.com${pathname}` },
    localStorage: { getItem: () => null, setItem: () => {} },
    history: { replaceState: () => {} },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
  delete (globalThis as unknown as { document?: unknown }).document;
});

async function renderPractice(pathname: string): Promise<string> {
  setupWindow(pathname);
  vi.resetModules();
  const { LanguageProvider } = await import('../../i18n/LanguageContext');
  const mod = await import('../../pages/AcademicPracticePage');
  const Comp = mod.default as React.ComponentType;
  return renderToString(
    React.createElement(
      HelmetProvider,
      null,
      React.createElement(
        MemoryRouter,
        { initialEntries: [pathname] },
        React.createElement(
          LanguageProvider,
          null,
          React.createElement(
            Routes,
            null,
            React.createElement(Route, {
              path: '/:lang/learn/practice',
              element: React.createElement(Comp),
            }),
            React.createElement(Route, {
              path: '/:lang/learn/practice/:classId/:subjectId',
              element: React.createElement(Comp),
            }),
            React.createElement(Route, {
              path: '/:lang/learn/practice/:classId/:subjectId/:chapterId',
              element: React.createElement(Comp),
            }),
          ),
        ),
      ),
    ),
  );
}

describe('Academic practice routes (App.tsx + ClassIndexPage)', () => {
  it('mounts the practice page under /learn/practice (hub, subject, chapter)', () => {
    const app = read('../../App.tsx');
    expect(app).toContain(
      '<Route path="learn/practice" element={<AcademicPracticePage />} />',
    );
    expect(app).toContain(
      '<Route path="learn/practice/:classId/:subjectId" element={<AcademicPracticePage />} />',
    );
    expect(app).toContain('learn/practice/:classId/:subjectId/:chapterId');
    expect(app).toContain("lazy(() => import('./pages/AcademicPracticePage'))");
  });

  it('the Education Hub (/class) links to the practice hub', () => {
    const src = read('../../pages/ClassIndexPage.tsx');
    expect(src).toContain('/learn/practice');
    expect(src).toContain('অধ্যায়ভিত্তিক অনুশীলন');
    expect(src).toContain('publicAcademicClassSubjects');
  });
});

describe('Academic practice SEO (resolveRouteSeo)', () => {
  it('hub + subject + chapter resolve with titles, unknown slugs resolve to null', () => {
    for (const lang of ['bn', 'en'] as const) {
      const hub = resolveRouteSeo('/learn/practice', lang);
      expect(hub, `hub (${lang})`).not.toBeNull();
      expect(hub!.title.length).toBeGreaterThan(10);
      expect(hub!.canonical).toBe(`https://eduvelto.com/${lang}/learn/practice`);
      // Classes 3–5 were removed 27 Nov 2026 — the SEO examples
      // now use Class 6 (28 English questions, 28 Math questions).
      const subj = resolveRouteSeo('/learn/practice/class-6/english', lang);
      expect(subj, `subject (${lang})`).not.toBeNull();
      expect(subj!.title).toContain('28');
      const ch = resolveRouteSeo(
        '/learn/practice/class-6/english/acad-class-6-eng-lesson-1',
        lang,
      );
      expect(ch, `chapter (${lang})`).not.toBeNull();
      expect(ch!.title).toContain('Lesson 1');
      // Non-English subjects resolve too now (26 Nov 2026: twelve subjects).
      const mathSubj = resolveRouteSeo('/learn/practice/class-6/math', lang);
      expect(mathSubj, `math subject (${lang})`).not.toBeNull();
      expect(mathSubj!.title).toContain('28');
      const banCh = resolveRouteSeo(
        '/learn/practice/class-6/bangla/acad-class-6-ban-lesson-1',
        lang,
      );
      expect(banCh, `bangla chapter (${lang})`).not.toBeNull();
      // Class 6 is live now (26 Nov 2026) — its subjects resolve,
      // including the new depth subjects.
      const c6Math = resolveRouteSeo('/learn/practice/class-6/math', lang);
      expect(c6Math, `class-6 math (${lang})`).not.toBeNull();
      expect(c6Math!.title).toContain('28');
      const c6Depth = resolveRouteSeo(
        '/learn/practice/class-6/math-depth/acad-class-6-mat-depth-chapter-1',
        lang,
      );
      expect(c6Depth, `class-6 math-depth chapter (${lang})`).not.toBeNull();
      expect(c6Depth!.title).toContain('স্বাভাবিক সংখ্যা');
      // Class 7 is live now (26 Nov 2026) — its subjects resolve too.
      const c7Math = resolveRouteSeo('/learn/practice/class-7/math', lang);
      expect(c7Math, `class-7 math (${lang})`).not.toBeNull();
      expect(c7Math!.title).toContain('27');
      // Class 8 is live now (26 Nov 2026) — its subjects resolve too.
      const c8Math = resolveRouteSeo('/learn/practice/class-8/math', lang);
      expect(c8Math, `class-8 math (${lang})`).not.toBeNull();
      expect(c8Math!.title).toContain('22');
      // Class 9 is live now (26 Nov 2026) — its subjects resolve too,
      // and Class 10 shares the Class 9 pool, so it resolves as well.
      const c9Math = resolveRouteSeo('/learn/practice/class-9/math', lang);
      expect(c9Math, `class-9 math (${lang})`).not.toBeNull();
      expect(c9Math!.title).toContain('22');
      const c9Ban1st = resolveRouteSeo('/learn/practice/class-9/bangla-1st', lang);
      expect(c9Ban1st, `class-9 bangla-1st (${lang})`).not.toBeNull();
      expect(c9Ban1st!.title).toContain('21');
      const c10Math = resolveRouteSeo('/learn/practice/class-10/math', lang);
      expect(c10Math, `class-10 math (${lang})`).not.toBeNull();
      expect(c10Math!.title).toContain('22');
      // Unknown slugs are not pages — never indexable. Class 9 has no
      // single 'english' subject (it is English 1st/2nd Paper).
      expect(resolveRouteSeo('/learn/practice/class-9/english', lang)).toBeNull();
      expect(resolveRouteSeo('/learn/practice/class-10/english', lang)).toBeNull();
      expect(resolveRouteSeo('/learn/practice/class-11/math', lang)).toBeNull();
      // Removed classes resolve to nothing — never indexable.
      expect(resolveRouteSeo('/learn/practice/class-3/english', lang)).toBeNull();
      expect(resolveRouteSeo('/learn/practice/class-5/math', lang)).toBeNull();
      expect(
        resolveRouteSeo('/learn/practice/class-6/english/acad-class-6-eng-lesson-99', lang),
      ).toBeNull();
    }
  });
});

describe('Academic practice first paint (renderToString)', () => {
  it('hub lists the seven classes with verified practice', async () => {
    const html = await renderPractice('/bn/learn/practice');
    expect(html).toContain('অধ্যায়ভিত্তিক অনুশীলন');
    expect(html).not.toContain('৩য় শ্রেণি');
    expect(html).not.toContain('৪র্থ শ্রেণি');
    expect(html).not.toContain('৫ম শ্রেণি');
    expect(html).toContain('৬ষ্ঠ শ্রেণি');
    expect(html).toContain('৭ম শ্রেণি');
    expect(html).toContain('৮ম শ্রেণি');
    expect(html).toContain('৯ম শ্রেণি');
    expect(html).toContain('১০ম শ্রেণি');
    expect(html).toContain('একাদশ শ্রেণি');
    expect(html).toContain('দ্বাদশ শ্রেণি');
    expect(html).toContain('/learn/practice/class-6/english');
    expect(html).toContain('/learn/practice/class-7/math');
    expect(html).toContain('/learn/practice/class-6/bangla');
    expect(html).toContain('/learn/practice/class-8/english');
    expect(html).toContain('/learn/practice/class-6/math-depth');
    expect(html).toContain('/learn/practice/class-7/math-depth');
    expect(html).toContain('/learn/practice/class-8/math-depth');
    expect(html).toContain('/learn/practice/class-9/math');
    expect(html).toContain('/learn/practice/class-9/bangla-1st');
    expect(html).toContain('/learn/practice/class-10/math');
    expect(html).toContain('/learn/practice/class-11/physics');
    expect(html).toContain('/learn/practice/class-11/islamic-history');
    expect(html).toContain('/learn/practice/class-12/physics');
    expect(html).toContain('যাচাইকৃত প্রশ্ন');
  });

  it('subject page lists its units with counts', async () => {
    const html = await renderPractice('/bn/learn/practice/class-6/english');
    expect(html).toContain('Lesson 1: Going to a New School');
    expect(html).toContain('Lesson 7: Holding Hands');
    expect(html).toContain('/learn/practice/class-6/english/acad-class-6-eng-lesson-1');
    expect(html).toContain('১টি প্রশ্ন');
  });

  it('chapter page renders the questions with options and 0/N progress', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-6/english/acad-class-6-eng-lesson-1',
    );
    expect(html).toContain('Lesson 1: Going to a New School');
    expect(html).toContain('What should we do at a new school?');
    expect(html).toContain('Introduce ourselves to new friends and teachers');
    expect(html).toContain('অগ্রগতি');
    expect(html).toContain('০/১টি উত্তর দিয়েছেন');
    expect(html).toContain('সঠিক: ০টি');
  });

  it('unknown chapter shows the honest empty state, never questions', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-6/english/acad-class-6-eng-lesson-99',
    );
    expect(html).toContain('যাচাই চলছে');
    expect(html).not.toContain('What should we do at a new school?');
    expect(html).toContain('অধ্যায়ের তালিকা');
  });

  it('a non-English subject page lists its chapters with counts', async () => {
    const html = await renderPractice('/bn/learn/practice/class-6/math');
    expect(html).toContain('১. স্বাভাবিক সংখ্যা ও ভগ্নাংশ');
    expect(html).toContain('/learn/practice/class-6/math/acad-class-6-mat-chapter-1');
    expect(html).toContain('৪টি প্রশ্ন');
  });

  it('a non-English chapter page renders the questions with options and 0/N progress', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-6/math/acad-class-6-mat-chapter-1',
    );
    expect(html).toContain('১. স্বাভাবিক সংখ্যা ও ভগ্নাংশ');
    expect(html).toContain('অগ্রগতি');
    expect(html).toContain('০/৪টি উত্তর দিয়েছেন');
    expect(html).toContain('সঠিক: ০টি');
  });

  it('unknown subject shows the honest empty state', async () => {
    const html = await renderPractice('/bn/learn/practice/class-11/math');
    expect(html).toContain('যাচাই চলছে');
    expect(html).toContain('অনুশীলনের তালিকা');
  });

  it('a Class 9 subject page lists its chapters with counts', async () => {
    const html = await renderPractice('/bn/learn/practice/class-9/math');
    expect(html).toContain('অধ্যায় ১: বাস্তব সংখ্যা');
    expect(html).toContain('/learn/practice/class-9/math/acad-class-9-mat-chapter-1');
    expect(html).toContain('২টি প্রশ্ন');
  });

  it('a Class 9 chapter page renders the questions with options and 0/N progress', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-9/math/acad-class-9-mat-chapter-1',
    );
    expect(html).toContain('অধ্যায় ১: বাস্তব সংখ্যা');
    expect(html).toContain('√2 কোন ধরনের সংখ্যা?');
    expect(html).toContain('অগ্রগতি');
    expect(html).toContain('০/২টি উত্তর দিয়েছেন');
    expect(html).toContain('সঠিক: ০টি');
  });

  it('a Class 10 subject page lists the same chapters as Class 9', async () => {
    const html = await renderPractice('/bn/learn/practice/class-10/math');
    expect(html).toContain('অধ্যায় ১: বাস্তব সংখ্যা');
    expect(html).toContain('/learn/practice/class-10/math/acad-class-9-mat-chapter-1');
    expect(html).toContain('২টি প্রশ্ন');
  });

  it('a Class 11 subject page lists its chapters with counts', async () => {
    const html = await renderPractice('/bn/learn/practice/class-11/physics');
    expect(html).toContain('অধ্যায় ২: ভেক্টর (১ম পত্র)');
    expect(html).toContain('/learn/practice/class-11/physics/acad-class-11-phy-p1-chapter-2');
    expect(html).toContain('২টি প্রশ্ন');
    expect(html).toContain('অধ্যায় ১: তাপগতিবিদ্যা (২য় পত্র)');
    expect(html).toContain('/learn/practice/class-11/physics/acad-class-11-phy-p2-chapter-1');
  });

  it('a Class 11 chapter page renders the questions with options and 0/N progress', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-11/physics/acad-class-11-phy-p1-chapter-2',
    );
    expect(html).toContain('অধ্যায় ২: ভেক্টর (১ম পত্র)');
    expect(html).toContain('অগ্রগতি');
    expect(html).toContain('০/২টি উত্তর দিয়েছেন');
    expect(html).toContain('সঠিক: ০টি');
  });

  it('a Class 12 subject page lists the same chapters as Class 11', async () => {
    const html = await renderPractice('/bn/learn/practice/class-12/physics');
    expect(html).toContain('অধ্যায় ২: ভেক্টর (১ম পত্র)');
    expect(html).toContain('/learn/practice/class-12/physics/acad-class-11-phy-p1-chapter-2');
    expect(html).toContain('২টি প্রশ্ন');
  });

  it('a Class 8 subject page lists its chapters with counts', async () => {
    const html = await renderPractice('/bn/learn/practice/class-8/math');
    expect(html).toContain('১. প্যাটার্ন');
    expect(html).toContain('/learn/practice/class-8/math/acad-class-8-mat-chapter-1');
    expect(html).toContain('২টি প্রশ্ন');
  });

  it('a Class 8 chapter page renders the questions with options and 0/N progress', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-8/math/acad-class-8-mat-chapter-1',
    );
    expect(html).toContain('১. প্যাটার্ন');
    expect(html).toContain('১, ৩, ৫, ৭, ... ধারার পরের সংখ্যা কোনটি?');
    expect(html).toContain('অগ্রগতি');
    expect(html).toContain('০/২টি উত্তর দিয়েছেন');
    expect(html).toContain('সঠিক: ০টি');
  });

  it('a Class 7 subject page lists its chapters with counts', async () => {
    const html = await renderPractice('/bn/learn/practice/class-7/math');
    expect(html).toContain('১. মূলদ ও অমূলদ সংখ্যা');
    expect(html).toContain('/learn/practice/class-7/math/acad-class-7-mat-chapter-1');
    expect(html).toContain('৩টি প্রশ্ন');
  });

  it('a Class 6 subject page lists its chapters with counts', async () => {
    const html = await renderPractice('/bn/learn/practice/class-6/math');
    expect(html).toContain('১. স্বাভাবিক সংখ্যা ও ভগ্নাংশ');
    expect(html).toContain('/learn/practice/class-6/math/acad-class-6-mat-chapter-1');
    expect(html).toContain('৪টি প্রশ্ন');
  });

  it('a Class 6 depth chapter page renders the questions with options and 0/N progress', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-6/math-depth/acad-class-6-mat-depth-chapter-1',
    );
    expect(html).toContain('১. স্বাভাবিক সংখ্যা ও ভগ্নাংশ');
    expect(html).toContain('অগ্রগতি');
    expect(html).toContain('০/৫টি উত্তর দিয়েছেন');
    expect(html).toContain('সঠিক: ০টি');
  });
});
