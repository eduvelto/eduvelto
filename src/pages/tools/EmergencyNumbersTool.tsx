// Eduvelto — Emergency Numbers Directory tool UI (100-Tools Project, Phase 2).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// STATIC data only, from src/lib/tools/emergencyNumbers.ts — no fetch,
// no API. 999 (National Emergency Service) is listed FIRST. No number
// here was guessed: hospital / thana landlines are deliberately
// omitted (see the logic file) rather than invented.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  EMERGENCY_NUMBERS,
  EMERGENCY_CATEGORIES,
  filterEmergencyNumbers,
  telLink,
  type EmergencyCategory,
} from '../../lib/tools/emergencyNumbers';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const chipStyle: CSSProperties = {
  minHeight: 40,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--heading)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const chipActiveStyle: CSSProperties = {
  ...chipStyle,
  background: 'var(--teal, #0b7285)',
  borderColor: 'var(--teal, #0b7285)',
  color: '#fff',
};

/** Hero band: forest → teal-deep gradient, white title + trust chip. */
const heroStyle: CSSProperties = {
  margin: '-18px -16px 16px',
  padding: '20px 16px 18px',
  borderRadius: '12px 12px 0 0',
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  color: '#fff',
};

const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  padding: '5px 12px',
  borderRadius: 999,
  border: '1px solid rgba(255, 255, 255, 0.5)',
  background: 'rgba(255, 255, 255, 0.14)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
};

/** Sticky 999 banner: call 999 first in immediate danger. */
const bannerStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 5,
  margin: '0 0 14px',
  padding: '12px 14px',
  borderRadius: 10,
  background: 'var(--amber-soft)',
  border: '1px solid var(--amber)',
  color: 'var(--heading)',
  fontSize: 15,
};

const copyButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: '6px 12px',
  fontSize: 14,
};

function categoryLabel(category: EmergencyCategory | 'all', t: (e: { bn: string; en: string }) => string): string {
  switch (category) {
    case 'all':
      return t({ bn: 'সবগুলো', en: 'All' });
    case 'emergency':
      return t({ bn: 'জরুরি', en: 'Emergency' });
    case 'hospital':
      return t({ bn: 'হাসপাতাল', en: 'Hospital' });
    case 'police':
      return t({ bn: 'পুলিশ', en: 'Police' });
    case 'fire':
      return t({ bn: 'ফায়ার সার্ভিস', en: 'Fire' });
  }
}

export function EmergencyNumbersTool() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<EmergencyCategory | 'all'>('all');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const entries = useMemo(
    () => filterEmergencyNumbers(EMERGENCY_NUMBERS, query, category),
    [query, category],
  );

  // Group the (filtered) entries by category, in the fixed category
  // order — 999's emergency group stays first. Each group carries its
  // own "last verified" stamp.
  const groups = useMemo(
    () =>
      EMERGENCY_CATEGORIES.map((c) => ({
        category: c,
        entries: entries.filter((e) => e.category === c),
      })).filter((g) => g.entries.length > 0),
    [entries],
  );

  async function copyNumber(number: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(number);
      setCopiedNumber(number);
      window.setTimeout(() => setCopiedNumber((current) => (current === number ? null : current)), 2000);
    } catch {
      setCopiedNumber(null);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="emergency-numbers-title">
      <div style={heroStyle}>
        <h2 id="emergency-numbers-title" style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
          {t({ bn: 'জরুরি নম্বর', en: 'Emergency Numbers' })}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
          {t({
            bn: 'জরুরি অবস্থায় প্রথমে ৯৯৯-এ কল করুন। নম্বরে ট্যাপ করলে সরাসরি কল যাবে। সব তথ্য আপনার ডিভাইসেই আছে, ইন্টারনেট লাগে না।',
            en: 'In an emergency, call 999 first. Tap a number to call it directly. Everything here is stored on your device — no internet needed.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% অফলাইন • কোনো আপলোড নয়', en: '100% offline • nothing uploaded' })}
        </span>
      </div>
      <p style={bannerStyle} role="status">
        <strong>
          <a href="tel:999" style={{ color: 'var(--heading)' }}>
            999
          </a>
        </strong>
        {' — '}
        {t({
          bn: 'তাৎক্ষণিক বিপদে প্রথমে এই নম্বরে কল করুন।',
          en: 'In immediate danger, call this number first.',
        })}
      </p>
      <div>
        <label style={labelStyle} htmlFor="emergency-search">
          {t({ bn: 'খুঁজুন (নাম বা নম্বর)', en: 'Search (name or number)' })}
        </label>
        <input
          id="emergency-search"
          style={inputStyle}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t({ bn: 'যেমন: ফায়ার, 999', en: 'e.g. fire, 999' })}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }} role="group" aria-label={t({ bn: 'বিভাগ', en: 'Category' })}>
        {(['all', ...EMERGENCY_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            style={category === c ? chipActiveStyle : chipStyle}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {categoryLabel(c, t)}
          </button>
        ))}
      </div>
      <div style={resultStyle} role="status">
        {entries.length === 0 ? (
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: 'এই খোঁজে কিছু পাওয়া যায়নি — অন্য নাম বা নম্বর দিয়ে চেষ্টা করুন।',
              en: 'Nothing matched that search — try another name or number.',
            })}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {groups.map((group) => (
              <div key={group.category}>
                <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: 'var(--heading)' }}>
                  {categoryLabel(group.category, t)}
                  {' · '}
                  <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 13 }}>
                    {t({ bn: 'যাচাই: ২৭ নভেম্বর ২০২৬', en: 'Verified: 27 Nov 2026' })}
                  </span>
                </p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
                  {group.entries.map((entry) => (
                    <li
                      key={`${entry.category}-${entry.number}-${entry.nameEn}`}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: entry.number === '999' ? 'var(--amber-soft)' : 'var(--surface)',
                        border: entry.number === '999' ? '1px solid var(--amber)' : '1px solid var(--line)',
                      }}
                    >
                      <p style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--heading)' }}>
                        {t({ bn: entry.nameBn, en: entry.nameEn })}
                      </p>
                      <p
                        style={{
                          margin: '0 0 4px',
                          fontSize: 15,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <a href={telLink(entry)} style={{ fontWeight: 700, color: 'var(--teal, #0b7285)', fontSize: 18 }}>
                          {entry.number}
                        </a>
                        <button
                          type="button"
                          className="ev-btn ev-btn-outline"
                          style={copyButtonStyle}
                          onClick={() => void copyNumber(entry.number)}
                        >
                          {copiedNumber === entry.number
                            ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                            : t({ bn: 'কপি', en: 'Copy' })}
                        </button>
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                        {t({ bn: entry.noteBn, en: entry.noteEn })}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <p style={noteStyle}>
          {t({
            bn: 'এখানে শুধু যাচাই করা সরকারি শর্ট-কোড নম্বর আছে। হাসপাতাল বা থানার আলাদা ল্যান্ডলাইন নম্বর যাচাই না হওয়ায় দেওয়া হয়নি — হাসপাতালের তথ্যের জন্য ১৬২৬৩, পুলিশের জন্য ৯৯৯-এ কল করুন।',
            en: 'Only verified government short-code numbers are listed here. Hospital and thana landlines are not listed because they could not be verified — call 16263 for hospital information and 999 for police help.',
          })}
        </p>
      </div>
    </section>
  );
}
