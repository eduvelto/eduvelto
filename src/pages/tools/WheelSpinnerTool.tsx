// Eduvelto — Wheel Spinner tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle, primaryButtonStyle } from './toolUi';
import { spinWheel, parseOptionList } from '../../lib/tools/textTools';
import type { CSSProperties } from 'react';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const headlineStyle: CSSProperties = { fontFamily: 'var(--font-head)', fontSize: '2rem', lineHeight: 1.2, color: 'var(--teal-deep)', margin: '4px 0 0' };
const headlineLabelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--muted)', margin: 0 };

export function WheelSpinnerTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('Pizza\nBurger\nBiriyani\nPasta');
  const [picked, setPicked] = useState<string | null>(null);
  const [spins, setSpins] = useState(0);
  const options = useMemo(() => parseOptionList(input), [input]);
  const spin = () => {
    const result = spinWheel(options);
    if (result !== null) {
      setPicked(result);
      setSpins((s) => s + 1);
    }
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="চাকা ঘোরানো — যেকোনো সিদ্ধান্ত নিন" titleEn="Wheel Spinner — Random Decision Maker" descBn="অপশনের তালিকা দিন, চাকা ঘুরিয়ে একটি বেছে নিন।" descEn="Give a list of options and spin the wheel to pick one." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="wheel-input">{t({ bn: `অপশন (প্রতি লাইনে একটি — ${options.length}টি)`, en: `Options (one per line — ${options.length})` })}</label>
        <textarea id="wheel-input" style={inputStyle} value={input} onChange={(e) => { setInput(e.target.value); setPicked(null); }} placeholder={'Pizza\nBurger\nBiriyani'} />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => { setInput('Pizza\nBurger\nBiriyani\nPasta'); setPicked(null); }} />
        <ClearButton onClear={() => { setInput(''); setPicked(null); }} disabled={input === ''} />
      </ButtonRow>
      <ButtonRow>
        <button type="button" style={primaryButtonStyle} onClick={spin} disabled={options.length === 0}>
          {t({ bn: 'চাকা ঘোরান', en: 'Spin the wheel' })}
        </button>
        {picked ? <CopyButton text={picked} labelBn="ফল কপি করুন" labelEn="Copy result" /> : null}
      </ButtonRow>
      {picked ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'চাকা থামলো এখানে', en: 'The wheel landed on' })}</p>
          <p style={headlineStyle}>{picked}</p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `${options.length}টি অপশন থেকে বাছা হয়েছে • ${spins} বার ঘোরানো হয়েছে`, en: `Picked from ${options.length} options • Spun ${spins} times` })}</p>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'প্রতিটি অপশনের সম্ভাবনা সমান — ফল সম্পূর্ণ দৈবচয়ন।', en: 'Every option has an equal chance — the result is fully random.' })}</p>
    </section>
  );
}
