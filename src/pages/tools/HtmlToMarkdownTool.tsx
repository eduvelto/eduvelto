// Eduvelto — HTML to Markdown tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: htmlToMarkdown() in src/lib/tools/docConverters.ts (DOMParser on a detached document; scripts/styles stripped). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {ToolHero, CopyButton, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { htmlToMarkdown } from '../../lib/tools/docConverters';


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


const SAMPLE_HTML = '<h1>Welcome</h1>\n<p>Eduvelto is a <strong>free</strong> learning platform.</p>\n<ul>\n<li>Study</li>\n<li>Job preparation</li>\n</ul>\n<blockquote>Learn a little every day.</blockquote>';

export function HtmlToMarkdownTool() {
  const { t, lang } = useLanguage();
  const [input, setInput] = useState(SAMPLE_HTML);
  const result = useMemo(() => {
    try { return { markdown: htmlToMarkdown(input).markdown }; } catch (e) {
      return { error: e instanceof Error ? e.message : 'Could not convert' };
    }
  }, [input]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="HTML থেকে Markdown" titleEn="HTML to Markdown" descBn="HTML লেখাকে Markdown-এ রূপান্তর করুন।" descEn="Convert HTML text to Markdown." chipBn="স্ক্রিপ্ট ও স্টাইল সরানো হয় — কিছু চালানো হয় না" chipEn="Scripts and styles are stripped — nothing is executed" />
      <div>
        <label style={labelStyle} htmlFor="h2m-input">{t({ bn: 'HTML লেখা', en: 'HTML text' })}</label>
        <textarea id="h2m-input" style={{ ...inputStyle, minHeight: 160 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="<h1>Title</h1>" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(SAMPLE_HTML)} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      {'error' in result ? (
        <p style={errorStyle} role="alert">{result.error}</p>
      ) : (
        <>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle} htmlFor="h2m-output">{t({ bn: 'Markdown ফলাফল', en: 'Markdown result' })}</label>
            <textarea id="h2m-output" style={{ ...inputStyle, minHeight: 160 }} value={result.markdown} readOnly />
          </div>
          <ButtonRow>
            <CopyButton text={result.markdown} labelBn="Markdown কপি করুন" labelEn="Copy Markdown" />
            {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadText('eduvelto-text.md', result.markdown, 'text/markdown')} />
          </ButtonRow>
        </>
      )}
      <p style={noteStyle}>{t({ bn: 'শিরোনাম, মোটা/বাঁকা লেখা, লিংক, ছবি, তালিকা, কোড ও উদ্ধৃতি রূপান্তরিত হয়। <script> ও <style> ট্যাগ এবং ইভেন্ট অ্যাট্রিবিউট সরিয়ে ফেলা হয়।', en: 'Headings, bold/italic, links, images, lists, code and quotes are converted. <script> and <style> tags and event attributes are removed.' })}</p>
    </section>
  );
}
