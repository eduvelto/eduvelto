// Eduvelto — Exam Countdown Timer tool UI.
// Pure logic in src/lib/tools/examCountdown.ts + timerEngine.ts.
// Ticks every second while mounted.
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { examCountdown, isoDateDaysFromNow, weeksAndDays } from '../../lib/tools/examCountdown';
import {
  LoadExampleBtn, Tiles, ToolSection, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

export function ExamCountdownTool() {
  const { t } = useLanguage();
  const [examName, setExamName] = useState('');
  const [date, setDate] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const result = useMemo(() => {
    if (!date) return null;
    try { return examCountdown(date, now); } catch { return null; }
  }, [date, now]);

  const wd = result ? weeksAndDays(result.days) : null;

  return (
    <ToolSection id="exam-countdown-title" titleBn="পরীক্ষার কাউন্টডাউন টাইমার" titleEn="Exam Countdown Timer"
      descBn="পরীক্ষার দিন পর্যন্ত কত দিন, ঘণ্টা ও মিনিট বাকি তা দেখুন। সব হিসাব আপনার ডিভাইসেই হয়।"
      descEn="See how many days, hours and minutes remain until an exam. Everything is computed on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="cd-exam">{t({ bn: 'পরীক্ষার নাম', en: 'Exam name' })}</label>
          <input id="cd-exam" style={inputStyle} type="text" value={examName}
            onChange={(e) => setExamName(e.target.value)} placeholder={t({ bn: 'যেমন: এইচএসসি পরীক্ষা', en: 'e.g. HSC Exam' })} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cd-date">{t({ bn: 'পরীক্ষার তারিখ', en: 'Exam date' })}</label>
          <input id="cd-date" style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        <LoadExampleBtn onLoad={() => { setExamName(t({ bn: 'পরীক্ষা', en: 'Exam' })); setDate(isoDateDaysFromNow(30)); }} />
        {[30, 60, 90].map((d) => (
          <button key={d} type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 36 }}
            onClick={() => setDate(isoDateDaysFromNow(d))}>
            {t({ bn: `আজ থেকে ${d} দিন পর`, en: `In ${d} days` })}
          </button>
        ))}
      </div>
      {result ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 6px', fontSize: 16 }}>
            {result.past ? (
              <strong>{t({ bn: 'পরীক্ষার দিন পেরিয়ে গেছে।', en: 'The exam date has passed.' })}</strong>
            ) : (
              <strong>{examName || t({ bn: 'পরীক্ষা', en: 'Exam' })}: {result.days} {t({ bn: 'দিন', en: 'days' })} {result.hours}:{String(result.minutes).padStart(2, '0')}:{String(result.seconds).padStart(2, '0')}</strong>
            )}
          </p>
          <Tiles items={[
            { label: t({ bn: 'দিন', en: 'Days' }), value: String(result.days) },
            { label: t({ bn: 'ঘণ্টা', en: 'Hours' }), value: String(result.hours) },
            { label: t({ bn: 'মিনিট', en: 'Minutes' }), value: String(result.minutes) },
            { label: t({ bn: 'সেকেন্ড', en: 'Seconds' }), value: String(result.seconds) },
            { label: t({ bn: 'সপ্তাহ', en: 'Weeks' }), value: wd ? `${wd.weeks} ${t({ bn: 'সপ্তাহ', en: 'w' })} ${wd.days} ${t({ bn: 'দিন', en: 'd' })}` : '—' },
          ]} />
          <p style={noteStyle}>{t({ bn: `লক্ষ্য তারিখ: ${date}`, en: `Target date: ${date}` })}</p>
        </div>
      ) : null}
    </ToolSection>
  );
}
