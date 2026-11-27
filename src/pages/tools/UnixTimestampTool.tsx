// Eduvelto — Unix Timestamp Converter tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: parseUnixInput() / unixToDate() / dateToUnix() in src/lib/tools/dateTimeTools.ts (Intl only). 100% in-browser; nothing is uploaded.
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { parseUnixInput, unixToDate, dateToUnix } from '../../lib/tools/dateTimeTools';

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




const ZONES = ['Asia/Dhaka', 'UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Europe/London', 'America/New_York'];

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function UnixTimestampTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState(() => String(Math.floor(Date.now() / 1000)));
  const [date, setDate] = useState(todayLocal);
  const [time, setTime] = useState('14:22');
  const [zone, setZone] = useState('Asia/Dhaka');
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = window.setInterval(() => { if (!document.hidden) setNowSec(Math.floor(Date.now() / 1000)); }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const converted = useMemo(() => {
    try {
      const { seconds, millis } = parseUnixInput(input);
      return { ...unixToDate(seconds), millis };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid timestamp' };
    }
  }, [input]);
  const reverse = useMemo(() => {
    try { return { seconds: dateToUnix(date, time, zone) }; } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid date' };
    }
  }, [date, time, zone]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ইউনিক্স টাইমস্ট্যাম্প কনভার্টার" titleEn="Unix Timestamp Converter" descBn="টাইমস্ট্যাম্প থেকে তারিখ ও সময়, অথবা তারিখ-সময় থেকে টাইমস্ট্যাম্প বের করুন।" descEn="Convert a Unix timestamp to a date and time, or a date and time to a timestamp." chipBn="১০ অঙ্ক = সেকেন্ড, ১৩ অঙ্ক = মিলিসেকেন্ড" chipEn="10 digits = seconds, 13 digits = milliseconds" />
      <div style={resultStyle} role="status">
        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'এখনকার টাইমস্ট্যাম্প', en: 'Current timestamp' })}</p>
        <p style={{ margin: 0, fontSize: '1.6rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{nowSec}</p>
        <ButtonRow><CopyButton text={String(nowSec)} labelBn="এখনকার টাইমস্ট্যাম্প কপি করুন" labelEn="Copy current timestamp" /></ButtonRow>
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={labelStyle} htmlFor="ut-input">{t({ bn: 'টাইমস্ট্যাম্প (সেকেন্ড বা মিলিসেকেন্ড)', en: 'Timestamp (seconds or milliseconds)' })}</label>
        <input id="ut-input" style={inputStyle} type="text" inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value)} placeholder="1700000000" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('1700000000')} />
      </ButtonRow>
      {'error' in converted ? (
        <p style={errorStyle} role="alert">{converted.error}</p>
      ) : (
        <>
          <Tiles items={[
            { labelBn: 'UTC', labelEn: 'UTC', value: converted.utc },
            { labelBn: 'ঢাকা (UTC+৬)', labelEn: 'Dhaka (UTC+6)', value: converted.dhaka },
            { labelBn: 'আপনার স্থানীয় সময়', labelEn: 'Your local time', value: converted.local },
            { labelBn: 'ISO 8601', labelEn: 'ISO 8601', value: converted.isoUtc },
          ]} />
          <p style={noteStyle}>{converted.millis ? t({ bn: '১৩ অঙ্কের ইনপুট মিলিসেকেন্ড হিসেবে ধরা হয়েছে।', en: 'The 13-digit input was read as milliseconds.' }) : t({ bn: 'ঢাকায় গ্রীষ্ম/শীতের সময়ের পার্থক্য (DST) নেই — সারা বছর UTC+৬।', en: 'Dhaka has no daylight saving — UTC+6 all year.' })}</p>
          <ButtonRow><CopyButton text={converted.isoUtc} labelBn="ISO তারিখ কপি করুন" labelEn="Copy ISO date" /></ButtonRow>
        </>
      )}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ut-date">{t({ bn: 'তারিখ (উল্টো হিসাব)', en: 'Date (reverse)' })}</label>
          <input id="ut-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ut-time">{t({ bn: 'সময়', en: 'Time' })}</label>
          <input id="ut-time" style={inputStyle} type="time" step={1} value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ut-zone">{t({ bn: 'সময় অঞ্চল', en: 'Time zone' })}</label>
          <select id="ut-zone" style={inputStyle} value={zone} onChange={(e) => setZone(e.target.value)}>
            {ZONES.map((z) => (<option key={z} value={z}>{z}</option>))}
          </select>
        </div>
      </div>
      {'seconds' in reverse ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'টাইমস্ট্যাম্প', en: 'Timestamp' })}</p>
          <p style={{ margin: 0, fontSize: '1.6rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{reverse.seconds}</p>
          <ButtonRow><CopyButton text={String(reverse.seconds)} labelBn="টাইমস্ট্যাম্প কপি করুন" labelEn="Copy timestamp" /></ButtonRow>
        </div>
      ) : (
        <p style={errorStyle} role="alert">{'error' in reverse ? reverse.error : ''}</p>
      )}
      <p style={noteStyle}>{t({ bn: '১৯৭০ সালের আগের সময় (ঋণাত্মক টাইমস্ট্যাম্প) সমর্থিত, এবং ২১০০ সালের পরের সময়ও দেখানো যায়। বাংলা তারিখ এখানে গ্রেগরীয় তারিখ বাংলায় লেখা — বাংলা (বঙ্গাব্দ) পঞ্জিকা নয়।', en: 'Negative timestamps (before 1970) are supported, as are dates after 2100. The Bangla date shown is the Gregorian date rendered in Bangla — not the Bangla (Bongabdo) calendar.' })}</p>
    </section>
  );
}
