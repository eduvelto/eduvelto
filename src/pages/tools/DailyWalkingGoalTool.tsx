// Eduvelto — Daily Walking-Goal Calculator tool UI (28 Nov 2026).
//
// Steps in, distance / time / calories out — all labelled as estimates.
// No network, no storage; everything is calculated in the browser.
// Pure logic lives in src/lib/tools/walkingGoal.ts.
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Tiles, ToolSection, errorStyle, formulaStyle, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle } from './eduToolUi';
import {
  DEFAULT_SPEED_KMH,
  DEFAULT_STEPS,
  DEFAULT_STRIDE_CM,
  DEFAULT_WEIGHT_KG,
  calculateWalking,
  estimateStrideCm,
  goalTable,
  parseWalkingField,
} from '../../lib/tools/walkingGoal';

export function DailyWalkingGoalTool() {
  const { t } = useLanguage();
  const [steps, setSteps] = useState(String(DEFAULT_STEPS));
  const [strideCm, setStrideCm] = useState(String(DEFAULT_STRIDE_CM));
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState(String(DEFAULT_WEIGHT_KG));
  const [speedKmh, setSpeedKmh] = useState(String(DEFAULT_SPEED_KMH));

  const stepsNum = parseWalkingField(steps, true);
  const strideNum = parseWalkingField(strideCm, false);
  const weightNum = parseWalkingField(weightKg, false);
  const speedNum = parseWalkingField(speedKmh, false);
  const heightNum = heightCm.trim() === '' ? null : parseWalkingField(heightCm, false);

  const valid = stepsNum !== null && strideNum !== null && weightNum !== null && speedNum !== null;
  const result = valid
    ? calculateWalking({ steps: stepsNum, strideCm: strideNum, weightKg: weightNum, speedKmh: speedNum })
    : null;
  const goals = valid
    ? goalTable({ strideCm: strideNum, weightKg: weightNum, speedKmh: speedNum })
    : [];

  function formatTime(hours: number, minutes: number): string {
    if (hours <= 0) {
      return t({ bn: `${minutes} মিনিট`, en: `${minutes} min` });
    }
    return t({ bn: `${hours} ঘণ্টা ${minutes} মিনিট`, en: `${hours} h ${minutes} min` });
  }

  function onHeightChange(value: string) {
    setHeightCm(value);
    const height = parseWalkingField(value, false);
    if (height !== null) {
      setStrideCm(String(estimateStrideCm(height)));
    }
  }

  const errorMsg = t({ bn: '০-এর বেশি একটি সংখ্যা লিখুন।', en: 'Enter a number greater than 0.' });
  const stepsErrorMsg = t({ bn: '০ বা তার বেশি একটি সংখ্যা লিখুন।', en: 'Enter a number of 0 or more.' });

  return (
    <ToolSection id="daily-walking-goal-title" titleBn="দৈনিক হাঁটার লক্ষ্য ক্যালকুলেটর" titleEn="Daily Walking-Goal Calculator"
      descBn="আপনার দৈনিক পদক্ষেপ থেকে দূরত্ব, সময় আর ক্যালরি হিসাব করুন। সব ফলাফল আনুমানিক — ব্যক্তিভেদে ভিন্ন হতে পারে।"
      descEn="Turn your daily steps into distance, time and calories. All results are estimates — they vary from person to person.">
      <p style={noteStyle}>
        {t({
          bn: 'এই টুলের সব ফলাফল আনুমানিক (estimate)। আসল দূরত্ব আর ক্যালরি আপনার শরীর, হাঁটার গতি, ভূমি আর ফিটনেস অনুযায়ী ভিন্ন হতে পারে।',
          en: 'All results from this tool are estimates. Your real distance and calories vary with your body, walking speed, terrain and fitness.',
        })}
      </p>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="wg-steps">{t({ bn: 'দৈনিক পদক্ষেপ (steps)', en: 'Daily steps' })}</label>
          <input id="wg-steps" style={inputStyle} type="number" min="0" step="1" value={steps} onChange={(e) => setSteps(e.target.value)} />
          {stepsNum === null && <p style={{ ...errorStyle, marginTop: 6 }}>{stepsErrorMsg}</p>}
        </div>
        <div>
          <label style={labelStyle} htmlFor="wg-stride">{t({ bn: 'পদক্ষেপের দৈর্ঘ্য (stride, সেমি)', en: 'Stride length (cm)' })}</label>
          <input id="wg-stride" style={inputStyle} type="number" min="0" step="any" value={strideCm} onChange={(e) => setStrideCm(e.target.value)} />
          {strideNum === null && <p style={{ ...errorStyle, marginTop: 6 }}>{errorMsg}</p>}
        </div>
        <div>
          <label style={labelStyle} htmlFor="wg-height">{t({ bn: 'উচ্চতা (সেমি) — ঐচ্ছিক, stride বসিয়ে দেবে', en: 'Height (cm) — optional, fills stride' })}</label>
          <input id="wg-height" style={inputStyle} type="number" min="0" step="any" value={heightCm}
            placeholder={t({ bn: 'যেমন ১৭০', en: 'e.g. 170' })}
            onChange={(e) => onHeightChange(e.target.value)} />
          {heightNum === null && heightCm.trim() !== '' && <p style={{ ...errorStyle, marginTop: 6 }}>{errorMsg}</p>}
        </div>
        <div>
          <label style={labelStyle} htmlFor="wg-weight">{t({ bn: 'ওজন (কেজি)', en: 'Weight (kg)' })}</label>
          <input id="wg-weight" style={inputStyle} type="number" min="0" step="any" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          {weightNum === null && <p style={{ ...errorStyle, marginTop: 6 }}>{errorMsg}</p>}
        </div>
        <div>
          <label style={labelStyle} htmlFor="wg-speed">{t({ bn: 'হাঁটার গতি (কিমি/ঘণ্টা)', en: 'Walking speed (km/h)' })}</label>
          <input id="wg-speed" style={inputStyle} type="number" min="0" step="any" value={speedKmh} onChange={(e) => setSpeedKmh(e.target.value)} />
          {speedNum === null && <p style={{ ...errorStyle, marginTop: 6 }}>{errorMsg}</p>}
        </div>
      </div>
      <div style={resultStyle} role="status">
        {result === null ? (
          <p style={{ margin: 0 }}>{t({ bn: 'সব ঘরে সঠিক সংখ্যা বসালেই ফলাফল এখানে দেখাবে।', en: 'Enter valid numbers in every field to see the result here.' })}</p>
        ) : (
          <>
            <p style={{ margin: '0 0 6px', fontSize: 16 }}>
              {t({ bn: `${result.steps.toLocaleString('en-US')} পদক্ষেপের আনুমানিক ফলাফল`, en: `Estimated result for ${result.steps.toLocaleString('en-US')} steps` })}
            </p>
            <Tiles items={[
              { label: t({ bn: 'দূরত্ব (আনুমানিক)', en: 'Distance (estimate)' }), value: `${result.distanceKm} km` },
              { label: t({ bn: 'সময় (আনুমানিক)', en: 'Time (estimate)' }), value: formatTime(result.timeHours, result.timeRemainingMinutes) },
              { label: t({ bn: 'ক্যালরি (আনুমানিক)', en: 'Calories (estimate)' }), value: `${result.caloriesKcal} kcal` },
            ]} />
          </>
        )}
        <p style={formulaStyle}>
          {t({
            bn: 'সূত্র: দূরত্ব = পদক্ষেপ × stride ÷ ১০০০; সময় = দূরত্ব ÷ গতি; ক্যালরি ≈ দূরত্ব × ওজন × ০.৫৩। উচ্চতা থেকে stride ≈ উচ্চতা × ০.৪১৪।',
            en: 'Formulas: distance = steps × stride ÷ 1000; time = distance ÷ speed; calories ≈ distance × weight × 0.53. Stride from height ≈ height × 0.414.',
          })}
        </p>
      </div>
      {valid && goals.length > 0 && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <p style={labelStyle}>{t({ bn: 'লক্ষ্য তালিকা (আপনার stride, ওজন আর গতি অনুযায়ী)', en: 'Goal table (using your stride, weight and speed)' })}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'পদক্ষেপ', en: 'Steps' })}</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'দূরত্ব (আনুমানিক)', en: 'Distance (estimate)' })}</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'সময় (আনুমানিক)', en: 'Time (estimate)' })}</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid var(--line)' }}>{t({ bn: 'ক্যালরি (আনুমানিক)', en: 'Calories (estimate)' })}</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((row) => (
                <tr key={row.steps}>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--line)' }}>{row.steps.toLocaleString('en-US')}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--line)' }}>{row.distanceKm} km</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--line)' }}>{formatTime(row.timeHours, row.timeRemainingMinutes)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid var(--line)' }}>{row.caloriesKcal} kcal</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={noteStyle}>
            {t({
              bn: 'টেবিলের সংখ্যাগুলোও আনুমানিক — একই পদক্ষেপে আসল ক্যালরি ব্যক্তিভেদে কম-বেশি হতে পারে।',
              en: 'The table numbers are estimates too — the same step count can burn more or fewer calories for different people.',
            })}
          </p>
        </div>
      )}
    </ToolSection>
  );
}
