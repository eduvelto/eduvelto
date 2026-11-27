// Eduvelto — Square Root & Cube Root Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: sqrtCbrt in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { sqrtCbrt } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function SquareRootCubeRootCalculatorTool() {
  const { t } = useLanguage();
  const [x, setX] = useState('64');
  const n = parseNum(x);
  const result = useMemo(() => (n !== null ? sqrtCbrt(n) : null), [n]);
  const clear = () => setX('');
  const loadExample = () => setX('64');

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বর্গমূল ও ঘনমূল ক্যালকুলেটর" titleEn="Square Root & Cube Root Calculator" descBn="যেকোনো সংখ্যার বর্গমূল ও ঘনমূল বের করুন।" descEn="Find the square root and cube root of any number." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="root-x">{t({ bn: 'সংখ্যা', en: 'Number' })}</label>
        <input id="root-x" style={shortInputStyle} type="number" step="any" inputMode="decimal" value={x} onChange={(e) => setX(e.target.value)} placeholder="64" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'বর্গমূল', en: 'Square root' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.sqrt === null ? t({ bn: 'বাস্তব সংখ্যায় নেই', en: 'No real square root' }) : `√${x} = ${result.sqrt}`}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `ঘনমূল: ∛${x} = ${result.cbrt}`, en: `Cube root: ∛${x} = ${result.cbrt}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'বর্গমূল', labelEn: 'Square root', value: result.sqrt === null ? '—' : `${result.sqrt}` },
            { labelBn: 'ঘনমূল', labelEn: 'Cube root', value: `${result.cbrt}` },
          ]} />
          <ButtonRow><CopyButton text={`sqrt(${x}) = ${result.sqrt ?? 'no real root'}, cbrt(${x}) = ${result.cbrt}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'একটি সঠিক সংখ্যা দিন।', en: 'Enter a valid number.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'ঋণাত্মক সংখ্যার বাস্তব বর্গমূল হয় না, তবে ঘনমূল হয় — যেমন ∛(−৮) = −২।', en: 'A negative number has no real square root, but it does have a cube root — for example ∛(−8) = −2.' })}</p>
    </section>
  );
}
