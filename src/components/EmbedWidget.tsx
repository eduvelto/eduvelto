// Eduvelto — "Embed This Tool" widget (28 Nov 2026, growth batch item 4).
//
// A free-backlinks widget: on the top-20 tool pages it shows the exact
// <iframe> snippet a site owner can paste on their own site, so the tool
// runs there and links back to Eduvelto. The embed target is the
// chrome-free /embed/:slug page (src/pages/EmbedToolPage.tsx) — the
// snippet is built by buildEmbedSnippet() so the widget, the embed page
// docs and the tests all share one string.
//
// EMBED LIST (v1, 20 slugs): the 14 owner-priority slugs from the GSC
// indexing queue that have a real ToolUI component, plus 6 more
// single-component popular calculators (percentage, scientific,
// compound-interest, discount-vat-profit, cgpa-to-percentage, bmr —
// all verified to have a TOOL_COMPONENTS entry). Alias slugs
// (unit-converter, typing-speed-test, cv-builder, cover-letter-builder)
// are EXCLUDED: they render full hub pages via meta.aliasPage, not a
// single ToolUI component, so there is no single tool to embed.

import { useState } from 'react';
import { SITE_URL } from '../lib/langRouting';

export const EMBED_DEFAULT_HEIGHT = 600;

export const EMBEDDABLE_TOOL_SLUGS: readonly string[] = [
  // Owner-priority slugs from the GSC indexing queue (14).
  'age-calculator',
  'bmi-calculator',
  'govt-job-age-calculator',
  'pdf-to-word',
  'pdf-merger',
  'pdf-compressor',
  'word-counter',
  'qr-code-generator',
  'ssc-hsc-gpa-calculator',
  'nu-cgpa-calculator',
  'land-measurement',
  'loan-emi-calculator',
  'assignment-cover-generator',
  'attendance-calculator',
  // 6 more single-component popular calculators (6).
  'percentage-converter',
  'scientific-calculator',
  'compound-interest-calculator',
  'discount-vat-profit-calculator',
  'cgpa-to-percentage-converter',
  'bmr-calculator',
];

export function isEmbeddableTool(slug: string): boolean {
  return EMBEDDABLE_TOOL_SLUGS.includes(slug);
}

/** The exact iframe snippet for a tool page. One builder, shared by the
 *  widget and the tests, so the copied string never drifts from the
 *  documented embed URL pattern. */
export function buildEmbedSnippet(slug: string, title: string): string {
  const safeTitle = title.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<iframe src="${SITE_URL}/embed/${slug}" width="100%" height="${EMBED_DEFAULT_HEIGHT}" style="border:0" loading="lazy" title="${safeTitle}"></iframe>`;
}

async function copyText(text: string): Promise<boolean> {
  // navigator.clipboard needs a secure context + user gesture; the
  // textarea fallback covers older browsers and non-HTTPS previews.
  // SSR-safe: no window/document access unless both exist.
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea fallback.
    }
  }
  if (typeof document !== 'undefined') {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function EmbedWidget(props: {
  slug: string;
  title: string;
  lang: 'bn' | 'en';
}) {
  const { slug, title, lang } = props;
  const [copied, setCopied] = useState(false);
  const snippet = buildEmbedSnippet(slug, title);
  const heading = lang === 'bn' ? 'আপনার ওয়েবসাইটে এমবেড করুন' : 'Embed on Your Website';
  const note =
    lang === 'bn'
      ? 'এই কোডটি আপনার ওয়েবসাইটে বসান — টুলটি সেখানেই চলবে এবং Eduvelto-তে লিংক ব্যাক করবে।'
      : 'Paste this code on your website — the tool runs there and links back to Eduvelto.';
  const copyLabel = lang === 'bn' ? 'কপি করুন' : 'Copy';
  const copiedLabel = lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!';

  return (
    <section
      aria-label={heading}
      style={{
        margin: '20px 0',
        padding: '16px',
        border: '1px solid var(--border, #e5e7eb)',
        borderRadius: 12,
        background: 'var(--surface, #fff)',
      }}
    >
      <h2 style={{ margin: '0 0 8px', fontSize: 18, lineHeight: 1.4 }}>{heading}</h2>
      <p style={{ margin: '0 0 12px', fontSize: 14, lineHeight: 1.6, color: 'var(--muted)' }}>
        {note}
      </p>
      <textarea
        readOnly
        value={snippet}
        rows={3}
        aria-label={heading}
        onFocus={(e) => e.target.select()}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 13,
          lineHeight: 1.5,
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px solid var(--border, #d1d5db)',
          background: 'var(--surface-muted, #f9fafb)',
          color: 'var(--heading)',
          resize: 'vertical',
        }}
      />
      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          onClick={() => {
            void copyText(snippet).then((ok) => {
              if (ok) {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              }
            });
          }}
          style={{
            padding: '10px 18px',
            minHeight: 44,
            fontSize: 15,
            borderRadius: 8,
            border: 'none',
            background: '#142B3B',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </section>
  );
}
