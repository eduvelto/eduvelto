// QA landing fixes (Worker E report, 27 Nov 2026) — regression tests.
// Source-read style, matching the repo's other route/copy tests: the
// fixes are small and structural, so asserting the shipped source
// (routes, CSS rules, labels) is the honest check available here.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { QPG_PRICE_TIERS } from '../questionPaper';
import { buildRobotsTxt } from '../../../scripts/prerender.mjs';

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
const APP = read('../../App.tsx');
const CSS = read('../../index.css');
const LANDING_SRC = read('../../pages/QuestionMakerLandingPage.tsx');
const DASHBOARD_SRC = read('../../pages/ClassDashboardPage.tsx');
const OFFLINE_SRC = read('../../pages/OfflinePage.tsx');
const OFFLINE_HTML = read('../../../public/offline.html');

describe('D-03 — /bn/question-maker must not overflow at 390 px', () => {
  it('the watermark shrink-wraps its text instead of filling the mockup', () => {
    expect(CSS).toContain('.ev-qm-mockup-wm');
    expect(CSS).toContain('width: max-content');
    expect(CSS).toContain('translate(-50%, -50%) rotate(-28deg)');
    // The old full-cover geometry (an `inset` declaration + rotate)
    // measured 410 px wide.
    expect(CSS).not.toMatch(/\.ev-qm-mockup-wm\s*\{[^}]*inset:\s*0;/);
  });

  it('the long Pro-review chip may wrap on small screens', () => {
    expect(CSS).toContain('.ev-qm-chip-wrap');
    expect(CSS).toContain('white-space: normal');
    expect(LANDING_SRC).toContain('ev-qm-chip-wrap');
  });
});

describe('D-05 — lang-prefixed auth/admission URLs redirect', () => {
  it('the :lang children redirect login/register/role/teacher-register/admission', () => {
    for (const [path, to] of [
      ['login', '/login'],
      ['register', '/register'],
      ['register/role', '/register/role'],
      ['teacher/register', '/teacher/register'],
    ] as const) {
      expect(APP).toContain(`path="${path}" element={<PrefixedAuthRedirect to="${to}" />}`);
    }
    expect(APP).toContain('path="admission" element={<PrefixedAdmissionRedirect />}');
    expect(APP).toContain('`/${l}/admissions${location.search}`');
  });

  it('the redirect preserves the query string (?next= return-to)', () => {
    expect(APP).toContain('`${to}${location.search}`');
  });
});

describe('D-04 — /offline is a real route, not a 404', () => {
  it('App mounts /offline rendering the branded offline page', () => {
    expect(APP).toContain('path="/offline" element={<OfflinePage />}');
    expect(OFFLINE_SRC).toContain('আপনি অফলাইনে আছেন');
    // Same copy as the precached static page the worker serves.
    expect(OFFLINE_HTML).toContain('আপনি অফলাইনে আছেন');
    expect(OFFLINE_SRC).toContain('হোমে ফিরুন');
  });

  it('robots.txt disallows the utility /offline page', () => {
    expect(buildRobotsTxt()).toContain('Disallow: /offline');
  });
});

describe('D-06 — pricing sells no Class 3–5 products', () => {
  it('no price tier names Class 3, 4 or 5', () => {
    for (const tier of QPG_PRICE_TIERS) {
      expect(tier.nameBn).not.toMatch(/৩য়|৪র্থ|৫ম/);
      expect(tier.nameEn).not.toMatch(/Class [345]\b/);
      expect(tier.id).not.toMatch(/class-[345]/);
    }
    // The cheapest tier starts at Class 6–8.
    expect(QPG_PRICE_TIERS.map((t) => t.id)).toContain('class-6-8');
  });
});

describe('D-07 — question-maker sample is not labelled Honours', () => {
  it('the sample paper is labelled BCS English', () => {
    expect(LANDING_SRC).toContain('প্রশ্নপত্র — English (BCS)');
    expect(LANDING_SRC).not.toContain('English (অনার্স)');
  });
});

describe('D-08 — class dashboard Home tab is never text-blank', () => {
  it('a visible loading line + data-free quick tiles render while loading', () => {
    expect(DASHBOARD_SRC).toContain('শ্রেণির তথ্য লোড হচ্ছে');
    expect(DASHBOARD_SRC).toContain('const quickAccess = (');
    // The shared tiles render in the loading branch, not only after load.
    expect(DASHBOARD_SRC).toMatch(/books === null \|\| stats === undefined \?[\s\S]*?\{quickAccess\}/);
  });
});
