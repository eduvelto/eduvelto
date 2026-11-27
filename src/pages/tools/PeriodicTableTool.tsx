// Eduvelto — Periodic Table tool UI (27 Nov 2026).
// Interactive table of all 118 elements — click an element for details.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, cardStyle, noteStyle, labelStyle, shortInputStyle } from './toolUi';
import { PERIODIC_TABLE, type ElementCategory, type ElementInfo } from '../../lib/tools/periodicTable';

const CATEGORY_COLORS: Record<ElementCategory, string> = {
  alkali: '#f28b82',
  'alkaline-earth': '#fbbc04',
  transition: '#a7c4fc',
  'post-transition': '#bdc1c6',
  metalloid: '#81c995',
  nonmetal: '#a8dab5',
  halogen: '#f6a5c0',
  'noble-gas': '#c3a6f5',
  lanthanide: '#f9ab72',
  actinide: '#e8a0bf',
};

const CATEGORY_LABELS: Record<ElementCategory, { bn: string; en: string }> = {
  alkali: { bn: 'ক্ষার ধাতু', en: 'Alkali metal' },
  'alkaline-earth': { bn: 'মৃৎক্ষার ধাতু', en: 'Alkaline earth metal' },
  transition: { bn: 'অবস্থান্তর ধাতু', en: 'Transition metal' },
  'post-transition': { bn: 'উত্তর-অবস্থান্তর ধাতু', en: 'Post-transition metal' },
  metalloid: { bn: 'অপধাতু', en: 'Metalloid' },
  nonmetal: { bn: 'অধাতু', en: 'Non-metal' },
  halogen: { bn: 'হ্যালোজেন', en: 'Halogen' },
  'noble-gas': { bn: 'নিষ্ক্রিয় গ্যাস', en: 'Noble gas' },
  lanthanide: { bn: 'ল্যান্থানাইড', en: 'Lanthanide' },
  actinide: { bn: 'অ্যাক্টিনাইড', en: 'Actinide' },
};

function cellStyle(el: ElementInfo, selected: boolean): CSSProperties {
  return {
    gridColumn: `${el.group} / span 1`,
    gridRow: `${el.period} / span 1`,
    background: CATEGORY_COLORS[el.category],
    border: selected ? '2px solid var(--teal-deep)' : '1px solid rgba(0,0,0,0.15)',
    borderRadius: 6,
    padding: '4px 2px',
    textAlign: 'center',
    cursor: 'pointer',
    minWidth: 0,
  };
}

export function PeriodicTableTool() {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ElementInfo>(PERIODIC_TABLE[5]); // Carbon
  const q = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!q) return null;
    return PERIODIC_TABLE.filter(
      (e) => e.symbol.toLowerCase().includes(q) || e.nameEn.toLowerCase().includes(q) || e.nameBn.includes(q) || String(e.z) === q,
    );
  }, [q]);

  const mainBlock = PERIODIC_TABLE.filter((e) => e.group > 0);
  const lanthanides = PERIODIC_TABLE.filter((e) => e.category === 'lanthanide' && e.group === 0);
  const actinides = PERIODIC_TABLE.filter((e) => e.category === 'actinide' && e.group === 0);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পর্যায় সারণি" titleEn="Periodic Table" descBn="সব ১১৮টি মৌল — নাম, প্রতীক, পারমাণবিক সংখ্যা ও ভর। যেকোনো মৌলে ক্লিক করলে বিস্তারিত দেখা যাবে।" descEn="All 118 elements — name, symbol, atomic number and mass. Click any element for details." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle} htmlFor="pt-search">{t({ bn: 'মৌল খুঁজুন (নাম, প্রতীক বা সংখ্যা)', en: 'Find an element (name, symbol or number)' })}</label>
        <input id="pt-search" style={shortInputStyle} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Fe, Iron, 26…" />
      </div>
      {matches ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {matches.length === 0 ? (
            <span style={{ fontSize: 14 }}>{t({ bn: 'কোনো মৌল পাওয়া যায়নি।', en: 'No element found.' })}</span>
          ) : (
            matches.map((e) => (
              <button key={e.z} type="button" onClick={() => setSelected(e)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line)', background: CATEGORY_COLORS[e.category], cursor: 'pointer', fontWeight: 700 }}>
                {e.symbol} ({e.z})
              </button>
            ))
          )}
        </div>
      ) : null}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, minmax(34px, 1fr))', gap: 3, minWidth: 640 }}>
          {mainBlock.map((e) => (
            <button key={e.z} type="button" style={cellStyle(e, selected.z === e.z)} onClick={() => setSelected(e)} title={`${e.nameEn} (${e.z})`}>
              <span style={{ display: 'block', fontSize: 10, lineHeight: 1 }}>{e.z}</span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{e.symbol}</span>
              <span style={{ display: 'block', fontSize: 9, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'bn' ? e.nameBn : e.nameEn}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, minmax(34px, 1fr))', gap: 3, minWidth: 640, marginTop: 8 }}>
          {lanthanides.map((e, i) => (
            <button key={e.z} type="button" style={{ ...cellStyle({ ...e, group: 4 + i, period: 6 }, selected.z === e.z) }} onClick={() => setSelected(e)} title={`${e.nameEn} (${e.z})`}>
              <span style={{ display: 'block', fontSize: 10, lineHeight: 1 }}>{e.z}</span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{e.symbol}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(18, minmax(34px, 1fr))', gap: 3, minWidth: 640, marginTop: 3 }}>
          {actinides.map((e, i) => (
            <button key={e.z} type="button" style={{ ...cellStyle({ ...e, group: 4 + i, period: 7 }, selected.z === e.z) }} onClick={() => setSelected(e)} title={`${e.nameEn} (${e.z})`}>
              <span style={{ display: 'block', fontSize: 10, lineHeight: 1 }}>{e.z}</span>
              <span style={{ display: 'block', fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>{e.symbol}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16, padding: '16px', borderRadius: 12, background: 'var(--teal-soft)' }} role="status">
        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'নির্বাচিত মৌল', en: 'Selected element' })}</p>
        <p style={{ margin: 0, fontSize: '1.6rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>
          {selected.symbol} — {t({ bn: selected.nameBn, en: selected.nameEn })}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 15 }}>
          {t({ bn: `পারমাণবিক সংখ্যা: ${selected.z} · পারমাণবিক ভর: ${selected.mass} · শ্রেণি: ${CATEGORY_LABELS[selected.category].bn} · পর্যায় ${selected.period}`, en: `Atomic number: ${selected.z} · Atomic mass: ${selected.mass} · Category: ${CATEGORY_LABELS[selected.category].en} · Period ${selected.period}` })}
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        {(Object.keys(CATEGORY_LABELS) as ElementCategory[]).map((c) => (
          <span key={c} style={{ fontSize: 12, padding: '3px 8px', borderRadius: 999, background: CATEGORY_COLORS[c] }}>
            {t({ bn: CATEGORY_LABELS[c].bn, en: CATEGORY_LABELS[c].en })}
          </span>
        ))}
      </div>
      <p style={noteStyle}>{t({ bn: 'ভর IUPAC-এর প্রমিত পারমাণবিক ভর; কৃত্রিম মৌলের ক্ষেত্রে সবচেয়ে স্থিতিশীল আইসোটোপের ভর সংখ্যা দেওয়া হয়েছে।', en: 'Masses are standard IUPAC atomic weights; for synthetic elements the mass number of the most stable isotope is shown.' })}</p>
    </section>
  );
}
