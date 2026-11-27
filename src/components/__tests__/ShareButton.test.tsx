// Eduvelto — ShareButton tests (28 Nov 2026).
//
// Renders with renderToString in plain node (same pattern as
// toolsDetailAds.test.tsx): the button label follows the mocked
// language, and the shared URL is exposed as data-share-url so the
// wiring (canonical tool URL vs current page URL) is testable
// without a click.
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import ShareButton from '../ShareButton';

const mockLangState = vi.hoisted(() => ({ lang: 'bn' as 'bn' | 'en' }));

vi.mock('../../i18n/LanguageContext', () => ({
  useLanguage: () => ({
    lang: mockLangState.lang,
    tabLang: mockLangState.lang,
    t: (entry: { bn: string; en: string }) => entry[mockLangState.lang],
    setLanguage: () => {},
  }),
}));

function fakeWindow(href: string): void {
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname: 'eduvelto.com', href },
  };
  (globalThis as unknown as { document: unknown }).document = {
    title: 'Eduvelto',
  };
}

describe('ShareButton', () => {
  it('renders the Bangla label and the explicit canonical URL', () => {
    mockLangState.lang = 'bn';
    fakeWindow('https://eduvelto.com/bn/tools/bmi-calculator');
    const html = renderToString(
      <ShareButton
        url="https://eduvelto.com/bn/tools/bmi-calculator"
        title="বিএমআই ক্যালকুলেটর"
      />,
    );
    expect(html).toContain('শেয়ার করুন');
    expect(html).toContain('data-share-url="https://eduvelto.com/bn/tools/bmi-calculator"');
  });

  it('renders the English label', () => {
    mockLangState.lang = 'en';
    fakeWindow('https://eduvelto.com/en/tools/bmi-calculator');
    const html = renderToString(
      <ShareButton
        url="https://eduvelto.com/en/tools/bmi-calculator"
        title="BMI Calculator"
      />,
    );
    expect(html).toContain('Share');
    expect(html).toContain('data-share-url="https://eduvelto.com/en/tools/bmi-calculator"');
  });

  it('defaults to the current page URL when no url is given', () => {
    mockLangState.lang = 'bn';
    fakeWindow('https://eduvelto.com/bn/tools/typing-speed-test');
    const html = renderToString(<ShareButton />);
    expect(html).toContain('data-share-url="https://eduvelto.com/bn/tools/typing-speed-test"');
  });
});
