// Eduvelto — PDF Rotate tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: rotatePdfPages() + getPdfPageCount() in src/lib/tools/pdfPageOps.ts (pdf-lib, dynamic import). 100% in-browser; nothing is uploaded.
import {useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { rotatePdfPages, getPdfPageCount } from '../../lib/tools/pdfPageOps';

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

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


export function PdfRotateTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function handleFile(selected: File | null): Promise<void> {
    if (!selected) return;
    setError(null);
    setDone(null);
    setRotations({});
    if (selected.size > 50 * 1024 * 1024) { setError(t({ bn: 'ফাইলটি ৫০ MB-এর বেশি — ছোট ফাইল বাছুন।', en: 'The file is over 50 MB — choose a smaller file.' })); return; }
    try {
      const pages = await getPdfPageCount(selected);
      setFile(selected);
      setPageCount(pages);
    } catch {
      setError(t({ bn: 'ফাইলটি পড়া যায়নি — এটি সঠিক PDF কি না দেখুন।', en: 'Could not read the file — check it is a valid PDF.' }));
    }
  }

  async function makeSample(): Promise<void> {
    setError(null);
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const page = doc.addPage([595, 842]);
      page.drawText('Sample page - rotate me', { x: 50, y: 750, size: 24, font, color: rgb(0, 0, 0) });
      const bytes = await doc.save();
      const sample = new File([bytes as BlobPart], 'eduvelto-sample.pdf', { type: 'application/pdf' });
      setFile(sample);
      setPageCount(1);
      setRotations({});
      setDone(t({ bn: 'নমুনা PDF তৈরি হয়েছে — এবার ঘোরান।', en: 'Sample PDF created — now rotate it.' }));
    } catch {
      setError(t({ bn: 'নমুনা PDF বানানো যায়নি।', en: 'Could not create the sample PDF.' }));
    }
  }

  function setRotation(page: number, deg: number): void {
    setRotations((prev) => {
      const next = { ...prev };
      if (deg === 0) delete next[page];
      else next[page] = deg;
      return next;
    });
  }

  function rotateAll(deg: number): void {
    const next: Record<number, number> = {};
    for (let p = 1; p <= pageCount; p += 1) next[p] = deg;
    setRotations(next);
  }

  function rotateOddEven(odd: boolean, deg: number): void {
    setRotations((prev) => {
      const next = { ...prev };
      for (let p = 1; p <= pageCount; p += 1) {
        if ((p % 2 === 1) === odd) next[p] = deg;
      }
      return next;
    });
  }

  const rotatedCount = Object.keys(rotations).length;

  async function handleRotate(): Promise<void> {
    if (!file) return;
    setError(null);
    setDone(null);
    if (rotatedCount === 0) {
      setError(t({ bn: 'অন্তত একটি পাতা ও একটি ঘূর্ণন বাছুন।', en: 'Choose at least one page and a rotation.' }));
      return;
    }
    setBusy(true);
    try {
      const blob = await rotatePdfPages(file, rotations);
      downloadBlob('eduvelto-rotated.pdf', blob);
      setDone(t({ bn: `${rotatedCount}টি পাতা ঘোরানো হয়েছে। ডাউনলোড হয়েছে: eduvelto-rotated.pdf`, en: `${rotatedCount} page(s) rotated. Downloaded: eduvelto-rotated.pdf` }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ bn: 'ঘোরানো যায়নি — ফাইলটি সঠিক PDF কি না দেখুন।', en: 'Could not rotate — check the file is a valid PDF.' }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পিডিএফ ঘোরান" titleEn="PDF Rotate" descBn="PDF-এর সব পাতা বা বেছে নেওয়া পাতা ৯০°/১৮০°/২৭০° ঘোরান।" descEn="Rotate all pages of a PDF, or selected pages, by 90°/180°/270°." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="pr-file">{t({ bn: 'PDF ফাইল (সর্বোচ্চ ৫০ MB)', en: 'PDF file (at most 50 MB)' })}</label>
        <input id="pr-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      <ButtonRow>
        <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => void makeSample()}>
          {t({ bn: 'নমুনা PDF দিয়ে চেষ্টা করুন', en: 'Try with a sample PDF' })}
        </button>
      </ButtonRow>
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      {file && pageCount > 0 ? (
        <>
          <p style={noteStyle}>{t({ bn: `ফাইল: ${file.name} — ${pageCount} পাতা।`, en: `File: ${file.name} — ${pageCount} page(s).` })}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => rotateAll(90)}>{t({ bn: 'সব পাতা ৯০°', en: 'All pages 90°' })}</button>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => rotateAll(180)}>{t({ bn: 'সব পাতা ১৮০°', en: 'All pages 180°' })}</button>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => rotateAll(270)}>{t({ bn: 'সব পাতা ২৭০°', en: 'All pages 270°' })}</button>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => rotateOddEven(true, 90)}>{t({ bn: 'বিজোড় পাতা ৯০°', en: 'Odd pages 90°' })}</button>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => rotateOddEven(false, 90)}>{t({ bn: 'জোড় পাতা ৯০°', en: 'Even pages 90°' })}</button>
            <button type="button" style={{ minHeight: 40, padding: '0 14px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setRotations({})}>{t({ bn: 'সব মুছুন', en: 'Clear all' })}</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <div key={p} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 8px', textAlign: 'center', background: rotations[p] ? 'var(--teal-soft)' : 'var(--card)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700 }}>{t({ bn: `পাতা ${p}`, en: `Page ${p}` })}</p>
                <select style={{ ...inputStyle, minHeight: 36, fontSize: 14 }} value={rotations[p] ?? 0} onChange={(e) => setRotation(p, Number(e.target.value))} aria-label={`${t({ bn: 'পাতা', en: 'Page' })} ${p}`}>
                  <option value={0}>0°</option>
                  <option value={90}>90°</option>
                  <option value={180}>180°</option>
                  <option value={270}>270°</option>
                </select>
              </div>
            ))}
          </div>
          <div style={resultStyle} role="status">
            <p style={{ margin: 0, fontSize: 16 }}><strong>{t({ bn: `${rotatedCount}টি পাতা ঘোরানো হবে`, en: `${rotatedCount} page(s) will be rotated` })}</strong></p>
          </div>
          <ButtonRow>
            <button type="button" style={{ minHeight: 44, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => void handleRotate()} disabled={busy || rotatedCount === 0}>
              {busy ? t({ bn: 'ঘোরানো হচ্ছে…', en: 'Rotating…' }) : t({ bn: 'ঘোরান ও ডাউনলোড করুন', en: 'Rotate & download' })}
            </button>
          </ButtonRow>
          {done ? <p style={noteStyle} role="status">{done}</p> : null}
        </>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'ঘূর্ণন মূল ফাইলে নয়, নতুন ফাইলে লেখা হয় — আপনার আসল PDF অপরিবর্তিত থাকে।', en: 'Rotation is written to a new file — your original PDF stays unchanged.' })}</p>
    </section>
  );
}
