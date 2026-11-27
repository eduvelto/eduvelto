// Eduvelto — Text to PDF tool UI (Batch 3, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/textPdf.ts (jsPDF, lazy).
// HONEST LIMIT (same precedent as Certificate Maker): jsPDF has NO
// Bangla glyphs. Bangla typed here shows correctly ON SCREEN, but the
// PDF itself is English/Latin only — Bangla letters become '?' there.
// The UI states this plainly and reports how many letters change.

import { useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import RewardedAdButton from '../../components/RewardedAdButton';
import { buildTextPdf, sanitizeForPdf } from '../../lib/tools/textPdf';
import {
  cardStyle, errorStyle, gridStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, labelStyle,
  noteStyle, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

const EXAMPLE_EN = 'Eduvelto — Free Education for Bangladesh\n\nWrite your notes, assignment or letter here. This tool turns plain text into a clean A4 PDF, right in your browser.\n\nTip: use English letters for the PDF. Bangla shows on screen, but the PDF font cannot draw Bangla letters.';

export function TextToPdfTool() {
  const { t, lang } = useLanguage();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState('12');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);
  const [resultBytes, setResultBytes] = useState(0);
  const [replaced, setReplaced] = useState(0);

  const stats = useMemo(() => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const check = sanitizeForPdf(text + title);
    return { words, chars: text.length, replaced: check.replaced, hadBangla: check.hadBangla };
  }, [text, title]);

  async function handleBuild(): Promise<void> {
    if (!text.trim()) return;
    setBusy(true); setError(null); setResultUrl(null);
    try {
      const blob = await buildTextPdf(text, { title: title.trim() || undefined, fontSize: Number(fontSize) });
      setResultBytes(blob.size);
      setReplaced(stats.replaced);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="text-to-pdf-title">
      <div style={heroStyle}>
        <h2 id="text-to-pdf-title" style={heroTitleStyle}>{t({ bn: 'লেখা থেকে পিডিএফ', en: 'Text to PDF' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'লেখা বা মার্কডাউন থেকে PDF ফাইল তৈরি করুন।', en: 'Create a PDF file from plain text or Markdown.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ কোনো ফাইল আপলোড হয় না', en: '✓ Nothing is uploaded' })}</span>
        <span style={trustChipStyle}>{t({ bn: 'A4 পাতা', en: 'A4 pages' })}</span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="text-pdf-title">{t({ bn: 'শিরোনাম (ঐচ্ছিক)', en: 'Title (optional)' })}</label>
          <input id="text-pdf-title" style={inputStyle} type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My notes" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="text-pdf-size">{t({ bn: 'অক্ষরের আকার (pt)', en: 'Font size (pt)' })}</label>
          <input id="text-pdf-size" style={inputStyle} type="number" min="8" max="24" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="text-pdf-text">{t({ bn: 'লেখা', en: 'Text' })}</label>
        <textarea
          id="text-pdf-text"
          style={{ ...inputStyle, minHeight: 180, resize: 'vertical', lineHeight: 1.6 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t({ bn: 'এখানে লিখুন…', en: 'Write here…' })}
        />
      </div>
      <p style={noteStyle} role="status">
        {t({ bn: 'শব্দ: ', en: 'Words: ' })}{stats.words}
        {' · '}
        {t({ bn: 'অক্ষর: ', en: 'Characters: ' })}{stats.chars}
      </p>
      {stats.hadBangla ? (
        <p style={{ ...noteStyle, color: '#8a5a00' }} role="alert">
          {t({
            bn: `সতর্কতা: PDF-এর ফন্টে বাংলা অক্ষর নেই — আপনার লেখার ${stats.replaced}টি বাংলা অক্ষর PDF-এ "?" হয়ে যাবে। বাংলা পর্দায় ঠিকই দেখাচ্ছে, কিন্তু PDF-এ ইংরেজি লেখাই পুরোপুরি আসবে।`,
            en: `Note: the PDF font has no Bangla letters — ${stats.replaced} Bangla character(s) in your text will become "?" in the PDF. Bangla shows fine on screen, but only English text comes out fully in the PDF.`,
          })}
        </p>
      ) : null}
      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button onClick={() => void handleBuild()} loading={busy} disabled={!text.trim()}>
          {t({ bn: 'পিডিএফ বানান', en: 'Make PDF' })}
        </Button>
        <Button onClick={() => { setTitle('Eduvelto Notes'); setText(EXAMPLE_EN); }}>
          {t({ bn: 'উদাহরণ লোড করুন', en: 'Load example' })}
        </Button>
      </div>
      {error ? (
        <p style={errorStyle} role="alert">{t({ bn: 'পিডিএফ বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the PDF — please try again.' })}</p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'পিডিএফ তৈরি', en: 'PDF ready' })}</p>
          <p style={headlineStyle}>{title.trim() || 'Document'}</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'শব্দ', en: 'Words' })} value={stats.words} />
            <Tile label={t({ bn: 'অক্ষর', en: 'Characters' })} value={stats.chars} />
            <Tile label={t({ bn: 'পিডিএফের আকার', en: 'PDF size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
          </div>
          {replaced > 0 ? (
            <p style={noteStyle}>{t({ bn: `PDF-এ ${replaced}টি অক্ষর "?" হয়েছে (বাংলা ফন্ট নেই বলে)।`, en: `${replaced} character(s) became "?" in the PDF (no Bangla font).` })}</p>
          ) : null}
          <a ref={downloadRef} href={resultUrl} download="text.pdf" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1} />
          {/* Ads rollout B2 (27 Nov 2026): this download goes through RewardedAdButton — Free Download is live, the 30s Unlock stays disabled until AdSense approval (never a fake timer). */}
          <RewardedAdButton lang={lang} onFreeDownload={() => downloadRef.current?.click()} />
        </div>
      ) : null}
    </section>
  );
}
