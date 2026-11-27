// Eduvelto — Tools hub (26 Nov 2026, 100-Tools Project, Phase 1;
// redesigned 27 Nov 2026, Batch 2 — eye-catching hero, search,
// colour-coded category headers, picture-tile tool cards).
//
// /:lang/tools — the hub for all 140 free tools, driven from the
// single source of truth in src/lib/toolsMeta.ts (TOOLS_META),
// grouped by category. Same card-grid pattern as LifeHubPage.
// The tool pages themselves are one slug-driven component
// (ToolsDetailPage); the 8 already-built tools render their
// existing page via the aliasPage dispatch there.
//
// BEHAVIOUR: same tool list (TOOLS_META), same links
// (/tools/:slug), same locale handling via t(). The search box is
// new in this redesign (the hub had none before) — it filters the
// same list client-side by title/description in the current
// language; empty categories hide while searching. No tool in
// toolsMeta.ts carries a coming-soon flag, so no card is marked
// coming soon. No emoji icons anywhere: every tool tile shows a
// function-matching picture (ToolIcon, src/components/ToolIcon.tsx)
// on a gradient 3D-style tile — never a letter.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { ToolIcon } from '../components/ToolIcon';
import { TOOLS_META, TOOL_CATEGORY_META } from '../lib/toolsMeta';

// Category order follows the order in toolsMeta.ts (10 categories
// x 10 tools + 5 video/music tools).
const CATEGORIES = TOOL_CATEGORY_META;

// Accent cycles teal → forest → amber (palette only, no new colours).
// Each entry: gradient underline + count-badge colours. Badge text
// uses theme-aware vars (--teal-text / --heading / --amber-dark-text)
// so it stays readable in the dark theme too.
const ACCENTS = [
  { bar: 'linear-gradient(90deg, var(--teal), var(--teal-deep))', badgeBg: 'var(--teal-soft)', badgeText: 'var(--teal-text)' },
  { bar: 'linear-gradient(90deg, var(--forest), var(--teal))', badgeBg: 'var(--teal-softer)', badgeText: 'var(--heading)' },
  { bar: 'linear-gradient(90deg, var(--amber), var(--teal))', badgeBg: 'var(--amber-soft)', badgeText: 'var(--amber-dark-text)' },
] as const;

function toBnDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

