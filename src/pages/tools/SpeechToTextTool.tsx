// Eduvelto — Speech to Text tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, labelStyle, cardStyle, primaryButtonStyle, noteStyle } from './toolUi';
import { useEffect, useRef } from 'react';
import { isSpeechRecognitionSupported, SPEECH_LANGUAGES } from '../../lib/tools/speechToText';


const selectStyle: CSSProperties = {
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

const outputStyle: CSSProperties = {
  width: '100%',
  minHeight: 120,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--teal-soft)',
  color: 'var(--heading)',
  fontFamily: 'inherit',
  resize: 'vertical',
};

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function SpeechToTextTool() {
  const { t } = useLanguage();
  const [supported] = useState(() => isSpeechRecognitionSupported());
  const [lang, setLang] = useState('bn-BD');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  const startListening = () => {
    const w = window as unknown as Record<string, unknown>;
    const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as
      | (new () => {
          lang: string;
          interimResults: boolean;
          continuous: boolean;
          onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null;
          onerror: ((e: { error: string }) => void) | null;
          onend: (() => void) | null;
          start: () => void;
          stop: () => void;
        })
      | undefined;
    if (!Ctor) {
      setError(t({ bn: 'এই ব্রাউজারে কণ্ঠ থেকে লেখা সমর্থিত নয়। Chrome বা Edge ব্যবহার করুন।', en: 'Speech recognition is not supported in this browser. Use Chrome or Edge.' }));
      return;
    }
    setError('');
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (e) => {
      let finalText = '';
      let interimText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.length > 0) {
          if ((result as unknown as { isFinal?: boolean }).isFinal) finalText += result[0].transcript;
          else interimText += result[0].transcript;
        }
      }
      if (finalText) setTranscript((prev) => (prev ? `${prev} ${finalText}` : finalText));
      setInterim(interimText);
    };
    recognition.onerror = (e) => {
      setListening(false);
      setError(e.error === 'not-allowed'
        ? t({ bn: 'মাইক্রোফোনের অনুমতি দেওয়া হয়নি। ব্রাউজারের ঠিকানা বারের পাশে মাইকের অনুমতি দিন।', en: 'Microphone permission was not given. Allow the microphone next to the browser address bar.' })
        : t({ bn: 'কণ্ঠ শোনা যায়নি। আবার চেষ্টা করুন।', en: 'Speech could not be heard. Try again.' }));
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError(t({ bn: 'শুরু করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not start. Try again.' }));
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim('');
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="কণ্ঠ থেকে লেখা" titleEn="Speech to Text" descBn="মাইকে কথা বলুন, ব্রাউজার তা লেখায় রূপান্তর করবে — কোনো ফাইল আপলোড হয় না।" descEn="Speak into the microphone and the browser turns your speech into text — nothing is uploaded." chipBn="Chrome / Edge-এ কাজ করে — সব ব্রাউজারে নয়" chipEn="Works in Chrome / Edge — not in every browser" />
      {!supported ? (
        <div style={errorStyle} role="alert">
          {t({ bn: 'এই ব্রাউজারে কণ্ঠ থেকে লেখা সমর্থিত নয়। এটি Chrome ও Edge-এ কাজ করে; Firefox ও Safari-তে সাধারণত কাজ করে না।', en: 'Speech recognition is not supported in this browser. It works in Chrome and Edge; it usually does not work in Firefox or Safari.' })}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle} htmlFor="stt-lang">{t({ bn: 'ভাষা', en: 'Language' })}</label>
          <select id="stt-lang" style={selectStyle} value={lang} onChange={(e) => setLang(e.target.value)} disabled={listening}>
            {SPEECH_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{t({ bn: l.nameBn, en: l.nameEn })}</option>
            ))}
          </select>
        </div>
        {listening ? (
          <button type="button" style={primaryButtonStyle} onClick={stopListening}>{t({ bn: 'থামান', en: 'Stop' })}</button>
        ) : (
          <button type="button" style={primaryButtonStyle} onClick={startListening} disabled={!supported}>{t({ bn: 'শুনতে শুরু করুন', en: 'Start listening' })}</button>
        )}
      </div>
      {listening ? (
        <p role="status" style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: '#991b1b' }}>● {t({ bn: 'শুনছি… কথা বলুন', en: 'Listening… speak now' })}</p>
      ) : null}
      {error ? <div style={errorStyle} role="alert">{error}</div> : null}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="stt-output">{t({ bn: 'লেখা', en: 'Text' })}</label>
        <textarea id="stt-output" style={outputStyle} value={transcript + (interim ? ` ${interim}` : '')} onChange={(e) => setTranscript(e.target.value)} placeholder={t({ bn: 'আপনার কথা এখানে লেখা হবে…', en: 'Your speech will appear here as text…' })} />
      </div>
      <ButtonRow>
        <CopyButton text={transcript} />
        <ClearButton onClear={() => { setTranscript(''); setInterim(''); }} disabled={transcript === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'কণ্ঠ শোনা ও লেখায় রূপান্তর ব্রাউজারেই হয় — কোনো অডিও ফাইল আপলোড হয় না। তবে Chrome-এ রূপান্তরের জন্য ব্রাউজার নিজে অনলাইন সেবা ব্যবহার করতে পারে।', en: 'Listening and converting to text happen in the browser — no audio file is uploaded. In Chrome, though, the browser itself may use an online service for the conversion.' })}</p>
    </section>
  );
}
