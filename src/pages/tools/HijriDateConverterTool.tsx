// Eduvelto — Hijri Date Converter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Kuwaiti tabular algorithm (src/lib/tools/hijriDate.ts). The result
// is labelled আনুমানিক (±1 day — depends on moon sighting), never
// presented as the observed date. Both directions: Gregorian ->
// Hijri and Hijri -> Gregorian.

import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { gregorianToHijri, hijriToGregorian, formatHijri, HIJRI_MONTHS } from '../../lib/tools/hijriDate';
import {
  inputStyle, labelStyle, gridStyle, cardStyle, resultStyle, headlineStyle,
  headlineLabelStyle, tileGridStyle, noteStyle, buttonRowStyle, ToolHero, CopyButton, Tile,
} from './toolUiShared';

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function HijriDateConverterTool() {
  const { t, lang } = useLanguage();
  const [date, setDate] = useState(todayLocal);
  const [hYear, setHYear] = useState('1447');
  const [hMonth, setHMonth] = useState('9');
  const [hDay, setHDay] = useState('1');
  const [direction, setDirection] = useState<'g2h' | 'h2g'>('g2h');

  const g2h = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!m) return null;
    try {
      return gregorianToHijri(Number(m[1]), Number(m[2]), Number(m[3]));
    } catch {
      return null;
    }
  }, [date]);

  const h2g = useMemo(() => {
    const y = Number(hYear);
    const mo = Number(hMonth);
    const d = Number(hDay);
    if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return null;
    try {
      return hijriToGregorian({ year: y, month: mo, day: d });
    } catch {
      return null;
    }
  }, [hYear, hMonth, hDay]);

  const todayHijri = useMemo(() => {
    const now = new Date();
    return gregorianToHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }, []);

  const approxNote = t({
    bn: 'আনুমানিক (±১ দিন হতে পারে — চাঁদ দেখার উপর নির্ভর করে)। এটি হিসাবের তারিখ, স্থানীয়ভাবে ঘোষিত চাঁদ দেখার তারিখ থেকে এক দিন এদিক-ওদিক হতে পারে।',
    en: 'Approximate (±1 day possible — depends on moon sighting). This is the calculated date; the locally observed date may differ by a day.',
  });

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="hijri-title">
      <ToolHero
        titleId="hijri-title"
        titleBn="হিজরি তারিখ কনভার্টার"
        titleEn="Hijri Date Converter"
        descBn="ইংরেজি তারিখকে হিজরি তারিখে রূপান্তর করুন।"
        descEn="Convert an English calendar date to a Hijri date."
        chipBn="১০০% ব্রাউজারে • কোনো আপলোড নয়"
        chipEn="100% in-browser • nothing uploaded"
      />
      <div style={tileGridStyle}>
        <Tile
          label={t({ bn: 'আজকের হিজরি তারিখ (আনুমানিক)', en: "Today's Hijri date (approximate)" })}
          value={formatHijri(todayHijri, lang)}
        />
      </div>
      <div style={buttonRowStyle} role="group" aria-label={t({ bn: 'রূপান্তরের দিক', en: 'Conversion direction' })}>
        <button type="button" className="ev-btn-outline" aria-pressed={direction === 'g2h'} onClick={() => setDirection('g2h')}>
          {t({ bn: 'ইংরেজি → হিজরি', en: 'Gregorian → Hijri' })}
        </button>
        <button type="button" className="ev-btn-outline" aria-pressed={direction === 'h2g'} onClick={() => setDirection('h2g')}>
          {t({ bn: 'হিজরি → ইংরেজি', en: 'Hijri → Gregorian' })}
        </button>
      </div>
      {direction === 'g2h' ? (
        <div style={{ marginTop: 14 }}>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle} htmlFor="hijri-date">
                {t({ bn: 'ইংরেজি তারিখ', en: 'Gregorian date' })}
              </label>
              <input id="hijri-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {g2h ? (
            <div style={resultStyle} role="status">
              <p style={headlineLabelStyle}>{t({ bn: 'হিজরি তারিখ', en: 'Hijri date' })}</p>
              <p style={headlineStyle}>{formatHijri(g2h, lang)}</p>
              <div style={buttonRowStyle}>
                <CopyButton
                  text={formatHijri(g2h, lang)}
                  labelBn="ফলাফল কপি করুন"
                  labelEn="Copy result"
                />
              </div>
              <p style={noteStyle}>{approxNote}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle} htmlFor="hijri-day">
                {t({ bn: 'দিন', en: 'Day' })}
              </label>
              <input id="hijri-day" style={inputStyle} type="number" min="1" max="30" value={hDay} onChange={(e) => setHDay(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="hijri-month">
                {t({ bn: 'মাস', en: 'Month' })}
              </label>
              <select id="hijri-month" style={inputStyle} value={hMonth} onChange={(e) => setHMonth(e.target.value)}>
                {HIJRI_MONTHS.map((mo, i) => (
                  <option key={mo.en} value={i + 1}>
                    {lang === 'bn' ? mo.bn : mo.en}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle} htmlFor="hijri-year">
                {t({ bn: 'বছর (হিজরি)', en: 'Year (Hijri)' })}
              </label>
              <input id="hijri-year" style={inputStyle} type="number" min="1300" max="1600" value={hYear} onChange={(e) => setHYear(e.target.value)} />
            </div>
          </div>
          {h2g ? (
            <div style={resultStyle} role="status">
              <p style={headlineLabelStyle}>{t({ bn: 'ইংরেজি তারিখ', en: 'Gregorian date' })}</p>
              <p style={headlineStyle}>
                {h2g.day} / {h2g.month} / {h2g.year}
              </p>
              <div style={buttonRowStyle}>
                <CopyButton text={`${h2g.day}/${h2g.month}/${h2g.year}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
              </div>
              <p style={noteStyle}>{approxNote}</p>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
