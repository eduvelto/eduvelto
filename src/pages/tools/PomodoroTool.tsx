// Eduvelto — Pomodoro Study Timer tool UI.
// Pure logic in src/lib/tools/pomodoro.ts + timerEngine.ts.
// Default 25 min focus / 5 min short break / 15 min long break,
// long break after every 4th focus session.
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { nextPomodoroPhase, pomodoroPhaseLabel, pomodoroPhaseSeconds, type PomodoroPhase } from '../../lib/tools/pomodoro';
import { formatHMS } from '../../lib/tools/timerEngine';
import { Tiles, ToolSection, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle } from './eduToolUi';

export function PomodoroTool() {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [remaining, setRemaining] = useState(() => pomodoroPhaseSeconds('focus'));
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [focusMin, setFocusMin] = useState('25');
  const [shortMin, setShortMin] = useState('5');
  const [longMin, setLongMin] = useState('15');

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setRunning(false);
          setCompleted((c) => {
            const done = phase === 'focus' ? c + 1 : c;
            setPhase(nextPomodoroPhase(phase, done));
            setRemaining(pomodoroPhaseSeconds(
              nextPomodoroPhase(phase, done),
              { focusMin: Number(focusMin) || 25, shortBreakMin: Number(shortMin) || 5, longBreakMin: Number(longMin) || 15, sessionsBeforeLong: 4 },
            ));
            return done;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, phase, focusMin, shortMin, longMin]);

  const label = useMemo(() => pomodoroPhaseLabel(phase), [phase]);
  const total = pomodoroPhaseSeconds(phase, { focusMin: Number(focusMin) || 25, shortBreakMin: Number(shortMin) || 5, longBreakMin: Number(longMin) || 15, sessionsBeforeLong: 4 });

  function resetTo(p: PomodoroPhase) {
    setPhase(p);
    setRemaining(pomodoroPhaseSeconds(p, { focusMin: Number(focusMin) || 25, shortBreakMin: Number(shortMin) || 5, longBreakMin: Number(longMin) || 15, sessionsBeforeLong: 4 }));
    setRunning(false);
  }

  return (
    <ToolSection id="pomodoro-title" titleBn="পোমোডোরো স্টাডি টাইমার" titleEn="Pomodoro Study Timer"
      descBn="পড়ার সময়কে ছোট ছোট বিরতিসহ ভাগ করে মনোযোগ ধরে রাখুন। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Split study time into focused sessions with short breaks. Everything happens on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="pom-focus">{t({ bn: 'মনোযোগ (মিনিট)', en: 'Focus (minutes)' })}</label>
          <input id="pom-focus" style={inputStyle} type="number" min="1" value={focusMin} onChange={(e) => setFocusMin(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pom-short">{t({ bn: 'ছোট বিরতি (মিনিট)', en: 'Short break (minutes)' })}</label>
          <input id="pom-short" style={inputStyle} type="number" min="1" value={shortMin} onChange={(e) => setShortMin(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pom-long">{t({ bn: 'লম্বা বিরতি (মিনিট)', en: 'Long break (minutes)' })}</label>
          <input id="pom-long" style={inputStyle} type="number" min="1" value={longMin} onChange={(e) => setLongMin(e.target.value)} />
        </div>
      </div>
      <div style={resultStyle} role="status">
        <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{t(label)}</strong></p>
        <p style={{ margin: '0 0 6px', fontSize: 34, fontWeight: 700, color: 'var(--heading)', fontFamily: 'var(--font-head)' }}>{formatHMS(remaining)}</p>
        <Tiles items={[
          { label: t({ bn: 'সম্পন্ন সেশন', en: 'Sessions done' }), value: String(completed) },
          { label: t({ bn: 'এই ধাপের মোট', en: 'Phase total' }), value: formatHMS(total) },
          { label: t({ bn: 'পরের ধাপ', en: 'Next phase' }), value: t(pomodoroPhaseLabel(nextPomodoroPhase(phase, completed + (phase === 'focus' ? 1 : 0)))) },
        ]} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }}
            onClick={() => { if (remaining === 0) resetTo(phase); setRunning((r) => !r); }}>
            {running ? t({ bn: 'থামান', en: 'Pause' }) : t({ bn: 'শুরু করুন', en: 'Start' })}
          </button>
          <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={() => resetTo('focus')}>
            {t({ bn: 'রিসেট', en: 'Reset' })}
          </button>
          <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }}
            onClick={() => resetTo(nextPomodoroPhase(phase, completed + (phase === 'focus' ? 1 : 0)))}>
            {t({ bn: 'পরের ধাপে যান', en: 'Skip to next phase' })}
          </button>
        </div>
        <p style={noteStyle}>{t({ bn: 'প্রতি ৪টি মনোযোগের সেশনের পর লম্বা বিরতি।', en: 'A long break follows every 4th focus session.' })}</p>
      </div>
    </ToolSection>
  );
}
