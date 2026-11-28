// Eduvelto — Pomodoro & Focus Ambient Sound Workspace tool UI (28 Nov 2026, global batch item 2).
//
// NEW tool — the existing pomodoro-timer is left untouched. This is a
// workspace, not a second plain timer: a focus/break timer PLUS an
// ambient sound mixer. All sounds are SYNTHESIZED with Web Audio
// (noise buffers + filters) — NO audio files are needed, and the mixer
// works offline. Volume per sound + a master volume.
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Tiles, ToolSection, gridStyle, inputStyle, labelStyle, noteStyle, resultStyle } from './eduToolUi';
import { formatHMS } from '../../lib/tools/timerEngine';

type Phase = 'focus' | 'break';
type SoundId = 'rain' | 'wind' | 'white' | 'brown';

const SOUNDS: Array<{ id: SoundId; bn: string; en: string }> = [
  { id: 'rain', bn: 'বৃষ্টি', en: 'Rain' },
  { id: 'wind', bn: 'বাতাস', en: 'Wind' },
  { id: 'white', bn: 'সাদা শব্দ', en: 'White noise' },
  { id: 'brown', bn: 'গভীর শব্দ', en: 'Brown noise' },
];

interface SoundNodes {
  source: AudioBufferSourceNode;
  gain: GainNode;
  extra?: AudioNode[];
}

