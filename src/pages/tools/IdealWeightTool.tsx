// Eduvelto — Ideal Weight Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: idealWeight() in src/lib/tools/idealWeight.ts (Devine/Robinson/Miller/Hamwi + BMI 18.5–24.9 range). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { idealWeight, ASIAN_BMI_NOTE_BN, ASIAN_BMI_NOTE_EN } from '../../lib/tools/idealWeight';

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



export function IdealWeightTool() {
  const { t,} = useLanguage();
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState('175');
  const [weight, setWeight] = useState('90');
  const heightV = parseNum(height);
  const weightV = parseNum(weight);
  const result = useMemo(() => {
    if (heightV === null) return null;
    try {
      return idealWeight({ heightCm: heightV, sex, currentWeightKg: weightV ?? undefined });
    } catch {
      return null;
    }
  }, [heightV, weightV, sex]);

  function loadExample(): void {
    setSex('male');
    setHeight('175');
    setWeight('90');
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="আদর্শ ওজন ক্যালকুলেটর" titleEn="Ideal Weight Calculator" descBn="উচ্চতা অনুযায়ী স্বাস্থ্যকর ওজনের সীমা ও পরিচিত সূত্রগুলোর অনুমান দেখুন।" descEn="See the healthy weight range for your height and the classic formula estimates." chipBn="তথ্যভিত্তিক অনুমান — চিকিৎসা পরামর্শ নয়" chipEn="Informational estimates — not medical advice" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="iw-sex">{t({ bn: 'লিঙ্গ', en: 'Sex' })}</label>
          <select id="iw-sex" style={inputStyle} value={sex} onChange={(e) => setSex(e.target.value as 'male' | 'female')}>
            <option value="male">{t({ bn: 'পুরুষ', en: 'Male' })}</option>
            <option value="female">{t({ bn: 'নারী', en: 'Female' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="iw-height">{t({ bn: 'উচ্চতা (সেমি)', en: 'Height (cm)' })}</label>
          <input id="iw-height" style={inputStyle} type="number" min="1" max="300" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="iw-weight">{t({ bn: 'বর্তমান ওজন (কেজি, ঐচ্ছিক)', en: 'Current weight (kg, optional)' })}</label>
          <input id="iw-weight" style={inputStyle} type="number" min="0" step="0.1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="90" />
        </div>
      </div>
      <ButtonRow>
        <ExampleButton onLoad={loadExample} />
        <ClearButton onClear={() => { setHeight(''); setWeight(''); }} disabled={height === '' && weight === ''} />
      </ButtonRow>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'স্বাস্থ্যকর ওজনের সীমা (BMI ১৮.৫–২৪.৯)', en: 'Healthy weight range (BMI 18.5–24.9)' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.healthyRangeKg.min}–{result.healthyRangeKg.max} {t({ bn: 'কেজি', en: 'kg' })}</p>
            {result.toBmi25Kg !== null && result.toBmi25Kg > 0 ? (
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `BMI ২৫-এ পৌঁছাতে কমাতে হবে প্রায় ${result.toBmi25Kg} কেজি`, en: `Lose about ${result.toBmi25Kg} kg to reach BMI 25` })}</p>
            ) : null}
            {result.toBmi25Kg !== null && result.toBmi25Kg < 0 ? (
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `BMI ২৫-এর নিচে আছেন — বাড়াতে পারেন প্রায় ${-result.toBmi25Kg} কেজি`, en: `You are below BMI 25 — you could gain about ${-result.toBmi25Kg} kg` })}</p>
            ) : null}
          </div>
          <Tiles items={[
            { labelBn: 'ডিভাইন (১৯৭৪)', labelEn: 'Devine (1974)', value: `${result.devineKg} kg` },
            { labelBn: 'রবিনসন (১৯৮৩)', labelEn: 'Robinson (1983)', value: `${result.robinsonKg} kg` },
            { labelBn: 'মিলার (১৯৮৩)', labelEn: 'Miller (1983)', value: `${result.millerKg} kg` },
            { labelBn: 'হামউই (১৯৬৪)', labelEn: 'Hamwi (1964)', value: `${result.hamwiKg} kg` },
            { labelBn: 'BMI ২২-এর জন্য পার্থক্য', labelEn: 'Difference to BMI 22', value: result.toBmi22Kg === null ? '—' : `${result.toBmi22Kg > 0 ? '+' : ''}${result.toBmi22Kg} kg` },
          ]} />
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক উচ্চতা দিন (১–৩০০ সেমি)।', en: 'Enter a valid height (1–300 cm).' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: ASIAN_BMI_NOTE_BN, en: ASIAN_BMI_NOTE_EN })}</p>
      <p style={noteStyle}>{t({ bn: 'ডিভাইন, রবিনসন, মিলার ও হামউই ১৯৬০–৮০ দশকের চিকিৎসা-সাহিত্যের পরিচিত সূত্র — এগুলো অনুমান, প্রেসক্রিপশন নয়। ওজন নিয়ে সিদ্ধান্তের আগে চিকিৎসকের সঙ্গে কথা বলুন।', en: 'Devine, Robinson, Miller and Hamwi are commonly quoted clinical formulas from the 1960s–80s — estimates, not prescriptions. Talk to a doctor before acting on weight.' })}</p>
    </section>
  );
}
