// Eduvelto — Text Diff Checker tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { lineDiff } from '../../lib/tools/textDiff';


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

export function TextDiffCheckerTool() {
  const { t } = useLanguage();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const diff = useMemo(() => lineDiff(a, b), [a, b]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লেখার পার্থক্য পরীক্ষক" titleEn="Text Diff Checker" descBn="দুটি লেখার মধ্যে কী কী পার্থক্য আছে তা দেখুন।" descEn="See the differences between two pieces of text." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="td-a">{t({ bn: 'প্রথম লেখা', en: 'First text' })}</label>
          <textarea id="td-a" style={inputStyle} value={a} onChange={(e) => setA(e.target.value)} placeholder={t({ bn: 'মূল লেখা…', en: 'Original text…' })} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="td-b">{t({ bn: 'দ্বিতীয় লেখা', en: 'Second text' })}</label>
          <textarea id="td-b" style={inputStyle} value={b} onChange={(e) => setB(e.target.value)} placeholder={t({ bn: 'তুলনা করার লেখা…', en: 'Text to compare…' })} />
        </div>
      </div>
      <Tiles items={[
        { labelBn: 'যোগ হয়েছে', labelEn: 'Added', value: String(diff.added) },
        { labelBn: 'সরানো হয়েছে', labelEn: 'Removed', value: String(diff.removed) },
        { labelBn: 'একই আছে', labelEn: 'Unchanged', value: String(diff.unchanged) },
      ]} />
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle}>{t({ bn: 'পার্থক্য', en: 'Differences' })}</label>
        <div style={{ ...outputStyle, minHeight: 160, overflowY: 'auto', whiteSpace: 'pre-wrap' }} role="status">
          {diff.ops.length === 0 ? (
            <span style={{ color: 'var(--muted)' }}>{t({ bn: 'দুটি লেখা লিখলে পার্থক্য এখানে দেখাবে।', en: 'Type both texts to see the differences here.' })}</span>
          ) : (
            diff.ops.map((op, i) => (
              <div key={i} style={op.type === 'add' ? { background: '#dcfce7', color: '#14532d' } : op.type === 'remove' ? { background: '#fee2e2', color: '#7f1d1d' } : {}}>
                {op.type === 'add' ? '+ ' : op.type === 'remove' ? '− ' : '  '}{op.text || ' '}
              </div>
            ))
          )}
        </div>
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => { setA('apple\nbanana\ncherry'); setB('apple\nblueberry\ncherry\ndate'); }} />
        <ClearButton onClear={() => { setA(''); setB(''); }} disabled={a === '' && b === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'সবুজ = যোগ হয়েছে, লাল = সরানো হয়েছে। তুলনা লাইন ধরে লাইন করা হয়।', en: 'Green = added, red = removed. Comparison is line by line.' })}</p>
    </section>
  );
}
