// Eduvelto — PDF Page Number Adder tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: stampPdfPageNumbers() + latinSafeText() in src/lib/tools/pdfPageOps.ts (Helvetica Latin font only in phase 1 — Bangla digits need an embedded font, phase 2). 100% in-browser; nothing is uploaded.
import {useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import RewardedAdButton from '../../components/RewardedAdButton';
import { stampPdfPageNumbers, getPdfPageCount, latinSafeText, type PageNumberPosition, type PageNumberFormat } from '../../lib/tools/pdfPageOps';


const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};



function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


const POSITIONS: readonly { id: PageNumberPosition; bn: string; en: string }[] = [
  { id: 'top-left', bn: 'উপরে বামে', en: 'Top left' },
  { id: 'top-center', bn: 'উপরে মাঝখানে', en: 'Top centre' },
  { id: 'top-right', bn: 'উপরে ডানে', en: 'Top right' },
  { id: 'bottom-left', bn: 'নিচে বামে', en: 'Bottom left' },
  { id: 'bottom-center', bn: 'নিচে মাঝখানে', en: 'Bottom centre' },
  { id: 'bottom-right', bn: 'নিচে ডানে', en: 'Bottom right' },
];

const FORMATS: readonly { id: PageNumberFormat; bn: string; en: string }[] = [
  { id: 'n', bn: 'শুধু নম্বর (১)', en: 'Number only (1)' },
  { id: 'page-n', bn: 'Page ১', en: 'Page 1' },
  { id: 'page-n-of-p', bn: 'Page ১ of ১২', en: 'Page 1 of 12' },
  { id: 'n-of-p', bn: '১/১২', en: '1/12' },
  { id: 'custom', bn: 'নিজের মতো', en: 'Custom' },
];

