// Eduvelto — Online Alarm Clock (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Sets an alarm in the browser with a WebAudio beep. Honest limit: it only
// rings while this page stays open (and the device stays awake) — closing
// the tab or letting the device sleep silences it. 100% in-browser.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, ButtonRow, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, primaryButtonStyle } from './toolUi';
import { alarmDelayMs, formatCountdown } from '../../lib/tools/converterTools';

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

function beep(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.2;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.6;
      osc.start(start);
      osc.stop(start + 0.4);
    }
  } catch {
    // Audio unavailable — the visual "ringing" state still shows.
  }
}

export function OnlineAlarmClockTool() {
  const { t } = useLanguage();
  const [hour, setHour] = useState('7');
  const [minute, setMinute] = useState('30');
  const [armed, setArmed] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [remaining, setRemaining] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const h = parseIntOrNull(hour);
  const m = parseIntOrNull(minute);
  const valid = h !== null && m !== null && h >= 0 && h <= 23 && m >= 0 && m <= 59;

  useEffect(() => {
    if (!armed || !valid || h === null || m === null) return;
    const delay = alarmDelayMs(Date.now(), h, m);
    if (delay === null) return;
    timerRef.current = window.setTimeout(() => {
      setRinging(true);
      beep();
    }, delay);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [armed, valid, h, m]);

  useEffect(() => {
    if (!armed || ringing) return;
    const tick = () => {
      if (h === null || m === null) return;
      const delay = alarmDelayMs(Date.now(), h, m);
      setRemaining(delay === null ? null : formatCountdown(delay));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [armed, ringing, h, m]);

  const setAlarm = () => {
    if (!valid) return;
    setRinging(false);
    setArmed(true);
  };
  const cancel = () => {
    setArmed(false);
    setRinging(false);
    setRemaining(null);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  const pad = (n: number): string => String(n).padStart(2, '0');
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অনলাইন অ্যালার্ম ঘড়ি" titleEn="Online Alarm Clock" descBn="ব্রাউজারে অ্যালার্ম সেট করুন — সময় হলে বিপ শব্দে জানাবে।" descEn="Set an alarm in your browser — it will beep when the time comes." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="alarm-hour">{t({ bn: 'ঘণ্টা (০–২৩)', en: 'Hour (0–23)' })}</label>
          <input id="alarm-hour" style={shortInputStyle} type="number" min="0" max="23" inputMode="numeric" value={hour} onChange={(e) => setHour(e.target.value)} placeholder="7" disabled={armed} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="alarm-minute">{t({ bn: 'মিনিট (০–৫৯)', en: 'Minute (0–59)' })}</label>
          <input id="alarm-minute" style={shortInputStyle} type="number" min="0" max="59" inputMode="numeric" value={minute} onChange={(e) => setMinute(e.target.value)} placeholder="30" disabled={armed} />
        </div>
      </div>
      <ButtonRow>
        {!armed ? (
          <button type="button" style={primaryButtonStyle} onClick={setAlarm} disabled={!valid}>{t({ bn: 'অ্যালার্ম সেট করুন', en: 'Set alarm' })}</button>
        ) : (
          <button type="button" style={buttonStyle} onClick={cancel}>{t({ bn: 'অ্যালার্ম বন্ধ করুন', en: 'Cancel alarm' })}</button>
        )}
        <ExampleButton onLoad={() => { setHour('7'); setMinute('30'); }} />
      </ButtonRow>
      {!valid ? (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক সময় দিন — ঘণ্টা ০–২৩, মিনিট ০–৫৯।', en: 'Enter a valid time — hour 0–23, minute 0–59.' })}</p>
      ) : null}
      {armed && !ringing ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'অ্যালার্ম সেট হয়েছে', en: 'Alarm set' })}</p>
          <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{h !== null && m !== null ? `${pad(h)}:${pad(m)}` : ''}</p>
          <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `বাজতে বাকি: ${remaining ?? '…'}`, en: `Rings in: ${remaining ?? '…'}` })}</p>
        </div>
      ) : null}
      {ringing ? (
        <div style={resultStyle} role="alert">
          <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'অ্যালার্ম বাজছে!', en: 'Alarm ringing!' })}</p>
          <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{t({ bn: 'সময় হয়েছে!', en: "Time's up!" })}</p>
          <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `এখন ${h !== null && m !== null ? `${pad(h)}:${pad(m)}` : ''} — অ্যালার্ম বন্ধ করতে নিচের বোতাম চাপুন।`, en: `It is now ${h !== null && m !== null ? `${pad(h)}:${pad(m)}` : ''} — press the button below to stop the alarm.` })}</p>
          <ButtonRow><button type="button" style={primaryButtonStyle} onClick={cancel}>{t({ bn: 'অ্যালার্ম থামান', en: 'Stop alarm' })}</button></ButtonRow>
        </div>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'সত্যি কথা: এই অ্যালার্ম শুধু এই পেজ খোলা থাকলেই বাজে। ট্যাব বন্ধ করলে, ফোন লক বা স্লিপ হলে, বা ব্রাউজার ব্যাকগ্রাউন্ডে থেমে গেলে এটি বাজবে না — গুরুত্বপূর্ণ কাজের জন্য ফোনের নিজের অ্যালার্ম ব্যবহার করুন।', en: 'Honest note: this alarm only rings while this page stays open. If you close the tab, or the phone locks or sleeps, it will not ring — use your phone’s own alarm for anything important.' })}</p>
    </section>
  );
}
