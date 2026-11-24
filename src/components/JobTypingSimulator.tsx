// Eduvelto — typing simulator (design §1.8, R-2).
//
// Client-side first: Bangla + English typing practice (WPM,
// accuracy, error count, timed, progressive difficulty). One
// component for both languages, driven by a language + passage-set
// config. Keystrokes / timer updates are NEVER written to
// Firestore — only a best-WPM milestone is kept, in local state
// (a single milestone write comes only if the dashboard needs it).
//
// Honest framing on every render: practice, not an exact replica
// of the authority's practical test. Bangla layout (Avro/Bijoy) is
// stated and switchable; neither is presented as the official one.

import { useMemo, useRef, useState } from 'react';
import { Card } from './ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  scoreTyping,
  typingPassageById,
  typingPassagesFor,
  TYPING_SIMULATOR_NOTICE,
  type BanglaLayout,
  type TypingLanguage,
} from '../lib/jobTypingPassages';

export default function JobTypingSimulator({
  defaultLang = 'bn',
}: {
  defaultLang?: TypingLanguage;
}) {
  const { t, lang } = useLanguage();
  const [typingLang, setTypingLang] = useState<TypingLanguage>(defaultLang);
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [layout, setLayout] = useState<BanglaLayout>('avro');
  const passages = useMemo(
    () => typingPassagesFor(typingLang, level),
    [typingLang, level],
  );
  const [passageId, setPassageId] = useState(passages[0]?.id ?? '');
  const passage = typingPassageById(passageId) ?? passages[0];
  const [typed, setTyped] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [bestWpm, setBestWpm] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const done = passage !== undefined && typed.length >= passage.text.length;
  const elapsedSeconds =
    startedAt !== null
      ? Math.max(1, Math.round(((finishedAt ?? Date.now()) - startedAt) / 1000))
      : 0;
  const score =
    passage !== undefined && typed.length > 0
      ? scoreTyping({ passageText: passage.text, typedText: typed, elapsedSeconds: Math.max(elapsedSeconds, 1) })
      : null;

  const pickPassage = (id: string) => {
    setPassageId(id);
    setTyped('');
    setStartedAt(null);
    setFinishedAt(null);
  };

  const onType = (value: string) => {
    if (passage === undefined) return;
    if (startedAt === null && value.length > 0) setStartedAt(Date.now());
    const next = value.slice(0, passage.text.length);
    setTyped(next);
    if (next.length >= passage.text.length && finishedAt === null) {
      const end = Date.now();
      setFinishedAt(end);
      const s = scoreTyping({
        passageText: passage.text,
        typedText: next,
        elapsedSeconds: Math.max(1, Math.round((end - (startedAt ?? end)) / 1000)),
      });
      setBestWpm((prev) => (prev === null || s.wpm > prev ? s.wpm : prev));
    }
  };

  const reset = () => {
    setTyped('');
    setStartedAt(null);
    setFinishedAt(null);
    inputRef.current?.focus();
  };

  if (passage === undefined) return null;

  return (
    <Card>
      <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
        {t({ bn: 'টাইপিং অনুশীলন', en: 'Typing practice' })}
      </div>
      <p style={{ margin: '6px 0 12px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
        {t({ bn: TYPING_SIMULATOR_NOTICE.bn, en: TYPING_SIMULATOR_NOTICE.en })}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <label style={{ fontSize: 14 }}>
          {t({ bn: 'ভাষা', en: 'Language' })}{' '}
          <select
            value={typingLang}
            onChange={(e) => {
              const next = e.target.value as TypingLanguage;
              setTypingLang(next);
              const first = typingPassagesFor(next, level)[0];
              if (first) pickPassage(first.id);
            }}
            style={{ padding: '6px 8px', borderRadius: 6 }}
          >
            <option value="bn">{t({ bn: 'বাংলা', en: 'Bangla' })}</option>
            <option value="en">English</option>
          </select>
        </label>
        <label style={{ fontSize: 14 }}>
          {t({ bn: 'স্তর', en: 'Level' })}{' '}
          <select
            value={level}
            onChange={(e) => {
              const next = Number(e.target.value) as 1 | 2 | 3;
              setLevel(next);
              const first = typingPassagesFor(typingLang, next)[0];
              if (first) pickPassage(first.id);
            }}
            style={{ padding: '6px 8px', borderRadius: 6 }}
          >
            <option value={1}>{t({ bn: 'সহজ', en: 'Easy' })}</option>
            <option value={2}>{t({ bn: 'মাঝারি', en: 'Medium' })}</option>
            <option value={3}>{t({ bn: 'কঠিন', en: 'Hard' })}</option>
          </select>
        </label>
        {typingLang === 'bn' ? (
          <label style={{ fontSize: 14 }}>
            {t({ bn: 'কিবোর্ড বিন্যাস', en: 'Keyboard layout' })}{' '}
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as BanglaLayout)}
              style={{ padding: '6px 8px', borderRadius: 6 }}
            >
              <option value="avro">Avro</option>
              <option value="bijoy">Bijoy</option>
            </select>
          </label>
        ) : null}
        <label style={{ fontSize: 14 }}>
          {t({ bn: 'অনুচ্ছেদ', en: 'Passage' })}{' '}
          <select
            value={passage.id}
            onChange={(e) => pickPassage(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6 }}
          >
            {passages.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === 'bn' ? p.titleBn : p.titleEn} ({p.id})
              </option>
            ))}
          </select>
        </label>
      </div>
      {typingLang === 'bn' ? (
        <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 13 }}>
          {t({
            bn: `বিন্যাস: ${layout === 'avro' ? 'Avro' : 'Bijoy'} — কর্তৃপক্ষ কোন বিন্যাস ব্যবহার করে, তা বিজ্ঞপ্তি থেকে যাচাই না হওয়া পর্যন্ত এটিকে অফিসিয়াল বিন্যাস বলা হয় না।`,
            en: `Layout: ${layout === 'avro' ? 'Avro' : 'Bijoy'} — until the circular confirms which layout the authority uses, this is not presented as the official layout.`,
          })}
        </p>
      ) : null}

      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          lineHeight: 2,
          background: 'var(--surface)',
          marginBottom: 12,
        }}
        aria-label={t({ bn: 'টাইপ করার অনুচ্ছেদ', en: 'Passage to type' })}
      >
        {passage.text.split('').map((ch, i) => {
          const typedCh = typed[i];
          const color =
            typedCh === undefined ? 'inherit' : typedCh === ch ? '#15803D' : '#B91C1C';
          const bg = typedCh !== undefined && typedCh !== ch ? '#FDECEC' : 'transparent';
          return (
            <span key={i} style={{ color, background: bg }}>
              {ch}
            </span>
          );
        })}
      </div>

      <textarea
        ref={inputRef}
        value={typed}
        onChange={(e) => onType(e.target.value)}
        rows={4}
        placeholder={t({ bn: 'এখানে টাইপ করুন…', en: 'Type here…' })}
        style={{ width: '100%', padding: 10, borderRadius: 8, fontSize: 16, lineHeight: 1.8 }}
        aria-label={t({ bn: 'টাইপ করার জায়গা', en: 'Typing area' })}
      />

      {score !== null ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12, fontSize: 15 }}>
          <span>
            <strong>{score.wpm}</strong> {t({ bn: 'শব্দ/মিনিট', en: 'WPM' })}
          </span>
          <span>
            {t({ bn: 'নির্ভুলতা', en: 'Accuracy' })}: <strong>{score.accuracy}%</strong>
          </span>
          <span>
            {t({ bn: 'ভুল', en: 'Errors' })}: <strong>{score.errors}</strong>
          </span>
          <span>
            {t({ bn: 'সময়', en: 'Time' })}: <strong>{elapsedSeconds}{t({ bn: ' সেকেন্ড', en: 's' })}</strong>
          </span>
          {bestWpm !== null ? (
            <span>
              {t({ bn: 'এই সেশনের সেরা', en: 'Best this session' })}: <strong>{bestWpm}</strong>{' '}
              {t({ bn: 'শব্দ/মিনিট', en: 'WPM' })}
            </span>
          ) : null}
        </div>
      ) : null}

      {done ? (
        <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 14 }}>
          {t({
            bn: 'অনুচ্ছেদ শেষ। নির্ভুলতা বাড়লে গতি নিজে থেকেই বাড়বে।',
            en: 'Passage finished. As accuracy improves, speed follows on its own.',
          })}
        </p>
      ) : null}
      <p style={{ margin: '12px 0 0' }}>
        <button type="button" onClick={reset} style={{ padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>
          {t({ bn: 'আবার শুরু করুন', en: 'Start again' })}
        </button>
      </p>
    </Card>
  );
}
