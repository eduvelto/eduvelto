// Eduvelto — Quiz Stopwatch Timer tool UI.
// Pure logic in src/lib/tools/quizStopwatch.ts + timerEngine.ts.
// Up to 4 named timers can run at once; each has laps.
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { describeLaps, formatStopwatch } from '../../lib/tools/quizStopwatch';
import { Tiles, ToolSection, inputStyle, noteStyle } from './eduToolUi';

interface TimerState {
  id: number;
  label: string;
  elapsedMs: number;
  running: boolean;
  splits: number[];
}

let nextId = 1;

export function QuizStopwatchTool() {
  const { t } = useLanguage();
  const [timers, setTimers] = useState<TimerState[]>([
    { id: nextId++, label: 'Timer 1', elapsedMs: 0, running: false, splits: [] },
  ]);
  const [newLabel, setNewLabel] = useState('');
  const lastTick = useRef<number>(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick.current;
      lastTick.current = now;
      setTimers((prev) =>
        prev.some((tm) => tm.running)
          ? prev.map((tm) => (tm.running ? { ...tm, elapsedMs: tm.elapsedMs + delta } : tm))
          : prev,
      );
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  const runningCount = timers.filter((tm) => tm.running).length;
  const totalLaps = timers.reduce((s, tm) => s + tm.splits.length, 0);

  const update = (id: number, patch: Partial<TimerState>) =>
    setTimers((prev) => prev.map((tm) => (tm.id === id ? { ...tm, ...patch } : tm)));

  return (
    <ToolSection id="quiz-stopwatch-title" titleBn="কুইজ স্টপওয়াচ টাইমার" titleEn="Quiz Stopwatch Timer"
      descBn="কুইজ ও পরীক্ষার জন্য একাধিক টাইমার একসাথে চালান। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Run several timers at once for quizzes and exams. Everything happens on your device.">
      <Tiles items={[
        { label: t({ bn: 'টাইমার', en: 'Timers' }), value: String(timers.length) },
        { label: t({ bn: 'চলছে', en: 'Running' }), value: String(runningCount) },
        { label: t({ bn: 'মোট ল্যাপ', en: 'Total laps' }), value: String(totalLaps) },
      ]} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input style={{ ...inputStyle, flex: 1 }} type="text" value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder={t({ bn: 'নতুন টাইমারের নাম (যেমন: গ্রুপ A)', en: 'New timer name (e.g. Group A)' })} />
        <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} disabled={timers.length >= 4}
          onClick={() => {
            const label = newLabel.trim() || `Timer ${timers.length + 1}`;
            setTimers((prev) => [...prev, { id: nextId++, label, elapsedMs: 0, running: false, splits: [] }]);
            setNewLabel('');
          }}>
          {t({ bn: '+ টাইমার যোগ করুন', en: '+ Add timer' })}
        </button>
      </div>
      <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
        {timers.map((tm) => (
          <div key={tm.id} style={{ padding: 14, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <strong style={{ fontSize: 15, color: 'var(--heading)' }}>{tm.label}</strong>
              {timers.length > 1 ? (
                <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 30, padding: '2px 8px' }}
                  onClick={() => setTimers((prev) => prev.filter((x) => x.id !== tm.id))}>
                  {t({ bn: 'মুছুন', en: 'Remove' })}
                </button>
              ) : null}
            </div>
            <p style={{ margin: '8px 0', fontSize: 30, fontWeight: 700, color: 'var(--heading)', fontFamily: 'monospace' }}>
              {formatStopwatch(tm.elapsedMs)}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 40 }}
                onClick={() => update(tm.id, { running: !tm.running })}>
                {tm.running ? t({ bn: 'থামান', en: 'Pause' }) : t({ bn: 'শুরু করুন', en: 'Start' })}
              </button>
              <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 40 }}
                onClick={() => update(tm.id, { splits: [...tm.splits, tm.elapsedMs] })}>
                {t({ bn: 'ল্যাপ', en: 'Lap' })}
              </button>
              <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 40 }}
                onClick={() => update(tm.id, { elapsedMs: 0, running: false, splits: [] })}>
                {t({ bn: 'রিসেট', en: 'Reset' })}
              </button>
            </div>
            {tm.splits.length > 0 ? (
              <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 14 }}>
                {describeLaps(tm.splits).map((lap) => (
                  <li key={lap.lap}>{t({ bn: 'ল্যাপ', en: 'Lap' })} {lap.lap}: {lap.split} ({t({ bn: 'সময়কাল', en: 'lap time' })} {lap.duration})</li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
      <p style={noteStyle}>{t({ bn: 'সর্বোচ্চ ৪টি টাইমার একসাথে চলতে পারে।', en: 'Up to 4 timers can run at once.' })}</p>
    </ToolSection>
  );
}
