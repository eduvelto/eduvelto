// Eduvelto — Body Fat Calculator tool UI (slug: body-fat-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bodyMetrics.ts: U.S. Navy
// method (Hodgdon & Beckett, 1984), all measurements in centimetres;
// categories per the American Council on Exercise (ACE). All outputs
// are informational estimates.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calculateBodyFatWithWeight,
  BODY_FAT_LABELS,
  type Sex,
} from '../../lib/tools/bodyMetrics';
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

export function BodyFatTool() {
  const { t } = useLanguage();
  const [sex, setSex] = useState<Sex>('male');
  const [height, setHeight] = useState('');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [weight, setWeight] = useState('');
  const { copied, copyText } = useCopy();

  const heightV = parseAmount(height);
  const neckV = parseAmount(neck);
  const waistV = parseAmount(waist);
  const hipV = parseAmount(hip);
  const weightV = parseAmount(weight);
  const invalid =
    (heightV !== null && heightV <= 0) ||
    (neckV !== null && neckV <= 0) ||
    (waistV !== null && waistV <= 0) ||
    (hipV !== null && hipV <= 0) ||
    (weightV !== null && weightV <= 0) ||
    (height.trim() !== '' && heightV === null) ||
    (neck.trim() !== '' && neckV === null) ||
    (waist.trim() !== '' && waistV === null) ||
    (hip.trim() !== '' && hipV === null) ||
    (weight.trim() !== '' && weightV === null);
  const ready =
    heightV !== null && heightV > 0 && neckV !== null && neckV > 0 && waistV !== null && waistV > 0 &&
    (sex === 'male' || (hipV !== null && hipV > 0));

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateBodyFatWithWeight({
        sex,
        heightCm: heightV as number,
        neckCm: neckV as number,
        waistCm: waistV as number,
        hipCm: hipV ?? undefined,
        weightKg: weightV !== null && weightV > 0 ? weightV : 70,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sex, heightV, neckV, waistV, hipV, weightV]);

  // Fat/lean mass only counts when the user actually entered a weight.
  const showMass = weightV !== null && weightV > 0;

  function loadExample(): void {
    setSex('male');
    setHeight('175');
    setNeck('38');
    setWaist('85');
    setHip('');
    setWeight('70');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="body-fat-title">
      <HealthHero
        id="body-fat-title"
        titleBn="শরীরের চর্বির হার ক্যালকুলেটর"
        titleEn="Body Fat Calculator"
        descBn="শরীরের মাপ দিয়ে চর্বির আনুমানিক শতাংশ হিসাব করুন। ফিতা দিয়ে গলা, কোমর (নারীদের ক্ষেত্রে নিতম্বও) ও উচ্চতা মাপুন। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Estimate body fat percentage from body measurements. Measure neck, waist (and hips for women) and height with a tape. Everything is computed on your device."
        trustBn="সূত্র: U.S. Navy method, Hodgdon & Beckett 1984 • ১০০% ব্রাউজারে"
        trustEn="Source: U.S. Navy method, Hodgdon & Beckett 1984 • 100% in-browser"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="body-fat-sex">
            {t({ bn: 'লিঙ্গ', en: 'Sex' })}
          </label>
          <select
            id="body-fat-sex"
            style={inputStyle}
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="male">{t({ bn: 'পুরুষ', en: 'Male' })}</option>
            <option value="female">{t({ bn: 'নারী', en: 'Female' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="body-fat-height">
            {t({ bn: 'উচ্চতা (সেমি)', en: 'Height (cm)' })}
          </label>
          <input
            id="body-fat-height"
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
          <label style={labelStyle} htmlFor="body-fat-neck">
            {t({ bn: 'গলার মাপ (সেমি)', en: 'Neck (cm)' })}
          </label>
          <input
            id="body-fat-neck"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={neck}
            onChange={(e) => setNeck(e.target.value)}
            placeholder="38"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="body-fat-waist">
            {t({ bn: 'কোমরের মাপ (সেমি)', en: 'Waist (cm)' })}
          </label>
          <input
            id="body-fat-waist"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            placeholder="85"
          />
        </div>
        {sex === 'female' ? (
          <div>
            <label style={labelStyle} htmlFor="body-fat-hip">
              {t({ bn: 'নিতম্বের মাপ (সেমি)', en: 'Hips (cm)' })}
            </label>
            <input
              id="body-fat-hip"
              style={inputStyle}
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              value={hip}
              onChange={(e) => setHip(e.target.value)}
              placeholder="100"
            />
          </div>
        ) : null}
        <div>
          <label style={labelStyle} htmlFor="body-fat-weight">
            {t({ bn: 'ওজন (কেজি, ঐচ্ছিক)', en: 'Weight (kg, optional)' })}
          </label>
          <input
            id="body-fat-weight"
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
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (পুরুষ, ১৭৫ সেমি, গলা ৩৮, কোমর ৮৫, ৭০ কেজি)', en: 'Load example (male, 175 cm, neck 38, waist 85, 70 kg)' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'শরীরের চর্বি', en: 'Body fat' })}</p>
          <p style={headlineStyle}>{fmtNum(result.bodyFatPercent, 1)}%</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'bf'}
              onCopy={() => void copyText(`Body fat ${fmtNum(result.bodyFatPercent, 1)}%`, 'bf')}
              labelBn="ফল কপি করুন"
              labelEn="Copy result"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'শ্রেণি (ACE)', en: 'Category (ACE)' })}</p>
              <p style={tileValueStyle}>
                {t({ bn: BODY_FAT_LABELS[result.category].bn, en: BODY_FAT_LABELS[result.category].en })}
              </p>
            </div>
            {showMass && result.fatMassKg !== null ? (
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'চর্বির ভর', en: 'Fat mass' })}</p>
                <p style={tileValueStyle}>{fmtNum(result.fatMassKg, 1)} {t({ bn: 'কেজি', en: 'kg' })}</p>
              </div>
            ) : null}
            {showMass && result.leanMassKg !== null ? (
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'চর্বিহীন ভর', en: 'Lean mass' })}</p>
                <p style={tileValueStyle}>{fmtNum(result.leanMassKg, 1)} {t({ bn: 'কেজি', en: 'kg' })}</p>
              </div>
            ) : null}
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: U.S. Navy method (Hodgdon & Beckett, 1984) — সব মাপ সেন্টিমিটারে। ${sex === 'male' ? `পুরুষ: ৪৯৫ ÷ (১.০৩২৪ − ০.১৯০৭৭ × log₁₀(${fmtNum((waistV as number) - (neckV as number), 1)}) + ০.১৫৪৫৬ × log₁₀(${fmtNum(heightV as number, 1)})) − ৪৫০` : `নারী: ৪৯৫ ÷ (১.২৯৫৭৯ − ০.৩৫০০৪ × log₁₀(${fmtNum((waistV as number) + (hipV as number) - (neckV as number), 1)}) + ০.২২১ × log₁₀(${fmtNum(heightV as number, 1)})) − ৪৫০`} = ${fmtNum(result.bodyFatPercent, 1)}%। এটি একটি ক্ষেত্র-অনুমান (সাধারণত ±৩–৪ শতাংশ পয়েন্ট), চিকিৎসা পরামর্শ নয়।`,
              en: `Formula: U.S. Navy method (Hodgdon & Beckett, 1984) — all measurements in centimetres. ${sex === 'male' ? `Men: 495 ÷ (1.0324 − 0.19077 × log₁₀(${fmtNum((waistV as number) - (neckV as number), 1)}) + 0.15456 × log₁₀(${fmtNum(heightV as number, 1)})) − 450` : `Women: 495 ÷ (1.29579 − 0.35004 × log₁₀(${fmtNum((waistV as number) + (hipV as number) - (neckV as number), 1)}) + 0.221 × log₁₀(${fmtNum(heightV as number, 1)})) − 450`} = ${fmtNum(result.bodyFatPercent, 1)}%. This is a field estimate (typically ±3–4 percentage points), not medical advice.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — সব মাপ শূন্যের বেশি হতে হবে, আর কোমর গলার চেয়ে বড় হতে হবে।', en: 'Enter valid values — every measurement must be greater than zero, and waist must be larger than neck.' })}
        </p>
      ) : null}
    </section>
  );
}
