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
      const subj = resolveRouteSeo('/learn/practice/class-3/english', lang);
      expect(subj, `subject (${lang})`).not.toBeNull();
      expect(subj!.title).toContain('28');
      const ch = resolveRouteSeo(
        '/learn/practice/class-3/english/acad-class-3-eng-unit-1',
        lang,
      );
      expect(ch, `chapter (${lang})`).not.toBeNull();
      expect(ch!.title).toContain('Unit 1');
      // Unknown slugs are not pages — never indexable.
      expect(resolveRouteSeo('/learn/practice/class-9/english', lang)).toBeNull();
      expect(resolveRouteSeo('/learn/practice/class-3/math', lang)).toBeNull();
      expect(
        resolveRouteSeo('/learn/practice/class-3/english/acad-class-3-eng-unit-99', lang),
      ).toBeNull();
    }
  });
});

describe('Academic practice first paint (renderToString)', () => {
  it('hub lists the two classes with verified practice', async () => {
    const html = await renderPractice('/bn/learn/practice');
    expect(html).toContain('অধ্যায়ভিত্তিক অনুশীলন');
    expect(html).toContain('৩য় শ্রেণি');
    expect(html).toContain('৫ম শ্রেণি');
    expect(html).toContain('/learn/practice/class-3/english');
    expect(html).toContain('/learn/practice/class-5/english');
    expect(html).toContain('যাচাইকৃত প্রশ্ন');
  });

  it('subject page lists its units with counts', async () => {
    const html = await renderPractice('/bn/learn/practice/class-3/english');
    expect(html).toContain('Unit 1: Greetings');
    expect(html).toContain('Unit 7: Save Our Planet');
    expect(html).toContain('/learn/practice/class-3/english/acad-class-3-eng-unit-1');
    expect(html).toContain('৪টি প্রশ্ন');
  });

  it('chapter page renders the questions with options and 0/N progress', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-3/english/acad-class-3-eng-unit-1',
    );
    expect(html).toContain('Unit 1: Greetings');
    expect(html).toContain('What do we say when we meet our teacher in the morning?');
    expect(html).toContain('Good morning');
    expect(html).toContain('অগ্রগতি');
    expect(html).toContain('০/৪টি উত্তর দিয়েছেন');
    expect(html).toContain('সঠিক: ০টি');
  });

  it('unknown chapter shows the honest empty state, never questions', async () => {
    const html = await renderPractice(
      '/bn/learn/practice/class-3/english/acad-class-3-eng-unit-99',
    );
    expect(html).toContain('যাচাই চলছে');
    expect(html).not.toContain('What do we say');
    expect(html).toContain('অধ্যায়ের তালিকা');
  });

  it('unknown subject shows the honest empty state', async () => {
    const html = await renderPractice('/bn/learn/practice/class-3/math');
    expect(html).toContain('যাচাই চলছে');
    expect(html).toContain('অনুশীলনের তালিকা');
  });
});
