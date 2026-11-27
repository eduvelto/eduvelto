// Eduvelto — Time Duration Calculator tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: parseDuration() / formatDuration() / durationBetween() / addDurations() in src/lib/tools/dateTimeTools.ts. 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { parseDuration, formatDuration, durationBetween, addDurations } from '../../lib/tools/dateTimeTools';

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

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}



type Mode = 'list' | 'between' | 'multiply';

export function TimeDurationTool() {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('list');
  const [list, setList] = useState('1:30:00\n0:45:30\n90m');
  const [start, setStart] = useState('09:30');
  const [end, setEnd] = useState('17:45');
  const [overnight, setOvernight] = useState(false);
  const [base, setBase] = useState('45m');
  const [count, setCount] = useState('5');

  const listParsed = useMemo(() => {
    const lines = list.split('\n').map((l) => l.trim()).filter(Boolean);
    const values: number[] = [];
    let error: string | null = null;
    for (const line of lines) {
      try { values.push(parseDuration(line)); } catch (e) { error = e instanceof Error ? e.message : 'Invalid duration'; break; }
    }
    return { values, error, total: values.length > 0 ? addDurations(values) : 0 };
  }, [list]);
  const between = useMemo(() => {
    try { return { ms: durationBetween(start, end, overnight) }; } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid time' };
    }
  }, [start, end, overnight]);
  const multiplied = useMemo(() => {
    const n = parseNum(count);
    try {
      if (n === null) return { error: 'Enter a count' };
      return { ms: parseDuration(base) * n };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid duration' };
    }
  }, [base, count]);

  const tabStyle = (active: boolean): CSSProperties => ({
    minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)',
    background: active ? 'var(--teal)' : 'var(--surface)', color: active ? '#fff' : 'var(--heading)', cursor: 'pointer', fontWeight: 600,
  });

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সময়কাল ক্যালকুলেটর" titleEn="Time Duration Calculator" descBn="সময় যোগ-বিয়োগ করুন, দুটি সময়ের ব্যবধান বের করুন, বা একটি সময় গুণ করুন।" descEn="Add and subtract durations, find the gap between two times, or multiply a duration." chipBn="লেখার ধরন: 1:30:00, 90m, 1h 30m" chipEn="Write durations as 1:30:00, 90m or 1h 30m" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={tabStyle(mode === 'list')} onClick={() => setMode('list')}>{t({ bn: 'সময় যোগ করুন', en: 'Add durations' })}</button>
        <button type="button" style={tabStyle(mode === 'between')} onClick={() => setMode('between')}>{t({ bn: 'দুটি সময়ের ব্যবধান', en: 'Time difference' })}</button>
        <button type="button" style={tabStyle(mode === 'multiply')} onClick={() => setMode('multiply')}>{t({ bn: 'সময় গুণ করুন', en: 'Multiply duration' })}</button>
      </div>
      {mode === 'list' ? (
        <>
          <div>
            <label style={labelStyle} htmlFor="td-list">{t({ bn: 'প্রতি লাইনে একটি সময়', en: 'One duration per line' })}</label>
            <textarea id="td-list" style={{ ...inputStyle, minHeight: 110 }} value={list} onChange={(e) => setList(e.target.value)} placeholder={'1:30:00\n0:45:30\n90m'} />
          </div>
          {listParsed.error ? (
            <p style={errorStyle} role="alert">{listParsed.error}</p>
          ) : (
            <>
              <div style={resultStyle} role="status">
                <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মোট সময়', en: 'Total time' })}</p>
                <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{formatDuration(listParsed.total)}</p>
              </div>
              <Tiles items={[
                { labelBn: 'দশমিক ঘণ্টা', labelEn: 'Decimal hours', value: (listParsed.total / 3600000).toFixed(2) },
                { labelBn: 'মোট মিনিট', labelEn: 'Total minutes', value: String(Math.round(listParsed.total / 60000)) },
                { labelBn: 'দিন', labelEn: 'Days', value: (listParsed.total / 86400000).toFixed(2) },
              ]} />
            </>
          )}
        </>
      ) : null}
      {mode === 'between' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="td-start">{t({ bn: 'শুরুর সময়', en: 'Start time' })}</label>
              <input id="td-start" style={inputStyle} type="time" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="td-end">{t({ bn: 'শেষের সময়', en: 'End time' })}</label>
              <input id="td-end" style={inputStyle} type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <ButtonRow>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setStart('10:00'); setEnd('16:00'); }}>{t({ bn: 'স্কুল ১০:০০–১৬:০০', en: 'School 10:00–16:00' })}</button>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setStart('09:00'); setEnd('17:00'); }}>{t({ bn: 'অফিস ০৯:০০–১৭:০০', en: 'Office 09:00–17:00' })}</button>
          </ButtonRow>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15, marginTop: 12 }}>
            <input type="checkbox" checked={overnight} onChange={(e) => setOvernight(e.target.checked)} />
            {t({ bn: 'রাত পেরিয়ে যায় (শেষের সময় শুরুর আগে হলে)', en: 'Overnight (end time is after midnight)' })}
          </label>
          {'error' in between ? (
            <p style={errorStyle} role="alert">{between.error}</p>
          ) : (
            <div style={resultStyle} role="status">
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'ব্যবধান', en: 'Duration' })}</p>
              <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{formatDuration(between.ms)}</p>
              <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `দশমিক ঘণ্টায়: ${(between.ms / 3600000).toFixed(2)} ঘণ্টা`, en: `In decimal hours: ${(between.ms / 3600000).toFixed(2)} hours` })}</p>
            </div>
          )}
        </>
      ) : null}
      {mode === 'multiply' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="td-base">{t({ bn: 'সময় (যেমন ৪৫m)', en: 'Duration (e.g. 45m)' })}</label>
              <input id="td-base" style={inputStyle} type="text" value={base} onChange={(e) => setBase(e.target.value)} placeholder="45m" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="td-count">{t({ bn: 'কতবার (যেমন ৫ দিন)', en: 'How many times (e.g. 5 days)' })}</label>
              <input id="td-count" style={inputStyle} type="number" min="0" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} placeholder="5" />
            </div>
          </div>
          {'error' in multiplied ? (
            <p style={errorStyle} role="alert">{multiplied.error}</p>
          ) : (
            <div style={resultStyle} role="status">
              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মোট', en: 'Total' })}</p>
              <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{formatDuration(multiplied.ms)}</p>
            </div>
          )}
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'রাতের শিফটে শেষের সময় শুরুর আগে হলে “রাত পেরিয়ে যায়” চালু করুন — না হলে ভুল বার্তা দেখাবে। অতিরিক্ত ঘণ্টার বেতনের নিয়ম নিয়োগকর্তাভেদে আলাদা হয়।', en: 'For night shifts where the end time is before the start, turn on “overnight” — otherwise you will see an error. Overtime pay rules differ by employer.' })}</p>
    </section>
  );
}
