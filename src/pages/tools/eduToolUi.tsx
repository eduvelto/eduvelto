// Eduvelto — shared UI helpers for the Education / Job / Teacher tools
// (Batch 3, 27 Nov 2026). Small building blocks so every tool shares the
// same forest/teal/amber look: gradient hero, headline result + tiles,
// formula line, copy button, "Load example" button. No business logic
// lives here — each tool's pure logic stays in src/lib/tools/*.

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
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
};

export const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

export const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

export const formulaStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
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

export const heroStyle: CSSProperties = {
  margin: '-18px -16px 16px',
  padding: '20px 16px 18px',
  borderRadius: '12px 12px 0 0',
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  color: '#fff',
};

export const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  padding: '5px 12px',
  borderRadius: 999,
  border: '1px solid rgba(255, 255, 255, 0.5)',
  background: 'rgba(255, 255, 255, 0.14)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
};

const tilesStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: 10,
  marginTop: 12,
};

const tileStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  background: 'var(--surface)',
  border: '1px solid var(--line)',
};

export function ToolHero({
  id,
  titleBn,
  titleEn,
  descBn,
  descEn,
}: {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
}) {
  const { t } = useLanguage();
  return (
    <div style={heroStyle}>
      <h2 id={id} style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
        {t({ bn: titleBn, en: titleEn })}
      </h2>
      <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
        {t({ bn: descBn, en: descEn })}
      </p>
      <span style={trustChipStyle}>
        {t({ bn: '১০০% ফ্রি • কোনো আপলোড নয়', en: '100% free • nothing uploaded' })}
      </span>
    </div>
  );
}

export function Tiles({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div style={tilesStyle}>
      {items.map((item) => (
        <div key={item.label} style={tileStyle}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.label}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--heading)' }}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}

export function CopyBtn({ text, labelBn, labelEn }: { text: string; labelBn: string; labelEn: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ev-btn ev-btn-outline"
      style={{ minHeight: 36, padding: '6px 12px', fontSize: 14 }}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(
          () => setCopied(true),
          () => setCopied(false),
        );
      }}
    >
      {copied ? t({ bn: 'কপি হয়েছে', en: 'Copied' }) : t({ bn: labelBn, en: labelEn })}
    </button>
  );
}

export function LoadExampleBtn({ onLoad }: { onLoad: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      className="ev-btn ev-btn-outline"
      style={{ minHeight: 36, padding: '6px 12px', fontSize: 14 }}
      onClick={onLoad}
    >
      {t({ bn: 'উদাহরণ বসান', en: 'Load example' })}
    </button>
  );
}

export function PdfBanglaNote() {
  const { t } = useLanguage();
  return (
    <p style={noteStyle}>
      {t({
        bn: 'পিডিএফে বাংলা অক্ষর দেখা যায় না (পিডিএফের ফন্টে বাংলা নেই) — বাংলা লেখা পর্দার প্রিভিউতেই ঠিকভাবে দেখাবে, পিডিএফে ইংরেজি/লাতিন অক্ষরে লিখুন।',
        en: 'Bangla script does not render inside the PDF (the PDF font has no Bangla glyphs) — Bangla text shows correctly in the on-screen preview; write PDF fields in English/Latin letters.',
      })}
    </p>
  );
}

export function ToolSection({
  id,
  titleBn,
  titleEn,
  descBn,
  descEn,
  children,
}: {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  children: ReactNode;
}) {
  return (
    <section className="ev-card" style={cardStyle} aria-labelledby={id}>
      <ToolHero id={id} titleBn={titleBn} titleEn={titleEn} descBn={descBn} descEn={descEn} />
      {children}
    </section>
  );
}
