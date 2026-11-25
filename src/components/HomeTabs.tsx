// Eduvelto — homepage tabs (owner 25 Nov 2026 17:40: "home page a tab
// koro sudnor kore sajiye" — make tabs on the home page and decorate
// it beautifully).
//
// The tab bar organises the homepage's main content sections into six
// tabs (Education, Question Maker, Job Preparation, Admission
// Preparation, Opportunity Hub, AI & Services). The hero, ticker,
// search, hub cards, section cards and feature strip stay above the
// tabs; the Daily Quiz, stats, panels, founder message and footer
// banner stay below them, always visible.
//
// All six panels render in the DOM (inactive ones hidden) so the
// prerendered/SEO content is unchanged — tabs only change what is
// VISIBLE. Labels are bilingual via useLanguage. The tab bar scrolls
// horizontally on mobile (no wrapping, no cramped buttons). Arrow
// keys / Home / End move between tabs (WAI-ARIA tabs pattern).

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export type HomeTabId = 'education' | 'question-maker' | 'jobs' | 'admissions' | 'opportunities' | 'services';

export type HomeTabDef = {
  id: HomeTabId;
  icon: string;
  bn: string;
  en: string;
};

// The six tabs — only sections that really exist on the homepage.
// No invented tabs, no invented content: every panel reuses the
// homepage's own sections and links. The question-maker tab (owner
// 25 Nov 2026 18:26: "question banai j setar akta tab dite bolci j")
// sits right after Education — the generator is the core education
// tool — and links into the full generator at /question-maker.
export const HOME_TABS: HomeTabDef[] = [
  { id: 'education', icon: '📖', bn: 'শিক্ষা', en: 'Education' },
  { id: 'question-maker', icon: '📝', bn: 'প্রশ্নপত্র তৈরি', en: 'Question Maker' },
  { id: 'jobs', icon: '💼', bn: 'চাকরি প্রস্তুতি', en: 'Job Preparation' },
  { id: 'admissions', icon: '🎓', bn: 'ভর্তি প্রস্তুতি', en: 'Admission Preparation' },
  { id: 'opportunities', icon: '🌟', bn: 'সুযোগ কেন্দ্র', en: 'Opportunity Hub' },
  { id: 'services', icon: '🤖', bn: 'AI ও সেবা', en: 'AI & Services' },
];

/** Pure arrow-key navigation over the tab list (wrap-around). */
export function getNextTabId(tabs: HomeTabDef[], currentId: HomeTabId, direction: 1 | -1): HomeTabId {
  const idx = tabs.findIndex((tab) => tab.id === currentId);
  const at = idx === -1 ? 0 : idx;
  return tabs[(at + direction + tabs.length) % tabs.length].id;
}

export default function HomeTabs(props: {
  tabs: HomeTabDef[];
  activeId: HomeTabId;
  onActiveChange: (id: HomeTabId) => void;
  panels: Record<HomeTabId, ReactNode>;
}) {
  const { t } = useLanguage();
  const { tabs, activeId, onActiveChange, panels } = props;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTab(id: HomeTabId) {
    const idx = tabs.findIndex((tab) => tab.id === id);
    tabRefs.current[idx]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, currentId: HomeTabId) {
    let next: HomeTabId | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = getNextTabId(tabs, currentId, 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = getNextTabId(tabs, currentId, -1);
    else if (e.key === 'Home') next = tabs[0].id;
    else if (e.key === 'End') next = tabs[tabs.length - 1].id;
    if (next) {
      e.preventDefault();
      onActiveChange(next);
      focusTab(next);
    }
  }

  return (
    <section className="ev-home-tabs" aria-label={t({ bn: 'Eduvelto-র সব সেবা', en: "All of Eduvelto's services" })}>
      <div className="ev-rd-head">
        <h2>{t({ bn: '✨ সবকিছু এক জায়গায়', en: '✨ Everything in one place' })}</h2>
      </div>
      <p className="ev-rd-sub">
        {t({
          bn: 'শিক্ষা, প্রশ্নপত্র তৈরি, চাকরি প্রস্তুতি, ভর্তি, সুযোগ আর সেবা — ট্যাবে ট্যাবে ঘুরে দেখুন।',
          en: 'Education, question papers, job preparation, admission, opportunities and services — browse them tab by tab.',
        })}
      </p>
      <div className="ev-home-tabbar" role="tablist" aria-label={t({ bn: 'প্রধান বিভাগ', en: 'Main sections' })}>
        {tabs.map((tab, idx) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              id={`ev-home-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`ev-home-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              className="ev-home-tab"
              onClick={() => onActiveChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{t({ bn: tab.bn, en: tab.en })}</span>
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={`ev-home-panel-${tab.id}`}
            aria-labelledby={`ev-home-tab-${tab.id}`}
            hidden={!active}
            className="ev-home-tabpanel"
          >
            {panels[tab.id]}
          </div>
        );
      })}
    </section>
  );
}
