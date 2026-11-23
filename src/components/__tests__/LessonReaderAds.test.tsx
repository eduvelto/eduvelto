// Eduvelto — rendered evidence for the LessonReader ad slots (Hybrid Ad
// Strategy, owner brief 23 Nov 2026 21:52).
//
// Why a unit test, not a preview probe: lesson content is login-gated,
// and NO live chapter carries isPreview=true, so a signed-out preview
// probe can never reach a LessonReader (ChapterPage walls; BookPage
// shows 0 chapters for guests). This test renders LessonReader to
// static HTML with a fake lesson and asserts the slots mount exactly
// where the policy says: in-content halfway through the questions
// (>= 4 questions only), in-content-2 after the progress card.
// renderToString runs in plain node (no jsdom, no effects): the
// bookmark/progress Firestore calls never run; auth + language are
// mocked. The window hostname is swapped per scenario with a fresh
// module import (AdSlot reads it at render time).
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Lesson, LessonQuestion } from '../../lib/content';

const PREVIEW_HOST = 'eduvelto--ads-placements-abc123.web.app';
const PRODUCTION_HOST = 'eduvelto.web.app';

vi.mock('../../lib/auth', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'bn',
    t: (x: { bn: string; en: string }) => x.bn,
  }),
}));
vi.mock('../../lib/bookmarks', () => ({
  addBookmark: async () => undefined,
  isBookmarked: async () => false,
  removeBookmark: async () => undefined,
}));
vi.mock('../../lib/progress', () => ({
  markLessonComplete: async () => undefined,
}));

function question(n: number): LessonQuestion {
  return {
    n,
    kind: 'mcq',
    label: `Q${n}`,
    question: `প্রশ্ন ${n} — নমুনা প্রশ্ন?`,
    topic: '',
    options: [
      { letter: 'A', text: 'উত্তর ক' },
      { letter: 'B', text: 'উত্তর খ' },
    ],
    correctLetter: 'A',
    correctText: 'উত্তর ক',
    answer: '',
    answerBn: '',
    explanation: '',
  };
}

function lesson(questionCount: number): Lesson {
  return {
    id: 'lesson-1',
    bookId: 'book-1',
    chapterId: 'chapter-1',
    title: 'নমুনা পাঠ',
    part: '',
    set: 1,
    body: 'এই পাঠের ভূমিকা।',
    questions: Array.from({ length: questionCount }, (_, i) => question(i + 1)),
    questionCount,
    reviewStatus: 'published',
    isPreview: false,
  };
}

async function renderLesson(hostname: string, questionCount: number): Promise<string> {
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname },
  };
  vi.resetModules();
  const mod = await import('../LessonReader');
  const LessonReader = mod.default;
  try {
    return renderToString(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(LessonReader, {
          lesson: lesson(questionCount),
          bookTitle: 'নমুনা বই',
          subject: 'বাংলা',
          backTo: '/library/book-1',
          backLabel: 'বই',
        }),
      ),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
  }
}

describe('LessonReader ad slots (preview host)', () => {
  it('6-question lesson: in-content mid-list + in-content-2 at the end', async () => {
    const html = await renderLesson(PREVIEW_HOST, 6);
    expect(html).toContain('data-ad-placement="in-content"');
    expect(html).toContain('data-ad-placement="in-content-2"');
    // All six questions still render (React splits the label and the
    // full stop with a <!-- --> comment), numbering continuing across
    // the split.
    for (let n = 1; n <= 6; n++) expect(html).toContain(`Q${n}<!-- -->`);
    // Second list continues at question 4 (mid = floor(6/2) = 3).
    expect(html).toContain('start="4"');
    expect(html).not.toContain('adsbygoogle');
  });

  it('2-question lesson: NO mid slot, only the end slot', async () => {
    const html = await renderLesson(PREVIEW_HOST, 2);
    expect(html).not.toContain('data-ad-placement="in-content"');
    expect(html).toContain('data-ad-placement="in-content-2"');
    expect(html).toContain('Q1<!-- -->');
    expect(html).toContain('Q2<!-- -->');
  });

  it('0-question lesson: no mid slot, end slot still present', async () => {
    const html = await renderLesson(PREVIEW_HOST, 0);
    expect(html).not.toContain('data-ad-placement="in-content"');
    expect(html).toContain('data-ad-placement="in-content-2"');
  });
});

describe('LessonReader ad slots (production host, master off)', () => {
  it('renders NO ad slots at all', async () => {
    const html = await renderLesson(PRODUCTION_HOST, 6);
    expect(html).not.toContain('data-ad-placement');
    expect(html).not.toContain('adsbygoogle');
    expect(html).toContain('Q1<!-- -->');
    expect(html).toContain('Q6<!-- -->');
  });
});
