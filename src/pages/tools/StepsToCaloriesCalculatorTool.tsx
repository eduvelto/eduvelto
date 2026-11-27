// Eduvelto — Steps to Calories Calculator tool UI.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: calculateStepsCalories() in src/lib/tools/financeHealthTools.ts. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculateStepsCalories } from '../../lib/tools/financeHealthTools';

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

export function StepsToCaloriesCalculatorTool() {
  const { t } = useLanguage();
  const [steps, setSteps] = useState('10000');
  const [weight, setWeight] = useState('70');
  const [stride, setStride] = useState('0.762');
  const s = parseNum(steps);
  const w = parseNum(weight);
  const st = parseNum(stride);
  const result = useMemo(() => (s !== null && w !== null ? calculateStepsCalories(s, w, st ?? undefined) : null), [s, w, st]);
  const loadExample = () => { setSteps('10000'); setWeight('70'); setStride('0.762'); };
  const clear = () => { setSteps(''); setWeight(''); setStride(''); };

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="হাঁটা থেকে ক্যালরি ক্যালকুলেটর" titleEn="Steps to Calories Calculator" descBn="দৈনিক হাঁটার ধাপ থেকে আনুমানিক কত ক্যালরি খরচ হলো তা দেখুন।" descEn="See roughly how many calories your daily steps burned." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="steps-count">{t({ bn: 'ধাপের সংখ্যা', en: 'Number of steps' })}</label>
          <input id="steps-count" style={shortInputStyle} type="number" min="0" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="10000" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="steps-weight">{t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' })}</label>
          <input id="steps-weight" style={shortInputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="steps-stride">{t({ bn: 'এক ধাপের দৈর্ঘ্য (মিটার)', en: 'Stride length (metres)' })}</label>
          <input id="steps-stride" style={shortInputStyle} type="number" min="0" step="0.01" inputMode="decimal" value={stride} onChange={(e) => setStride(e.target.value)} placeholder="0.762" />
        </div>
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'আনুমানিক ক্যালরি খরচ', en: 'Estimated calories burned' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.calories.toLocaleString('en-US')} kcal</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `দূরত্ব: ${result.distanceKm.toLocaleString('en-US')} কিমি`, en: `Distance: ${result.distanceKm.toLocaleString('en-US')} km` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'ধাপ', labelEn: 'Steps', value: (s ?? 0).toLocaleString('en-US') },
            { labelBn: 'দূরত্ব (মিটার)', labelEn: 'Distance (m)', value: result.distanceM.toLocaleString('en-US') },
            { labelBn: 'ওজন', labelEn: 'Weight', value: `${w ?? 0} kg` },
          ]} />
          <ButtonRow>
            <CopyButton text={`${result.calories} kcal burned from ${s ?? 0} steps (${result.distanceKm} km)`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            <ExampleButton onLoad={loadExample} />
            <ClearButton onClear={clear} />
          </ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — ধাপ ০ বা তার বেশি, ওজন ০-এর বেশি হতে হবে।', en: 'Enter valid values — steps 0 or above, weight above 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এটি একটি অনুমান — আসল ক্যালরি খরচ হাঁটার গতি, ভূমি ও শরীরের ওপর নির্ভর করে বদলায়। এক ধাপের গড় দৈর্ঘ্য ০.৭৬২ মিটার ধরা হয়েছে; চাইলে বদলে নিন।', en: 'This is an estimate — real calorie burn varies with walking speed, terrain and body. Average stride is taken as 0.762 m; change it if you know yours.' })}</p>
    </section>
  );
}
