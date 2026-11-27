// Eduvelto — shared UI pieces for the Finance tools (Batch 2 pattern).
//
// The Batch 2 finance tools (BkashNagadTool, BudgetPlannerTool) each
// carry the same forest/teal/amber hero, headline + tiles, copy
// buttons and formula block inline. These 10 finance tools share
// that look through this one module instead of copying the style
// objects ten times — the visual result is the same.
//
// Premium outputs (a downloadable summary) go through the existing
// RewardedAdButton: the Free Download path is live and the Unlock
// path stays disabled until AdSense approval — never a fake timer.

import { useCallback, useState, type CSSProperties, type ReactNode } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';

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

export const tileSubStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--muted)',
  margin: '4px 0 0',
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

export const presetRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: 8,
};

export const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
  marginTop: 8,
};

export const cellStyle: CSSProperties = {
  borderBottom: '1px solid var(--line)',
  padding: '6px 4px',
  textAlign: 'left',
};

export function presetChipStyle(active: boolean): CSSProperties {
  return {
    borderRadius: 999,
    padding: '6px 14px',
    minHeight: 36,
    border: '1px solid var(--teal)',
    background: active ? 'var(--teal)' : 'var(--card)',
    color: active ? '#ffffff' : 'var(--teal-deep)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  };
}

/** Empty means "not entered yet"; a non-empty value must parse to a number. */
export function parseAmount(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function fmtMoney(n: number): string {
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/** Copy-to-clipboard state shared by the finance tools. */
export function useCopyText(): {
  copied: string;
  copyText: (value: string, key: string) => Promise<void>;
} {
  const [copied, setCopied] = useState('');
  const copyText = useCallback(async (value: string, key: string): Promise<void> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(value);
        setCopied(key);
        window.setTimeout(() => setCopied(''), 2000);
      }
    } catch {
      setCopied('');
    }
  }, []);
  return { copied, copyText };
}

/** Download plain text as a file (the Free Download path of a summary). */
export function downloadTextFile(filename: string, text: string): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FinanceHero({
  titleId,
  titleBn,
  titleEn,
  descBn,
  descEn,
  trustBn,
  trustEn,
}: {
  titleId: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  trustBn: string;
  trustEn: string;
}): ReactNode {
  const { t } = useLanguage();
  return (
    <div style={heroStyle}>
      <h2 id={titleId} style={heroTitleStyle}>
        {t({ bn: titleBn, en: titleEn })}
      </h2>
      <p style={heroDescStyle}>{t({ bn: descBn, en: descEn })}</p>
      <span style={trustChipStyle}>{t({ bn: trustBn, en: trustEn })}</span>
    </div>
  );
}

/**
 * Free summary download via the existing RewardedAdButton (the Unlock
 * option stays disabled until AdSense approval — never a fake timer).
 * Renders nothing when `text` is null (no result yet).
 */
export function SummaryDownload({
  filename,
  text,
}: {
  filename: string;
  text: string | null;
}): ReactNode {
  const { lang } = useLanguage();
  if (text === null) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <RewardedAdButton lang={lang} onFreeDownload={() => downloadTextFile(filename, text)} />
    </div>
  );
}
