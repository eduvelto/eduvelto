// Eduvelto — Markdown to HTML tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: markdownToHtml() in src/lib/tools/docConverters.ts (safe subset — raw HTML is escaped, never rendered). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {ToolHero, CopyButton, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { markdownToHtml } from '../../lib/tools/docConverters';


const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};



function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


const SAMPLE_MD = '# স্বাগতম\n\nEduvelto is a **free** learning platform for Bangladesh.\n\n- পড়াশোনা\n- চাকরির প্রস্তুতি\n- দরকারি টুলস\n\n[Eduvelto](https://eduvelto.com) দেখুন।\n\n> প্রতিদিন একটু একটু করে পড়ুন।';

export function MarkdownToHtmlTool() {
  const { t, lang } = useLanguage();
  const [input, setInput] = useState(SAMPLE_MD);
  const result = useMemo(() => {
    try { return { html: markdownToHtml(input).html }; } catch (e) {
      return { error: e instanceof Error ? e.message : 'Could not convert' };
    }
  }, [input]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="Markdown থেকে HTML" titleEn="Markdown to HTML" descBn="Markdown লেখাকে HTML-এ রূপান্তর করুন — প্রিভিউসহ।" descEn="Convert Markdown text to HTML — with a live preview." chipBn="Markdown-এর ভেতরের HTML লেখা হিসেবে দেখানো হয়, চালানো হয় না" chipEn="HTML inside Markdown is shown as text, never run" />
      <div>
        <label style={labelStyle} htmlFor="m2h-input">{t({ bn: 'Markdown লেখা', en: 'Markdown text' })}</label>
        <textarea id="m2h-input" style={{ ...inputStyle, minHeight: 160 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="# শিরোনাম" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(SAMPLE_MD)} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      {'error' in result ? (
        <p style={errorStyle} role="alert">{result.error}</p>
      ) : (
        <>
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{t({ bn: 'প্রিভিউ', en: 'Preview' })}</p>
            <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '14px 16px', background: 'var(--card)' }} dangerouslySetInnerHTML={{ __html: result.html }} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle} htmlFor="m2h-output">{t({ bn: 'HTML সোর্স', en: 'HTML source' })}</label>
            <textarea id="m2h-output" style={{ ...inputStyle, minHeight: 140 }} value={result.html} readOnly />
          </div>
          <ButtonRow>
            <CopyButton text={result.html} labelBn="HTML কপি করুন" labelEn="Copy HTML" />
            {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadText('eduvelto-page.html', `<!doctype html>\n<html lang="bn">\n<head>\n<meta charset="utf-8">\n<title>Eduvelto page</title>\n</head>\n<body>\n${result.html}\n</body>\n</html>\n`, 'text/html')} />
          </ButtonRow>
        </>
      )}
      <p style={noteStyle}>{t({ bn: 'শিরোনাম, মোটা/বাঁকা লেখা, লিংক, ছবি, তালিকা, কোড ব্লক, উদ্ধৃতি ও অনুভূমিক রেখা সমর্থিত। Markdown-এর ভেতরে লেখা HTML নিরাপত্তার জন্য লেখা হিসেবে দেখানো হয় — চালানো হয় না।', en: 'Headings, bold/italic, links, images, lists, code blocks, quotes and horizontal rules are supported. Raw HTML inside Markdown is shown as text for safety — never executed.' })}</p>
    </section>
  );
}
