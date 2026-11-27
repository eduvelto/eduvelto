// Eduvelto — Dictionary (Bangla–English) tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// The word list lives in src/lib/tools/dictionary.ts — no API, no
// fetch. Search filters as-you-type, exact matches first, then
// prefix matches, in both directions.
//
// Design polish (batch 2): hero band, honest "curated wordlist, not
// a complete dictionary" label, a copy button on every entry, example
// word chips, and a cross-link to the Text to Speech tool so any
// word can be heard aloud.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { searchDictionary } from '../../lib/tools/dictionary';

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
  margin: '12px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const listStyle: CSSProperties = {
  margin: '8px 0 0',
  padding: 0,
  listStyle: 'none',
  fontSize: 15,
  lineHeight: 1.7,
};

const entryStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '10px 12px',
  marginBottom: 8,
  boxShadow: 'var(--shadow-sm)',
};

const chipRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 10,
};

function exampleChipStyle(): CSSProperties {
  return {
    borderRadius: 999,
    padding: '6px 14px',
    minHeight: 36,
    border: '1px solid var(--teal)',
    background: 'var(--card)',
    color: 'var(--teal-deep)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  };
}

const EXAMPLE_WORDS = ['water', 'book', 'teacher', 'পানি', 'বই', 'শিক্ষক'];

export function DictionaryTool() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState('');

  const results = useMemo(() => searchDictionary(query), [query]);
  const searching = query.trim() !== '';

  async function copyEntry(entryKey: string, text: string): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(entryKey);
        window.setTimeout(() => setCopied(''), 2000);
      }
    } catch {
      setCopied('');
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="dictionary-title">
      <div style={heroStyle}>
        <h2 id="dictionary-title" style={heroTitleStyle}>
          {t({ bn: 'অভিধান (বাংলা–ইংরেজি)', en: 'Dictionary (Bangla–English)' })}
        </h2>
        <p style={heroDescStyle}>
          {t({
            bn: 'ইংরেজি বা বাংলা শব্দ লিখুন — লেখার সাথে সাথে অর্থ দেখাবে। এটি একটি ছোট অন্তর্নির্মিত শব্দতালিকা, ইন্টারনেট ছাড়াই আপনার ডিভাইসেই চলে।',
            en: 'Type an English or Bangla word — the meaning appears as you type. This is a small built-in word list that runs on your device, with no internet needed.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: 'সম্পূর্ণ অভিধান নয় — বাছাই করা শব্দতালিকা', en: 'Not a complete dictionary — a curated wordlist' })}
        </span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="dictionary-query">
          {t({ bn: 'শব্দ খুঁজুন', en: 'Search a word' })}
        </label>
        <input
          id="dictionary-query"
          style={inputStyle}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t({ bn: 'যেমন: book অথবা বই', en: 'e.g. book or বই' })}
        />
      </div>
      <div style={chipRowStyle}>
        {EXAMPLE_WORDS.map((w) => (
          <button key={w} type="button" style={exampleChipStyle()} onClick={() => setQuery(w)}>
            {w}
          </button>
        ))}
      </div>
      {searching ? (
        <div style={resultStyle} role="status">
          {results.length > 0 ? (
            <ul style={listStyle}>
              {results.map((entry) => {
                const key = `${entry.en}-${entry.bn}`;
                return (
                  <li key={key} style={entryStyle}>
                    <span>
                      <strong>{entry.en}</strong>
                      {' — '}
                      {entry.bn}
                    </span>
                    <button
                      type="button"
                      className="ev-btn-outline"
                      onClick={() => void copyEntry(key, `${entry.en} — ${entry.bn}`)}
                    >
                      {copied === key
                        ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                        : t({ bn: 'কপি', en: 'Copy' })}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: 15 }}>
              {t({
                bn: 'এই শব্দটি তালিকায় পাওয়া যায়নি। অন্য একটি সাধারণ শব্দ চেষ্টা করুন।',
                en: 'This word is not in the list. Try another common word.',
              })}
            </p>
          )}
          <p style={noteStyle}>
            {t({
              bn: 'নিয়ম: প্রথমে হুবহু মিল, তারপর ওই শব্দ দিয়ে শুরু হওয়া শব্দগুলো দেখানো হয় — ইংরেজি ও বাংলা দুই দিকেই।',
              en: 'How it works: exact matches first, then words starting with your query — in both English and Bangla.',
            })}
          </p>
          <p style={{ fontSize: 14, margin: '10px 0 0' }}>
            <a href="/tools/text-to-speech">
              {t({ bn: 'শব্দটি শুনুন — টেক্সট টু স্পিচ →', en: 'Hear the word — Text to Speech →' })}
            </a>
          </p>
        </div>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '14px 0 0' }}>
          {t({
            bn: 'উদাহরণ: water, book, teacher — অথবা পানি, বই, শিক্ষক। উপরের যেকোনো শব্দে চাপ দিন।',
            en: 'Examples: water, book, teacher — or পানি, বই, শিক্ষক. Tap any word above.',
          })}
        </p>
      )}
    </section>
  );
}
