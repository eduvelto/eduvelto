// Eduvelto — PDF Merger tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: mergePdfs() + getPdfPageCount() + parsePageSelection in src/lib/tools/pdfPageOps.ts (pdf-lib, dynamic import). 100% in-browser; nothing is uploaded.
import {useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import {ToolHero, Tiles, ButtonRow, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { mergePdfs, getPdfPageCount, parsePageSelection, type MergeFileInput } from '../../lib/tools/pdfPageOps';


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

function fmtBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

interface MergeEntry {
  id: string;
  file: File;
  pages: number;
  range: string;
  rotation: number;
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `pdf-${Date.now()}-${idCounter}`;
}

export function PdfMergerTool() {
  const { t } = useLanguage();
  const [entries, setEntries] = useState<MergeEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const totalPages = entries.reduce((a, e) => a + e.pages, 0);
  const totalBytes = entries.reduce((a, e) => a + e.file.size, 0);

  async function handleFiles(selected: FileList | null): Promise<void> {
    if (!selected) return;
    setError(null);
    setDone(null);
    const pdfs = Array.from(selected).filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length < selected.length) {
      setError(t({ bn: 'শুধু PDF ফাইল যোগ করা হয়েছে; অন্য ফাইলগুলো বাদ দেওয়া হয়েছে।', en: 'Only PDF files were added; other files were skipped.' }));
    }
    if (entries.length + pdfs.length > 25) {
      setError(t({ bn: 'একসঙ্গে সর্বোচ্চ ২৫টি ফাইল মার্জ করা যায়।', en: 'At most 25 files can be merged at once.' }));
      return;
    }
    const oversize = pdfs.find((f) => f.size > 50 * 1024 * 1024);
    if (oversize) {
      setError(t({ bn: `"${oversize.name}" ৫০ MB-এর বেশি — ছোট ফাইল বাছুন।`, en: `"${oversize.name}" is over 50 MB — choose a smaller file.` }));
      return;
    }
    const added: MergeEntry[] = [];
    for (const file of pdfs) {
      try {
        const pages = await getPdfPageCount(file);
        added.push({ id: nextId(), file, pages, range: '', rotation: 0 });
      } catch {
        setError(t({ bn: `"${file.name}" পড়া যায়নি — এটি সঠিক PDF কি না দেখুন (পাসওয়ার্ড দেওয়া PDF মার্জ হয় না)।`, en: `"${file.name}" could not be read — check it is a valid PDF (password-protected PDFs cannot be merged).` }));
        return;
      }
    }
    setEntries((prev) => [...prev, ...added]);
  }

  function move(id: string, dir: -1 | 1): void {
    setEntries((prev) => {
      const i = prev.findIndex((e) => e.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function update(id: string, patch: Partial<MergeEntry>): void {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  async function handleMerge(): Promise<void> {
    setError(null);
    setDone(null);
    if (entries.length < 2) {
      setError(t({ bn: 'মার্জ করতে অন্তত ২টি PDF ফাইল লাগবে।', en: 'Merging needs at least 2 PDF files.' }));
      return;
    }
    setBusy(true);
    try {
      const inputs: MergeFileInput[] = [];
      for (const e of entries) {
        let pages: number[] | undefined;
        if (e.range.trim() !== '') {
          pages = parsePageSelection(e.range, e.pages);
        }
        const rotations: Record<number, number> = {};
        if (e.rotation !== 0) {
          const wanted = pages ?? Array.from({ length: e.pages }, (_, i) => i + 1);
          wanted.forEach((p) => { rotations[p] = e.rotation; });
        }
        inputs.push({ blob: e.file, name: e.file.name, pages, rotations });
      }
      const result = await mergePdfs(inputs);
      downloadBlob('eduvelto-merged.pdf', result.blob);
      setDone(t({ bn: `${entries.length}টি PDF একত্র হয়েছে — মোট ${result.totalPages} পাতা। ডাউনলোড হয়েছে: eduvelto-merged.pdf`, en: `${entries.length} PDFs merged — ${result.totalPages} pages in total. Downloaded: eduvelto-merged.pdf` }));
    } catch (e) {
      setError(e instanceof Error ? e.message : t({ bn: 'মার্জ করা যায়নি — ফাইলগুলো সঠিক PDF কি না দেখুন।', en: 'Could not merge — check the files are valid PDFs.' }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পিডিএফ মার্জার" titleEn="PDF Merger" descBn="একাধিক PDF একত্র করে একটি PDF বানান — ক্রম বদলে, পাতা বেছে ও ঘুরিয়ে।" descEn="Combine several PDFs into one — reorder, pick pages and rotate." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="pm-files">{t({ bn: 'PDF ফাইলগুলো (সর্বোচ্চ ২৫টি, প্রতিটি সর্বোচ্চ ৫০ MB)', en: 'PDF files (at most 25, each at most 50 MB)' })}</label>
        <input id="pm-files" style={inputStyle} type="file" accept="application/pdf,.pdf" multiple onChange={(e) => void handleFiles(e.target.files)} />
      </div>
      {entries.length > 0 ? (
        <>
          <div style={{ marginTop: 14 }}>
            {entries.map((e, i) => (
              <div key={e.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '12px', marginBottom: 10, background: 'var(--card)' }}>
                <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>
                  {i + 1}. {e.file.name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({e.pages} {t({ bn: 'পাতা', en: 'pages' })}, {fmtBytes(e.file.size)})</span>
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" style={{ minHeight: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer' }} onClick={() => move(e.id, -1)} disabled={i === 0} aria-label={t({ bn: 'উপরে নিন', en: 'Move up' })}>↑</button>
                  <button type="button" style={{ minHeight: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer' }} onClick={() => move(e.id, 1)} disabled={i === entries.length - 1} aria-label={t({ bn: 'নিচে নিন', en: 'Move down' })}>↓</button>
                  <input style={{ ...inputStyle, maxWidth: 150 }} type="text" value={e.range} onChange={(ev) => update(e.id, { range: ev.target.value })} placeholder={t({ bn: 'পাতা: 1,3-5', en: 'Pages: 1,3-5' })} aria-label={t({ bn: 'পাতার পরিসর', en: 'Page range' })} />
                  <select style={{ ...inputStyle, maxWidth: 150 }} value={e.rotation} onChange={(ev) => update(e.id, { rotation: Number(ev.target.value) })} aria-label={t({ bn: 'ঘোরান', en: 'Rotate' })}>
                    <option value={0}>{t({ bn: 'ঘোরাবেন না', en: 'No rotation' })}</option>
                    <option value={90}>90°</option>
                    <option value={180}>180°</option>
                    <option value={270}>270°</option>
                  </select>
                  <button type="button" style={{ minHeight: 36, padding: '0 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', cursor: 'pointer', color: '#b3261e' }} onClick={() => setEntries((prev) => prev.filter((x) => x.id !== e.id))}>{t({ bn: 'সরান', en: 'Remove' })}</button>
                </div>
              </div>
            ))}
          </div>
          <Tiles items={[
            { labelBn: 'ফাইল', labelEn: 'Files', value: String(entries.length) },
            { labelBn: 'মোট পাতা', labelEn: 'Total pages', value: String(totalPages) },
            { labelBn: 'আনুমানিক আকার', labelEn: 'Estimated size', value: fmtBytes(totalBytes) },
          ]} />
          <ButtonRow>
            <button type="button" style={{ minHeight: 44, padding: '0 18px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--heading)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setEntries((prev) => [...prev].sort((a, b) => a.file.name.localeCompare(b.file.name)))}>
              {t({ bn: 'নাম অনুযায়ী সাজান (A–Z)', en: 'Sort by name (A–Z)' })}
            </button>
            <button type="button" style={{ minHeight: 44, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--teal)', color: '#fff', fontWeight: 700, cursor: 'pointer' }} onClick={() => void handleMerge()} disabled={busy || entries.length < 2}>
              {busy ? t({ bn: 'মার্জ হচ্ছে…', en: 'Merging…' }) : t({ bn: 'মার্জ করুন ও ডাউনলোড করুন', en: 'Merge & download' })}
            </button>
          </ButtonRow>
          {done ? <p style={noteStyle} role="status">{done}</p> : null}
        </>
      ) : (
        <p style={noteStyle}>{t({ bn: 'ফাইল যোগ করলে এখানে তালিকা, পাতার সংখ্যা ও মোট আকার দেখা যাবে — মার্জ করার আগেই। পাতার পরিসর ফাঁকা রাখলে পুরো ফাইল নেওয়া হয়।', en: 'Add files to see the list, page counts and total size before merging. Leave the page range empty to take the whole file.' })}</p>
      )}
      {error ? <p style={errorStyle} role="alert">{error}</p> : null}
      <p style={noteStyle}>{t({ bn: 'মার্জ করার সময় ফাইলের ক্রমই চূড়ান্ত PDF-এর ক্রম। পাসওয়ার্ড দেওয়া PDF মার্জ হয় না।', en: 'The order you set is the order in the final PDF. Password-protected PDFs cannot be merged.' })}</p>
    </section>
  );
}
