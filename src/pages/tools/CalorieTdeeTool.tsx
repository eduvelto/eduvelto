// Eduvelto — Calorie & TDEE Calculator tool UI
// (slug: calorie-tdee-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bodyMetrics.ts: ONE shared
// chain — BMR (Mifflin-St Jeor, 1990) x activity factor = TDEE.
// The BMR intermediate value is shown as a tile. Activity levels
// are presets. All outputs are informational estimates.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calculateTdee,
  ACTIVITY_LABELS,
  type ActivityLevel,
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

const ACTIVITIES: ActivityLevel[] = ['sedentary', 'light', 'moderate', 'active', 'veryActive'];

export function CalorieTdeeTool() {
  const { t } = useLanguage();
  const [sex, setSex] = useState<Sex>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
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
      return calculateTdee({
        sex,
        weightKg: weightV as number,
        heightCm: heightV as number,
        ageYears: ageV as number,
        activity,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sex, weightV, heightV, ageV, activity]);

  function loadExample(): void {
    setSex('male');
    setWeight('70');
    setHeight('175');
    setAge('30');
    setActivity('moderate');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="tdee-title">
      <HealthHero
        id="tdee-title"
        titleBn="ক্যালোরি ও টিডিইই ক্যালকুলেটর"
        titleEn="Calorie & TDEE Calculator"
        descBn="দৈনিক কত ক্যালোরি দরকার তা হিসাব করুন। প্রথমে BMR বের হয়, তারপর কাজের ধরন দিয়ে গুণ করে TDEE পাওয়া যায়। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Work out how many calories you need each day. BMR is calculated first, then multiplied by your activity level to give TDEE. Everything is computed on your device."
        trustBn="সূত্র: Mifflin-St Jeor, 1990 • ১০০% ব্রাউজারে"
        trustEn="Source: Mifflin-St Jeor, 1990 • 100% in-browser"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="tdee-sex">
            {t({ bn: 'লিঙ্গ', en: 'Sex' })}
          </label>
          <select
            id="tdee-sex"
            style={inputStyle}
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="male">{t({ bn: 'পুরুষ', en: 'Male' })}</option>
            <option value="female">{t({ bn: 'নারী', en: 'Female' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="tdee-weight">
            {t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' })}
          </label>
          <input
            id="tdee-weight"
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
          <label style={labelStyle} htmlFor="tdee-height">
            {t({ bn: 'উচ্চতা (সেমি)', en: 'Height (cm)' })}
          </label>
          <input
            id="tdee-height"
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
          <label style={labelStyle} htmlFor="tdee-age">
            {t({ bn: 'বয়স (বছর)', en: 'Age (years)' })}
          </label>
          <input
            id="tdee-age"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="numeric"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="30"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="tdee-activity">
            {t({ bn: 'কাজের ধরন', en: 'Activity level' })}
          </label>
          <select
            id="tdee-activity"
            style={inputStyle}
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
          >
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {t({ bn: ACTIVITY_LABELS[a].bn, en: ACTIVITY_LABELS[a].en })}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (পুরুষ, ৭০ কেজি, ১৭৫ সেমি, ৩০ বছর, মাঝারি)', en: 'Load example (male, 70 kg, 175 cm, 30 years, moderate)' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'দৈনিক ক্যালোরি চাহিদা (TDEE)', en: 'Daily calorie needs (TDEE)' })}</p>
          <p style={headlineStyle}>{fmtNum(result.tdee)} {t({ bn: 'ক্যালোরি', en: 'kcal' })}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'tdee'}
              onCopy={() => void copyText(`TDEE ${fmtNum(result.tdee)} kcal/day (BMR ${fmtNum(result.bmr)})`, 'tdee')}
              labelBn="TDEE কপি করুন"
              labelEn="Copy TDEE"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'বিএমআর (বিশ্রামে)', en: 'BMR (at rest)' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.bmr)} {t({ bn: 'ক্যালোরি', en: 'kcal' })}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'কাজের গুণক', en: 'Activity factor' })}</p>
              <p style={tileValueStyle}>× {result.activityFactor}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'সাপ্তাহিক', en: 'Per week' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.tdee * 7)} {t({ bn: 'ক্যালোরি', en: 'kcal' })}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: TDEE = BMR × কাজের গুণক = ${fmtNum(result.bmr)} × ${result.activityFactor} = ${fmtNum(result.tdee)} ক্যালোরি/দিন। BMR বের হয় Mifflin-St Jeor সূত্রে (১৯৯০)। ওজন ধরে রাখতে এই পরিমাণ ক্যালোরি দরকার — এটি একটি অনুমান, চিকিৎসা পরামর্শ নয়।`,
              en: `Formula: TDEE = BMR × activity factor = ${fmtNum(result.bmr)} × ${result.activityFactor} = ${fmtNum(result.tdee)} kcal/day. BMR comes from the Mifflin-St Jeor equation (1990). This is the amount to maintain weight — an estimate, not medical advice.`,
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
