// Eduvelto — Government Service Links directory UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// STATIC data only (src/lib/tools/govtServiceLinks.ts): official
// .gov.bd portals verified 27 Nov 2026. No lookalike or unofficial
// site is listed; a link that could not be verified was left out.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  GOVT_SERVICE_LINKS, GOVT_SERVICE_CATEGORIES, filterGovtServiceLinks,
  type GovtServiceCategory,
} from '../../lib/tools/govtServiceLinks';
import {
  inputStyle, labelStyle, cardStyle, noteStyle, ToolHero, presetChipStyle,
} from './toolUiShared';

function categoryLabel(category: GovtServiceCategory | 'all', t: (e: { bn: string; en: string }) => string): string {
  switch (category) {
    case 'all': return t({ bn: 'সবগুলো', en: 'All' });
    case 'general': return t({ bn: 'সাধারণ', en: 'General' });
    case 'identity': return t({ bn: 'পরিচয়পত্র', en: 'Identity' });
    case 'land': return t({ bn: 'জমি', en: 'Land' });
    case 'tax': return t({ bn: 'কর', en: 'Tax' });
    case 'transport': return t({ bn: 'যাতায়াত', en: 'Transport' });
    case 'education': return t({ bn: 'শিক্ষা', en: 'Education' });
    case 'jobs': return t({ bn: 'চাকরি', en: 'Jobs' });
  }
}

export function GovtServiceLinksTool() {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GovtServiceCategory | 'all'>('all');

  const filtered = useMemo(
    () => filterGovtServiceLinks(GOVT_SERVICE_LINKS, query, category),
    [query, category],
  );

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="govt-title">
      <ToolHero
        titleId="govt-title"
        titleBn="সরকারি সেবার লিংক"
        titleEn="Government Service Links"
        descBn="বাংলাদেশের সরকারি সেবার দরকারি ওয়েবসাইটের লিংক এক জায়গায় পান।"
        descEn="Find links to useful Bangladesh government service websites in one place."
        chipBn="শুধু সরকারি (.gov.bd) লিংক • ২৭ নভেম্বর ২০২৬ যাচাইকৃত"
        chipEn="Official (.gov.bd) links only • checked 27 Nov 2026"
      />
      <div>
        <label style={labelStyle} htmlFor="govt-search">
          {t({ bn: 'সেবা খুঁজুন', en: 'Search services' })}
        </label>
        <input
          id="govt-search"
          style={inputStyle}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t({ bn: 'যেমন: পাসপোর্ট, জমি, কর', en: 'e.g. passport, land, tax' })}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }} role="group" aria-label={t({ bn: 'বিভাগ', en: 'Category' })}>
        {(['all', ...GOVT_SERVICE_CATEGORIES] as const).map((c) => (
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
          {t({ bn: 'এই খোঁজে কোনো সেবা পাওয়া যায়নি।', en: 'No service matches this search.' })}
        </p>
      ) : null}
      <p style={noteStyle}>
        {t({
          bn: 'এখানে শুধু সরকারি ওয়েবসাইটের লিংক আছে — সরকারি সাইটের ঠিকানা .gov.bd দিয়ে শেষ হয় (myGov ছাড়া)। মিলে যাওয়া নামের অন্য কোনো সাইটে ব্যক্তিগত তথ্য বা টাকা দেবেন না; সন্দেহ হলে bangladesh.gov.bd থেকে যাচাই করুন।',
          en: 'Only official government websites are listed here — official sites end in .gov.bd (except myGov). Never enter personal details or pay money on a similar-looking site; when in doubt, verify from bangladesh.gov.bd.',
        })}
      </p>
    </section>
  );
}
