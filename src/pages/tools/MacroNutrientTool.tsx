// Eduvelto — Macro Nutrient Calculator tool UI
// (slug: macro-nutrient-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Uses the SAME shared chain as the BMR/TDEE tools
// (src/lib/tools/bodyMetrics.ts): BMR (Mifflin-St Jeor, 1990) ->
// TDEE -> macro split (protein/carbs 4 kcal/g, fat 9 kcal/g).
// Goal presets change the split. All outputs are informational
// estimates, not a prescription.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  calculateTdee,
  calculateMacros,
  MACRO_SPLITS,
  ACTIVITY_LABELS,
  type ActivityLevel,
  type MacroGoal,
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

const GOALS: { key: MacroGoal; bn: string; en: string }[] = [
  { key: 'maintain', bn: 'ওজন ধরে রাখা (৩০/৪০/৩০)', en: 'Maintain weight (30/40/30)' },
  { key: 'lose', bn: 'ওজন কমানো (৩৫/৩৫/৩০)', en: 'Lose weight (35/35/30)' },
  { key: 'gain', bn: 'ওজন বাড়ানো (২৫/৪৫/৩০)', en: 'Gain weight (25/45/30)' },
];

export function MacroNutrientTool() {
  const { t } = useLanguage();
  const [sex, setSex] = useState<Sex>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<MacroGoal>('maintain');
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
      const tdee = calculateTdee({
        sex,
        weightKg: weightV as number,
        heightCm: heightV as number,
        ageYears: ageV as number,
        activity,
      });
      return { tdee, macros: calculateMacros(tdee.tdee, goal) };
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sex, weightV, heightV, ageV, activity, goal]);

  function loadExample(): void {
    setSex('male');
    setWeight('70');
    setHeight('175');
    setAge('30');
    setActivity('moderate');
    setGoal('maintain');
  }

  const split = MACRO_SPLITS[goal];

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="macro-title">
      <HealthHero
        id="macro-title"
        titleBn="ম্যাক্রো নিউট্রিয়েন্ট ক্যালকুলেটর"
        titleEn="Macro Nutrient Calculator"
        descBn="প্রোটিন, কার্বোহাইড্রেট ও ফ্যাটের দৈনিক পরিমাণ হিসাব করুন। প্রথমে আপনার TDEE বের হয়, তারপর লক্ষ্য অনুযায়ী ভাগ হয়। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Calculate daily protein, carbohydrate and fat amounts. Your TDEE is worked out first, then split by your goal. Everything is computed on your device."
        trustBn="প্রোটিন/কার্ব ৪ kcal/g, ফ্যাট ৯ kcal/g • ১০০% ব্রাউজারে"
        trustEn="Protein/carbs 4 kcal/g, fat 9 kcal/g • 100% in-browser"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="macro-sex">
            {t({ bn: 'লিঙ্গ', en: 'Sex' })}
          </label>
          <select
            id="macro-sex"
            style={inputStyle}
            value={sex}
            onChange={(e) => setSex(e.target.value as Sex)}
          >
            <option value="male">{t({ bn: 'পুরুষ', en: 'Male' })}</option>
            <option value="female">{t({ bn: 'নারী', en: 'Female' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="macro-weight">
            {t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' })}
          </label>
          <input
            id="macro-weight"
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
          <label style={labelStyle} htmlFor="macro-height">
            {t({ bn: 'উচ্চতা (সেমি)', en: 'Height (cm)' })}
          </label>
          <input
            id="macro-height"
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
          <label style={labelStyle} htmlFor="macro-age">
            {t({ bn: 'বয়স (বছর)', en: 'Age (years)' })}
          </label>
          <input
            id="macro-age"
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
          <label style={labelStyle} htmlFor="macro-activity">
            {t({ bn: 'কাজের ধরন', en: 'Activity level' })}
          </label>
          <select
            id="macro-activity"
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
        <div>
          <label style={labelStyle} htmlFor="macro-goal">
            {t({ bn: 'লক্ষ্য', en: 'Goal' })}
          </label>
          <select
            id="macro-goal"
            style={inputStyle}
            value={goal}
            onChange={(e) => setGoal(e.target.value as MacroGoal)}
          >
            {GOALS.map((g) => (
              <option key={g.key} value={g.key}>
                {t({ bn: g.bn, en: g.en })}
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
          <p style={headlineLabelStyle}>{t({ bn: 'দৈনিক প্রোটিন', en: 'Daily protein' })}</p>
          <p style={headlineStyle}>{fmtNum(result.macros.proteinG, 1)} {t({ bn: 'গ্রাম', en: 'g' })}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'macro'}
              onCopy={() =>
                void copyText(
                  `Protein ${fmtNum(result.macros.proteinG, 1)} g, carbs ${fmtNum(result.macros.carbsG, 1)} g, fat ${fmtNum(result.macros.fatG, 1)} g (${fmtNum(result.macros.calories)} kcal)`,
                  'macro',
                )
              }
              labelBn="ম্যাক্রো কপি করুন"
              labelEn="Copy macros"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'কার্বোহাইড্রেট', en: 'Carbohydrate' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.macros.carbsG, 1)} {t({ bn: 'গ্রাম', en: 'g' })}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'ফ্যাট', en: 'Fat' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.macros.fatG, 1)} {t({ bn: 'গ্রাম', en: 'g' })}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট ক্যালোরি (TDEE)', en: 'Total calories (TDEE)' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.macros.calories)} {t({ bn: 'ক্যালোরি', en: 'kcal' })}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'বিএমআর', en: 'BMR' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.tdee.bmr)} {t({ bn: 'ক্যালোরি', en: 'kcal' })}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: TDEE ${fmtNum(result.macros.calories)} ক্যালোরির মধ্যে প্রোটিন ${Math.round(split.protein * 100)}% = ${fmtNum(result.macros.proteinKcal)} ক্যালোরি ÷ ৪ = ${fmtNum(result.macros.proteinG, 1)} গ্রাম; কার্ব ${Math.round(split.carbs * 100)}% = ${fmtNum(result.macros.carbsKcal)} ÷ ৪ = ${fmtNum(result.macros.carbsG, 1)} গ্রাম; ফ্যাট ${Math.round(split.fat * 100)}% = ${fmtNum(result.macros.fatKcal)} ÷ ৯ = ${fmtNum(result.macros.fatG, 1)} গ্রাম। এই ভাগ একটি সাধারণ শুরুর অনুপাত, নির্ধারিত খাদ্যতালিকা নয়।`,
              en: `Formula: of ${fmtNum(result.macros.calories)} kcal TDEE, protein ${Math.round(split.protein * 100)}% = ${fmtNum(result.macros.proteinKcal)} kcal ÷ 4 = ${fmtNum(result.macros.proteinG, 1)} g; carbs ${Math.round(split.carbs * 100)}% = ${fmtNum(result.macros.carbsKcal)} ÷ 4 = ${fmtNum(result.macros.carbsG, 1)} g; fat ${Math.round(split.fat * 100)}% = ${fmtNum(result.macros.fatKcal)} ÷ 9 = ${fmtNum(result.macros.fatG, 1)} g. This split is a common starting ratio, not a prescribed diet.`,
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
