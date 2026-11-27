// Eduvelto — Robots & Sitemap Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, ExampleButton, inputStyle, shortInputStyle, labelStyle, cardStyle } from './toolUi';
import { buildRobotsTxt, buildSitemapXml, parseUrlList } from '../../lib/tools/robotsSitemap';


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

export function RobotsSitemapGeneratorTool() {
  const { t } = useLanguage();
  const [disallow, setDisallow] = useState('/admin\n/private');
  const [allow, setAllow] = useState('/');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [urlList, setUrlList] = useState('https://example.com/\nhttps://example.com/about');
  const robots = useMemo(() => buildRobotsTxt(
    [{ agent: '*', allow: allow.split('\n'), disallow: disallow.split('\n') }],
    sitemapUrl,
  ), [allow, disallow, sitemapUrl]);
  const parsed = useMemo(() => parseUrlList(urlList), [urlList]);
  const sitemap = useMemo(() => {
    try {
      return { text: buildSitemapXml(parsed.valid.map((loc) => ({ loc }))), error: '' };
    } catch (err) {
      return { text: '', error: err instanceof Error ? err.message : '' };
    }
  }, [parsed]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="রোবটস ও সাইটম্যাপ জেনারেটর" titleEn="Robots & Sitemap Generator" descBn="ওয়েবসাইটের robots.txt ও sitemap.xml ফাইল বানান।" descEn="Generate a robots.txt and sitemap.xml file for a website." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="rs-disallow">{t({ bn: 'Disallow (প্রতি লাইনে একটি পথ)', en: 'Disallow (one path per line)' })}</label>
          <textarea id="rs-disallow" style={inputStyle} value={disallow} onChange={(e) => setDisallow(e.target.value)} placeholder="/admin" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="rs-allow">{t({ bn: 'Allow (প্রতি লাইনে একটি পথ)', en: 'Allow (one path per line)' })}</label>
          <textarea id="rs-allow" style={inputStyle} value={allow} onChange={(e) => setAllow(e.target.value)} placeholder="/" />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="rs-sitemap-url">{t({ bn: 'সাইটম্যাপের লিংক (ঐচ্ছিক)', en: 'Sitemap link (optional)' })}</label>
        <input id="rs-sitemap-url" style={shortInputStyle} value={sitemapUrl} onChange={(e) => setSitemapUrl(e.target.value)} placeholder="https://example.com/sitemap.xml" />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="rs-robots">robots.txt</label>
        <textarea id="rs-robots" style={{ ...outputStyle, fontFamily: 'monospace' }} value={robots} readOnly aria-readonly="true" />
      </div>
      <ButtonRow><CopyButton text={robots} /></ButtonRow>
      <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
        <h3 style={{ fontSize: 17, margin: '0 0 10px' }}>sitemap.xml</h3>
        <label style={labelStyle} htmlFor="rs-urls">{t({ bn: 'পাতার লিংক (প্রতি লাইনে একটি)', en: 'Page links (one per line)' })}</label>
        <textarea id="rs-urls" style={inputStyle} value={urlList} onChange={(e) => setUrlList(e.target.value)} placeholder="https://example.com/" />
        {parsed.invalid.length > 0 ? <div style={errorStyle} role="alert">{t({ bn: 'বাদ দেওয়া হয়েছে (সঠিক লিংক নয়): ', en: 'Skipped (not a valid link): ' })}{parsed.invalid.join(', ')}</div> : null}
        <Tiles items={[{ labelBn: 'সঠিক লিংক', labelEn: 'Valid links', value: String(parsed.valid.length) }]} />
        {sitemap.error ? <div style={errorStyle} role="alert">{sitemap.error}</div> : null}
        <div style={{ marginTop: 12 }}>
          <label style={labelStyle} htmlFor="rs-sitemap">sitemap.xml</label>
          <textarea id="rs-sitemap" style={{ ...outputStyle, fontFamily: 'monospace' }} value={sitemap.text} readOnly aria-readonly="true" />
        </div>
        <ButtonRow>
          <CopyButton text={sitemap.text} />
          <ExampleButton onLoad={() => setUrlList('https://example.com/\nhttps://example.com/about\nhttps://example.com/tools')} />
        </ButtonRow>
      </div>
    </section>
  );
}
