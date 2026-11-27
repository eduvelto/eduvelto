// Eduvelto — Sleep Cycle Calculator tool UI (slug: sleep-cycle-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/healthDates.ts: one cycle
// is about 90 minutes, plus about 15 minutes to fall asleep.
// Two modes: pick a wake time -> bedtimes, or pick a bedtime ->
// wake times. Presets: 4, 5 or 6 full cycles. All outputs are
// informational estimates.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { bedtimesForWake, wakeTimesForBed } from '../../lib/tools/healthDates';
import {
  inputStyle,
  labelStyle,
  gridStyle,
  cardStyle,
  resultStyle,
  tileGridStyle,
  tileStyle,
  tileLabelStyle,
  tileValueStyle,
  formulaStyle,
  errorStyle,
  buttonRowStyle,
  useCopy,
  HealthHero,
  CopyButton,
} from './healthShared';

type SleepMode = 'wake' | 'bed';

export function SleepCycleTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<SleepMode>('wake');
  const [time, setTime] = useState('');
  const { copied, copyText } = useCopy();

  const options = useMemo(() => {
    if (time.trim() === '') return null;
    try {
      return mode === 'wake' ? bedtimesForWake(time) : wakeTimesForBed(time);
    } catch {
      return null;
    }
  }, [time, mode]);

  const invalid = time.trim() !== '' && options === null;

  function loadExample(): void {
    setMode('wake');
    setTime('06:00');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="sleep-title">
      <HealthHero
        id="sleep-title"
        titleBn="ঘুমের চক্র ক্যালকুলেটর"
        titleEn="Sleep Cycle Calculator"
        descBn="কখন ঘুমাতে গেলে বা কখন উঠলে ঘুম পূর্ণ হবে তা হিসাব করুন। একটি ঘুমের চক্র প্রায় ৯০ মিনিট, আর ঘুম আসতে প্রায় ১৫ মিনিট ধরা হয়। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Find the right bedtime or wake-up time based on sleep cycles. One sleep cycle is about 90 minutes, plus about 15 minutes to fall asleep. Everything is computed on your device."
        trustBn="৯০ মিনিটের ঘুমের চক্র • ১০০% ব্রাউজারে"
        trustEn="90-minute sleep cycles • 100% in-browser"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="sleep-mode">
            {t({ bn: 'কী ঠিক করবেন?', en: 'What is fixed?' })}
          </label>
          <select
            id="sleep-mode"
            style={inputStyle}
            value={mode}
            onChange={(e) => setMode(e.target.value as SleepMode)}
          >
            <option value="wake">{t({ bn: 'ওঠার সময় — কখন ঘুমাবো?', en: 'Wake-up time — when should I sleep?' })}</option>
            <option value="bed">{t({ bn: 'ঘুমের সময় — কখন উঠবো?', en: 'Bedtime — when should I wake?' })}</option>
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="sleep-time">
            {mode === 'wake'
              ? t({ bn: 'কখন উঠতে চান? (২৪ ঘণ্টা)', en: 'When do you want to wake? (24-hour)' })
              : t({ bn: 'কখন ঘুমাতে যাবেন? (২৪ ঘণ্টা)', en: 'When will you go to bed? (24-hour)' })}
          </label>
          <input
            id="sleep-time"
            style={inputStyle}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (সকাল ৬টায় ওঠা)', en: 'Load example (wake at 06:00)' })}
        </button>
      </div>
      {options ? (
        <div style={resultStyle} role="status">
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'sleep'}
              onCopy={() =>
                void copyText(
                  options.map((o) => `${o.cycles} cycles (${o.hours}h): ${o.time}`).join(', '),
                  'sleep',
                )
              }
              labelBn="সময়গুলো কপি করুন"
              labelEn="Copy times"
            />
          </div>
          <div style={tileGridStyle}>
            {options.map((o) => (
              <div key={o.cycles} style={tileStyle}>
                <p style={tileLabelStyle}>
                  {o.cycles} {t({ bn: 'চক্র', en: 'cycles' })} — {o.hours} {t({ bn: 'ঘণ্টা', en: 'hours' })}
                </p>
                <p style={tileValueStyle}>{o.time}</p>
              </div>
            ))}
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: একটি চক্র ৯০ মিনিট + ঘুম আসতে ১৫ মিনিট। ${mode === 'wake' ? `ওঠার সময় ${time} থেকে ৪/৫/৬ চক্র পেছনে গিয়ে ঘুমের সময় বের হয়েছে।` : `ঘুমের সময় ${time} থেকে ৪/৫/৬ চক্র সামনে গিয়ে ওঠার সময় বের হয়েছে।`} চক্রের মাঝখানে উঠলে ঘুম ভাঙা মনে হতে পারে — তাই পূর্ণ চক্রে ওঠাই ভালো। এটি একটি সাধারণ নির্দেশিকা।`,
              en: `Formula: one cycle is 90 minutes + 15 minutes to fall asleep. ${mode === 'wake' ? `Bedtimes are counted back 4/5/6 cycles from wake time ${time}.` : `Wake times are counted forward 4/5/6 cycles from bedtime ${time}.`} Waking mid-cycle can feel groggy — waking at the end of a full cycle is better. This is a general guide.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক সময় দিন (ঘণ্টা:মিনিট, ২৪ ঘণ্টার ঘড়ি)।', en: 'Enter a valid time (hours:minutes, 24-hour clock).' })}
        </p>
      ) : null}
    </section>
  );
}
