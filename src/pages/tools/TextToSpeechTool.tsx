// Eduvelto — Text to Speech tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Uses the browser's built-in speechSynthesis ONLY — no API, no
// network, no audio is ever uploaded. Voice sorting lives in
// src/lib/tools/textToSpeech.ts (pure, tested in node); the
// speechSynthesis object itself is never tested.
//
// Design polish (batch 2): hero band, volume slider (was missing),
// listening-time estimate (words ÷ ~165 wpm at 1×, adjusted for
// speed), word count, one-tap Bangla example text, and an honest
// "no MP3 download with browser voices" note. Bangla voices are
// listed first via sortVoicesPreferBnEn. Click-sentence-to-start
// was skipped — it needs live word-boundary highlighting, a rework
// of the finished speak flow (noted in the batch report).

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  pickDefaultVoice,
  sortVoicesPreferBnEn,
  type SpeechVoiceLike,
} from '../../lib/tools/textToSpeech';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  borderRadius: 12,
  padding: '20px 18px',
  marginBottom: 16,
  boxShadow: 'var(--shadow-md)',
};

const heroTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 22,
  color: '#ffffff',
  margin: '0 0 6px',
};

const heroDescStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.88)',
  fontSize: 14,
  lineHeight: 1.6,
  margin: '0 0 12px',
};

const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 600,
  color: '#ffffff',
  background: 'rgba(255, 255, 255, 0.14)',
  border: '1px solid rgba(255, 255, 255, 0.45)',
  borderRadius: 999,
  padding: '4px 10px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 14,
};

const tileGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
  marginTop: 12,
};

const tileStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '12px',
  boxShadow: 'var(--shadow-sm)',
};

const tileLabelStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  margin: '0 0 4px',
};

const tileValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--heading)',
  margin: 0,
};

function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && !!window.speechSynthesis;
}

const EXAMPLE_TEXT_BN = 'আসসালামু আলাইকুম, কেমন আছেন? এডুভেল্টোতে আপনাকে স্বাগতম। এখানে আপনি বিনামূল্যে পড়াশোনা করতে পারবেন।';

