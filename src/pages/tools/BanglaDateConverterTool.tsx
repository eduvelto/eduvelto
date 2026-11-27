// Eduvelto — Bangla Date Converter (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Gregorian ↔ Bangla calendar (Bangladesh revised calendar, 2019 revision),
// both directions. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { BANGLA_MONTHS, gregorianToBangla, banglaToGregorian, banglaMonthLength, formatBangla } from '../../lib/tools/banglaDate';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

function parseIntOrNull(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

export function BanglaDateConverterTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'to-bangla' | 'to-gregorian'>('to-bangla');
  const [date, setDate] = useState('2026-04-14');
  const [byear, setByear] = useState('1433');
  const [bmonth, setBmonth] = useState('1');
  const [bday, setBday] = useState('1');
  const parsed = useMemo(() => {
    const parts = date.split('-').map((p) => Number(p));
    if (parts.length !== 3 || parts.some((p) => !Number.isInteger(p))) return null;
    return { y: parts[0], m: parts[1], d: parts[2] };
  }, [date]);
  const bangla = useMemo(() => (parsed ? gregorianToBangla(parsed.y, parsed.m, parsed.d) : null), [parsed]);
  const by = parseIntOrNull(byear);
  const bm = parseIntOrNull(bmonth);
  const bd = parseIntOrNull(bday);
  const gregorian = useMemo(
    () => (by !== null && bm !== null && bd !== null ? banglaToGregorian({ year: by, month: bm, day: bd }) : null),
    [by, bm, bd],
  );
  const maxDay = by !== null && bm !== null ? banglaMonthLength(by, bm) : 30;
  const loadExample = () => {
    if (mode === 'to-bangla') setDate('2026-04-14');
    else { setByear('1433'); setBmonth('1'); setBday('1'); }
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="বাংলা তারিখ কনভার্টার" titleEn="Bangla Date Converter" descBn="ইংরেজি তারিখ ↔ বাংলা তারিখ (বঙ্গাব্দ) — দুই দিকেই বদলান।" descEn="Convert between Gregorian dates and Bangla (Bengali calendar) dates, both ways." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={mode === 'to-bangla' ? activeButtonStyle : buttonStyle} onClick={() => setMode('to-bangla')}>{t({ bn: 'ইংরেজি → বাংলা', en: 'Gregorian → Bangla' })}</button>
        <button type="button" style={mode === 'to-gregorian' ? activeButtonStyle : buttonStyle} onClick={() => setMode('to-gregorian')}>{t({ bn: 'বাংলা → ইংরেজি', en: 'Bangla → Gregorian' })}</button>
      </div>
      {mode === 'to-bangla' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="bangla-date">{t({ bn: 'ইংরেজি তারিখ', en: 'Gregorian date' })}</label>
            <input id="bangla-date" style={shortInputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="bangla-year">{t({ bn: 'বাংলা সাল', en: 'Bangla year' })}</label>
            <input id="bangla-year" style={shortInputStyle} type="number" step="1" inputMode="numeric" value={byear} onChange={(e) => setByear(e.target.value)} placeholder="1433" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="bangla-month">{t({ bn: 'বাংলা মাস', en: 'Bangla month' })}</label>
            <select id="bangla-month" style={shortInputStyle} value={bmonth} onChange={(e) => setBmonth(e.target.value)}>
              {BANGLA_MONTHS.map((mo, i) => (<option key={mo.en} value={String(i + 1)}>{t({ bn: mo.bn, en: mo.en })}</option>))}
            </select>
          </div>
          <div>
            <label style={labelStyle} htmlFor="bangla-day">{t({ bn: `দিন (১–${maxDay})`, en: `Day (1–${maxDay})` })}</label>
            <input id="bangla-day" style={shortInputStyle} type="number" min="1" max={maxDay} inputMode="numeric" value={bday} onChange={(e) => setBday(e.target.value)} placeholder="1" />
          </div>
        </div>
      )}
      <ButtonRow>
        <ClearButton onClear={() => { if (mode === 'to-bangla') setDate(''); else setBday(''); }} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {mode === 'to-bangla' ? (
        bangla ? (
          <>
            <div style={resultStyle} role="status">
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'বাংলা তারিখ', en: 'Bangla date' })}</p>
              <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{formatBangla(bangla, 'bn')}</p>
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>{formatBangla(bangla, 'en')}</p>
            </div>
            <Tiles items={[
              { labelBn: 'বাংলা সাল', labelEn: 'Bangla year', value: String(bangla.year) },
              { labelBn: 'মাস', labelEn: 'Month', value: t({ bn: BANGLA_MONTHS[bangla.month - 1].bn, en: BANGLA_MONTHS[bangla.month - 1].en }) },
              { labelBn: 'ইংরেজি তারিখ', labelEn: 'Gregorian date', value: date },
            ]} />
            <ButtonRow><CopyButton text={`${date} = ${formatBangla(bangla, 'en')} (${formatBangla(bangla, 'bn')})`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
          </>
        ) : (
          <p style={errorStyle} role="alert">{t({ bn: 'সঠিক ইংরেজি তারিখ দিন।', en: 'Enter a valid Gregorian date.' })}</p>
        )
      ) : gregorian ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ইংরেজি তারিখ', en: 'Gregorian date' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{gregorian.year}-{String(gregorian.month).padStart(2, '0')}-{String(gregorian.day).padStart(2, '0')}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `${by} সালের ${BANGLA_MONTHS[(bm ?? 1) - 1].bn} মাসের ${bd} তারিখ`, en: `${bd} ${BANGLA_MONTHS[(bm ?? 1) - 1].en} ${by}` })}</p>
          </div>
          <ButtonRow><CopyButton text={`${bd} ${BANGLA_MONTHS[(bm ?? 1) - 1].en} ${by} = ${gregorian.year}-${gregorian.month}-${gregorian.day}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: `সঠিক বাংলা তারিখ দিন — এই মাসে দিন ১–${maxDay} এর মধ্যে হতে হবে।`, en: `Enter a valid Bangla date — the day must be 1–${maxDay} in this month.` })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'এটি বাংলাদেশের সরকারি সংশোধিত বাংলা ক্যালেন্ডার (২০১৯ সালের সংশোধন): নববর্ষ ১৪ এপ্রিল; বৈশাখ–আশ্বিন ৩১ দিন, কার্তিক–মাঘ ৩০ দিন, ফাল্গুন ২৯ দিন (অধিবর্ষে ৩০), চৈত্র ৩০ দিন। তাই ২১ ফেব্রুয়ারি সবসময় ৮ ফাল্গুন, ২৬ মার্চ ১২ চৈত্র। পশ্চিমবঙ্গের প্রচলিত পঞ্জিকায় মাসের শুরু সূর্যের অবস্থানের ওপর নির্ভর করে, তাই সেখানকার তারিখ এক দিন আলাদা হতে পারে।', en: 'This is Bangladesh’s official revised Bangla calendar (2019 revision): new year on 14 April; Boishakh–Ashwin 31 days, Kartik–Magh 30 days, Falgun 29 days (30 in a leap year), Choitro 30 days. So 21 February is always 8 Falgun and 26 March always 12 Choitro. West Bengal’s traditional panjika ties month starts to the sun’s position, so its dates can differ by a day.' })}</p>
    </section>
  );
}
