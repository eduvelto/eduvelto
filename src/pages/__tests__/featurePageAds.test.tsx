// Eduvelto — ads rollout B4: display ads on feature pages (27 Nov 2026).
//
// VERIFICATION-ONLY batch: every feature page already carries its slots
// under the Hybrid Ad Strategy (owner brief 23 Nov 2026 21:52) and no
// new slot placement was invented here. This test locks that state in:
//   - in-page slots where the policy allows them (home, library, book,
//     class dashboard, directory, lesson reader, tool pages via the
//     ToolsDetailPage wrapper — covered by toolsDetailAds.test.tsx);
//   - the bottom banner on every other eligible page via App.tsx's
//     getBannerPlacementForPath() (QPG, SheetBuilder, Smartboard and
//     all hubs mount NO direct slot — the banner is their only ad);
//   - NO banner at all on auth / admin / exam-in-progress / AI
//     conversation / profile pages (binding rules).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getBannerPlacementForPath, isInPageSlotAllowed } from '../../lib/adsConfig';

const PAGES_DIR = join(__dirname, '..');
const COMPONENTS_DIR = join(__dirname, '../../components');

function src(dir: string, file: string): string {
  const raw = readFileSync(join(dir, file), 'utf8');
  return raw
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*\/\*[\s\S]*?\*\//gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
}

function slotCount(text: string, placement: string): number {
  return (text.match(new RegExp(`<AdSlot placement="${placement}"`, 'g')) ?? []).length;
}

describe('ads rollout B4: feature pages carry their display slots', () => {
  it('HomePage has exactly one top-banner below the hero', () => {
    const text = src(PAGES_DIR, 'HomePage.tsx');
    expect(slotCount(text, 'top-banner')).toBe(1);
  });

  it('LibraryPage and BookPage have in-feed + in-feed-2', () => {
    for (const file of ['LibraryPage.tsx', 'BookPage.tsx']) {
      const text = src(PAGES_DIR, file);
      expect(slotCount(text, 'in-feed'), `${file}: in-feed`).toBe(1);
      expect(slotCount(text, 'in-feed-2'), `${file}: in-feed-2`).toBe(1);
    }
  });

  it('ClassDashboard has mobile + sidebar + in-content', () => {
    const page = src(PAGES_DIR, 'ClassDashboardPage.tsx');
    expect(slotCount(page, 'mobile')).toBe(1);
    expect(slotCount(page, 'sidebar')).toBe(1);
    const tabs = src(PAGES_DIR, 'ClassDashboardTabs.tsx');
    expect(slotCount(tabs, 'in-content')).toBe(1);
  });

  it('DirectoryPage has one in-content slot', () => {
    expect(slotCount(src(PAGES_DIR, 'DirectoryPage.tsx'), 'in-content')).toBe(1);
  });

  it('LessonReader has in-content mid-lesson + in-content-2 at the end', () => {
    const text = src(COMPONENTS_DIR, 'LessonReader.tsx');
    expect(slotCount(text, 'in-content')).toBe(1);
    expect(slotCount(text, 'in-content-2')).toBe(1);
  });

  it('QPG, SheetBuilder, Smartboard and all hubs mount NO direct slot (bottom banner only)', () => {
    for (const file of [
      'QuestionPaperGeneratorPage.tsx',
      'SheetBuilderPage.tsx',
      'SmartboardPage.tsx',
      'ToolsHubPage.tsx',
      'JobHubPage.tsx',
      'AdmissionsIndexPage.tsx',
      'OpportunityHubPage.tsx',
      'HealthPage.tsx',
      'LearnHubPage.tsx',
      'LifeHubPage.tsx',
      'GuidesHubPage.tsx',
    ]) {
      const text = src(PAGES_DIR, file);
      expect(text, `${file}: no direct AdSlot`).not.toContain('<AdSlot');
    }
  });

  it('in-page slots are allowed only on the policy page types', () => {
    expect(isInPageSlotAllowed('tool', 'in-content')).toBe(true);
    expect(isInPageSlotAllowed('tool', 'in-content-2')).toBe(true);
    expect(isInPageSlotAllowed('tool', 'top-banner')).toBe(false);
    expect(isInPageSlotAllowed('tool', 'sidebar')).toBe(false);
    expect(isInPageSlotAllowed('section-hub', 'in-content')).toBe(false);
    expect(isInPageSlotAllowed('section-hub', 'in-feed')).toBe(false);
    expect(isInPageSlotAllowed('unknown', 'in-content')).toBe(false);
    expect(isInPageSlotAllowed('home', 'top-banner')).toBe(true);
    expect(isInPageSlotAllowed('library', 'in-feed')).toBe(true);
    expect(isInPageSlotAllowed('lesson', 'in-content-2')).toBe(true);
  });
});

describe('ads rollout B4: bottom banner coverage', () => {
  it('eligible pages get the bottom banner, including QPG / Smartboard / hubs / results', () => {
    for (const path of [
      '/',
 '/tools', '/tools/pdf-merger', '/library', '/library/book-1',
      '/question-paper', '/smartboard', '/jobs', '/learn', '/life',
      '/directory', '/progress', '/routine',
      '/quiz/abc/result', '/jobs/result/1',
    ]) {
      expect(getBannerPlacementForPath(path), path).toBe('bottom-banner');
    }
  });

  it('no banner on auth / admin / exam-in-progress / AI / profile pages', () => {
    for (const path of [
      '/login', '/register', '/register/role', '/teacher/register',
      '/admin', '/admin/ads',
      '/quiz/abc', '/exam', '/jobs/mock/1', '/bn/jobs/mock/1',
      '/ai-teacher', '/ai-assistant', '/bn/ai-assistant',
      '/profile',
    ]) {
      expect(getBannerPlacementForPath(path), path).toBeNull();
    }
  });
});