function makeNoiseBuffer(ctx: BaseAudioContext, kind: 'white' | 'brown'): AudioBuffer {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  if (kind === 'white') {
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  } else {
    // Brown noise: integrated white noise, leaks back toward zero.
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
}

export function FocusWorkspaceTool() {
  const { t, lang } = useLanguage();
  const [phase, setPhase] = useState<Phase>('focus');
  const [focusMin, setFocusMin] = useState('25');
  const [breakMin, setBreakMin] = useState('5');
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [masterVol, setMasterVol] = useState(80);
  const [enabled, setEnabled] = useState<Record<SoundId, boolean>>({ rain: false, wind: false, white: false, brown: false });
  const [volumes, setVolumes] = useState<Record<SoundId, number>>({ rain: 70, wind: 60, white: 50, brown: 50 });
  const [audioNote, setAudioNote] = useState('');
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<Partial<Record<SoundId, SoundNodes>>>({});
  const buffersRef = useRef<{ white?: AudioBuffer; brown?: AudioBuffer }>({});

  const phaseSeconds = phase === 'focus' ? (Number(focusMin) || 25) * 60 : (Number(breakMin) || 5) * 60;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  // Phase transition lives in its own effect (never inside a state
  // updater — StrictMode double-invokes updaters in dev, which would
  // double-count sessions and double-chime).
  useEffect(() => {
    if (!running || remaining !== 0) return;
    setRunning(false);
    if (phase === 'focus') {
      setSessions((c) => c + 1);
      setPhase('break');
      setRemaining((Number(breakMin) || 5) * 60);
    } else {
      setPhase('focus');
      setRemaining((Number(focusMin) || 25) * 60);
    }
    chime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, running]);

  // Stop all audio when the tool unmounts.
  useEffect(() => () => {
    Object.values(nodesRef.current).forEach((n) => {
      try { n?.source.stop(); } catch { /* already stopped */ }
    });
    void ctxRef.current?.close().catch(() => undefined);
  }, []);

  function ensureContext(): AudioContext | null {
    if (ctxRef.current) return ctxRef.current;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        setAudioNote(t({ bn: 'এই ব্রাউজারে Web Audio নেই, তাই পরিবেশের শব্দ চলবে না।', en: 'This browser has no Web Audio, so ambient sounds will not play.' }));
        return null;
      }
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = masterVol / 100;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
      buffersRef.current = { white: makeNoiseBuffer(ctx, 'white'), brown: makeNoiseBuffer(ctx, 'brown') };
      return ctx;
    } catch {
      setAudioNote(t({ bn: 'শব্দ চালু করা যায়নি।', en: 'Sound could not be started.' }));
      return null;
    }
  }

  function buildSound(ctx: AudioContext, id: SoundId): SoundNodes {
    const gain = ctx.createGain();
    gain.gain.value = volumes[id] / 100;
    gain.connect(masterRef.current!);
    const src = ctx.createBufferSource();
    src.buffer = id === 'brown' ? buffersRef.current.brown! : buffersRef.current.white!;
    src.loop = true;
    if (id === 'rain') {
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 1400;
      const high = ctx.createBiquadFilter();
      high.type = 'highpass';
      high.frequency.value = 300;
      src.connect(low);
      low.connect(high);
      high.connect(gain);
      return { source: src, gain, extra: [low, high] };
    }
    if (id === 'wind') {
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 420;
      band.Q.value = 0.6;
      // Slow swell: an LFO moves the filter frequency up and down.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain);
      lfoGain.connect(band.frequency);
      lfo.start();
      src.connect(band);
      band.connect(gain);
      return { source: src, gain, extra: [band, lfo] };
    }
    if (id === 'brown') {
      const low = ctx.createBiquadFilter();
      low.type = 'lowpass';
      low.frequency.value = 400;
      src.connect(low);
      low.connect(gain);
      return { source: src, gain, extra: [low] };
    }
    // White noise: straight through.
    src.connect(gain);
    return { source: src, gain };
  }

  function toggleSound(id: SoundId) {
    const next = !enabled[id];
    setEnabled((prev) => ({ ...prev, [id]: next }));
    if (next) {
      const ctx = ensureContext();
      if (!ctx) {
        setEnabled((prev) => ({ ...prev, [id]: false }));
        return;
      }
      void ctx.resume().catch(() => undefined);
      const nodes = buildSound(ctx, id);
      nodesRef.current[id] = nodes;
      nodes.source.start();
    } else {
      const nodes = nodesRef.current[id];
      if (nodes) {
        try { nodes.source.stop(); } catch { /* already stopped */ }
        nodes.extra?.forEach((n) => { if (n instanceof OscillatorNode) { try { n.stop(); } catch { /* already stopped */ } } });
        delete nodesRef.current[id];
      }
    }
  }

  function setVolume(id: SoundId, v: number) {
    setVolumes((prev) => ({ ...prev, [id]: v }));
    nodesRef.current[id]?.gain.gain.setTargetAtTime(v / 100, ctxRef.current?.currentTime ?? 0, 0.05);
  }

  function setMaster(v: number) {
    setMasterVol(v);
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.setTargetAtTime(v / 100, ctxRef.current.currentTime, 0.05);
    }
  }

  function chime() {
    const ctx = ctxRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.value = 880;
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch { /* chime is a nicety */ }
  }

  function resetTimer() {
    setRunning(false);
    setPhase('focus');
    setRemaining((Number(focusMin) || 25) * 60);
  }

  function switchPhase(p: Phase) {
    setRunning(false);
    setPhase(p);
    setRemaining(p === 'focus' ? (Number(focusMin) || 25) * 60 : (Number(breakMin) || 5) * 60);
  }

  return (
    <ToolSection id="focus-workspace-title" titleBn="ফোকাস ওয়ার্কস্পেস" titleEn="Focus Workspace"
      descBn="টাইমার + পরিবেশের শব্দের মিক্সার — বৃষ্টি, বাতাস, সাদা শব্দ। শব্দ ব্রাউজারেই তৈরি হয়, কোনো অডিও ফাইল লাগে না।"
      descEn="Timer + ambient sound mixer — rain, wind, white noise. Sounds are synthesized in the browser; no audio files needed.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="fw-focus">{t({ bn: 'মনোযোগ (মিনিট)', en: 'Focus (minutes)' })}</label>
          <input id="fw-focus" style={inputStyle} type="number" min="1" max="180" value={focusMin}
            onChange={(e) => { setFocusMin(e.target.value); if (!running && phase === 'focus') setRemaining((Number(e.target.value) || 25) * 60); }} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="fw-break">{t({ bn: 'বিরতি (মিনিট)', en: 'Break (minutes)' })}</label>
          <input id="fw-break" style={inputStyle} type="number" min="1" max="60" value={breakMin}
            onChange={(e) => { setBreakMin(e.target.value); if (!running && phase === 'break') setRemaining((Number(e.target.value) || 5) * 60); }} />
        </div>
      </div>
      <div style={resultStyle} role="status">
        <p style={{ margin: '0 0 6px', fontSize: 16 }}><strong>{phase === 'focus' ? t({ bn: 'মনোযোগের সময়', en: 'Focus time' }) : t({ bn: 'বিরতির সময়', en: 'Break time' })}</strong></p>
        <p style={{ margin: '0 0 6px', fontSize: 34, fontWeight: 700, color: 'var(--heading)', fontFamily: 'var(--font-head)' }}>{formatHMS(remaining)}</p>
        <Tiles items={[
          { label: t({ bn: 'সম্পন্ন মনোযোগ সেশন', en: 'Focus sessions done' }), value: String(sessions) },
          { label: t({ bn: 'এই ধাপের মোট', en: 'Phase total' }), value: formatHMS(phaseSeconds) },
        ]} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <button type="button" className="ev-btn ev-btn-primary" style={{ minHeight: 44 }}
            onClick={() => { if (remaining === 0) resetTimer(); else setRunning((r) => !r); }}>
            {running ? t({ bn: 'থামান', en: 'Pause' }) : t({ bn: 'শুরু করুন', en: 'Start' })}
          </button>
          <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={() => switchPhase(phase === 'focus' ? 'break' : 'focus')}>
            {phase === 'focus' ? t({ bn: 'বিরতিতে যান', en: 'Switch to break' }) : t({ bn: 'মনোযোগে ফিরুন', en: 'Back to focus' })}
          </button>
          <button type="button" className="ev-btn ev-btn-outline" style={{ minHeight: 44 }} onClick={resetTimer}>
            {t({ bn: 'রিসেট', en: 'Reset' })}
          </button>
        </div>
        <p style={noteStyle}>{t({ bn: 'মনোযোগ শেষ হলে নিজে থেকে বিরতিতে যাবে, বিরতি শেষ হলে আবার মনোযোগে।', en: 'When focus ends it moves to break on its own, and back to focus when the break ends.' })}</p>
      </div>
      <div style={{ marginTop: 16 }}>
        <p style={labelStyle}>{t({ bn: 'পরিবেশের শব্দ (মিক্সার) — একসাথে কয়েকটি চালানো যায়', en: 'Ambient sounds (mixer) — several can play together' })}</p>
        {SOUNDS.map((s) => (
          <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <button type="button" className={enabled[s.id] ? 'ev-btn ev-btn-primary' : 'ev-btn ev-btn-outline'}
              style={{ minHeight: 44, minWidth: 140 }} onClick={() => toggleSound(s.id)} aria-pressed={enabled[s.id]}>
              {enabled[s.id] ? `■ ${lang === 'bn' ? s.bn : s.en}` : `▶ ${lang === 'bn' ? s.bn : s.en}`}
            </button>
            <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor={`fw-vol-${s.id}`}>{t({ bn: 'ভলিউম', en: 'Volume' })}</label>
            <input id={`fw-vol-${s.id}`} type="range" min="0" max="100" value={volumes[s.id]}
              onChange={(e) => setVolume(s.id, Number(e.target.value))} style={{ flex: '1 1 160px', minWidth: 120 }} />
            <span style={{ minWidth: 40 }}>{volumes[s.id]}%</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="fw-master">{t({ bn: 'মোট ভলিউম', en: 'Master volume' })}</label>
          <input id="fw-master" type="range" min="0" max="100" value={masterVol}
            onChange={(e) => setMaster(Number(e.target.value))} style={{ flex: '1 1 160px', minWidth: 120 }} />
          <span style={{ minWidth: 40 }}>{masterVol}%</span>
        </div>
        {audioNote ? <p style={noteStyle} role="alert">{audioNote}</p> : null}
        <p style={noteStyle}>{t({ bn: 'শব্দগুলো Web Audio দিয়ে আপনার ডিভাইসেই তৈরি হয় — কোনো অডিও ফাইল ডাউনলোড হয় না, অফলাইনেও চলে।', en: 'The sounds are synthesized on your device with Web Audio — no audio file is downloaded, and they work offline.' })}</p>
      </div>
    </ToolSection>
  );
}
