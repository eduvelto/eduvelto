// Eduvelto — Pace & Speed Calculator tool UI (slug: pace-speed-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/bodyMetrics.ts: pace =
// time / distance, speed = distance / time. Reverse mode: "what pace
// for a 5K in 30 min?" What-if mode: time for a distance at a pace.
// Distance presets: 5K, 10K, half marathon, marathon.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculatePace, paceForTarget, timeForPace } from '../../lib/tools/bodyMetrics';
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

const DISTANCE_PRESETS: { km: number; bn: string; en: string }[] = [
  { km: 5, bn: '৫ কিমি', en: '5K' },
  { km: 10, bn: '১০ কিমি', en: '10K' },
  { km: 21.1, bn: 'হাফ ম্যারাথন (২১.১ কিমি)', en: 'Half marathon (21.1 km)' },
  { km: 42.2, bn: 'ম্যারাথন (৪২.২ কিমি)', en: 'Marathon (42.2 km)' },
];

export function PaceSpeedTool() {
  const { t } = useLanguage();
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');
  const [whatIfPace, setWhatIfPace] = useState('');
  const { copied, copyText } = useCopy();

  const distanceV = parseAmount(distance);
  const hoursV = parseAmount(hours);
  const minutesV = parseAmount(minutes);
  const secondsV = parseAmount(seconds);
  const targetV = parseAmount(targetMinutes);
  const whatIfV = parseAmount(whatIfPace);
  const invalid =
    (distanceV !== null && distanceV <= 0) ||
    (hoursV !== null && hoursV < 0) ||
    (minutesV !== null && minutesV < 0) ||
    (secondsV !== null && secondsV < 0) ||
    (targetV !== null && targetV <= 0) ||
    (whatIfV !== null && whatIfV <= 0) ||
    (distance.trim() !== '' && distanceV === null);
  const ready =
    distanceV !== null && distanceV > 0 &&
    (hoursV !== null || minutesV !== null || secondsV !== null) &&
    (hoursV ?? 0) >= 0 && (minutesV ?? 0) >= 0 && (secondsV ?? 0) >= 0 &&
    (hoursV ?? 0) * 60 + (minutesV ?? 0) + (secondsV ?? 0) / 60 > 0;

  const result = useMemo(() => {
    if (!ready) return null;
    try {
      return calculatePace({
        distanceKm: distanceV as number,
        hours: hoursV ?? 0,
        minutes: minutesV ?? 0,
        seconds: secondsV ?? 0,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, distanceV, hoursV, minutesV, secondsV]);

  const reverse =
    distanceV !== null && distanceV > 0 && targetV !== null && targetV > 0
      ? paceForTarget(distanceV, targetV)
      : null;
  const whatIf =
    distanceV !== null && distanceV > 0 && whatIfV !== null && whatIfV > 0
      ? timeForPace(distanceV, whatIfV)
      : null;

  function loadExample(): void {
    setDistance('5');
    setHours('');
    setMinutes('30');
    setSeconds('');
    setTargetMinutes('25');
    setWhatIfPace('6');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pace-title">
      <HealthHero
        id="pace-title"
        titleBn="গতি ও পেস ক্যালকুলেটর"
        titleEn="Pace & Speed Calculator"
        descBn="দৌড়ের দূরত্ব ও সময় দিয়ে গতি ও প্রতি কিলোমিটারের সময় হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
        descEn="Calculate running pace and speed from distance and time. Everything is computed on your device."
        trustBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        trustEn="100% in-browser • nothing uploaded"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pace-distance">
            {t({ bn: 'দূরত্ব (কিমি)', en: 'Distance (km)' })}
          </label>
          <input
            id="pace-distance"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="5"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pace-hours">
            {t({ bn: 'সময় — ঘণ্টা', en: 'Time — hours' })}
          </label>
          <input
            id="pace-hours"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="numeric"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pace-minutes">
            {t({ bn: 'সময় — মিনিট', en: 'Time — minutes' })}
          </label>
          <input
            id="pace-minutes"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="numeric"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="30"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pace-seconds">
            {t({ bn: 'সময় — সেকেন্ড', en: 'Time — seconds' })}
          </label>
          <input
            id="pace-seconds"
            style={inputStyle}
            type="number"
            min="0"
            inputMode="numeric"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        {DISTANCE_PRESETS.map((p) => (
          <button
            key={p.km}
            type="button"
            className="ev-btn-outline"
            onClick={() => setDistance(String(p.km))}
          >
            {t({ bn: p.bn, en: p.en })}
          </button>
        ))}
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (৫ কিমি, ৩০ মিনিট)', en: 'Load example (5 km, 30 min)' })}
        </button>
      </div>
      <div style={gridStyle}>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="pace-target">
            {t({ bn: 'উল্টো হিসাব — লক্ষ্য সময় (মিনিট, ঐচ্ছিক)', en: 'Reverse — target time in minutes (optional)' })}
          </label>
          <input
            id="pace-target"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={targetMinutes}
            onChange={(e) => setTargetMinutes(e.target.value)}
            placeholder="25"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="pace-whatif">
            {t({ bn: 'যদি — এই পেসে দৌড়ালে (মিনিট/কিমি, ঐচ্ছিক)', en: 'What-if — pace if you run at (min/km, optional)' })}
          </label>
          <input
            id="pace-whatif"
            style={inputStyle}
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={whatIfPace}
            onChange={(e) => setWhatIfPace(e.target.value)}
            placeholder="6"
          />
        </div>
      </div>
      {reverse && targetV !== null ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `${fmtNum(distanceV as number, 1)} কিমি ${fmtNum(targetV, 1)} মিনিটে শেষ করতে পেস লাগবে ${reverse.paceFormatted} /কিমি (গতি ${fmtNum(reverse.speedKmh)} কিমি/ঘণ্টা)।`,
              en: `To finish ${fmtNum(distanceV as number, 1)} km in ${fmtNum(targetV, 1)} minutes you need a pace of ${reverse.paceFormatted} /km (speed ${fmtNum(reverse.speedKmh)} km/h).`,
            })}
          </p>
        </div>
      ) : null}
      {whatIf !== null ? (
        <div style={{ ...resultStyle, background: 'var(--amber-soft)' }}>
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({
              bn: `${fmtNum(whatIfV as number, 1)} মিনিট/কিমি পেসে ${fmtNum(distanceV as number, 1)} কিমি শেষ হবে প্রায় ${fmtNum(whatIf, 1)} মিনিটে।`,
              en: `At ${fmtNum(whatIfV as number, 1)} min/km, ${fmtNum(distanceV as number, 1)} km would take about ${fmtNum(whatIf, 1)} minutes.`,
            })}
          </p>
        </div>
      ) : null}
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'পেস (প্রতি কিলোমিটার)', en: 'Pace (per kilometre)' })}</p>
          <p style={headlineStyle}>{result.paceFormatted} {t({ bn: '/কিমি', en: '/km' })}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'pace'}
              onCopy={() => void copyText(`Pace ${result.paceFormatted} /km, speed ${fmtNum(result.speedKmh)} km/h`, 'pace')}
              labelBn="পেস কপি করুন"
              labelEn="Copy pace"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'গতি', en: 'Speed' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.speedKmh)} {t({ bn: 'কিমি/ঘণ্টা', en: 'km/h' })}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'গতি (মিটার/সেকেন্ড)', en: 'Speed (m/s)' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.speedMs)} {t({ bn: 'মি/সে', en: 'm/s' })}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'মোট সময়', en: 'Total time' })}</p>
              <p style={tileValueStyle}>{fmtNum(result.totalMinutes, 1)} {t({ bn: 'মিনিট', en: 'min' })}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: পেস = ${fmtNum(result.totalMinutes, 1)} মিনিট ÷ ${fmtNum(distanceV as number, 1)} কিমি = ${fmtNum(result.paceMinPerKm)} মিনিট/কিমি; গতি = ${fmtNum(distanceV as number, 1)} ÷ ${fmtNum(result.totalMinutes / 60)} ঘণ্টা = ${fmtNum(result.speedKmh)} কিমি/ঘণ্টা।`,
              en: `Formula: pace = ${fmtNum(result.totalMinutes, 1)} min ÷ ${fmtNum(distanceV as number, 1)} km = ${fmtNum(result.paceMinPerKm)} min/km; speed = ${fmtNum(distanceV as number, 1)} ÷ ${fmtNum(result.totalMinutes / 60)} h = ${fmtNum(result.speedKmh)} km/h.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক মান দিন — দূরত্ব শূন্যের বেশি হতে হবে, সময় ঋণাত্মক হতে পারবে না।', en: 'Enter valid values — distance must be greater than zero and time cannot be negative.' })}
        </p>
      ) : null}
    </section>
  );
}