export default function ToolsHubPage() {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  // Client-side filter over the same TOOLS_META list, matching the
  // title + description in the current language.
  const sections = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        tools: TOOLS_META.filter(
          (tool) =>
            tool.category === category.key &&
            (q === '' ||
              (lang === 'bn' ? tool.titleBn : tool.titleEn).toLowerCase().includes(q) ||
              (lang === 'bn' ? tool.descriptionBn : tool.descriptionEn).toLowerCase().includes(q)),
        ),
      })).filter((section) => section.tools.length > 0),
    [q, lang],
  );
  const shownCount = sections.reduce((n, s) => n + s.tools.length, 0);

  return (
    <PageShell titleBn="ফ্রি অনলাইন টুলস" titleEn="Free Online Tools" wide hideTitle>
      <style>{`
        .tools-hub-search:focus { border-color: var(--teal) !important; box-shadow: 0 0 0 3px var(--teal-soft); outline: none; }
        .tools-hub-card { transition: box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease; }
        .tools-hub-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--line-strong); }
        .tools-hub-card:focus-visible { outline: 2px solid var(--teal); outline-offset: 2px; }
        .tools-hub-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* Hero band */}
      <section
        aria-labelledby="tools-hub-title"
        style={{
          background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
          borderRadius: 12,
          padding: '28px 24px',
          color: '#fff',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span
            style={{
              background: 'var(--amber)',
              color: 'var(--forest)',
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 999,
              padding: '4px 12px',
            }}
          >
            {t({ bn: `${toBnDigits(TOOLS_META.length)}টি টুল`, en: `${TOOLS_META.length} tools` })}
          </span>
          <span
            style={{
              border: '1px solid rgba(255,255,255,0.45)',
              color: '#fff',
              fontSize: 13,
              borderRadius: 999,
              padding: '4px 12px',
            }}
          >
            {t({
              bn: '১০০% ফ্রি • ব্রাউজারেই চলে • কোনো আপলোড নয়',
              en: '100% free • runs in your browser • nothing uploaded',
            })}
          </span>
        </div>
        <h1
          id="tools-hub-title"
          style={{ fontFamily: 'var(--font-head)', fontSize: 30, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.3, color: '#fff' }}
        >
          {t({ bn: 'ফ্রি অনলাইন টুলস', en: 'Free Online Tools' })}
        </h1>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, opacity: 0.95, maxWidth: 640 }}>
          {t({
            bn: 'পড়াশোনা, চাকরির প্রস্তুতি আর দৈনন্দিন জীবনের দরকারি কাজের জন্য ১০০+ ফ্রি টুল এক জায়গায় — পিডিএফ, ছবি, হিসাব, স্বাস্থ্য, সিভি, লেখা ও আরও অনেক কিছু।',
            en: '100+ free tools in one place for study, job preparation and everyday life — PDF, images, calculators, health, CVs, writing and more.',
          })}
        </p>
        <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.6, opacity: 0.85, maxWidth: 640 }}>
          {t({
            bn: 'সব টুল সম্পূর্ণ বিনামূল্যে, লগইন ছাড়াই ব্যবহার করা যায়। হিসাব-নিকাশ আপনার ডিভাইসেই হয় — আপনার ফাইল বা তথ্য কোনো সার্ভারে পাঠানো হয় না।',
            en: 'All tools are completely free and need no login. Computation happens on your device — your files and data are never sent to any server.',
          })}
        </p>
      </section>

      {/* Search — filters the same list client-side */}
      <div role="search" style={{ marginTop: 20 }}>
        <label htmlFor="tools-hub-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
          {t({ bn: 'টুল খুঁজুন', en: 'Search tools' })}
        </label>
        <input
          id="tools-hub-search"
          className="tools-hub-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t({ bn: 'টুল খুঁজুন — যেমন: পিডিএফ মার্জ, বিএমআই, সিভি…', en: 'Search tools — e.g. PDF merge, BMI, CV…' })}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            fontFamily: 'var(--font-body)',
            fontSize: 17,
            padding: '14px 18px',
            borderRadius: 12,
            border: '1px solid var(--line-strong)',
            background: 'var(--card)',
            color: 'var(--ink)',
            boxShadow: 'var(--shadow-sm)',
          }}
        />
        {q !== '' && (
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: '10px 2px 0' }}>
            {t({
              bn: `${toBnDigits(shownCount)}টি টুল পাওয়া গেছে`,
              en: `${shownCount} tool${shownCount === 1 ? '' : 's'} found`,
            })}
            {' — '}
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--teal-text)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-body)' }}
            >
              {t({ bn: 'মুছুন', en: 'Clear' })}
            </button>
          </p>
        )}
      </div>

      {sections.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: 16, margin: '28px 2px', textAlign: 'center' }}>
          {t({
            bn: 'দুঃখিত, এই নামে কোনো টুল পাওয়া যায়নি। অন্য কিছু লিখে খুঁজে দেখুন।',
            en: 'Sorry, no tool matches that name. Try a different search.',
          })}
        </p>
      ) : (
        sections.map(({ category, tools }, index) => {
          const accent = ACCENTS[index % ACCENTS.length];
          return (
            <section key={category.key} aria-labelledby={`tools-${category.key}`}>
              <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px 12px', margin: '28px 0 4px' }}>
                <h2
                  id={`tools-${category.key}`}
                  style={{ fontFamily: 'var(--font-head)', fontSize: 20, color: 'var(--heading)', margin: 0 }}
                >
                  {t({ bn: category.titleBn, en: category.titleEn })}
                </h2>
                <span
                  style={{
                    background: accent.badgeBg,
                    color: accent.badgeText,
                    fontWeight: 700,
                    fontSize: 13,
                    borderRadius: 999,
                    padding: '2px 10px',
                  }}
                >
                  {t({ bn: `${toBnDigits(tools.length)}টি`, en: `${tools.length}` })}
                </span>
              </div>
              <div aria-hidden="true" style={{ width: 48, height: 4, borderRadius: 2, background: accent.bar, margin: '0 0 6px' }} />
              <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 12px' }}>
                {t({ bn: category.blurbBn, en: category.blurbEn })}
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                  gap: 14,
                }}
              >
                {tools.map((tool) => {
                  const title = lang === 'bn' ? tool.titleBn : tool.titleEn;
                  return (
                    <Link
                      key={tool.slug}
                      to={`/tools/${tool.slug}`}
                      className="ev-card tools-hub-card"
                      style={{ display: 'block', textDecoration: 'none', color: 'var(--heading)', minHeight: 44 }}
                    >
                      <ToolIcon slug={tool.slug} category={tool.category} size={44} style={{ marginBottom: 10 }} />
                      <strong style={{ display: 'block', fontSize: 16, fontFamily: 'var(--font-head)' }}>
                        {title}
                      </strong>
                      <span className="tools-hub-desc" style={{ display: 'block', color: 'var(--muted)', fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
                        {t({ bn: tool.descriptionBn, en: tool.descriptionEn })}
                      </span>
                      <span style={{ display: 'block', color: 'var(--teal-text)', fontWeight: 700, fontSize: 14, marginTop: 10 }}>
                        {t({ bn: 'খুলুন →', en: 'Open →' })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </PageShell>
  );
}
