// Eduvelto — Probability Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: probabilityOf + probabilityAnd/Or in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { probabilityOf, probabilityAnd, probabilityOr } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };

function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}
function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function ProbabilityCalculatorTool() {
  const { t } = useLanguage();
  const [fav, setFav] = useState('1');
  const [total, setTotal] = useState('6');
  const [p1, setP1] = useState('0.5');
  const [p2, setP2] = useState('0.5');
  const f = parseIntOrNull(fav);
  const tot = parseIntOrNull(total);
  const q1 = parseNum(p1);
  const q2 = parseNum(p2);
  const result = useMemo(() => (f !== null && tot !== null ? probabilityOf(f, tot) : null), [f, tot]);
  const andP = useMemo(() => (q1 !== null && q2 !== null ? probabilityAnd(q1, q2) : null), [q1, q2]);
  const orP = useMemo(() => (q1 !== null && q2 !== null ? probabilityOr(q1, q2) : null), [q1, q2]);
  const clear = () => { setFav(''); setTotal(''); setP1(''); setP2(''); };
  const loadExample = () => { setFav('1'); setTotal('6'); setP1('0.5'); setP2('0.5'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সম্ভাবনা ক্যালকুলেটর" titleEn="Probability Calculator" descBn="অনুকূল ফলাফল ÷ মোট ফলাফল থেকে সম্ভাবনা বের করুন, সাথে দুটি স্বাধীন ঘটনার AND/OR সম্ভাবনাও।" descEn="Find probability from favourable ÷ total outcomes, plus AND/OR probabilities for two independent events." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="prob-fav">{t({ bn: 'অনুকূল ফলাফলের সংখ্যা', en: 'Favourable outcomes' })}</label>
          <input id="prob-fav" style={shortInputStyle} type="number" step="1" min="0" inputMode="numeric" value={fav} onChange={(e) => setFav(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="prob-total">{t({ bn: 'মোট ফলাফলের সংখ্যা', en: 'Total outcomes' })}</label>
          <input id="prob-total" style={shortInputStyle} type="number" step="1" min="1" inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="6" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'সম্ভাবনা', en: 'Probability' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.percent}%</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `P = ${fav}/${total} = ${result.probability} • না ঘটার সম্ভাবনা: ${result.complement}`, en: `P = ${fav}/${total} = ${result.probability} • Probability of not happening: ${result.complement}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'সম্ভাবনা (ভগ্নাংশে)', labelEn: 'Probability (as a fraction)', value: `${result.probability}` },
            { labelBn: 'সম্ভাবনা (%)', labelEn: 'Probability (%)', value: `${result.percent}%` },
            { labelBn: 'পূরক সম্ভাবনা', labelEn: 'Complement', value: `${result.complement}` },
          ]} />
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক পূর্ণসংখ্যা দিন — মোট ফলাফল ১ বা তার বেশি, আর অনুকূল ফলাফল মোটের চেয়ে বেশি হতে পারবে না।', en: 'Enter whole numbers — total outcomes must be 1 or more, and favourable outcomes cannot exceed the total.' })}</p>
      )}
      <div style={{ marginTop: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px' }}>{t({ bn: 'দুটি স্বাধীন ঘটনার AND / OR', en: 'AND / OR of two independent events' })}</p>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle} htmlFor="prob-p1">{t({ bn: 'প্রথম ঘটনার সম্ভাবনা (০–১)', en: 'Probability of first event (0–1)' })}</label>
            <input id="prob-p1" style={shortInputStyle} type="number" step="0.01" min="0" max="1" inputMode="decimal" value={p1} onChange={(e) => setP1(e.target.value)} placeholder="0.5" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="prob-p2">{t({ bn: 'দ্বিতীয় ঘটনার সম্ভাবনা (০–১)', en: 'Probability of second event (0–1)' })}</label>
            <input id="prob-p2" style={shortInputStyle} type="number" step="0.01" min="0" max="1" inputMode="decimal" value={p2} onChange={(e) => setP2(e.target.value)} placeholder="0.5" />
          </div>
        </div>
        {andP !== null && orP !== null ? (
          <Tiles items={[
            { labelBn: 'দুটোই ঘটবে (AND)', labelEn: 'Both happen (AND)', value: `${andP}` },
            { labelBn: 'অন্তত একটি ঘটবে (OR)', labelEn: 'At least one happens (OR)', value: `${orP}` },
          ]} />
        ) : (
          <p style={errorStyle} role="alert">{t({ bn: 'AND/OR-এর জন্য দুটি সম্ভাবনাই ০ থেকে ১-এর মধ্যে হতে হবে।', en: 'For AND/OR both probabilities must be between 0 and 1.' })}</p>
        )}
      </div>
      <ButtonRow><CopyButton text={result ? `P = ${fav}/${total} = ${result.probability} (${result.percent}%); AND ${andP ?? '—'}, OR ${orP ?? '—'}` : ''} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
      <p style={noteStyle}>{t({ bn: 'সম্ভাবনা সবসময় ০ থেকে ১-এর মধ্যে থাকে। AND/OR হিসাবটি শুধু স্বাধীন ঘটনার জন্য প্রযোজ্য — একটি ঘটনা অন্যটিকে প্রভাবিত করলে এই সূত্র চলবে না।', en: 'Probability is always between 0 and 1. The AND/OR figures apply only to independent events — if one event affects the other, these formulas do not apply.' })}</p>
    </section>
  );
}
