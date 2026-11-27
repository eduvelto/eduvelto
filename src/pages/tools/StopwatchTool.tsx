// Eduvelto — Stopwatch tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: formatStopwatch() + lapDurations() in src/lib/tools/timerEngine.ts. 100% in-browser; nothing is uploaded.
import {useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {ToolHero, CopyButton, ButtonRow, cardStyle, noteStyle } from './toolUi';
import { formatStopwatch, lapDurations } from '../../lib/tools/timerEngine';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};




function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function StopwatchTool() {
  const { t, lang } = useLanguage();
  const [baseMs, setBaseMs] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [splits, setSplits] = useState<number[]>([]);
  const running = startedAt !== null;
  const elapsed = baseMs + (startedAt !== null ? now - startedAt : 0);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    document.title = formatStopwatch(elapsed);
    return () => {
      document.title = 'Eduvelto';
    };
  }, [running, elapsed]);

  const toggle = useCallback(() => {
    if (startedAt !== null) {
      setBaseMs((b) => b + (Date.now() - startedAt));
      setStartedAt(null);
    } else {
      setStartedAt(Date.now());
      setNow(Date.now());
    }
  }, [startedAt]);

  const lap = useCallback(() => {
    if (startedAt === null) return;
    setSplits((prev) => [...prev, baseMs + (Date.now() - startedAt)]);
  }, [startedAt, baseMs]);

  const reset = useCallback(() => {
    setBaseMs(0);
    setStartedAt(null);
    setSplits([]);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.key === 'l' || e.key === 'L') lap();
      else if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, lap, reset]);

  const laps = lapDurations(splits);
  const lapsText = splits.map((s, i) => `Lap ${i + 1}: ${formatStopwatch(s)} (split ${formatStopwatch(laps[i])})`).join('\n');
  const lapsCsv = ['lap,total_ms,split_ms', ...splits.map((s, i) => `${i + 1},${s},${laps[i]}`)].join('\n');

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="স্টপওয়াচ" titleEn="Stopwatch" descBn="একটি সহজ স্টপওয়াচ — ল্যাপ, কপি ও CSV ডাউনলোডসহ।" descEn="A simple stopwatch — with laps, copy and CSV download." chipBn="কীবোর্ড: Space = শুরু/থামা, L = ল্যাপ, R = রিসেট" chipEn="Keyboard: Space = start/pause, L = lap, R = reset" />
      <div style={{ ...resultStyle, textAlign: 'center' }} role="status" aria-live="off">
        <p style={{ margin: 0, fontSize: '3rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)', lineHeight: 1.1 }}>{formatStopwatch(elapsed)}</p>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--muted)' }}>{running ? t({ bn: 'চলছে…', en: 'Running…' }) : t({ bn: 'থেমে আছে', en: 'Paused' })}</p>
      </div>
      <ButtonRow>
        <button type="button" style={{ minHeight: 44, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={toggle}>
          {running ? t({ bn: 'থামান', en: 'Pause' }) : t({ bn: 'শুরু করুন', en: 'Start' })}
        </button>
        <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={lap} disabled={!running}>{t({ bn: 'ল্যাপ', en: 'Lap' })}</button>
        <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={reset} disabled={elapsed === 0 && splits.length === 0}>{t({ bn: 'রিসেট', en: 'Reset' })}</button>
      </ButtonRow>
      {splits.length > 0 ? (
        <>
          <div style={{ marginTop: 16 }}>
            {splits.map((s, i) => (
              <p key={i} style={{ margin: '4px 0', fontSize: 15 }}>
                {t({ bn: `ল্যাপ ${i + 1}: `, en: `Lap ${i + 1}: ` })}<strong>{formatStopwatch(s)}</strong>
                <span style={{ color: 'var(--muted)' }}> ({t({ bn: 'ল্যাপের সময় ', en: 'split ' })}{formatStopwatch(laps[i])})</span>
              </p>
            ))}
          </div>
          <ButtonRow>
            <CopyButton text={lapsText} labelBn="ল্যাপ কপি করুন" labelEn="Copy laps" />
            {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadText('eduvelto-stopwatch-laps.csv', lapsCsv, 'text/csv')} />
          </ButtonRow>
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'চারটি টাইমার একসঙ্গে দরকার হলে কুইজ স্টপওয়াচ টুলটি দেখুন। সময় ট্যাবের শিরোনামেও দেখা যায়।', en: 'If you need four timers at once, see the quiz stopwatch tool. The running time also shows in the tab title.' })}</p>
    </section>
  );
}
