// Eduvelto — Meta Tag Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { buildMetaTags } from '../../lib/tools/metaTagGenerator';


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

export function MetaTagGeneratorTool() {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState('');
  const [siteName, setSiteName] = useState('');
  const [author, setAuthor] = useState('');
  const [keywords, setKeywords] = useState('');
  const output = useMemo(() => {
    try {
      return { text: buildMetaTags({ title, description, url, image, siteName, author, keywords }), error: '' };
    } catch (err) {
      return { text: '', error: err instanceof Error ? err.message : '' };
    }
  }, [title, description, url, image, siteName, author, keywords]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="মেটা ট্যাগ জেনারেটর" titleEn="Meta Tag Generator" descBn="ওয়েবসাইটের মেটা ট্যাগ ও Open Graph প্রিভিউ বানান।" descEn="Generate meta tags and an Open Graph preview for a website." chipBn="আপনার দেওয়া তথ্য সাজানো হয় — কিছু যাচাই করা হয় না" chipEn="Your input is arranged — nothing is verified" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div><label style={labelStyle} htmlFor="mt-title">{t({ bn: 'পাতার শিরোনাম', en: 'Page title' })}</label><input id="mt-title" style={shortInputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Eduvelto — Free Learning" /></div>
        <div><label style={labelStyle} htmlFor="mt-desc">{t({ bn: 'বিবরণ', en: 'Description' })}</label><input id="mt-desc" style={shortInputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t({ bn: 'পাতাটি কী নিয়ে', en: 'What the page is about' })} /></div>
        <div><label style={labelStyle} htmlFor="mt-url">URL</label><input id="mt-url" style={shortInputStyle} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/page" /></div>
        <div><label style={labelStyle} htmlFor="mt-image">{t({ bn: 'ছবির লিংক', en: 'Image link' })}</label><input id="mt-image" style={shortInputStyle} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://example.com/image.png" /></div>
        <div><label style={labelStyle} htmlFor="mt-site">{t({ bn: 'সাইটের নাম', en: 'Site name' })}</label><input id="mt-site" style={shortInputStyle} value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Eduvelto" /></div>
        <div><label style={labelStyle} htmlFor="mt-author">{t({ bn: 'লেখক', en: 'Author' })}</label><input id="mt-author" style={shortInputStyle} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Mizan" /></div>
        <div><label style={labelStyle} htmlFor="mt-kw">{t({ bn: 'কীওয়ার্ড (কমা দিয়ে)', en: 'Keywords (comma separated)' })}</label><input id="mt-kw" style={shortInputStyle} value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="learning, bangla, free" /></div>
      </div>
      {output.error && (title || description) ? <div style={errorStyle} role="alert">{output.error}</div> : null}
      {title || description ? (
        <div style={{ marginTop: 16, border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--card)' }}>
          {image ? <img src={image} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : null}
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{url || 'example.com'}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a0dab' }}>{title || t({ bn: 'শিরোনাম', en: 'Title' })}</div>
            <div style={{ fontSize: 14, color: 'var(--muted)' }}>{description || t({ bn: 'বিবরণ', en: 'Description' })}</div>
          </div>
        </div>
      ) : null}
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="mt-output">HTML</label>
        <textarea id="mt-output" style={{ ...outputStyle, fontFamily: 'monospace' }} value={output.text} readOnly aria-readonly="true" placeholder={t({ bn: 'শিরোনাম ও বিবরণ লিখলে ট্যাগ এখানে দেখাবে।', en: 'Type a title and description to see the tags here.' })} />
      </div>
      <ButtonRow>
        <CopyButton text={output.text} />
        <ExampleButton onLoad={() => { setTitle('Eduvelto — Free Learning in Bangla'); setDescription('Free Bangla learning tools, books and exam practice for Bangladesh.'); setUrl('https://eduvelto.com'); setSiteName('Eduvelto'); }} />
        <ClearButton onClear={() => { setTitle(''); setDescription(''); setUrl(''); setImage(''); setSiteName(''); setAuthor(''); setKeywords(''); }} disabled={title === '' && description === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'প্রিভিউটি আনুমানিক — আসল শেয়ার প্রিভিউ প্রতিটি প্ল্যাটফর্মে আলাদা হতে পারে।', en: 'The preview is approximate — real share previews can differ on each platform.' })}</p>
    </section>
  );
}
