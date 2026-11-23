// Eduvelto — unit tests for the gated AdSense script loader
// (owner brief 23 Nov 2026 21:22: AdSense Auto ads script, staging only).
//
// The loader (AdSlot.loadAdsenseScript) is the ONLY path that puts the
// AdSense library on the page. index.html must NOT carry a static
// <script> tag: with Auto ads ON in the AdSense account, an ungated
// script would serve ads the moment Google approves the site —
// bypassing the master flag. These tests run in plain node with a fake
// document (no jsdom): they prove the loader injects exactly one
// script, with the owner's exact publisher ID, and injects nothing
// when there is no client ID, when a copy already exists, or when
// there is no document (SSR safety).

import { describe, expect, it, vi } from 'vitest';

const OWNER_CLIENT_ID = 'ca-pub-6571267788512484';
const EXPECTED_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6571267788512484';

interface FakeScript {
  async: boolean;
  src: string;
  crossOrigin: string;
}

interface FakeDocument {
  querySelector: (selector: string) => unknown;
  createElement: (tag: string) => FakeScript;
  head: { appendChild: (node: FakeScript) => void };
}

function makeFakeDocument(existingScript: boolean) {
  const appended: FakeScript[] = [];
  let created = 0;
  const doc: FakeDocument = {
    querySelector: () => (existingScript ? { tagName: 'SCRIPT' } : null),
    createElement: () => {
      created++;
      return { async: false, src: '', crossOrigin: '' };
    },
    head: {
      appendChild: (node: FakeScript) => {
        appended.push(node);
      },
    },
  };
  return { doc, appended, created: () => created };
}

async function loadLoader() {
  vi.resetModules();
  const mod = await import('../AdSlot');
  return mod.loadAdsenseScript as (clientId: string) => void;
}

describe('loadAdsenseScript', () => {
  it('injects exactly one script with the owner publisher ID, async + anonymous', async () => {
    const { doc, appended, created } = makeFakeDocument(false);
    (globalThis as unknown as { document: FakeDocument }).document = doc;
    try {
      const loadAdsenseScript = await loadLoader();
      loadAdsenseScript(OWNER_CLIENT_ID);
      expect(created()).toBe(1);
      expect(appended).toHaveLength(1);
      expect(appended[0].src).toBe(EXPECTED_SRC);
      expect(appended[0].async).toBe(true);
      expect(appended[0].crossOrigin).toBe('anonymous');
    } finally {
      delete (globalThis as unknown as { document?: FakeDocument }).document;
    }
  });

  it('does not inject a second copy when one already exists', async () => {
    const { doc, appended, created } = makeFakeDocument(true);
    (globalThis as unknown as { document: FakeDocument }).document = doc;
    try {
      const loadAdsenseScript = await loadLoader();
      loadAdsenseScript(OWNER_CLIENT_ID);
      expect(created()).toBe(0);
      expect(appended).toHaveLength(0);
    } finally {
      delete (globalThis as unknown as { document?: FakeDocument }).document;
    }
  });

  it('does not inject again on a second call in the same page lifetime', async () => {
    const { doc, appended, created } = makeFakeDocument(false);
    (globalThis as unknown as { document: FakeDocument }).document = doc;
    try {
      const loadAdsenseScript = await loadLoader();
      loadAdsenseScript(OWNER_CLIENT_ID);
      loadAdsenseScript(OWNER_CLIENT_ID);
      expect(created()).toBe(1);
      expect(appended).toHaveLength(1);
    } finally {
      delete (globalThis as unknown as { document?: FakeDocument }).document;
    }
  });

  it('injects nothing with an empty client ID (never a ?client= script)', async () => {
    const { doc, appended, created } = makeFakeDocument(false);
    (globalThis as unknown as { document: FakeDocument }).document = doc;
    try {
      const loadAdsenseScript = await loadLoader();
      loadAdsenseScript('');
      expect(created()).toBe(0);
      expect(appended).toHaveLength(0);
    } finally {
      delete (globalThis as unknown as { document?: FakeDocument }).document;
    }
  });

  it('does nothing (and does not throw) when there is no document', async () => {
    delete (globalThis as unknown as { document?: FakeDocument }).document;
    const loadAdsenseScript = await loadLoader();
    expect(() => loadAdsenseScript(OWNER_CLIENT_ID)).not.toThrow();
  });
});
