// Eduvelto — Water Intake Calculator tool UI (slug: water-intake-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bodyMetrics.ts: 30–40 ml
// per kg per day, recommended 35 ml/kg plus exercise and hot-day
// additions. All outputs are informational estimates.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateWaterIntake } from '../../lib/tools/bodyMetrics';
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

export function WaterIntakeTool() {
  const { t } = useLanguage();
  const [weight, setWeight] = useState('');
  const [exercise, setExercise] = useState('');
  const [hot, setHot] = useState(false);
  const { copied, copyText } = useCopy();

  const weightV = parseAmount(weight);
  const exerciseV = parseAmount(exercise);
  const invalid =
    (weightV !== null && weightV <= 0) ||
    (exerciseV !== null && exerciseV < 0) ||
    (weight.trim() !== '' && weightV === null) ||
    (exercise.trim() !== '' && exerciseV === null);
  const ready = weightV !== null && weightV > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateWaterIntake({
        weightKg: weightV as number,
        exerciseMinutes: exerciseV ?? 0,
        hotClimate: hot,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, weightV, exerciseV, hot]);

  function loadExample(): void {
    setWeight('70');
    setExercise('30');
    setHot(false);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="water-title">
      <HealthHero
        id="water-title"
        titleBn="পানি পান ক্যালকুলেটর"
        titleEn="Water Intake Calculator"
        descBn="ওজন ও দৈনিক কাজের ধরন অনুযায়ী কত পানি পান করা উচিত তা হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Work out how much water to drink each day based on weight and activity. Everything is computed on your device."
        trustBn="নির্দেশনা: ৩০–৪০ মিলি/কেজি/দিন • ১০০% ব্রাউজারে"
        trustEn="Guidance: 30–40 ml/kg/day • 100% in-browser"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="water-weight">
            {t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' })}
          </label>
          <input
            id="water-weight"
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
          <label style={labelStyle} htmlFor="water-exercise">
            {t({ bn: 'ব্যায়াম (মিনিট/দিন, ঐচ্ছিক)', en: 'Exercise (minutes/day, optional)' })}
          </label>
          <input
            id="water-exercise"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="numeric"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            placeholder="30"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="water-hot">
            {t({ bn: 'গরম আবহাওয়া / বেশি ঘাম', en: 'Hot weather / heavy sweating' })}
          </label>
          <input
            id="water-hot"
            type="checkbox"
            checked={hot}
            onChange={(e) => setHot(e.target.checked)}
            style={{ minHeight: 44, width: 22 }}
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (৭০ কেজি, ৩০ মিনিট ব্যায়াম)', en: 'Load example (70 kg, 30 min exercise)' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'দৈনিক পানি (আনুমানিক)', en: 'Daily water (estimate)' })}</p>
          <p style={headlineStyle}>{fmtNum(result.recommendedLitres, 1)} {t({ bn: 'লিটার', en: 'L' })}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'water'}
              onCopy={() => void copyText(`${fmtNum(result.recommendedMl, 0)} ml/day`, 'water')}
              labelBn="ফল কপি করুন"
              labelEn="Copy result"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মিলিলিটার', en: 'Millilitres' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.recommendedMl, 0)} {t({ bn: 'মিলি', en: 'ml' })}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'সাধারণ পরিসর', en: 'Usual range' })}</p>
              <p style={tileValueStyle}>
                {fmtNum(result.lowMl, 0)}–{fmtNum(result.highMl, 0)} {t({ bn: 'মিলি', en: 'ml' })}
              </p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'গ্লাস (২৫০ মিলি করে)', en: 'Glasses (250 ml each)' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.glasses, 0)}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: ${fmtNum(weightV as number, 1)} কেজি × ৩৫ মিলি = ${fmtNum(35 * (weightV as number), 0)} মিলি${(exerciseV ?? 0) > 0 ? ` + ব্যায়াম ${fmtNum(exerciseV as number, 0)} মিনিট × ১২ = ${fmtNum((exerciseV as number) * 12, 0)} মিলি` : ''}${hot ? ' + গরম দিনে ৫০০ মিলি' : ''} = ${fmtNum(result.recommendedMl, 0)} মিলি। খাবারের পানিও এর অংশ; তৃষ্ণা ও প্রস্রাবের রং দেখে নিজের চাহিদা বুঝুন — এটি একটি সাধারণ নির্দেশিকা, চিকিৎসা পরামর্শ নয়।`,
              en: `Formula: ${fmtNum(weightV as number, 1)} kg × 35 ml = ${fmtNum(35 * (weightV as number), 0)} ml${(exerciseV ?? 0) > 0 ? ` + exercise ${fmtNum(exerciseV as number, 0)} min × 12 = ${fmtNum((exerciseV as number) * 12, 0)} ml` : ''}${hot ? ' + 500 ml for a hot day' : ''} = ${fmtNum(result.recommendedMl, 0)} ml. Water in food counts too; thirst and urine colour are your own guides — this is a general guide, not medical advice.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — ওজন শূন্যের বেশি হতে হবে, ব্যায়াম ঋণাত্মক হতে পারবে না।', en: 'Enter valid values — weight must be greater than zero and exercise cannot be negative.' })}
        </p>
      ) : null}
    </section>
  );
}
