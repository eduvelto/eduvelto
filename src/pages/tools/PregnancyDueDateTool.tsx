// Eduvelto — Pregnancy Due Date Calculator tool UI
// (slug: pregnancy-due-date-calculator).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure calculation lives in src/lib/tools/healthDates.ts: Naegele's
// rule — last menstrual period + 280 days (40 weeks). Standard
// obstetric estimate. The page carries a plain disclaimer in bn+en:
// this is an estimate, not medical advice — see a doctor. This tool
// does NOT diagnose and does NOT interpret any test result.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateDueDate, gestationalAge } from '../../lib/tools/healthDates';
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
  useCopy,
  HealthHero,
  CopyButton,
} from './healthShared';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PregnancyDueDateTool() {
  const { t } = useLanguage();
  const [lmp, setLmp] = useState('');
  const { copied, copyText } = useCopy();

  const result = useMemo(() => {
    if (lmp.trim() === '') return null;
    try {
      return calculateDueDate(lmp);
    } catch {
      return null;
    }
  }, [lmp]);

  const age = useMemo(() => {
    if (lmp.trim() === '' || result === null) return null;
    try {
      return gestationalAge(lmp, todayIso());
    } catch {
      return null;
    }
  }, [lmp, result]);

  const invalid = lmp.trim() !== '' && result === null;

  function loadExample(): void {
    setLmp('2026-01-01');
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="preg-title">
      <HealthHero
        id="preg-title"
        titleBn="গর্ভাবস্থার সম্ভাব্য তারিখ ক্যালকুলেটর"
        titleEn="Pregnancy Due Date Calculator"
        descBn="শেষ মাসিকের তারিখ দিয়ে সন্তান জন্মের সম্ভাব্য তারিখ হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়, কোনো তথ্য কোথাও পাঠানো হয় না।"
        descEn="Estimate a due date from the first day of the last menstrual period. Everything is computed on your device and nothing is sent anywhere."
        trustBn="সূত্র: Naegele's rule, +২৮০ দিন • অনুমান মাত্র, চিকিৎসা পরামর্শ নয়"
        trustEn="Source: Naegele's rule, +280 days • Estimate only, not medical advice"
      />
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="preg-lmp">
            {t({ bn: 'শেষ মাসিকের প্রথম দিন', en: 'First day of last menstrual period' })}
          </label>
          <input
            id="preg-lmp"
            style={inputStyle}
            type="date"
            value={lmp}
            onChange={(e) => setLmp(e.target.value)}
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn-outline" onClick={loadExample}>
          {t({ bn: 'উদাহরণ বসান (১ জানুয়ারি ২০২৬)', en: 'Load example (1 January 2026)' })}
        </button>
      </div>
      <p style={{ ...formulaStyle, marginTop: 14 }}>
        {t({
          bn: 'সতর্কতা: এটি শুধু একটি অনুমান — চিকিৎসা পরামর্শ নয়। সঠিক তথ্য ও যত্নের জন্য অবশ্যই চিকিৎসকের পরামর্শ নিন।',
          en: 'Note: this is only an estimate — not medical advice. Always see a doctor for accurate information and care.',
        })}
      </p>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'সম্ভাব্য প্রসবের তারিখ', en: 'Estimated due date' })}</p>
          <p style={headlineStyle}>{result.dueDate}</p>
          <div style={buttonRowStyle}>
            <CopyButton
              copied={copied === 'preg'}
              onCopy={() => void copyText(`Due date ${result.dueDate}`, 'preg')}
              labelBn="তারিখ কপি করুন"
              labelEn="Copy date"
            />
          </div>
          <div style={tileGridStyle}>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: 'আনুমানিক গর্ভধারণের তারিখ', en: 'Approx. conception date' })}</p>
              <p style={tileValueStyle}>{result.conceptionDate}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: '২য় ত্রৈমাসিক শুরু', en: '2nd trimester starts' })}</p>
              <p style={tileValueStyle}>{result.secondTrimesterStart}</p>
            </div>
            <div style={tileStyle}>
              <p style={tileLabelStyle}>{t({ bn: '৩য় ত্রৈমাসিক শুরু', en: '3rd trimester starts' })}</p>
              <p style={tileValueStyle}>{result.thirdTrimesterStart}</p>
            </div>
            {age ? (
              <div style={tileStyle}>
                <p style={tileLabelStyle}>{t({ bn: 'আজকের হিসাবে গর্ভকাল', en: 'Gestational age today' })}</p>
                <p style={tileValueStyle}>
                  {age.weeks} {t({ bn: 'সপ্তাহ', en: 'weeks' })} {age.days} {t({ bn: 'দিন', en: 'days' })}
                </p>
              </div>
            ) : null}
          </div>
          <p style={formulaStyle}>
            {t({
              bn: `সূত্র (Naegele's rule): সম্ভাব্য তারিখ = শেষ মাসিকের প্রথম দিন (${lmp}) + ২৮০ দিন (৪০ সপ্তাহ)। বেশিরভাগ জন্ম এই তারিখের আশপাশের দুই সপ্তাহের মধ্যে হয় — তারিখটি নিশ্চিত নয়।`,
              en: `Formula (Naegele's rule): due date = first day of last period (${lmp}) + 280 days (40 weeks). Most births happen within two weeks of this date — it is not a guarantee.`,
            })}
          </p>
        </div>
      ) : invalid ? (
        <p style={errorStyle} role="alert">
          {t({ bn: 'সঠিক তারিখ দিন।', en: 'Enter a valid date.' })}
        </p>
      ) : null}
    </section>
  );
}
