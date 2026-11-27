// Eduvelto — Ovulation Calculator tool UI (slug: ovulation-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/healthDates.ts: cycle math
// — ovulation about 14 days before the next period, fertile window
// 5 days before ovulation to 1 day after. An estimate only. The
// page carries a plain disclaimer in bn+en: this is an estimate,
// not medical advice — see a doctor. This tool does NOT diagnose
// and does NOT interpret any test result.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateOvulation } from '../../lib/tools/healthDates';
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
  useCopy,
  HealthHero,
  CopyButton,
} from './healthShared';

const CYCLE_PRESETS = [26, 28, 30];

export function OvulationTool() {
  const { t } = useLanguage();
  const [lmp, setLmp] = useState('');
  const [cycle, setCycle] = useState('28');
  const { copied, copyText } = useCopy();

  const cycleV = parseAmount(cycle);
  const result = useMemo(() => {
    if (lmp.trim() === '' || cycleV === null) return null;
    try {
      return calculateOvulation(lmp, cycleV);
    } catch {
      return null;
    }
  }, [lmp, cycleV]);

  const invalid =
    (lmp.trim() !== '' && result === null) ||
    (cycle.trim() !== '' && cycleV === null);

  function loadExample(): void {
    setLmp('2026-01-01');
    setCycle('28');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="ovul-title">
      <HealthHero
        id="ovul-title"
        titleBn="ডিম্বস্ফোটন ক্যালকুলেটর"
        titleEn="Ovulation Calculator"
        descBn="মাসিক চক্রের তারিখ দিয়ে ডিম্বস্ফোটনের সম্ভাব্য সময়ের অনুমান করুন। সব হিসাব আপনার ডিভাইসেই হয়, কোনো তথ্য কোথাও পাঠানো হয় না।"
        descEn="Estimate the likely ovulation window from menstrual cycle dates. Everything is computed on your device and nothing is sent anywhere."
        trustBn="চক্রের হিসাব • অনুমান মাত্র, চিকিৎসা পরামর্শ নয়"
        trustEn="Cycle math • Estimate only, not medical advice"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="ovul-lmp">
            {t({ bn: 'শেষ মাসিকের প্রথম দিন', en: 'First day of last menstrual period' })}
          </label>
          <input
            id="ovul-lmp"
            style={inputStyle}
            type="date"
            value={lmp}
            onChange={(e) => setLmp(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ovul-cycle">
            {t({ bn: 'চক্রের দৈর্ঘ্য (দিন)', en: 'Cycle length (days)' })}
          </label>
          <input
            id="ovul-cycle"
            style={inputStyle}
            type="number"
            min="21"
            max="35"
            inputMode="numeric"
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
            placeholder="28"
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        {CYCLE_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            className="ev-btn-outline"
            onClick={() => setCycle(String(c))}
          >
            {t({ bn: `${c} দিনের চক্র`, en: `${c}-day cycle` })}
          </button>
        ))}
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (১ জানুয়ারি ২০২৬, ২৮ দিন)', en: 'Load example (1 January 2026, 28 days)' })}
        </button>
      </div>
      <p style={{ ...formulaStyle, marginTop: 14 }}>
        {t({
          bn: 'সতর্কতা: এটি শুধু একটি অনুমান — চিকিৎসা পরামর্শ নয় এবং গর্ভনিরোধের নির্ভরযোগ্য উপায় নয়। সঠিক তথ্যের জন্য চিকিৎসকের পরামর্শ নিন।',
          en: 'Note: this is only an estimate — not medical advice and not a reliable method of contraception. See a doctor for accurate information.',
        })}
      </p>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'সম্ভাব্য ডিম্বস্ফোটনের দিন', en: 'Likely ovulation day' })}</p>
          <p style={headlineStyle}>{result.ovulationDate}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'ovul'}
              onCopy={() =>
                void copyText(
                  `Ovulation ${result.ovulationDate}, fertile ${result.fertileWindowStart} to ${result.fertileWindowEnd}`,
                  'ovul',
                )
              }
              labelBn="তারিখ কপি করুন"
              labelEn="Copy dates"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'উর্বর সময় শুরু', en: 'Fertile window starts' })}</p>
              <p style={tileValueStyle}>{result.fertileWindowStart}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'উর্বর সময় শেষ', en: 'Fertile window ends' })}</p>
              <p style={tileValueStyle}>{result.fertileWindowEnd}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'পরের মাসিকের সম্ভাব্য তারিখ', en: 'Next period (expected)' })}</p>
              <p style={tileValueStyle}>{result.nextPeriodDate}</p>
            </div>
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র: ডিম্বস্ফোটন পরের মাসিকের প্রায় ১৪ দিন আগে হয় — ${lmp} থেকে ${cycleV as number} দিনের চক্রে ডিম্বস্ফোটন ${result.ovulationDate}। উর্বর সময় ডিম্বস্ফোটনের ৫ দিন আগে থেকে ১ দিন পর পর্যন্ত। চক্র অনিয়মিত হলে এই অনুমান ভুল হতে পারে।`,
              en: `Formula: ovulation happens about 14 days before the next period — with a ${cycleV as number}-day cycle from ${lmp}, ovulation falls on ${result.ovulationDate}. The fertile window runs from 5 days before ovulation to 1 day after. Irregular cycles make this estimate less reliable.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক তারিখ ও চক্রের দৈর্ঘ্য (২১–৩৫ দিন) দিন।', en: 'Enter a valid date and cycle length (21–35 days).' })}
        </p>
      ) : null}
    </section>
  );
}
