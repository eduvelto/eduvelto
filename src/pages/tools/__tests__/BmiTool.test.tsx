// Eduvelto — server-rendered HTML evidence for BmiTool.
//
// renderToString runs in plain node (no jsdom): it proves the height
// unit selector (cm / feet / meter) and the per-unit height fields,
// labels and example button render in bn AND en, with cm as the
// default. There is no click simulation here — the repo has no
// jsdom/testing-library — so unit switching itself is covered by the
// pure-logic tests in src/lib/__tests__/tools/bmi.test.ts: the
// switch/loadExample handlers are built on cmToFeetInches,
// parseHeightInput and exampleHeightForUnit, all tested there,
// including the cross-unit BMI identity (175 cm ≡ 5 ft 9 in ≡ 1.75 m).
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import type { HeightUnit } from '../../../lib/tools/bmi';

vi.mock('../../../lib/auth', () => ({
  useAuth: () => ({ user: null, profile: null, saveProfile: vi.fn(() => Promise.resolve()) }),
}));

async function renderTool(
  stored?: string | null,
  initialHeightUnit?: HeightUnit,
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
    import('../BmiTool'),
    import('../../../i18n/LanguageContext'),
  ]);
  const { BmiTool } = toolMod;
  const { LanguageProvider } = ctxMod;
  try {
    return renderToString(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(BmiTool, { initialHeightUnit }),
      ),
    );
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { document?: unknown }).document;
  }
}

describe('BmiTool rendered HTML', () => {
  it('defaults to cm in Bangla: cm label, single input, cm example, no result yet', async () => {
    const html = await renderTool();
    expect(html).toContain('উচ্চতা (সেমি)');
    expect(html).toContain('id="bmi-height"');
    expect(html).toContain('placeholder="175"');
    expect(html).not.toContain('id="bmi-height-feet"');
    expect(html).not.toContain('id="bmi-height-inches"');
    // Unit selector: all three units, cm pressed.
    expect(html).toContain('সেমি');
    expect(html).toContain('ফুট');
    expect(html).toContain('মিটার');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('উদাহরণ বসান (৭০ কেজি, ১৭৫ সেমি)');
    expect(html).toContain('ওজন (কেজি)');
    expect(html).not.toContain('আপনার BMI');
    expect(html).not.toContain('<h1');
  });

  it('defaults to cm in English', async () => {
    const html = await renderTool('en');
    expect(html).toContain('Height (cm)');
    expect(html).toContain('id="bmi-height"');
    expect(html).toContain('placeholder="175"');
    expect(html).toContain('Load example (70 kg, 175 cm)');
    expect(html).toContain('>cm<');
    expect(html).toContain('>Feet<');
    expect(html).toContain('>Meter<');
    expect(html).not.toContain('উচ্চতা (সেমি)');
    expect(html).not.toContain('<h1');
  });

  it('feet mode in Bangla: ft/in fields with 5/9 placeholders and ft/in example', async () => {
    const html = await renderTool(undefined, 'feet');
    expect(html).toContain('উচ্চতা (ফুট)');
    expect(html).toContain('id="bmi-height-feet"');
    expect(html).toContain('id="bmi-height-inches"');
    expect(html).toContain('placeholder="5"');
    expect(html).toContain('placeholder="9"');
    expect(html).toContain('ফুট');
    expect(html).toContain('ইঞ্চি');
    expect(html).toContain('উদাহরণ বসান (৭০ কেজি, ৫ ফুট ৯ ইঞ্চি)');
    expect(html).not.toContain('id="bmi-height"');
    expect(html).not.toContain('<h1');
  });

  it('feet mode in English', async () => {
    const html = await renderTool('en', 'feet');
    expect(html).toContain('Height (feet)');
    expect(html).toContain('id="bmi-height-feet"');
    expect(html).toContain('id="bmi-height-inches"');
    expect(html).toContain('Load example (70 kg, 5 ft 9 in)');
    expect(html).toContain('>Feet<');
    expect(html).toContain('>Inches<');
    expect(html).not.toContain('উচ্চতা (ফুট)');
    expect(html).not.toContain('<h1');
  });

  it('meter mode in Bangla: single input with 1.75 placeholder and meter example', async () => {
    const html = await renderTool(undefined, 'meter');
    expect(html).toContain('উচ্চতা (মিটার)');
    expect(html).toContain('id="bmi-height"');
    expect(html).toContain('placeholder="1.75"');
    expect(html).toContain('উদাহরণ বসান (৭০ কেজি, ১.৭৫ মিটার)');
    expect(html).not.toContain('id="bmi-height-feet"');
    expect(html).not.toContain('<h1');
  });

  it('meter mode in English', async () => {
    const html = await renderTool('en', 'meter');
    expect(html).toContain('Height (meter)');
    expect(html).toContain('placeholder="1.75"');
    expect(html).toContain('Load example (70 kg, 1.75 m)');
    expect(html).not.toContain('উচ্চতা (মিটার)');
    expect(html).not.toContain('<h1');
  });
});
