// Eduvelto — YouTube Thumbnail Downloader tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, buttonStyle, noteStyle } from './toolUi';
import { extractYouTubeId, thumbnailUrls } from '../../lib/tools/youtubeThumbnail';


const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function YoutubeThumbnailDownloaderTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const videoId = useMemo(() => extractYouTubeId(input), [input]);
  const urls = useMemo(() => (videoId ? thumbnailUrls(videoId) : null), [videoId]);
  const sizes = urls ? ([
    { label: 'Default (120×90)', url: urls.default },
    { label: 'Medium (320×180)', url: urls.medium },
    { label: 'High (480×360)', url: urls.high },
    { label: 'Standard (640×480)', url: urls.standard },
    { label: 'Max (1280×720)', url: urls.maxres },
  ] as const) : [];
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ইউটিউব থাম্বনেইল ডাউনলোডার" titleEn="YouTube Thumbnail Downloader" descBn="ইউটিউব ভিডিওর থাম্বনেইল ছবিটি ডাউনলোড করুন — শুধু ছবি, ভিডিও নয়।" descEn="Download the thumbnail image of a YouTube video — the image only, not the video." chipBn="শুধু থাম্বনেইল ছবি — ভিডিও ডাউনলোড হয় না" chipEn="Thumbnail image only — no video download" />
      <div>
        <label style={labelStyle} htmlFor="yt-input">{t({ bn: 'ইউটিউব ভিডিওর লিংক বা আইডি', en: 'YouTube video link or ID' })}</label>
        <input id="yt-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
      </div>
      {input.trim() !== '' && !videoId ? (
        <div style={errorStyle} role="alert">{t({ bn: 'এই লিংক থেকে ভিডিও আইডি পাওয়া যায়নি। watch, shorts বা youtu.be লিংক ব্যবহার করুন।', en: 'No video ID found in this link. Use a watch, shorts or youtu.be link.' })}</div>
      ) : null}
      {urls ? (
        <>
          <div style={{ marginTop: 16 }}>
            <img src={urls.high} alt={t({ bn: 'ভিডিওর থাম্বনেইল', en: 'Video thumbnail' })} style={{ width: '100%', maxWidth: 480, borderRadius: 12, border: '1px solid var(--line)', display: 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none' }}>
            {sizes.map((s) => (
              <li key={s.url} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8, padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{s.label}</span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <a href={s.url} target="_blank" rel="noreferrer" style={{ ...buttonStyle, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>{t({ bn: 'ডাউনলোড', en: 'Download' })}</a>
                  <CopyButton text={s.url} />
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'এই টুল শুধু থাম্বনেইল ছবিটি দেয় — ভিডিও ডাউনলোড করা যায় না। সব ভিডিওর সর্বোচ্চ (1280×720) থাম্বনেইল থাকে না; না থাকলে ছবিটি দেখাবে না। থাম্বনেইল ভিডিওর মালিকের — ব্যবহারের আগে অনুমতি নিন।', en: 'This tool only gives the thumbnail image — the video cannot be downloaded. Not every video has a maximum (1280×720) thumbnail; if it does not exist the image will not show. The thumbnail belongs to the video owner — get permission before using it.' })}</p>
    </section>
  );
}
