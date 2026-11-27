// Eduvelto — Results Hub directory UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// STATIC data only (src/lib/tools/resultsHub.ts): official result
// portals verified 27 Nov 2026 against the exam bodies' own
// notices. No third-party result site is listed.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  RESULT_LINKS, RESULT_CATEGORIES, filterResultLinks, type ResultCategory,
} from '../../lib/tools/resultsHub';
import {
  inputStyle, labelStyle, cardStyle, noteStyle, ToolHero, presetChipStyle,
} from './toolUiShared';

function categoryLabel(category: ResultCategory | 'all', t: (e: { bn: string; en: string }) => string): string {
  switch (category) {
    case 'all': return t({ bn: 'সবগুলো', en: 'All' });
    case 'board': return t({ bn: 'বোর্ড (এসএসসি/এইচএসসি)', en: 'Board (SSC/HSC)' });
    case 'university': return t({ bn: 'বিশ্ববিদ্যালয়', en: 'University' });
    case 'technical': return t({ bn: 'কারিগরি', en: 'Technical' });
    case 'job': return t({ bn: 'চাকরি', en: 'Jobs' });
  }
}

export function ResultsHubTool() {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ResultCategory | 'all'>('all');

  const filtered = useMemo(
    () => filterResultLinks(RESULT_LINKS, query, category),
    [query, category],
  );

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="results-title">
      <ToolHero
        titleId="results-title"
        titleBn="ফলাফল হাব"
        titleEn="Results Hub"
        descBn="এসএসসি, এইচএসসি ও চাকরির পরীক্ষার ফলাফলের দরকারি লিংক এক জায়গায় পান।"
        descEn="Find links for SSC, HSC and job exam results in one place."
        chipBn="শুধু সরকারি ফলাফল পোর্টাল • ২৭ নভেম্বর ২০২৬ যাচাইকৃত"
        chipEn="Official result portals only • checked 27 Nov 2026"
      />
      <div>
        <label style={labelStyle} htmlFor="results-search">
          {t({ bn: 'ফলাফল খুঁজুন', en: 'Search results' })}
        </label>
        <input
          id="results-search"
          style={inputStyle}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t({ bn: 'যেমন: এসএসসি, জাতীয় বিশ্ববিদ্যালয়, বিসিএস', en: 'e.g. SSC, National University, BCS' })}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }} role="group" aria-label={t({ bn: 'বিভাগ', en: 'Category' })}>
        {(['all', ...RESULT_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            style={presetChipStyle(category === c)}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {categoryLabel(c, t)}
          </button>
        ))}
      </div>
      <ul style={{ listStyle: 'none', margin: '16px 0 0', padding: 0 }}>
        {filtered.map((link) => (
          <li
            key={link.url}
            style={{
              border: '1px solid var(--line)',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 10,
              background: 'var(--card)',
            }}
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal-deep)' }}
            >
              {lang === 'bn' ? link.nameBn : link.nameEn}
            </a>
            <p style={{ margin: '4px 0 2px', fontSize: 14, color: 'var(--heading)' }}>
              {lang === 'bn' ? link.noteBn : link.noteEn}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{link.url}</p>
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 14 }}>
          {t({ bn: 'এই খোঁজে কোনো ফলাফল পোর্টাল পাওয়া যায়নি।', en: 'No result portal matches this search.' })}
        </p>
      ) : null}
      <p style={noteStyle}>
        {t({
          bn: 'ফলাফল দেখা বিনামূল্যে — ফলাফল দেখার জন্য কেউ টাকা চাইলে দেবেন না। অনলাইন ফলাফল সাময়িক; মূল ট্রান্সক্রিপ্ট ও সনদ পরে শিক্ষাপ্রতিষ্ঠান থেকে নিতে হয়। মিলে যাওয়া নামের অন্য কোনো সাইটে রোল বা রেজিস্ট্রেশন নম্বর দেবেন না।',
          en: 'Checking results is free — never pay anyone to see a result. The online result is provisional; the original transcript and certificate come later from your institution. Do not enter your roll or registration number on a similar-looking site.',
        })}
      </p>
    </section>
  );
}
