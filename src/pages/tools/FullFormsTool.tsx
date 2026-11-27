// Eduvelto — Full Forms / Abbreviations tool UI (27 Nov 2026).
// Searchable static directory of 80+ abbreviations with correct full forms.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { FULL_FORM_CATEGORIES, searchFullForms, type FullFormCategory } from '../../lib/tools/fullFormsData';

const rowStyle: CSSProperties = { display: 'flex', gap: 12, alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid var(--line)' };

export function FullFormsTool() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FullFormCategory | 'all'>('all');
  const results = useMemo(() => searchFullForms(query, category), [query, category]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পূর্ণরূপ / সংক্ষিপ্ত রূপ" titleEn="Full Forms / Abbreviations" descBn="CPU, BCS, SSC, NID-সহ ৮০টির বেশি সংক্ষিপ্ত রূপের সঠিক পূর্ণরূপ খুঁজুন।" descEn="Find the correct full form of 80+ abbreviations — CPU, BCS, SSC, NID and more." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ff-search">{t({ bn: 'খুঁজুন', en: 'Search' })}</label>
          <input id="ff-search" style={shortInputStyle} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="CPU, BCS, ATM…" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ff-category">{t({ bn: 'বিভাগ', en: 'Category' })}</label>
          <select id="ff-category" style={{ ...shortInputStyle, minHeight: 44 }} value={category} onChange={(e) => setCategory(e.target.value as FullFormCategory | 'all')}>
            {FULL_FORM_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{t({ bn: c.labelBn, en: c.labelEn })}</option>
            ))}
          </select>
        </div>
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `${results.length}টি পূর্ণরূপ পাওয়া গেছে`, en: `${results.length} full forms found` })}</p>
      <div>
        {results.map((item) => (
          <div key={item.short} style={rowStyle}>
            <span style={{ fontWeight: 800, minWidth: 72, color: 'var(--teal-deep)' }}>{item.short}</span>
            <span style={{ fontSize: 15 }}>{item.full}</span>
          </div>
        ))}
      </div>
      {results.length === 0 ? (
        <p style={{ marginTop: 14, fontSize: 14 }}>{t({ bn: 'কিছু পাওয়া যায়নি — অন্য শব্দ বা বিভাগ দিয়ে চেষ্টা করুন।', en: 'Nothing found — try another word or category.' })}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'এই তালিকায় শুধু প্রমিত পূর্ণরূপ রাখা হয়েছে। কোনো সংক্ষিপ্ত রূপের একাধিক প্রচলিত অর্থ থাকলে এখানে সবচেয়ে প্রচলিতটি দেখানো হয়েছে।', en: 'This list keeps only standard full forms. Where an abbreviation has more than one common meaning, the most common one is shown.' })}</p>
    </section>
  );
}
