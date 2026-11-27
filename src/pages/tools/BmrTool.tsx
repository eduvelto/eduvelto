// Eduvelto — BMR Calculator tool UI (slug: bmr-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bodyMetrics.ts: BMR via
// the Mifflin-St Jeor equation (1990). All outputs are informational
// estimates.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateBmr, type Sex } from '../../lib/tools/bodyMetrics';
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

export function BmrTool() {
  const { t } = useLanguage();
  const [sex, setSex] = useState<Sex>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const { copied, copyText } = useCopy();

  const weightV = parseAmount(weight);
  const heightV = parseAmount(height);
  const ageV = parseAmount(age);
  const invalid =
    (weightV !== null && weightV <= 0) ||
    (heightV !== null && heightV <= 0) ||
    (ageV !== null && ageV <= 0) ||
    (weight.trim() !== '' && weightV === null) ||
    (height.trim() !== '' && heightV === null) ||
    (age.trim() !== '' && ageV === null);
  const ready =
    weightV !== null && weightV > 0 && heightV !== null && heightV > 0 && ageV !== null && ageV > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateBmr({
        sex,
        weightKg: weightV as number,
        heightCm: heightV as number,
        ageYears: ageV as number,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sex, weightV, heightV, ageV]);

  function loadExample(): void {
    setSex('male');
    setWeight('70');
    setHeight('175');
    setAge('30');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="bmr-title">
      <HealthHero
        id="bmr-title"
        titleBn="বিএমআর ক্যালকুলেটর"
        titleEn="BMR Calculator"
        descBn="বিশ্রাম অবস্থায় শরীর দৈনিক কত ক্যালোরি খরচ করে তা হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Calculate how many calories your body uses each day at rest. Everything is computed on your device."
        trustBn="সূত্র: Mifflin-St Jeor, 1990 • ১০০% ব্রাউজারে"
        trustEn="Source: Mifflin-St Jeor, 1990 • 100% in-browser"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="bmr-sex">
            {t({ bn: 'লিঙ্গ', en: 'Sex' })}
          </label>
          <select
            id="bmr-sex"
            style={inputStyle}
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="male">{t({ bn: 'পুরুষ', en: 'Male' })}</option>
            <option value="female">{t({ bn: 'নারী', en: 'Female' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="bmr-weight">
            {t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' })}
          </label>
          <input
            id="bmr-weight"
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
          <label style={labelStyle} htmlFor="bmr-height">
            {t({ bn: 'উচ্চতা (সেমি)', en: 'Height (cm)' })}
          </label>
          <input
            id="bmr-height"
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
          <label style={labelStyle} htmlFor="bmr-age">
            {t({ bn: 'বয়স (বছর)', en: 'Age (years)' })}
          </label>
          <input
            id="bmr-age"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="30"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (পুরুষ, ৭০ কেজি, ১৭৫ সেমি, ৩০ বছর)', en: 'Load example (male, 70 kg, 175 cm, 30 years)' })}
        </button>
      </div>
      {result !== null ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'বিএমআর (দৈনিক, বিশ্রামে)', en: 'BMR (daily, at rest)' })}</p>
          <p style={headlineStyle}>{fmtNum(result)} {t({ bn: 'ক্যালোরি', en: 'kcal' })}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'bmr'}
              onCopy={() => void copyText(`BMR ${fmtNum(result)} kcal/day`, 'bmr')}
              labelBn="বিএমআর কপি করুন"
              labelEn="Copy BMR"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'প্রতি ঘণ্টায়', en: 'Per hour' })}</p>
              <p style={tileValueStyle}>{fmtNum(Math.round(result / 24))} {t({ bn: 'ক্যালোরি', en: 'kcal' })}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'সাপ্তাহিক', en: 'Per week' })}</p>
              <p style={tileValueStyle}>{fmtNum(result * 7)} {t({ bn: 'ক্যালোরি', en: 'kcal' })}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র (Mifflin-St Jeor, 1990): BMR = ১০ × ${fmtNum(weightV as number, 1)} + ৬.২৫ × ${fmtNum(heightV as number, 1)} − ৫ × ${fmtNum(ageV as number, 0)} ${sex === 'male' ? '+ ৫' : '− ১৬১'} = ${fmtNum(result)} ক্যালোরি/দিন। এটি বিশ্রামে শরীরের খরচ — দৈনিক মোট চাহিদা জানতে TDEE ক্যালকুলেটর দেখুন।`,
              en: `Formula (Mifflin-St Jeor, 1990): BMR = 10 × ${fmtNum(weightV as number, 1)} + 6.25 × ${fmtNum(heightV as number, 1)} − 5 × ${fmtNum(ageV as number, 0)} ${sex === 'male' ? '+ 5' : '− 161'} = ${fmtNum(result)} kcal/day. This is the at-rest cost — see the TDEE calculator for total daily needs.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — ওজন, উচ্চতা ও বয়স শূন্যের বেশি হতে হবে।', en: 'Enter valid values — weight, height and age must be greater than zero.' })}
        </p>
      ) : null}
    </section>
  );
}
