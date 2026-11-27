// Eduvelto — Citation Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle, noteStyle } from './toolUi';
import { formatCitation, type CitationStyle } from '../../lib/tools/citation';


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

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function CitationGeneratorTool() {
  const { t } = useLanguage();
  const [style, setStyle] = useState<CitationStyle>('apa');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [url, setUrl] = useState('');
  const output = useMemo(() => {
    try {
      return { text: formatCitation(style, { author, year, title, source, url }), error: '' };
    } catch (err) {
      return { text: '', error: err instanceof Error ? err.message : '' };
    }
  }, [style, author, year, title, source, url]);
  const styles: CitationStyle[] = ['apa', 'mla', 'chicago'];
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="উদ্ধৃতি জেনারেটর" titleEn="Citation Generator" descBn="APA, MLA ও Chicago নিয়মে বই বা নিবন্ধের উদ্ধৃতি বানান।" descEn="Create citations for books or articles in APA, MLA and Chicago styles." chipBn="আপনার দেওয়া তথ্য সাজানো হয় — কোনো উৎস খোঁজা হয় না" chipEn="Your input is formatted — no source is fetched" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} role="group" aria-label={t({ bn: 'উদ্ধৃতির ধরন', en: 'Citation style' })}>
        {styles.map((s) => (
          <button key={s} type="button" style={style === s ? activeButtonStyle : buttonStyle} aria-pressed={style === s} onClick={() => setStyle(s)}>
            {s.toUpperCase()}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ct-author">{t({ bn: 'লেখক (যেমন: Rahman, A.)', en: 'Author (e.g. Rahman, A.)' })}</label>
          <input id="ct-author" style={shortInputStyle} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Rahman, A." />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ct-year">{t({ bn: 'সাল', en: 'Year' })}</label>
          <input id="ct-year" style={shortInputStyle} value={year} onChange={(e) => setYear(e.target.value)} placeholder="2024" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ct-title">{t({ bn: 'শিরোনাম', en: 'Title' })}</label>
          <input id="ct-title" style={shortInputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t({ bn: 'বই বা নিবন্ধের নাম', en: 'Book or article title' })} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ct-source">{t({ bn: 'উৎস (প্রকাশক / জার্নাল)', en: 'Source (publisher / journal)' })}</label>
          <input id="ct-source" style={shortInputStyle} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Dhaka Press" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ct-url">{t({ bn: 'লিংক (ঐচ্ছিক)', en: 'Link (optional)' })}</label>
          <input id="ct-url" style={shortInputStyle} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
        </div>
      </div>
      {output.error && (author || year || title || source) ? <div style={errorStyle} role="alert">{output.error}</div> : null}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="ct-output">{t({ bn: 'উদ্ধৃতি', en: 'Citation' })}</label>
        <textarea id="ct-output" style={outputStyle} value={output.text} readOnly aria-readonly="true" placeholder={t({ bn: 'সব ঘর পূরণ করলে উদ্ধৃতি এখানে দেখাবে।', en: 'Fill in the fields and the citation appears here.' })} />
      </div>
      <ButtonRow>
        <CopyButton text={output.text} />
        <ExampleButton onLoad={() => { setAuthor('Rahman, A.'); setYear('2024'); setTitle('Learning Bangla'); setSource('Dhaka Press'); }} />
        <ClearButton onClear={() => { setAuthor(''); setYear(''); setTitle(''); setSource(''); setUrl(''); }} disabled={author === '' && title === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'এই টুল শুধু আপনার দেওয়া তথ্য সাজায়; লেখক, সাল বা প্রকাশকের তথ্য যাচাই করে না। ব্যবহারের আগে নিজে মিলিয়ে নিন।', en: 'This tool only arranges the details you type; it does not verify the author, year or publisher. Check them yourself before using the citation.' })}</p>
    </section>
  );
}
