// Eduvelto — shared UI pieces for the Health tools (Batch 3).
//
// Mirrors the Batch 2 polished design (BkashNagadTool): gradient
// hero, headline result + tiles, copy buttons, formula with the
// user's own numbers, trust label. Forest / teal / amber palette,
// bn+en throughout. No tool logic lives here — only styles and
// small shared helpers.

import { useState, type CSSProperties, type ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

export const inputStyle: CSSProperties = {
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

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

export const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

export const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

export const heroStyle: CSSProperties = {
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  borderRadius: 12,
  padding: '20px 18px',
  marginBottom: 16,
  boxShadow: 'var(--shadow-md)',
};

export const heroTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: 22,
  color: '#ffffff',
  margin: '0 0 6px',
};

export const heroDescStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.88)',
  fontSize: 14,
  lineHeight: 1.6,
  margin: '0 0 12px',
};

export const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 12,
  fontWeight: 600,
  color: '#ffffff',
  background: 'rgba(255, 255, 255, 0.14)',
  border: '1px solid rgba(255, 255, 255, 0.45)',
  borderRadius: 999,
  padding: '4px 10px',
};

export const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

export const headlineStyle: CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontSize: '2.5rem',
  lineHeight: 1.15,
  color: 'var(--teal-deep)',
  margin: '4px 0 0',
};

export const headlineLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--muted)',
  margin: 0,
};

export const tileGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 10,
  marginTop: 14,
};

export const tileStyle: CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '12px',
  boxShadow: 'var(--shadow-sm)',
};

export const tileLabelStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  margin: '0 0 4px',
};

export const tileValueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--heading)',
  margin: 0,
};

export const formulaStyle: CSSProperties = {
  margin: '12px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

export const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

export const buttonRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 14,
};

/** Empty means "not entered yet"; a non-empty value must parse to a number. */
export function parseAmount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function fmtNum(n: number, maxDigits = 2): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: maxDigits });
}

/** Copy-to-clipboard state shared by every health tool. */
export function useCopy(): { copied: string; copyText: (value: string, key: string) => Promise<void> } {
  const [copied, setCopied] = useState('');
  async function copyText(value: string, key: string): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        setCopied(key);
        window.setTimeout(() => setCopied(''), 2000);
      }
    } catch {
      setCopied('');
    }
  }
  return { copied, copyText };
}

export function HealthHero(props: {
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  trustBn: string;
  trustEn: string;
  id: string;
}): ReactNode {
  const { t } = useLanguage();
  return (
    <div style={heroStyle}>
      <h2 id={props.id} style={heroTitleStyle}>
        {t({ bn: props.titleBn, en: props.titleEn })}
      </h2>
      <p style={heroDescStyle}>
        {t({ bn: props.descBn, en: props.descEn })}
      </p>
      <span style={trustChipStyle}>
        {t({ bn: props.trustBn, en: props.trustEn })}
      </span>
    </div>
  );
}

export function CopyButton(props: {
  copied: boolean;
  onCopy: () => void;
  labelBn: string;
  labelEn: string;
}): ReactNode {
  const { t } = useLanguage();
  return (
    <button type="button" className="ev-btn-outline" onClick={props.onCopy}>
      {props.copied
        ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
        : t({ bn: props.labelBn, en: props.labelEn })}
    </button>
  );
}
