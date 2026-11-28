// Eduvelto — shared tool UI helpers (Text & Developer batch, 27 Nov 2026).
//
// Small building blocks so the 29 text/developer tools share one look:
// gradient hero, headline result + tiles, copy button on every output,
// "Load example" button. Forest/teal/amber, bn+en throughout.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  AI_DAILY_LIMIT,
  aiQuotaExhaustedMessageBn,
  aiQuotaExhaustedMessageEn,
  toBnDigits,
} from '../../lib/aiQuota';

export const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 120,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
  fontFamily: 'inherit',
  resize: 'vertical',
};

export const shortInputStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 44,
  resize: 'none',
};

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

export const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

export const buttonStyle: CSSProperties = {
  minHeight: 44,
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  background: 'var(--surface)',
  color: 'var(--heading)',
  cursor: 'pointer',
};

export const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'var(--teal)',
  borderColor: 'var(--teal)',
  color: '#ffffff',
  fontWeight: 700,
};

export const activeButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'var(--teal-soft)',
  fontWeight: 700,
};

export const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

export const tilesStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 10,
  marginTop: 12,
};

export const tileStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '10px 12px',
  boxShadow: 'var(--shadow-sm)',
};

export const tileValueStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--heading)',
  wordBreak: 'break-word',
};

export const tileLabelStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  marginTop: 2,
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

export function ToolHero(props: {
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  chipBn?: string;
  chipEn?: string;
}) {
  const { t } = useLanguage();
  return (
    <div style={heroStyle}>
      <h2 style={heroTitleStyle}>{t({ bn: props.titleBn, en: props.titleEn })}</h2>
      <p style={heroDescStyle}>{t({ bn: props.descBn, en: props.descEn })}</p>
      {props.chipBn && props.chipEn ? (
        <span style={trustChipStyle}>{t({ bn: props.chipBn, en: props.chipEn })}</span>
      ) : null}
    </div>
  );
}

/** Copy button with a "Copied" state. Disabled when there is nothing to copy. */
export function CopyButton(props: { text: string; disabled?: boolean; labelBn?: string; labelEn?: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!props.text) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(props.text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  };
  return (
    <button type="button" style={buttonStyle} onClick={() => void copy()} disabled={props.disabled ?? props.text === ''}>
      {copied
        ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
        : t({ bn: props.labelBn ?? 'কপি করুন', en: props.labelEn ?? 'Copy' })}
    </button>
  );
}

/** Headline result + supporting tiles. */
export function Tiles(props: { items: Array<{ labelBn: string; labelEn: string; value: string }> }) {
  const { t } = useLanguage();
  return (
    <div style={tilesStyle}>
      {props.items.map((item) => (
        <div key={item.labelEn} style={tileStyle}>
          <div style={tileValueStyle}>{item.value}</div>
          <div style={tileLabelStyle}>{t({ bn: item.labelBn, en: item.labelEn })}</div>
        </div>
      ))}
    </div>
  );
}

export function ButtonRow(props: { children: ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{props.children}</div>;
}

export function ClearButton(props: { onClear: () => void; disabled?: boolean }) {
  const { t } = useLanguage();
  return (
    <button type="button" style={buttonStyle} onClick={props.onClear} disabled={props.disabled}>
      {t({ bn: 'মুছুন', en: 'Clear' })}
    </button>
  );
}

export function ExampleButton(props: { onLoad: () => void }) {
  const { t } = useLanguage();
  return (
    <button type="button" style={buttonStyle} onClick={props.onLoad}>
      {t({ bn: 'উদাহরণ লোড করুন', en: 'Load example' })}
    </button>
  );
}

/**
 * Daily free-AI budget line (owner rule 3a, 28 Nov 2026): every AI
 * tool states the 10-questions/day limit and how many the visitor
 * has left today. Shared so all 4 AI tools word it the same way.
 */
export function AiLimitLine(props: { remaining: number }) {
  const { t } = useLanguage();
  return (
    <p style={{ ...noteStyle, fontSize: 14, color: 'var(--heading)' }}>
      {t({
        bn: `দিনে ${toBnDigits(AI_DAILY_LIMIT)}টি ফ্রি AI প্রশ্ন — আজ আরও ${toBnDigits(props.remaining)}টি বাকি`,
        en: `${AI_DAILY_LIMIT} free AI questions per day — ${props.remaining} left today`,
      })}
    </p>
  );
}

/**
 * Quota-exhausted notice (owner rule 3c): the owner's EXACT friendly
 * Bangla message (live registry count) — NEVER a red error. In the
 * English UI the Bangla stays verbatim with a short gloss beneath.
 */
export function AiQuotaNotice() {
  const { lang } = useLanguage();
  return (
    <p
      role="status"
      style={{
        background: 'var(--teal-soft)',
        border: '1px solid var(--teal)',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 14,
        lineHeight: 1.7,
        color: 'var(--heading)',
        margin: '0 0 12px',
      }}
    >
      {aiQuotaExhaustedMessageBn()}
      {lang === 'en' ? (
        <>
          <br />
          {aiQuotaExhaustedMessageEn()}
        </>
      ) : null}
    </p>
  );
}
