// Eduvelto — Printable Paper Generator tool UI.
// Pure logic in src/lib/tools/printablePaper.ts. PDF via jspdf
// (dynamic import) through <RewardedAdButton>.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import { PAPER_TYPES, paperSpec, type PaperType } from '../../lib/tools/printablePaper';
import {
  CopyBtn, Tiles, ToolSection, errorStyle, formulaStyle, gridStyle,
  inputStyle, labelStyle, noteStyle, resultStyle,
} from './eduToolUi';

const TYPE_LABELS: Record<PaperType, { bn: string; en: string }> = {
  lined: { bn: 'লাইন কাগজ', en: 'Lined paper' },
  graph: { bn: 'গ্রাফ কাগজ', en: 'Graph paper' },
  dot: { bn: 'ডট গ্রিড', en: 'Dot grid' },
  blank: { bn: 'খালি কাগজ', en: 'Blank paper' },
};

function previewStyle(type: PaperType, spacingMm: number): CSSProperties {
  const px = spacingMm * 3.2;
  if (type === 'lined') {
    return { height: 220, border: '1px solid var(--line)', borderRadius: 8, background: `repeating-linear-gradient(to bottom, transparent 0, transparent ${px - 1}px, #9db8c4 ${px - 1}px, #9db8c4 ${px}px)` };
  }
  if (type === 'graph') {
    return { height: 220, border: '1px solid var(--line)', borderRadius: 8, backgroundImage: 'linear-gradient(#9db8c4 1px, transparent 1px), linear-gradient(90deg, #9db8c4 1px, transparent 1px)', backgroundSize: `${px}px ${px}px` };
  }
  if (type === 'dot') {
    return { height: 220, border: '1px solid var(--line)', borderRadius: 8, backgroundImage: 'radial-gradient(#5b7a88 1.2px, transparent 1.2px)', backgroundSize: `${px}px ${px}px` };
  }
  return { height: 220, border: '1px solid var(--line)', borderRadius: 8, background: 'var(--surface)' };
}

export function PrintablePaperTool() {
  const { t, lang } = useLanguage();
  const [type, setType] = useState<PaperType>('lined');
  const [spacing, setSpacing] = useState('8');
  const [pages, setPages] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);

  const spec = useMemo(() => {
    try { return paperSpec(type, Number(spacing), Number(pages)); } catch { return null; }
  }, [type, spacing, pages]);

  async function handleDownload(): Promise<void> {
    if (!spec || busy) return;
    setBusy(true);
    setError(null);
    setDownloaded(false);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const margin = 15;
      const usableH = 297 - margin * 2;
      const usableW = 210 - margin * 2;
      const s = spec.spacingMm;
      for (let p = 0; p < spec.pages; p += 1) {
        if (p > 0) doc.addPage();
        doc.setDrawColor(150, 170, 180);
        doc.setLineWidth(0.2);
        if (spec.type === 'lined') {
          for (let y = margin; y <= margin + usableH; y += s) doc.line(margin, y, margin + usableW, y);
        } else if (spec.type === 'graph') {
          for (let y = margin; y <= margin + usableH; y += s) doc.line(margin, y, margin + usableW, y);
          for (let x = margin; x <= margin + usableW; x += s) doc.line(x, margin, x, margin + usableH);
        } else if (spec.type === 'dot') {
          doc.setFillColor(90, 120, 135);
          for (let y = margin; y <= margin + usableH; y += s) {
            for (let x = margin; x <= margin + usableW; x += s) doc.circle(x, y, 0.3, 'F');
          }
        }
      }
      doc.save(`paper-${spec.type}.pdf`);
      setDownloaded(true);
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ToolSection id="paper-title" titleBn="ছাপার কাগজ জেনারেটর" titleEn="Printable Paper Generator"
      descBn="গ্রাফ, লাইন বা ডট গ্রিড কাগজ বানিয়ে PDF হিসেবে ছাপান। সব কাজ আপনার ডিভাইসেই হয়।"
      descEn="Make graph, lined or dot-grid paper and print it as a PDF. Everything happens on your device.">
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="paper-type">{t({ bn: 'কাগজের ধরন', en: 'Paper type' })}</label>
          <select id="paper-type" style={inputStyle} value={type} onChange={(e) => setType(e.target.value as PaperType)}>
            {PAPER_TYPES.map((pt) => (<option key={pt} value={pt}>{t(TYPE_LABELS[pt])}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="paper-spacing">{t({ bn: 'ফাঁক (মিমি, ৪–২০)', en: 'Spacing (mm, 4–20)' })}</label>
          <input id="paper-spacing" style={inputStyle} type="number" min="4" max="20" step="1" value={spacing} onChange={(e) => setSpacing(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="paper-pages">{t({ bn: 'পৃষ্ঠা (১–৫০)', en: 'Pages (1–50)' })}</label>
          <input id="paper-pages" style={inputStyle} type="number" min="1" max="50" step="1" value={pages} onChange={(e) => setPages(e.target.value)} />
        </div>
      </div>
      {spec ? (
        <div style={resultStyle} role="status">
          <div style={previewStyle(spec.type, spec.spacingMm)} aria-hidden="true" />
          <Tiles items={[
            { label: t({ bn: 'ধরন', en: 'Type' }), value: t(TYPE_LABELS[spec.type]) },
            { label: t({ bn: 'প্রতি পৃষ্ঠায় লাইন/সারি', en: 'Rows per page' }), value: String(spec.rowsPerPage) },
            { label: t({ bn: 'কলাম', en: 'Columns' }), value: String(spec.colsPerPage) },
            { label: t({ bn: 'পৃষ্ঠা', en: 'Pages' }), value: String(spec.pages) },
          ]} />
          <p style={formulaStyle}>{t({ bn: `A4 পৃষ্ঠা (২৯৭ মিমি, ১৫ মিমি মার্জিন) — প্রতি পৃষ্ঠায় ${spec.rowsPerPage}টি লাইন, ফাঁক ${spec.spacingMm} মিমি।`, en: `A4 page (297 mm, 15 mm margin) — ${spec.rowsPerPage} lines per page, ${spec.spacingMm} mm spacing.` })}</p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <RewardedAdButton lang={lang} onFreeDownload={() => void handleDownload()} />
            <CopyBtn text={`Printable paper: ${spec.type}, ${spec.spacingMm}mm spacing, ${spec.rowsPerPage} rows/page, ${spec.pages} page(s), A4.`} labelBn="বিবরণ কপি করুন" labelEn="Copy details" />
          </div>
          {busy ? <p style={noteStyle} role="status">{t({ bn: 'পিডিএফ তৈরি হচ্ছে…', en: 'Making the PDF…' })}</p> : null}
          {downloaded ? <p style={noteStyle} role="status">{t({ bn: 'ডাউনলোড হয়েছে।', en: 'Downloaded.' })}</p> : null}
        </div>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'ফাঁক ৪–২০ মিমি ও পৃষ্ঠা ১–৫০-এর মধ্যে দিন।', en: 'Set spacing to 4–20 mm and pages to 1–50.' })}</p>
      )}
      {error ? <p style={errorStyle} role="alert">{t({ bn: 'পিডিএফ বানানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not make the PDF — please try again.' })}</p> : null}
    </ToolSection>
  );
}