export function TextToSpeechTool() {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechVoiceLike[]>([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState('1');
  const [pitch, setPitch] = useState('1');
  const [volume, setVolume] = useState('1');
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');

  const supported = useMemo(() => isSpeechSupported(), []);

  useEffect(() => {
    if (!supported) return;
    const load = () => {
      const loaded: SpeechVoiceLike[] = window.speechSynthesis
        .getVoices()
        .map((v) => ({ name: v.name, lang: v.lang }));
      const sorted = sortVoicesPreferBnEn(loaded);
      setVoices(sorted);
      setVoiceName((prev) => prev || pickDefaultVoice(sorted)?.name || '');
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', load);
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const selectedVoice = voices.find((v) => v.name === voiceName) ?? null;
  const rateV = Number(rate);
  const pitchV = Number(pitch);
  const volumeV = Number(volume);

  // Listening-time estimate: ~165 words per minute at 1× speed.
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  const listenSeconds =
    wordCount === 0 ? 0 : (wordCount / 165 / (Number.isFinite(rateV) && rateV > 0 ? rateV : 1)) * 60;
  const listenLabel =
    listenSeconds === 0
      ? '—'
      : listenSeconds < 60
        ? t({ bn: `প্রায় ${Math.max(1, Math.round(listenSeconds))} সেকেন্ড`, en: `about ${Math.max(1, Math.round(listenSeconds))} sec` })
        : t({
            bn: `প্রায় ${(listenSeconds / 60).toFixed(1)} মিনিট`,
            en: `about ${(listenSeconds / 60).toFixed(1)} min`,
          });

  function speak(): void {
    setError('');
    if (!supported) {
      setError(
        t({
          bn: 'এই ব্রাউজারে ভয়েস সুবিধা নেই — অন্য একটি আধুনিক ব্রাউজার চেষ্টা করুন।',
          en: 'Voice is not available in this browser — try a modern browser.',
        }),
      );
      return;
    }
    if (text.trim() === '') {
      setError(
        t({ bn: 'শোনাতে প্রথমে কিছু লিখুন।', en: 'Write something first to hear it spoken.' }),
      );
      return;
    }
    if (voices.length === 0) {
      setError(
        t({
          bn: 'এই ডিভাইসে কোনো ভয়েস পাওয়া যায়নি — ব্রাউজারের ভয়েস সেটিংস দেখুন।',
          en: 'No voices are available on this device — check your browser voice settings.',
        }),
      );
      return;
    }
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const realVoice = window.speechSynthesis
      .getVoices()
      .find((v) => v.name === voiceName);
    if (realVoice) utterance.voice = realVoice;
    utterance.lang = selectedVoice?.lang ?? 'bn-BD';
    utterance.rate = Number.isFinite(rateV) ? rateV : 1;
    utterance.pitch = Number.isFinite(pitchV) ? pitchV : 1;
    utterance.volume = Number.isFinite(volumeV) ? Math.min(1, Math.max(0, volumeV)) : 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  function stop(): void {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="tts-title">
      <div style={heroStyle}>
        <h2 id="tts-title" style={heroTitleStyle}>
          {t({ bn: 'টেক্সট টু স্পিচ', en: 'Text to Speech' })}
        </h2>
        <p style={heroDescStyle}>
          {t({
            bn: 'লেখা টাইপ করুন, ভয়েস বেছে নিন, শুনুন। শব্দ আপনার ব্রাউজারেই তৈরি হয় — কিছুই ইন্টারনেটে পাঠানো হয় না।',
            en: 'Type text, pick a voice, and listen. Speech is made in your browser — nothing is sent to the internet.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ব্রাউজারে • কোনো আপলোড নয়', en: '100% in-browser • nothing uploaded' })}
        </span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="tts-text">
          {t({ bn: 'যা শুনতে চান লিখুন', en: 'Text to speak' })}
        </label>
        <textarea
          id="tts-text"
          style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t({ bn: 'যেমন: আসসালামু আলাইকুম, কেমন আছেন?', en: 'e.g. Hello, how are you?' })}
        />
      </div>
      {wordCount > 0 ? (
        <div style={tileGridStyle}>
          <div style={tileStyle}>
            <p style={tileLabelStyle}>{t({ bn: 'শব্দ', en: 'Words' })}</p>
            <p style={tileValueStyle}>{wordCount}</p>
          </div>
          <div style={tileStyle}>
            <p style={tileLabelStyle}>{t({ bn: 'শোনার সময় (১× গতিতে ~১৬৫ শব্দ/মিনিট)', en: 'Listening time (~165 wpm at 1×)' })}</p>
            <p style={tileValueStyle}>{listenLabel}</p>
          </div>
        </div>
      ) : null}
      <div style={{ ...gridStyle, marginTop: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="tts-voice">
            {t({ bn: 'ভয়েস', en: 'Voice' })}
          </label>
          <select
            id="tts-voice"
            style={inputStyle}
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            disabled={voices.length === 0}
          >
            {voices.length === 0 ? (
              <option value="">
                {t({ bn: 'কোনো ভয়েস পাওয়া যায়নি', en: 'No voices available' })}
              </option>
            ) : (
              voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))
            )}
          </select>
          <p style={noteStyle}>
            {t({
              bn: 'বাংলা ভয়েস থাকলে সেটি প্রথমে দেখানো হয়। আপনার ডিভাইসে বাংলা ভয়েস না থাকলে অ্যান্ড্রয়েডে Google-এর Speech Services অথবা আইফোনে সেটিংস → অ্যাক্সেসিবিলিটি → স্পোকেন কনটেন্ট থেকে ভয়েস যোগ করুন।',
              en: 'A Bangla voice is listed first when your device has one. If it does not, add one via Google Speech Services on Android, or Settings → Accessibility → Spoken Content on iPhone.',
            })}
          </p>
        </div>
        <div>
          <label style={labelStyle} htmlFor="tts-rate">
            {t({ bn: 'গতি', en: 'Speed' })}: {rate}×
          </label>
          <input
            id="tts-rate"
            style={inputStyle}
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="tts-pitch">
            {t({ bn: 'সুর', en: 'Pitch' })}: {pitch}
          </label>
          <input
            id="tts-pitch"
            style={inputStyle}
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="tts-volume">
            {t({ bn: 'ভলিউম', en: 'Volume' })}: {volume}
          </label>
          <input
            id="tts-volume"
            style={inputStyle}
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
          />
        </div>
      </div>
      <div style={buttonRowStyle}>
        <button type="button" className="ev-btn ev-btn-primary" onClick={speak} disabled={speaking}>
          {t({ bn: 'শুনুন', en: 'Speak' })}
        </button>
        <button type="button" className="ev-btn" onClick={stop} disabled={!speaking}>
          {t({ bn: 'থামান', en: 'Stop' })}
        </button>
        <button type="button" className="ev-btn-outline" onClick={() => setText(EXAMPLE_TEXT_BN)}>
          {t({ bn: 'উদাহরণ লেখা বসান', en: 'Load example text' })}
        </button>
      </div>
      <p style={noteStyle}>
        {t({
          bn: 'ব্রাউজারের ভয়েস দিয়ে শোনানো হয়, তাই MP3 হিসেবে ডাউনলোড করা যায় না — এটাই ব্রাউজার ভয়েসের সীমা।',
          en: 'Speech comes from your browser voice, so it cannot be downloaded as MP3 — that is the limit of browser voices.',
        })}
      </p>
      {!supported ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'এই ব্রাউজারে ভয়েস সুবিধা নেই — অন্য একটি আধুনিক ব্রাউজার চেষ্টা করুন।',
            en: 'Voice is not available in this browser — try a modern browser.',
          })}
        </p>
      ) : voices.length === 0 ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'এই ডিভাইসে কোনো ভয়েস পাওয়া যায়নি — ব্রাউজারের ভয়েস সেটিংস দেখুন।',
            en: 'No voices are available on this device — check your browser voice settings.',
          })}
        </p>
      ) : null}
      {error ? (
        <p style={errorStyle} role="alert">
          {error}
        </p>
      ) : null}
      {speaking ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: 0, fontSize: 15 }}>
            {t({ bn: 'শোনানো হচ্ছে…', en: 'Speaking…' })}
          </p>
          <p style={noteStyle}>
            {t({
              bn: 'আপনার ব্রাউজারের ভয়েস দিয়ে শোনানো হচ্ছে — কোনো সার্ভারে পাঠানো হচ্ছে না।',
              en: 'Spoken with your browser voice — nothing is sent to any server.',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
