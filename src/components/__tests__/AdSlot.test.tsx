// Eduvelto — server-rendered HTML evidence for AdSlot (owner brief
// 22 Nov 2026 10:43 + exam rule 22 Nov 2026 10:45).
//
// renderToString runs in plain node (no jsdom): it proves what markup
// each slot produces — the exam small banner's 50px cap, the labelled
// preview placeholder, and that production renders NOTHING while the
// master switch is off. The window hostname is swapped per scenario
// with a fresh module import (the component reads it at render time).
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import type { AdPlacement } from '../../lib/ads';

const PREVIEW_HOST = 'eduvelto--ads-placements-abc123.web.app';
const PRODUCTION_HOST = 'eduvelto.web.app';

async function renderSlot(
  hostname: string,
  placement: AdPlacement,
): Promise<string> {
  (globalThis as unknown as { window: unknown }).window = {
    location: { hostname },
  };
  vi.resetModules();
  const mod = await import('../AdSlot');
  const AdSlot = mod.default;
  try {
    return renderToString(React.createElement(AdSlot, { placement }));
  } finally {
    delete (globalThis as unknown as { window?: unknown }).window;
  }
}

describe('AdSlot rendered HTML', () => {
  it('exam small banner: labelled placeholder, capped at 50px, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'bottom-banner-small');
    expect(html).toContain('data-ad-placement="bottom-banner-small"');
    expect(html).toContain('বিজ্ঞাপনের স্থান');
    expect(html).toContain('৫০px');
    expect(html).toContain('max-height:50px');
    expect(html).not.toContain('adsbygoogle');
  });

  it('full banner: labelled placeholder, NOT capped at 50px, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'bottom-banner');
    expect(html).toContain('data-ad-placement="bottom-banner"');
    expect(html).toContain('বিজ্ঞাপনের স্থান');
    expect(html).not.toContain('max-height:50px');
    expect(html).not.toContain('adsbygoogle');
  });

  it('top banner: labelled placeholder with the 728×90 size, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'top-banner');
    expect(html).toContain('data-ad-placement="top-banner"');
    expect(html).toContain('৭২৮×৯০');
    expect(html).not.toContain('adsbygoogle');
  });

  it('sidebar: placeholder inside the desktop-only wrapper, on a preview host', async () => {
    const html = await renderSlot(PREVIEW_HOST, 'sidebar');
    expect(html).toContain('ev-ad-slot-sidebar');
    expect(html).toContain('৩০০×২৫০');
    expect(html).not.toContain('adsbygoogle');
  });

  it('renders NOTHING on the production host while the master switch is off', async () => {
    const html = await renderSlot(PRODUCTION_HOST, 'bottom-banner');
    expect(html).toBe('');
    const examHtml = await renderSlot(PRODUCTION_HOST, 'bottom-banner-small');
    expect(examHtml).toBe('');
    const topHtml = await renderSlot(PRODUCTION_HOST, 'top-banner');
    expect(topHtml).toBe('');
  });
});
