// Eduvelto — BMI Calculator tool UI (slug: bmi-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bodyMetrics.ts: BMI =
// weight (kg) / height (m)^2, categories per WHO. Reverse mode:
// "what weight for BMI 22?" All outputs are informational estimates.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateBmi, weightForBmi, BMI_CATEGORY_LABELS } from '../../lib/tools/bodyMetrics';
import {
  inputStyle,
  labelStyle,
  gridStyle,
  cardStyle,
  resultStyle,
  headlineStyle,
  headlineLabelStyle,
  tileGridStyle,
  tileStyle,
  tileLabelStyle,
  tileValueStyle,
  formulaStyle,
  errorStyle,
  buttonRowStyle,
  parseAmount,
  fmtNum,
  useCopy,
  HealthHero,
  CopyButton,
} from './healthShared';

export function BmiTool() {
  const { t } = useLanguage();
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [targetBmi, setTargetBmi] = useState('');
  const { copied, copyText } = useCopy();

  const weightV = parseAmount(weight);
  const heightV = parseAmount(height);
  const targetV = parseAmount(targetBmi);
  const invalid =
    (weightV !== null && weightV <= 0) ||
    (heightV !== null && heightV <= 0) ||
    (targetV !== null && targetV <= 0) ||
    (weight.trim() !== '' && weightV === null) ||
    (height.trim() !== '' && heightV === null) ||
    (targetBmi.trim() !== '' && targetV === null);
  const ready = weightV !== null && weightV > 0 && heightV !== null && heightV > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateBmi({ weightKg: weightV as number, heightCm: heightV as number });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, weightV, heightV]);

  const reverseWeight =
    targetV !== null && targetV > 0 && heightV !== null && heightV > 0
      ? weightForBmi(targetV, heightV)
      : null;

  function loadExample(): void {
    setWeight('70');
    setHeight('175');
    setTargetBmi('22');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="bmi-title">
      <HealthHero
        id="bmi-title"
        titleBn="বিএমআই ক্যালকুলেটর"
        titleEn="BMI Calculator"
        descBn="উচ্চতা ও ওজন দিয়ে শরীরের ভর সূচক (BMI) হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Calculate body mass index (BMI) from height and weight. Everything is computed on your device."
        trustBn="সূত্র: WHO BMI শ্রেণিবিভাগ • ১০০% ব্রাউজারে"
        trustEn="Source: WHO BMI classification • 100% in-browser"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="bmi-weight">
            {t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' })}
          </label>
          <input
            id="bmi-weight"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="70"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bmi-height">
            {t({ bn: 'উচ্চতা (সেমি)', en: 'Height (cm)' })}
          </label>
          <input
            id="bmi-height"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="175"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bmi-target">
            {t({ bn: 'উল্টো হিসাব — লক্ষ্য BMI (ঐচ্ছিক)', en: 'Reverse — target BMI (optional)' })}
          </label>
          <input
            id="bmi-target"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={targetBmi}
            onChange={(e) => setTargetBmi(e.target.value)}
            placeholder="22"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (৭০ কেজি, ১৭৫ সেমি)', en: 'Load example (70 kg, 175 cm)' })}
        </button>
      </div>
      {reverseWeight !== null && targetV !== null ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `BMI ${fmtNum(targetV)} পেতে এই উচ্চতায় ওজন হতে হবে ${fmtNum(reverseWeight, 1)} কেজি।`,
              en: `To reach a BMI of ${fmtNum(targetV)} at this height, weight would need to be ${fmtNum(reverseWeight, 1)} kg.`,
            })}
          </p>
        </div>
      ) : null}
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'আপনার BMI', en: 'Your BMI' })}</p>
          <p style={headlineStyle}>{fmtNum(result.bmi)}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'bmi'}
              onCopy={() => void copyText(`BMI ${fmtNum(result.bmi)}`, 'bmi')}
              labelBn="BMI কপি করুন"
              labelEn="Copy BMI"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'শ্রেণি (WHO)', en: 'Category (WHO)' })}</p>
              <p style={tileValueStyle}>
                {t({
                  bn: BMI_CATEGORY_LABELS[result.category].bn,
                  en: BMI_CATEGORY_LABELS[result.category].en,
                })}
              </p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'স্বাস্থ্যকর ওজন', en: 'Healthy weight' })}</p>
              <p style={tileValueStyle}>
                {fmtNum(result.healthyWeightMinKg, 1)}–{fmtNum(result.healthyWeightMaxKg, 1)} {t({ bn: 'কেজি', en: 'kg' })}
              </p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: BMI = ${fmtNum(weightV as number, 1)} ÷ (${fmtNum((heightV as number) / 100)} × ${fmtNum((heightV as number) / 100)}) = ${fmtNum(result.bmi)}। WHO শ্রেণি: ১৮.৫-এর নিচে কম ওজন, ১৮.৫–২৪.৯ স্বাভাবিক, ২৫–২৯.৯ বেশি ওজন, ৩০ বা বেশি স্থূলতা। এটি একটি সাধারণ নির্দেশিকা, চিকিৎসা পরামর্শ নয়।`,
              en: `Formula: BMI = ${fmtNum(weightV as number, 1)} ÷ (${fmtNum((heightV as number) / 100)} × ${fmtNum((heightV as number) / 100)}) = ${fmtNum(result.bmi)}. WHO ranges: below 18.5 underweight, 18.5–24.9 normal, 25–29.9 overweight, 30+ obese. This is a general guide, not medical advice.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — ওজন ও উচ্চতা শূন্যের বেশি হতে হবে।', en: 'Enter valid values — weight and height must be greater than zero.' })}
        </p>
      ) : null}
    </section>
  );
}
