// Eduvelto — Permutation & Combination Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: permComb in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { permComb, FACTORIAL_LIMIT } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 };

function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function PermutationCombinationCalculatorTool() {
  const { t } = useLanguage();
  const [n, setN] = useState('10');
  const [r, setR] = useState('3');
  const nn = parseIntOrNull(n);
  const rr = parseIntOrNull(r);
  const result = useMemo(() => (nn !== null && rr !== null ? permComb(nn, rr) : null), [nn, rr]);
  const clear = () => { setN(''); setR(''); };
  const loadExample = () => { setN('10'); setR('3'); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বিন্যাস ও সমাবেশ ক্যালকুলেটর" titleEn="Permutation & Combination Calculator" descBn="nPr (বিন্যাস) ও nCr (সমাবেশ) বের করুন।" descEn="Find nPr (permutation) and nCr (combination)." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pc-n">{t({ bn: 'n (মোট জিনিস)', en: 'n (total items)' })}</label>
          <input id="pc-n" style={shortInputStyle} type="number" step="1" min="0" max={FACTORIAL_LIMIT} inputMode="numeric" value={n} onChange={(e) => setN(e.target.value)} placeholder="10" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pc-r">{t({ bn: 'r (বাছাই করা জিনিস)', en: 'r (items chosen)' })}</label>
          <input id="pc-r" style={shortInputStyle} type="number" step="1" min="0" max={FACTORIAL_LIMIT} inputMode="numeric" value={r} onChange={(e) => setR(e.target.value)} placeholder="3" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `বিন্যাস ${n}P${r}`, en: `Permutation ${n}P${r}` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.nPr}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `সমাবেশ ${n}C${r} = ${result.nCr}`, en: `Combination ${n}C${r} = ${result.nCr}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বিন্যাস (nPr)', labelEn: 'Permutation (nPr)', value: `${result.nPr}` },
            { labelBn: 'সমাবেশ (nCr)', labelEn: 'Combination (nCr)', value: `${result.nCr}` },
          ]} />
          <ButtonRow><CopyButton text={`${n}P${r} = ${result.nPr}, ${n}C${r} = ${result.nCr}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: `পূর্ণসংখ্যা দিন — ০ ≤ r ≤ n ≤ ${FACTORIAL_LIMIT} হতে হবে।`, en: `Enter whole numbers — 0 ≤ r ≤ n ≤ ${FACTORIAL_LIMIT} is required.` })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'বিন্যাসে ক্রম গুরুত্বপূর্ণ (কে প্রথম, কে দ্বিতীয়), সমাবেশে শুধু বাছাইটি গুরুত্বপূর্ণ। তাই nPr সবসময় nCr-এর চেয়ে বড় বা সমান হয়।', en: 'In a permutation the order matters (who is first, who is second); in a combination only the selection matters. So nPr is always at least as large as nCr.' })}</p>
    </section>
  );
}
