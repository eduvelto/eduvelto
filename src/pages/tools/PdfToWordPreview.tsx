// Eduvelto — watermarked preview for PDF to Word (27 Nov 2026).
//
// Shows the REAL converted text (first lines) so the user can verify
// it looks right before the ad/download — with a diagonal repeating
// "Eduvelto" watermark over it and selection disabled, so the content
// cannot be copied clean from the preview. The watermark is visual
// only: the downloaded .docx is clean (see the engine tests — no
// "Eduvelto" in document.xml).
//
// Honest limit: a visual overlay + no-select deters casual copying,
// it does not stop a determined user inspecting the DOM. That is the
// intended deterrent level — do not claim stronger protection.
//
// Display fonts: the preview shows the extracted Unicode text in the
// chosen fonts. SutonnyMJ is a Bijoy font, so its preview shows in
// SolaimanLipi (readable Unicode) with a note — the downloaded file
// converts the text to Bijoy encoding for SutonnyMJ.

import { useLanguage } from '../../i18n/LanguageContext';
import {
  splitLineIntoRuns, type BanglaFont, type EnglishFont, type TextScript,
} from '../../lib/tools/pdfToWord';

export const PDF_TO_WORD_PREVIEW_LINES = 12;

const WATERMARK_ROWS = 5;
const WATERMARK_REPEAT = 6;

/**
 * Display font for a run in the preview. The preview shows the
 * ORIGINAL Unicode text (readable verification), never Bijoy codes:
 * SutonnyMJ is a Bijoy font, so its runs preview in SolaimanLipi
 * with a note — the downloaded file converts the text to Bijoy.
 */
function displayFontFor(script: TextScript, banglaFont: BanglaFont, englishFont: EnglishFont): string {
  if (script === 'bn') return banglaFont === 'SutonnyMJ' ? 'SolaimanLipi' : banglaFont;
  return englishFont;
}

export function PdfToWordPreview({
  lines,
  totalLines,
  banglaFont,
  englishFont,
}: {
  lines: string[];
  totalLines: number;
  banglaFont: BanglaFont;
  englishFont: EnglishFont;
}) {
  const { t } = useLanguage();
  const shown = lines.slice(0, PDF_TO_WORD_PREVIEW_LINES);
  const remaining = totalLines - shown.length;
  return (
    <div style={{ marginTop: 14 }}>
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', margin: '0 0 6px' }}>
        {t({ bn: 'প্রিভিউ — রূপান্তরিত লেখা (ওয়াটারমার্কসহ)', en: 'Preview — converted text (watermarked)' })}
      </p>
      <div
        data-preview="pdf-to-word"
        style={{
          position: 'relative',
          maxHeight: 320,
          overflow: 'auto',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '14px 16px',
          background: 'var(--surface)',
          userSelect: 'none',
        }}
      >
        {shown.map((line, i) => (
          <p key={i} style={{ margin: '0 0 8px', fontSize: 15, lineHeight: 1.7, color: 'var(--heading)' }}>
            {line === ''
              ? '\u00a0'
              : splitLineIntoRuns(line).map((seg, j) => (
                <span
                  key={j}
                  style={{ fontFamily: displayFontFor(seg.script, banglaFont, englishFont) }}
                >
                  {seg.text}
                </span>
              ))}
          </p>
        ))}
        {remaining > 0 ? (
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>
            {t({ bn: `আরও ${remaining}টি লাইন আছে — ডাউনলোড করা ফাইলে সব থাকবে।`, en: `${remaining} more line(s) — the downloaded file has them all.` })}
          </p>
        ) : null}
        {/* Watermark overlay: visual only, never in the .docx. */}
        <div
          data-preview-watermark="eduvelto"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
          }}
        >
          {Array.from({ length: WATERMARK_ROWS }, (_, row) => (
            <div
              key={row}
              style={{
                transform: 'rotate(-18deg) scale(1.15)',
                whiteSpace: 'nowrap',
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 2,
                color: 'rgba(11, 114, 133, 0.10)',
                userSelect: 'none',
              }}
            >
              {Array.from({ length: WATERMARK_REPEAT }, (_, k) => (
                <span key={k}>Eduvelto&nbsp;&nbsp;•&nbsp;&nbsp;</span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--muted)' }}>
        {banglaFont === 'SutonnyMJ'
          ? t({
            bn: 'প্রিভিউতে ইউনিকোড লেখা দেখাচ্ছে; ডাউনলোড করা ফাইলে SutonnyMJ-এর জন্য লেখা বিজয় কোডে থাকবে। প্রিভিউ থেকে লেখা কপি করা যায় না — ডাউনলোড করা ফাইলে কোনো ওয়াটারমার্ক থাকে না।',
            en: 'The preview shows Unicode text; the downloaded file converts it to Bijoy encoding for SutonnyMJ. Text cannot be copied from the preview — the downloaded file has no watermark.',
          })
          : t({
            bn: 'প্রিভিউ থেকে লেখা কপি করা যায় না — ডাউনলোড করা ফাইলে কোনো ওয়াটারমার্ক থাকে না।',
            en: 'Text cannot be copied from the preview — the downloaded file has no watermark.',
          })}
      </p>
    </div>
  );
}
