// Eduvelto — Math & Physics Formulas tool UI (27 Nov 2026).
// Static reference (algebra, geometry, trigonometry, motion/force/energy)
// with a worked-example mini-calculator per formula. The calculator
// section also covers the "math shortcut formula calculator" item, so
// no separate tool is needed for it.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, cardStyle, noteStyle, labelStyle, shortInputStyle } from './toolUi';
import { FORMULA_GROUPS, type FormulaItem } from '../../lib/tools/formulasData';
import { computeFormula } from '../../lib/tools/mainTablesTools';

const groupTitleStyle: CSSProperties = { margin: '22px 0 8px', fontSize: 18, fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' };
const formulaCardStyle: CSSProperties = { border: '1px solid var(--line)', borderRadius: 12, padding: '14px', marginBottom: 12, background: 'var(--card)' };
const formulaStyle: CSSProperties = { fontSize: 17, fontWeight: 700, margin: '6px 0', fontFamily: 'var(--font-head)' };
const resultStyle: CSSProperties = { marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--teal-soft)', fontSize: 15 };

function FormulaCard({ item }: { item: FormulaItem }) {
  const { t } = useLanguage();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(item.inputs.map((i) => [i.key, i.defaultValue])),
  );
  const parsed = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(values)) out[k] = Number(v);
    return out;
  }, [values]);
  const result = useMemo(() => computeFormula(item.id, parsed), [item.id, parsed]);
  const valid = result !== null && Number.isFinite(result.value);

  return (
    <div style={formulaCardStyle}>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t({ bn: item.nameBn, en: item.nameEn })}</p>
      <p style={formulaStyle}>{item.formula}</p>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--muted)' }}>{t({ bn: item.meaningBn, en: item.meaningEn })}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {item.inputs.map((inp) => (
          <div key={inp.key}>
            <label style={labelStyle} htmlFor={`mf-${item.id}-${inp.key}`}>
              {t({ bn: inp.labelBn, en: inp.labelEn })}{inp.unit ? ` (${inp.unit})` : ''}
            </label>
            <input
              id={`mf-${item.id}-${inp.key}`}
              style={shortInputStyle}
              type="number"
              inputMode="decimal"
              value={values[inp.key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [inp.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      {valid && result ? (
        <div style={resultStyle} role="status">
          <strong>{t({ bn: item.resultLabelBn, en: item.resultLabelEn })}: {Number.isInteger(result.value) ? result.value : result.value.toFixed(4)}{result.unit}</strong>
          <span style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{result.steps}</span>
        </div>
      ) : (
        <p style={{ marginTop: 10, fontSize: 13, color: '#b3261e' }}>{t({ bn: 'সঠিক মান দিন।', en: 'Enter valid values.' })}</p>
      )}
    </div>
  );
}

export function MathPhysicsFormulasTool() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      FORMULA_GROUPS.map((g) => ({
        ...g,
        items: g.items.filter((it) => !q || it.nameBn.includes(q) || it.nameEn.toLowerCase().includes(q) || it.formula.toLowerCase().includes(q)),
      })).filter((g) => g.items.length > 0),
    [q],
  );

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="গণিত ও পদার্থবিজ্ঞানের সূত্র" titleEn="Math & Physics Formulas" descBn="বীজগণিত, জ্যামিতি, ত্রিকোণমিতি, গতি ও বলের সূত্র এক জায়গায় — প্রতিটির সঙ্গে কাজ-করা উদাহরণ ক্যালকুলেটর।" descEn="Algebra, geometry, trigonometry, motion and force formulas in one place — each with a worked-example calculator." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="mf-search">{t({ bn: 'সূত্র খুঁজুন', en: 'Search formulas' })}</label>
        <input id="mf-search" style={shortInputStyle} type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t({ bn: 'যেমন: পিথাগোরাস, বল, বৃত্ত…', en: 'e.g. Pythagoras, force, circle…' })} />
      </div>
      {groups.length === 0 ? (
        <p style={{ marginTop: 14, fontSize: 14 }}>{t({ bn: 'কোনো সূত্র পাওয়া যায়নি।', en: 'No formula found.' })}</p>
      ) : null}
      {groups.map((g) => (
        <div key={g.groupEn}>
          <h3 style={groupTitleStyle}>{t({ bn: g.groupBn, en: g.groupEn })}</h3>
          {g.items.map((item) => (
            <FormulaCard key={`${g.groupEn}-${item.id}`} item={item} />
          ))}
        </div>
      ))}
      <p style={noteStyle}>{t({ bn: 'এই পাতার কাজ-করা উদাহরণ অংশটি গণিতের শর্টকাট সূত্র ক্যালকুলেটরের কাজও করে — আলাদা টুলের দরকার নেই। স্থিতিশক্তিতে g = 9.8 m/s² ধরা হয়েছে।', en: 'The worked-example section on this page also does the job of a math shortcut formula calculator — no separate tool is needed. Potential energy uses g = 9.8 m/s².' })}</p>
    </section>
  );
}