export function PdfPageNumberTool() {
  const { t, lang } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('n');
  const [customFormat, setCustomFormat] = useState('— {n} —');
  const [startAt, setStartAt] = useState('1');
  const [skipFirst, setSkipFirst] = useState(false);
  const [facing, setFacing] = useState(false);
  const [fontSize, setFontSize] = useState('14');
  const [margin, setMargin] = useState('36');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  const headerHasBangla = headerText !== '' && latinSafeText(headerText) !== headerText;
  const footerHasBangla = footerText !== '' && latinSafeText(footerText) !== footerText;

  async function handleFile(selected: File | null): Promise<void> {
    if (!selected) return;
    setError(null);
    setDone(null);
    setResultBlob(null);
    if (selected.size > 50 * 1024 * 1024) { setError(t({ bn: 'ফাইলটি ৫০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 50 MB — choose a smaller file.' })); return; }
    try {
      const pages = await getPdfPageCount(selected);
      setFile(selected);
      setPageCount(pages);
    } catch {
      setError(t({ bn: 'ফাইলটি পড়া যায়নি — এটি সঠিক PDF কি না দেখুন।', en: 'Could not read the file — check it is a valid PDF.' }));
    }
  }

  async function handleStamp(): Promise<void> {
    if (!file) return;
    setError(null);
    setDone(null);
    setResultBlob(null);
    setBusy(true);
    try {
      const blob = await stampPdfPageNumbers(file, {
        position,
        format,
        customFormat: format === 'custom' ? customFormat : undefined,
        startAt: Number(startAt) || 1,
        skipFirstPage: skipFirst,
        facingPages: facing,
        fontSize: Number(fontSize) || 14,
        margin: Number(margin) || 36,
        headerText: headerText || undefined,
        footerText: footerText || undefined,
      });
      setResultBlob(blob);
      const numbered = skipFirst ? pageCount - 1 : pageCount;
      setDone(t({ bn: `${numbered}টি পাতায় নম্বর বসানো হয়েছে। নিচে বিনামূল্যে ডাউনলোড করুন।`, en: `Page numbers added to ${numbered} page(s). Download it free below.` }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ bn: 'নম্বর বসানো যায়নি — সেটিংস দেখে আবার চেষ্টা করুন।', en: 'Could not add page numbers — check the settings and try again.' }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="PDF পাতায় নম্বর বসান" titleEn="PDF Page Number Adder" descBn="PDF-এর প্রতিটি পাতায় নম্বর বসান — অবস্থান, ধরন ও শুরুর নম্বর বেছে নিন।" descEn="Add page numbers to every page of a PDF — choose the position, format and starting number." chipBn="নম্বর লেখা হিসেবে বসে — ফাইলের আকার প্রায় বাড়ে না" chipEn="Numbers are stamped as text — file size barely changes" />
      <div>
        <label style={labelStyle} htmlFor="pn-file">{t({ bn: 'PDF ফাইল (সর্বোচ্চ ৫০ MB)', en: 'PDF file (at most 50 MB)' })}</label>
        <input id="pn-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {file && pageCount > 0 ? (
        <>
          <p style={noteStyle}>{t({ bn: `ফাইল: ${file.name} — ${pageCount} পাতা।`, en: `File: ${file.name} — ${pageCount} page(s).` })}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={labelStyle} htmlFor="pn-position">{t({ bn: 'নম্বরের অবস্থান', en: 'Number position' })}</label>
              <select id="pn-position" style={inputStyle} value={position} onChange={(e) => setPosition(e.target.value as PageNumberPosition)}>
                {POSITIONS.map((p) => (<option key={p.id} value={p.id}>{t({ bn: p.bn, en: p.en })}</option>))}
              </select>
            </div>
            <div>
              <label style={labelStyle} htmlFor="pn-format">{t({ bn: 'নম্বরের ধরন', en: 'Number format' })}</label>
              <select id="pn-format" style={inputStyle} value={format} onChange={(e) => setFormat(e.target.value as PageNumberFormat)}>
                {FORMATS.map((f) => (<option key={f.id} value={f.id}>{t({ bn: f.bn, en: f.en })}</option>))}
              </select>
            </div>
            {format === 'custom' ? (
              <div>
                <label style={labelStyle} htmlFor="pn-custom">{t({ bn: 'নিজের ধরন — {n} থাকতেই হবে', en: 'Custom format — must contain {n}' })}</label>
                <input id="pn-custom" style={inputStyle} type="text" value={customFormat} onChange={(e) => setCustomFormat(e.target.value)} placeholder="— {n} —" />
              </div>
            ) : null}
            <div>
              <label style={labelStyle} htmlFor="pn-start">{t({ bn: 'শুরুর নম্বর', en: 'Starting number' })}</label>
              <input id="pn-start" style={inputStyle} type="number" min={1} inputMode="numeric" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="pn-font">{t({ bn: 'অক্ষরের আকার (৮–২৪)', en: 'Font size (8–24)' })}</label>
              <input id="pn-font" style={inputStyle} type="number" min={8} max={24} inputMode="numeric" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="pn-margin">{t({ bn: 'কিনারা থেকে দূরত্ব (পয়েন্ট)', en: 'Margin from edge (points)' })}</label>
              <input id="pn-margin" style={inputStyle} type="number" min={0} inputMode="numeric" value={margin} onChange={(e) => setMargin(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="pn-header">{t({ bn: 'উপরের লেখা (ঐচ্ছিক, ইংরেজি অক্ষর)', en: 'Header text (optional, Latin letters)' })}</label>
              <input id="pn-header" style={inputStyle} type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} placeholder="My Document" />
            </div>
            <div>
              <label style={labelStyle} htmlFor="pn-footer">{t({ bn: 'নিচের লেখা (ঐচ্ছিক, ইংরেজি অক্ষর)', en: 'Footer text (optional, Latin letters)' })}</label>
              <input id="pn-footer" style={inputStyle} type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Confidential" />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
              <input type="checkbox" checked={skipFirst} onChange={(e) => setSkipFirst(e.target.checked)} />
              {t({ bn: 'প্রথম পাতা (কভার) বাদ দিন — কভার নম্বর খরচ করে না', en: 'Skip the first page (cover) — the cover does not consume a number' })}
            </label>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15 }}>
              <input type="checkbox" checked={facing} onChange={(e) => setFacing(e.target.checked)} />
              {t({ bn: 'বইয়ের মতো মুখোমুখি পাতা (বাইরের কিনারায় নম্বর)', en: 'Facing pages, like a book (numbers on outer edges)' })}
            </label>
          </div>
          {headerHasBangla || footerHasBangla ? (
            <p style={errorStyle} role="alert">{t({ bn: 'বাংলা লেখা PDF-এ “?” হয়ে যাবে — উপরের/নিচের লেখায় ইংরেজি অক্ষর ব্যবহার করুন। বাংলা সংখ্যাও আপাতত সমর্থিত নয়।', en: 'Bangla text will show as “?” in the PDF — use Latin letters for header/footer text. Bangla digits are not supported yet.' })}</p>
          ) : null}
          <ButtonRow>
            <button type="button" style={{ minHeight: 44, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => void handleStamp()} disabled={busy}>
              {busy ? t({ bn: 'নম্বর বসানো হচ্ছে…', en: 'Adding numbers…' }) : t({ bn: 'নম্বর বসান', en: 'Add numbers' })}
            </button>
          </ButtonRow>
          {done ? <p style={noteStyle} role="status">{done}</p> : null}
          {done && resultBlob ? (
            <div style={{ marginTop: 12 }}>
              {/* Ads rollout B2 (27 Nov 2026): this download goes through RewardedAdButton — Free Download is live, the 30s Unlock stays disabled until AdSense approval (never a fake timer). */}
              <RewardedAdButton lang={lang} onFreeDownload={() => downloadBlob('eduvelto-numbered.pdf', resultBlob)} />
            </div>
          ) : null}
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'নম্বর বসে ল্যাটিন সংখ্যায় (1, 2, 3)। প্রথম পাতা বাদ দিলে দ্বিতীয় পাতায় শুরুর নম্বর বসে। নিচের দিকে নম্বর বসালে আগে থেকে নিচে লেখা থাকলে ঢেকে যেতে পারে।', en: 'Numbers are stamped in Latin digits (1, 2, 3). When the first page is skipped, the second page shows the starting number. A bottom number can overlap text already at the bottom of a page.' })}</p>
    </section>
  );
}
