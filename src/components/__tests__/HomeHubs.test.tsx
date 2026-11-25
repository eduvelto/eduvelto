// Eduvelto — homepage hub-cards tests (owner 25 Nov 2026 18:39: the
// question-maker belongs IN the hub-cards row — "ai jaigar modde dite
// bolci j seta" — with the cards made smaller so all six fit:
// "agola cuto kore sekane modde kane ata bosiye daw").
//
// HomePage pulls in router + Firestore imports, so — exactly like
// AnnouncementTicker.test.tsx and HomeTabs.test.tsx — this asserts on
// the component + CSS source instead of rendering the whole page.
// The rendered Playwright probe is the proof the card actually
// renders and links. Asserts: six hub cards in order with the
// question-maker 2nd, its href/copy, the compact sizing (6-column
// desktop grid, min-width: 0 so the row cannot overflow), the rose
// tint, the 6th tab still intact, and no competitor name anywhere.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGE_SRC = readFileSync(resolve(__dirname, '../../pages/HomePage.tsx'), 'utf8');
const CSS_SRC = readFileSync(resolve(__dirname, '../home-redesign.css'), 'utf8');

function hubsBlock(): string {
  const m = PAGE_SRC.match(/const HUBS = \[([\s\S]*?)\n\];/);
  expect(m, 'HUBS array not found in HomePage.tsx').not.toBeNull();
  return m![1];
}

describe('homepage hub cards', () => {
  it('has six hub cards, question-maker 2nd (right after education)', () => {
    const ids = [...hubsBlock().matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
    expect(ids).toEqual(['education', 'question-maker', 'jobs', 'opportunity', 'ai', 'life']);
  });

  it('question-maker card links to /question-maker with the real copy', () => {
    const hubs = hubsBlock();
    const entry = hubs.match(/id: 'question-maker',([\s\S]*?)\n  \},/);
    expect(entry, 'question-maker hub entry not found').not.toBeNull();
    const text = entry![1];
    expect(text).toContain("to: '/question-maker'");
    expect(text).toContain("tint: 'ev-rd-hub-rose'");
    expect(text).toContain('icon: <DocIcon />');
    expect(text).toContain("titleBn: 'প্রশ্নপত্র তৈরি'");
    expect(text).toContain("titleEn: 'Question Maker'");
    expect(text).toContain('ফ্রি ৩টা/মাস');
    expect(text).toContain('৭০% ছাড়ে');
    expect(text).toContain('3 free/month');
    expect(text).toContain('70% off');
    expect(PAGE_SRC).toContain('function DocIcon(');
  });

  it('every hub has a destination, titles and descriptions in both languages', () => {
    const hubs = hubsBlock();
    for (const field of ["to: '", "titleBn: '", "titleEn: '", "descBn: '", "descEn: '"]) {
      expect(hubs.match(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))!.length).toBe(6);
    }
    expect(hubs).not.toContain("to: ''");
  });

  it('no competitor name anywhere in the hub cards', () => {
    const hubs = hubsBlock();
    for (const banned of ['Eproshnobank', 'Proshnobanai', 'proshnobanai']) {
      expect(hubs).not.toContain(banned);
    }
    expect(PAGE_SRC).not.toMatch(/Eproshnobank|Proshnobanai/);
  });

  it('the 6th tab (question-maker) is still there — the card is an addition, not a replacement', () => {
    expect(PAGE_SRC).toContain("import HomeTabs, { HOME_TABS, type HomeTabId } from '../components/HomeTabs';");
    expect(PAGE_SRC).toContain("'question-maker': <HomeQuestionMakerPanel />");
  });

  it('desktop grid fits six cards in one row', () => {
    const desktop = CSS_SRC.match(/@media \(min-width: 769px\) \{([\s\S]*?)\n\}/g);
    expect(desktop, 'desktop media block not found').not.toBeNull();
    const hubsDesktop = desktop!.find((b) => b.includes('.ev-rd-hubs'));
    expect(hubsDesktop).toContain('grid-template-columns: repeat(6, 1fr)');
    expect(hubsDesktop).not.toContain('repeat(5, 1fr)');
  });

  it('cards are compact and can shrink — the row cannot overflow', () => {
    const hub = CSS_SRC.match(/\.ev-rd-hub \{([^}]*)\}/);
    expect(hub, '.ev-rd-hub rule not found').not.toBeNull();
    expect(hub![1]).toContain('min-width: 0');
    expect(hub![1]).toContain('padding: 12px');
    expect(CSS_SRC).toContain('.ev-rd-hub-icon svg { width: 26px; height: 26px; }');
    expect(CSS_SRC).toMatch(/\.ev-rd-hub h2, \.ev-rd-hub h3 \{[^}]*font-size: 15px/);
    expect(CSS_SRC).toMatch(/\.ev-rd-hub p \{[^}]*font-size: 12\.5px/);
  });

  it('rose tint exists for the question-maker card, light and dark', () => {
    expect(CSS_SRC).toContain('.ev-rd-hub-rose { background: #fce4ec; border-color: #f8bbd0; }');
    expect(CSS_SRC).toContain('html[data-theme="dark"] .ev-rd-hub-rose { background: #3d1f2b; border-color: #5c2e40; }');
  });
});
