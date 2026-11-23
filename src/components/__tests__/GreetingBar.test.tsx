// Eduvelto — server-rendered HTML evidence for the premium Islamic
// Greeting Bar (owner brief 23 Nov 2026 ~22:23).
//
// renderToString runs in plain node (no jsdom): it proves what markup
// the bar produces on first paint — the Bismillah (Arabic, rtl, static),
// the English greeting, the first rotating message, and the exact
// five-message rotation order. Effects do not run under renderToString,
// so the rotation timer never starts here; the live rotation is verified
// by the Playwright probe on the preview host instead.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import GreetingBar, {
  BISMILLAH,
  GREETING_MESSAGES,
  GREETING_ROTATION_MS,
  getNextGreetingIndex,
} from '../GreetingBar';

function renderBar(): string {
  return renderToString(React.createElement(GreetingBar));
}

describe('GreetingBar rendered HTML', () => {
  it('renders the Bismillah in Arabic, rtl, on a static (unanimated) element', () => {
    const html = renderBar();
    expect(html).toContain(BISMILLAH);
    // The Bismillah span carries lang="ar" + dir="rtl" and its own
    // static class — it must NOT carry any animation/message class.
    expect(html).toContain('class="ev-greeting-bismillah"');
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    const bismillahTag = html.slice(html.indexOf('ev-greeting-bismillah') - 40, html.indexOf('ev-greeting-bismillah') + 60);
    expect(bismillahTag).not.toContain('ev-greeting-message');
    expect(bismillahTag).not.toContain('ev-greeting-sweep');
    expect(bismillahTag).not.toContain('ev-greeting-glow');
  });

  it('renders Assalamu Alaikum beside the Bismillah and the first welcome message', () => {
    const html = renderBar();
    expect(html).toContain('Assalamu Alaikum');
    expect(html).toContain('Welcome to Eduvelto • Learn, Create &amp; Grow');
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-live="polite"');
  });

  it('renders the crescent + star mark and the decorative sweep/sparkles as aria-hidden', () => {
    const html = renderBar();
    expect(html).toContain('ev-greeting-mark');
    expect(html).toContain('ev-greeting-sweep');
    expect(html).toContain('ev-greeting-spark-1');
    expect(html).toContain('aria-hidden="true"');
  });

  it('rotation order is exactly the owner-specified five messages', () => {
    expect(GREETING_MESSAGES).toEqual([
      'Welcome to Eduvelto • Learn, Create & Grow',
      'Learn Something New Today',
      'Explore. Learn. Grow.',
      'Your World of Possibilities',
      'Knowledge Without Boundaries',
    ]);
    expect(GREETING_ROTATION_MS).toBe(7500);
    expect(getNextGreetingIndex(0)).toBe(1);
    expect(getNextGreetingIndex(4)).toBe(0);
  });
});
