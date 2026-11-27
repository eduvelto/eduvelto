// Eduvelto — Tasbih Counter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Dhikr presets + counting logic in src/lib/tools/tasbih.ts.
// The count is stored in localStorage ONLY, on the user's own
// device — nothing is ever sent to a server, and the UI says so.

import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { DHIKRS, TASBIH_TARGETS, tasbihProgress, parseStoredCount, dhikrByKey } from '../../lib/tools/tasbih';
import {
  inputStyle, labelStyle, cardStyle, resultStyle, headlineStyle,
  headlineLabelStyle, tileGridStyle, noteStyle, buttonRowStyle,
  ToolHero, CopyButton, Tile, presetChipStyle,
} from './toolUiShared';

const COUNT_KEY = 'eduvelto-tasbih-count-v1';
const DHIKR_KEY = 'eduvelto-tasbih-dhikr-v1';
const TARGET_KEY = 'eduvelto-tasbih-target-v1';

function loadStored(key: string, fallback: string): string {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function TasbihCounterTool() {
  const { t, lang } = useLanguage();
  const [dhikrKey, setDhikrKey] = useState(() => loadStored(DHIKR_KEY, 'subhanallah'));
  const [target, setTarget] = useState<number>(() => {
    const raw = Number(loadStored(TARGET_KEY, '33'));
    return TASBIH_TARGETS.includes(raw) ? raw : 33;
  });
  const [count, setCount] = useState<number>(() => parseStoredCount(loadStored(COUNT_KEY, '0')));

  useEffect(() => {
    try {
      window.localStorage.setItem(COUNT_KEY, String(count));
      window.localStorage.setItem(DHIKR_KEY, dhikrKey);
      window.localStorage.setItem(TARGET_KEY, String(target));
    } catch {
      // Storage unavailable: counting still works for this session.
    }
  }, [count, dhikrKey, target]);

  const dhikr = dhikrByKey(dhikrKey) ?? DHIKRS[0];
  const progress = useMemo(() => tasbihProgress(count, target), [count, target]);

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="tasbih-title">
      <ToolHero
        titleId="tasbih-title"
        titleBn="তসবিহ কাউন্টার"
        titleEn="Tasbih Counter"
        descBn="তসবিহ ও জিকিরের সংখ্যা গুনুন — প্রতিবার ট্যাপে একটি করে বাড়ে।"
        descEn="Count tasbih and dhikr — each tap adds one to the count."
        chipBn="শুধু আপনার ডিভাইসে সংরক্ষিত • সার্ভারে কিছু যায় না"
        chipEn="Stored only on your device • nothing goes to a server"
      />
      <div>
        <label style={labelStyle} htmlFor="tasbih-dhikr">
          {t({ bn: 'জিকির', en: 'Dhikr' })}
        </label>
        <select
          id="tasbih-dhikr"
          style={inputStyle}
          value={dhikrKey}
          onChange={(e) => setDhikrKey(e.target.value)}
        >
          {DHIKRS.map((d) => (
            <option key={d.key} value={d.key}>
              {lang === 'bn' ? d.transliterationBn : d.transliterationEn}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 4px' }}>
          {t({ bn: 'লক্ষ্য', en: 'Target' })}
        </p>
        <div style={buttonRowStyle}>
          {TASBIH_TARGETS.map((tg) => (
            <button
              key={tg}
              type="button"
              style={presetChipStyle(target === tg)}
              aria-pressed={target === tg}
              onClick={() => setTarget(tg)}
            >
              {tg}
            </button>
          ))}
        </div>
      </div>
      <div style={resultStyle} role="status">
        <p dir="rtl" lang="ar" style={{ fontSize: '1.8rem', lineHeight: 1.8, color: 'var(--teal-deep)', margin: '0 0 4px', textAlign: 'center' }}>
          {dhikr.arabic}
        </p>
        <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--heading)', margin: '0 0 4px' }}>
          {lang === 'bn' ? dhikr.transliterationBn : dhikr.transliterationEn} — {lang === 'bn' ? dhikr.meaningBn : dhikr.meaningEn}
        </p>
        <p style={headlineLabelStyle}>{t({ bn: 'মোট গণনা', en: 'Total count' })}</p>
        <p style={{ ...headlineStyle, textAlign: 'center', fontSize: '3rem' }}>{count}</p>
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: 'var(--line)',
            overflow: 'hidden',
            marginTop: 10,
          }}
          role="progressbar"
          aria-valuenow={progress.inRound}
          aria-valuemin={0}
          aria-valuemax={target}
        >
          <div style={{ height: '100%', width: `${progress.percent}%`, background: 'var(--teal-deep)' }} />
        </div>
        <div style={tileGridStyle}>
          <Tile label={t({ bn: 'এই চক্রে', en: 'In this round' })} value={`${progress.inRound} / ${target}`} />
          <Tile label={t({ bn: 'পূর্ণ চক্র', en: 'Rounds completed' })} value={String(progress.rounds)} />
        </div>
        <div style={buttonRowStyle}>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            style={{
              flex: 1,
              minHeight: 64,
              borderRadius: 12,
              border: 'none',
              background: 'var(--teal-deep)',
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t({ bn: 'ট্যাপ করুন (+১)', en: 'Tap (+1)' })}
          </button>
        </div>
        <div style={buttonRowStyle}>
          <button type="button" className="ev-btn-outline" onClick={() => setCount((c) => Math.max(0, c - 1))}>
            {t({ bn: '−১', en: '−1' })}
          </button>
          <button type="button" className="ev-btn-outline" onClick={() => setCount(0)}>
            {t({ bn: 'শূন্য করুন', en: 'Reset' })}
          </button>
          <CopyButton
            text={t({
              bn: `${dhikr.transliterationBn}: ${count} বার (লক্ষ্য ${target})।`,
              en: `${dhikr.transliterationEn}: ${count} times (target ${target}).`,
            })}
            labelBn="গণনা কপি করুন"
            labelEn="Copy count"
          />
        </div>
        <p style={noteStyle}>
          {t({
            bn: 'আপনার গণনা শুধু এই ব্রাউজারের localStorage-এ থাকে — Eduvelto-র সার্ভারে কিছু পাঠানো হয় না। অন্য ডিভাইসে এটি দেখা যাবে না; ব্রাউজারের ডেটা মুছলে গণনা মুছে যাবে।',
            en: 'Your count lives only in this browser’s localStorage — nothing is sent to Eduvelto’s servers. It will not appear on another device, and clearing browser data deletes it.',
          })}
        </p>
      </div>
    </section>
  );
}
