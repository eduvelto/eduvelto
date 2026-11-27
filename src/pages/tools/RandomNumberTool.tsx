// Eduvelto — Random Number Generator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: randomInt() + randomInts() in src/lib/tools/passwordRandom.ts (crypto-based, unbiased rejection sampling). 100% in-browser; nothing is uploaded.
import {useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {ToolHero, Tiles, CopyButton, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { randomInts } from '../../lib/tools/passwordRandom';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}


function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


export function RandomNumberTool() {
  const { t, lang } = useLanguage();
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('100');
  const [count, setCount] = useState('1');
  const [unique, setUnique] = useState(false);
  const [sort, setSort] = useState(false);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  function draw(): void {
    const minV = parseNum(min);
    const maxV = parseNum(max);
    const countV = parseNum(count);
    setError(null);
    if (minV === null || maxV === null || countV === null) {
      setError(t({ bn: 'সঠিক সংখ্যা দিন।', en: 'Enter valid numbers.' }));
      return;
    }
    try {
      const list = randomInts(Math.round(countV), Math.round(minV), Math.round(maxV), unique);
      setNumbers(sort ? [...list].sort((a, b) => a - b) : list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not draw numbers');
    }
  }

  const sum = numbers.reduce((a, b) => a + b, 0);
  const avg = numbers.length > 0 ? sum / numbers.length : 0;

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="এলোমেলো সংখ্যা জেনারেটর" titleEn="Random Number Generator" descBn="খেলা, লটারি-ছাড়া ড্র ও ক্লাসের বাছাইয়ের জন্য এলোমেলো সংখ্যা তুলুন।" descEn="Draw random numbers for games, draws and classroom picks." chipBn="জুয়া, লটারি বা ক্রিপ্টোগ্রাফির জন্য নয়" chipEn="Not for gambling, lotteries or cryptography" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="rn-min">{t({ bn: 'সর্বনিম্ন', en: 'Minimum' })}</label>
          <input id="rn-min" style={inputStyle} type="number" step={1} inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="rn-max">{t({ bn: 'সর্বোচ্চ', en: 'Maximum' })}</label>
          <input id="rn-max" style={inputStyle} type="number" step={1} inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} placeholder="100" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="rn-count">{t({ bn: 'কয়টি (১–১০০)', en: 'How many (1–100)' })}</label>
          <input id="rn-count" style={inputStyle} type="number" min={1} max={100} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} placeholder="1" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
          <input type="checkbox" checked={unique} onChange={(e) => setUnique(e.target.checked)} />
          {t({ bn: 'আলাদা সংখ্যা (ডুপ্লিকেট নয়)', en: 'Unique numbers (no duplicates)' })}
        </label>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
          <input type="checkbox" checked={sort} onChange={(e) => setSort(e.target.checked)} />
          {t({ bn: 'ছোট থেকে বড় সাজান', en: 'Sort ascending' })}
        </label>
      </div>
      <ButtonRow>
        <button type="button" style={{ minHeight: 44, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={draw}>
          {t({ bn: 'সংখ্যা তুলুন', en: 'Draw numbers' })}
        </button>
      </ButtonRow>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {numbers.length > 0 ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: 0, fontSize: '1.8rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)', wordBreak: 'break-word' }}>{numbers.join(', ')}</p>
          </div>
          <Tiles items={[
            { labelBn: 'সংখ্যা', labelEn: 'Count', value: String(numbers.length) },
            { labelBn: 'যোগফল', labelEn: 'Sum', value: String(sum) },
            { labelBn: 'গড়', labelEn: 'Average', value: avg.toFixed(2) },
          ]} />
          <ButtonRow>
            <CopyButton text={numbers.join(', ')} labelBn="সংখ্যা কপি করুন" labelEn="Copy numbers" />
            {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadText('eduvelto-random-numbers.txt', numbers.join('\n'))} />
          </ButtonRow>
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'সংখ্যা তোলা হয় ডিভাইসের নিরাপদ র‍্যান্ডম জেনারেটর দিয়ে (পক্ষপাতহীন নমুনা)। এটি খেলা, ড্র ও ক্লাসের বাছাইয়ের জন্য — জুয়া, লটারি বা সনদপ্রাপ্ত ড্রয়ের জন্য নয়।', en: 'Numbers are drawn with the device secure random generator (unbiased sampling). It is for games, draws and classroom picks — not for gambling, lotteries or certified draws.' })}</p>
    </section>
  );
}
