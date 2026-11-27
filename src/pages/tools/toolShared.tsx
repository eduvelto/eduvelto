// Eduvelto — shared UI kit for the PDF & Image tools (Batch 3, 27 Nov 2026).
//
// Small shared styles + helpers so the 22 tools look consistent
// (forest/teal/amber, gradient hero, headline + tiles) without
// duplicating the same style objects in every file. Renders inside
// ToolsDetailPage's PageShell (no own h1 / Breadcrumb).

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
  marginRight: 6,
  marginBottom: 4,
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
};

export const tileLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--muted)',
  margin: '0 0 4px',
};

export const tileValueStyle: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--heading)',
  margin: 0,
  wordBreak: 'break-word',
};

export const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

export const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

export const downloadStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  minHeight: 44,
  lineHeight: '44px',
  padding: '0 18px',
  borderRadius: 8,
  background: 'var(--teal, #0b7285)',
  color: '#fff',
  fontWeight: 600,
  textDecoration: 'none',
  marginRight: 8,
};

export const previewStyle: CSSProperties = {
  display: 'block',
  maxWidth: '100%',
  maxHeight: 320,
  marginTop: 12,
  borderRadius: 8,
  border: '1px solid var(--line)',
};

export const sectionTitleStyle: CSSProperties = {
  fontSize: 19,
  color: 'var(--heading)',
  margin: '0 0 4px',
};

export const sectionDescStyle: CSSProperties = {
  color: 'var(--muted)',
  fontSize: 14,
  margin: '0 0 14px',
};

export function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** Honest in-browser limit note shown on every file tool. */
export function PrivacyNote({ limitMb = 10 }: { limitMb?: number }) {
  const { t } = useLanguage();
  return (
    <p style={noteStyle}>
      {t({
        bn: `${limitMb} MB পর্যন্ত ফাইল চলে — ফাইল আপনার ডিভাইসেই থাকে, সার্ভারে যায় না।`,
        en: `Files up to ${limitMb} MB — the file stays on your device and is never sent to a server.`,
      })}
    </p>
  );
}

export function isOverLimit(file: File, limitMb = 10): boolean {
  return file.size > limitMb * 1024 * 1024;
}

/** Small copy button for text outputs (copies via navigator.clipboard). */
export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      style={{
        minHeight: 36,
        padding: '6px 14px',
        borderRadius: 8,
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        color: 'var(--heading)',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      {copied
        ? t({ bn: 'কপি হয়েছে ✓', en: 'Copied ✓' })
        : (label ?? t({ bn: 'কপি করুন', en: 'Copy' }))}
    </button>
  );
}

/** One supporting tile (label + value) for the headline result area. */
export function Tile({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={tileStyle}>
      <p style={tileLabelStyle}>{label}</p>
      <p style={tileValueStyle}>{value}</p>
    </div>
  );
}
