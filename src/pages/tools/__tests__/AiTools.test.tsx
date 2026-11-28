// Eduvelto — server-rendered HTML evidence for the 4 AI tools
// (28 Nov 2026, global batch item 2).
//
// renderToString runs in plain node (no jsdom): it proves each tool's
// form renders in bn AND en, carries no own h1, shows its honest
// limits, and — because VITE_AI_PROXY_URL is unset in tests — shows
// the graceful not-connected message instead of a dead button.
// AI behaviour itself is covered by the pure-logic tests in
// src/lib/__tests__/tools/aiTools.test.ts.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

async function renderTool(
  toolPath: string,
  exportName: string,
  stored?: string | null,
): Promise<string> {
  const store: Record<string, string> = {};
  if (stored) store['eduvelto-language'] = stored;
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname: 'eduvelto.web.app', pathname: '/', search: '', href: 'https://eduvelto.web.app/' },
    localStorage: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
    },
    history: { replaceState: () => {} },
  };
  (globalThis as unknown as { document: unknown }).document = {
    documentElement: { lang: '' },
  };
  vi.resetModules();
  const [toolMod, ctxMod] = await Promise.all([
    import(toolPath),
    import('../../../i18n/LanguageContext'),
  ]);
  const Tool = (toolMod as Record<string, React.ComponentType>)[exportName];
  const { LanguageProvider } = ctxMod as unknown as {
    LanguageProvider: React.ComponentType<{ children?: React.ReactNode }>;
  };
  try {
    return renderToString(
      React.createElement(LanguageProvider, null, React.createElement(Tool)),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('AiPdfSummarizerTool rendered HTML', () => {
  it('renders the file input + limits in Bangla (summary/Q&A controls appear after a PDF is read)', async () => {
    const html = await renderTool('../AiPdfSummarizerTool', 'AiPdfSummarizerTool');
    expect(html).toContain('id="ai-pdf-file"');
    expect(html).toContain('পিডিএফ ফাইল');
    expect(html).toContain('স্ক্যান করা বা ছবির পিডিএফ পড়া যায় না');
    expect(html).toContain('সারাংশে ভুল থাকতে পারে');
    // Owner rule 3a: the 10/day limit is stated in the UI.
    expect(html).toContain('দিনে ১০টি ফ্রি AI প্রশ্ন');
    expect(html).toContain('আজ আরও ১০টি বাকি');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English and shows the not-connected message', async () => {
    const html = await renderTool('../AiPdfSummarizerTool', 'AiPdfSummarizerTool', 'en');
    expect(html).toContain('PDF file');
    expect(html).toContain('Live AI is not connected');
    expect(html).toContain('10 free AI questions per day');
    expect(html).toContain('10 left today');
  });
});

describe('AiGrammarCheckerTool rendered HTML', () => {
  it('renders both modes + the language selector in Bangla', async () => {
    const html = await renderTool('../AiGrammarCheckerTool', 'AiGrammarCheckerTool');
    expect(html).toContain('id="ai-grammar-input"');
    expect(html).toContain('id="ai-grammar-language"');
    expect(html).toContain('সংশোধন করুন');
    expect(html).toContain('পুনর্লেখন করুন');
    expect(html).toContain('ভাষা');
    expect(html).toContain('দিনে ১০টি ফ্রি AI প্রশ্ন');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('../AiGrammarCheckerTool', 'AiGrammarCheckerTool', 'en');
    expect(html).toContain('Correct');
    expect(html).toContain('Paraphrase');
    expect(html).toContain('Language');
    expect(html).toContain('Live AI is not connected');
    expect(html).toContain('10 free AI questions per day');
  });
});

describe('AiMathSolverTool rendered HTML', () => {
  it('always shows the permanent verify warning in Bangla', async () => {
    const html = await renderTool('../AiMathSolverTool', 'AiMathSolverTool');
    expect(html).toContain('id="ai-math-problem"');
    expect(html).toContain('ধাপে ধাপে সমাধান করুন');
    expect(html).toContain('AI উত্তর ভুল হতে পারে — যাচাই করে নিন');
    // Text only — no image upload in this batch.
    expect(html).toContain('ছবি আপলোড করা যায় না');
    expect(html).toContain('দিনে ১০টি ফ্রি AI প্রশ্ন');
    expect(html).not.toContain('<h1');
  });

  it('shows the same warning in English', async () => {
    const html = await renderTool('../AiMathSolverTool', 'AiMathSolverTool', 'en');
    expect(html).toContain('AI answers can be wrong — please verify.');
    expect(html).toContain('Solve step by step');
    expect(html).toContain('10 free AI questions per day');
  });
});

describe('AiResumeTailorTool rendered HTML', () => {
  it('renders both inputs in Bangla and says it differs from the CV builder', async () => {
    const html = await renderTool('../AiResumeTailorTool', 'AiResumeTailorTool');
    expect(html).toContain('id="ai-resume-jd"');
    expect(html).toContain('id="ai-resume-details"');
    expect(html).toContain('চাকরির বিজ্ঞাপন');
    expect(html).toContain('আপনার তথ্য ও অভিজ্ঞতা');
    expect(html).toContain('সিভি বিল্ডার থেকে আলাদা');
    expect(html).toContain('দিনে ১০টি ফ্রি AI প্রশ্ন');
    expect(html).not.toContain('<h1');
  });

  it('renders the same form in English', async () => {
    const html = await renderTool('../AiResumeTailorTool', 'AiResumeTailorTool', 'en');
    expect(html).toContain('Job description');
    expect(html).toContain('Your details');
    expect(html).toContain('different from the CV builder');
    expect(html).toContain('10 free AI questions per day');
  });
});
