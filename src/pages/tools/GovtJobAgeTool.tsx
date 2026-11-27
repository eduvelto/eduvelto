// Eduvelto — Govt Job Age Calculator tool UI.
// Pure logic in src/lib/tools/govtJobAge.ts + ageEngine.ts.
// The limit is user-entered; 30/32 are editable reference data
// with source + date, never hard-coded as fact.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { GOVT_JOB_AGE_REFERENCE, checkGovtJobAge } from '../../lib/tools/govtJobAge';
import {
  CopyBtn, LoadExampleBtn, Tiles, ToolSection, errorStyle, formulaStyle,
  gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

export function GovtJobAgeTool() {
  const { t } = useLanguage();
  const [dob, setDob] = useState('');
  const [limit, setLimit] = useState('30');

  const result = useMemo(() => {
    if (dob === '' || limit === '') return null;
    try { return checkGovtJobAge(dob, Number(limit)); } catch { return null; }
  }, [dob, limit]);

  return (
    <ToolSection id="govt-age-title" titleBn="সরকারি চাকরির বয়স ক্যালকুলেটর" titleEn="Govt Job Age Calculator"
      descBn="জন্মতারিখ দিয়ে সরকারি চাকরির আবেদনের বয়স হিসাব করুন। সব হিসাব আপনার ডিভাইসেই হয়।"
      descEn="Calculate your age for government job applications from your date of birth. Everything is computed on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="govt-dob">{t({ bn: 'জন্মতারিখ', en: 'Date of birth' })}</label>
          <input id="govt-dob" style={inputStyle} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="govt-limit">{t({ bn: 'বয়সসীমা (বছর)', en: 'Age limit (years)' })}</label>
          <input id="govt-limit" style={inputStyle} type="number" min="1" max="65" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <LoadExampleBtn onLoad={() => { setDob('2000-01-15'); setLimit('30'); }} />
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 36 }} onClick={() => setLimit('30')}>
          {t({ bn: 'সাধারণ: ৩০', en: 'General: 30' })}
        </button>
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 36 }} onClick={() => setLimit('32')}>
          {t({ bn: 'মুক্তিযোদ্ধা কোটা: ৩২', en: 'Freedom-fighter quota: 32' })}
        </button>
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            <strong>{t({ bn: 'বয়স: ', en: 'Age: ' })}{result.age.years} {t({ bn: 'বছর', en: 'years' })} {result.age.months} {t({ bn: 'মাস', en: 'months' })} {result.age.days} {t({ bn: 'দিন', en: 'days' })}</strong>
          </p>
          <Tiles items={[
            { label: t({ bn: 'বয়স', en: 'Age' }), value: `${result.age.years} ${t({ bn: 'বছর', en: 'y' })}` },
            { label: t({ bn: 'সীমা', en: 'Limit' }), value: `${result.limit} ${t({ bn: 'বছর', en: 'y' })}` },
            { label: t({ bn: 'যোগ্য?', en: 'Eligible?' }), value: result.eligible ? t({ bn: 'হ্যাঁ', en: 'Yes' }) : t({ bn: 'না', en: 'No' }) },
            { label: t({ bn: 'বাকি বছর', en: 'Years left' }), value: String(result.yearsLeft) },
          ]} />
          <p style={formulaStyle}>{t({ bn: `মোট দিন: ${result.age.totalDays} দিন; সীমা ${result.limit} বছর — ${result.eligible ? 'সীমার মধ্যে আছেন' : 'সীমা পেরিয়ে গেছে'}।`, en: `Total days: ${result.age.totalDays}; limit ${result.limit} years — ${result.eligible ? 'within the limit' : 'over the limit'}.` })}</p>
          <p style={noteStyle}>{t({ bn: GOVT_JOB_AGE_REFERENCE.sourceBn, en: GOVT_JOB_AGE_REFERENCE.sourceEn })}</p>
          <div style={{ marginTop: 12 }}>
            <CopyBtn text={`Age: ${result.age.years} years, ${result.age.months} months, ${result.age.days} days. Limit ${result.limit} years — ${result.eligible ? 'eligible' : 'not eligible'}.`} labelBn="ফল কপি করুন" labelEn="Copy result" />
          </div>
        </div>
      ) : dob !== '' ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক জন্মতারিখ দিন (ভবিষ্যতের তারিখ নয়)।', en: 'Enter a valid date of birth (not a future date).' })}</p>
      ) : null}
    </ToolSection>
  );
}
