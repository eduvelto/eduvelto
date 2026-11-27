/**
 * Shared UI bits for the Batch-3 tools (Daily Life / Islamic /
 * Utility, 27 Nov 2026). Same forest/teal/amber design as the
 * Batch 2 tools (BudgetPlannerTool): gradient hero, headline result
 * + tiles, copy button on every output. Pure presentational helpers
 * — no logic, no storage.
 */

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
  fontSize: '2rem',
  lineHeight: 1.2,
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

export const noteStyle: CSSProperties = {
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

/** Copy-to-clipboard button with a "Copied" state. */
export function CopyButton({ text, labelBn, labelEn }: { text: string; labelBn: string; labelEn: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  }
  return (
    <button type="button" className="ev-btn-outline" onClick={() => void copy()}>
      {copied ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: labelBn, en: labelEn })}
    </button>
  );
}

/** Gradient hero band with title, description and a trust chip. */
export function ToolHero({
  titleBn,
  titleEn,
  descBn,
  descEn,
  chipBn,
  chipEn,
  titleId,
}: {
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  chipBn: string;
  chipEn: string;
  titleId: string;
}) {
  const { t } = useLanguage();
  return (
    <div style={heroStyle}>
      <h2 id={titleId} style={heroTitleStyle}>
        {t({ bn: titleBn, en: titleEn })}
      </h2>
      <p style={heroDescStyle}>{t({ bn: descBn, en: descEn })}</p>
      <span style={trustChipStyle}>{t({ bn: chipBn, en: chipEn })}</span>
    </div>
  );
}

/** One supporting tile (label + value + optional sub-line). */
export function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={tileStyle}>
      <p style={tileLabelStyle}>{label}</p>
      <p style={tileValueStyle}>{value}</p>
      {sub ? <p style={tileSubStyle}>{sub}</p> : null}
    </div>
  );
}

export function useCopyState(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);
  async function copy(text: string): Promise<void> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setCopied(false);
    }
  }
  return [copied, copy];
}

export type { ReactNode };
