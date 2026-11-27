// Eduvelto — Heart Rate Zone Calculator tool UI
// (slug: heart-rate-zone-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bodyMetrics.ts: Karvonen
// formula (1957) with HRmax = 220 - age. All outputs are
// informational estimates.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateHeartRateZones } from '../../lib/tools/bodyMetrics';
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

export function HeartRateZoneTool() {
  const { t } = useLanguage();
  const [age, setAge] = useState('');
  const [resting, setResting] = useState('');
  const { copied, copyText } = useCopy();

  const ageV = parseAmount(age);
  const restingV = parseAmount(resting);
  const invalid =
    (ageV !== null && ageV <= 0) ||
    (restingV !== null && restingV <= 0) ||
    (age.trim() !== '' && ageV === null) ||
    (resting.trim() !== '' && restingV === null);
  const ready = ageV !== null && ageV > 0 && restingV !== null && restingV > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculateHeartRateZones(ageV as number, restingV as number);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, ageV, restingV]);

  function loadExample(): void {
    setAge('30');
    setResting('60');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="hr-title">
      <HealthHero
        id="hr-title"
        titleBn="হার্ট রেট জোন ক্যালকুলেটর"
        titleEn="Heart Rate Zone Calculator"
        descBn="বয়স ও হৃদস্পন্দন দিয়ে ব্যায়ামের হার্ট রেট জোন হিসাব করুন। বিশ্রামের হৃদস্পন্দন সকালে ঘুম থেকে উঠে মাপুন। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Calculate exercise heart rate zones from age and heart rate. Measure resting heart rate in the morning right after waking. Everything is computed on your device."
        trustBn="সূত্র: Karvonen, 1957; HRmax = ২২০ − বয়স • ১০০% ব্রাউজারে"
        trustEn="Source: Karvonen, 1957; HRmax = 220 − age • 100% in-browser"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="hr-age">
            {t({ bn: 'বয়স (বছর)', en: 'Age (years)' })}
          </label>
          <input
            id="hr-age"
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
          <label style={labelStyle} htmlFor="hr-resting">
            {t({ bn: 'বিশ্রামের হৃদস্পন্দন (প্রতি মিনিটে)', en: 'Resting heart rate (bpm)' })}
          </label>
          <input
            id="hr-resting"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="numeric"
            value={resting}
            onChange={(e) => setResting(e.target.value)}
            placeholder="60"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (৩০ বছর, বিশ্রামে ৬০)', en: 'Load example (30 years, resting 60)' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'সর্বোচ্চ হৃদস্পন্দন (আনুমানিক)', en: 'Maximum heart rate (estimate)' })}</p>
          <p style={headlineStyle}>{fmtNum(result.maxHr, 0)} {t({ bn: 'বিপিএম', en: 'bpm' })}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'hr'}
              onCopy={() =>
                void copyText(
                  result.zones.map((z) => `${z.zone} ${z.lowBpm}-${z.highBpm} bpm`).join(', '),
                  'hr',
                )
              }
              labelBn="জোনগুলো কপি করুন"
              labelEn="Copy zones"
            />
          </div>
          <div style={tileGridStyle}>
            {result.zones.map((z) => (
              <div key={z.zone} style={tileStyle}>
                <p style={tileLabelStyle}>
                  {z.zone} — {t({ bn: z.nameBn, en: z.nameEn })}
                </p>
                <p style={tileValueStyle}>
                  {z.lowBpm}–{z.highBpm} {t({ bn: 'বিপিএম', en: 'bpm' })}
                </p>
              </div>
            ))}
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র (Karvonen, ১৯৫৭): সর্বোচ্চ হৃদস্পন্দন = ২২০ − ${fmtNum(ageV as number, 0)} = ${fmtNum(result.maxHr, 0)}; রিজার্ভ = ${fmtNum(result.maxHr, 0)} − ${fmtNum(restingV as number, 0)} = ${fmtNum(result.maxHr - (restingV as number), 0)}। প্রতিটি জোন = বিশ্রাম + রিজার্ভ × তীব্রতা। HRmax একটি জনপ্রিয় অনুমান — ব্যক্তিভেদে ভিন্ন হতে পারে; অস্বস্তি হলে ব্যায়াম থামিয়ে চিকিৎসকের পরামর্শ নিন।`,
              en: `Formula (Karvonen, 1957): maximum heart rate = 220 − ${fmtNum(ageV as number, 0)} = ${fmtNum(result.maxHr, 0)}; reserve = ${fmtNum(result.maxHr, 0)} − ${fmtNum(restingV as number, 0)} = ${fmtNum(result.maxHr - (restingV as number), 0)}. Each zone = resting + reserve × intensity. HRmax is a popular estimate and varies between people; stop exercising and see a doctor if you feel unwell.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — বয়স ও বিশ্রামের হৃদস্পন্দন শূন্যের বেশি হতে হবে, আর বিশ্রামের মান সর্বোচ্চের চেয়ে কম হতে হবে।', en: 'Enter valid values — age and resting heart rate must be greater than zero, and resting must be below the maximum.' })}
        </p>
      ) : null}
    </section>
  );
}
