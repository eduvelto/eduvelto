// Eduvelto — Certificate Maker tool UI (100-Tools Project, Phase 2).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// FREE to make; the PDF download goes through the existing
// <RewardedAdButton> — Free Download is live and downloads the PDF,
// Unlock (Watch 30s Ad) stays disabled until AdSense approves (honest
// copy from src/lib/rewardedAd.ts; no ad API, no fake timer).
//
// CORRECTED SPEC (28 Nov 2026, quiz + certificate batch): the issuer
// is ALWAYS Eduvelto — no issuer-name input, no person's name, no
// signature of any person on the certificate. The issuer side is
// only Eduvelto's name + the official Eduvelto seal.
//
// jspdf is loaded with a dynamic import() only (never a static
// import), so it stays out of the main bundle. Pure shaping /
// validation / filename logic lives in src/lib/tools/certificateMaker.ts.
//
// NOTE (fixed 27 Nov 2026, A-tools spec-08): the PDF no longer uses
// jspdf's built-in Latin font for the certificate text. The certificate
// is drawn onto a canvas first (the browser renders Bangla via system
// fonts), then embedded as an image in the PDF — so Bangla names now
// render in the downloaded PDF exactly as in the on-screen preview.
// Same pattern as textToPdfBengali in LifePdfToolsPage.

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {
  CERTIFICATE_TEMPLATES,
  buildCertificateFilename,
  formatCertificateDate,
  getCertificateTemplateStyle,
  todayIsoDate,
  validateCertificateData,
  type CertificateTemplate,
} from '../../lib/tools/certificateMaker';

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--surface)',
  color: 'var(--heading)',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--heading)',
  marginBottom: 6,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 12,
};

const cardStyle: CSSProperties = {
  marginTop: 16,
  padding: '18px 16px',
};

const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '14px 16px',
  borderRadius: 10,
  background: 'var(--teal-soft)',
};

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  fontSize: 13,
  color: 'var(--muted)',
};

const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};

/** Hero band: forest → teal-deep gradient, white title + trust chip. */
const heroStyle: CSSProperties = {
  margin: '-18px -16px 16px',
  padding: '20px 16px 18px',
  borderRadius: '12px 12px 0 0',
  background: 'linear-gradient(135deg, var(--forest), var(--teal-deep))',
  color: '#fff',
};

const trustChipStyle: CSSProperties = {
  display: 'inline-block',
  marginTop: 10,
  padding: '5px 12px',
  borderRadius: 999,
  border: '1px solid rgba(255, 255, 255, 0.5)',
  background: 'rgba(255, 255, 255, 0.14)',
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
};

const copyButtonStyle: CSSProperties = {
  minHeight: 36,
  padding: '6px 12px',
  fontSize: 14,
};

/**
 * BD school occasion presets. The value fills the course / event
 * title. Since 27 Nov 2026 the PDF renders Bangla (canvas → image),
 * so a Bangla title works in the PDF too; presets stay in English
 * because schools usually print the event title in Latin script.
 */
const OCCASION_PRESETS: readonly { value: string; bn: string; en: string }[] = [
  { value: 'Annual Examination — Merit Position', bn: 'বার্ষিক পরীক্ষা — মেধা', en: 'Annual Exam — Merit' },
  { value: 'Annual Examination — Attendance', bn: 'বার্ষিক পরীক্ষা — উপস্থিতি', en: 'Annual Exam — Attendance' },
  { value: 'Annual Sports Competition', bn: 'বার্ষিক ক্রীড়া প্রতিযোগিতা', en: 'Annual Sports Competition' },
  { value: 'Quran and Hadith Competition', bn: 'কুরআন ও হাদিস প্রতিযোগিতা', en: 'Quran & Hadith Competition' },
];

function templateLabel(
  template: CertificateTemplate,
  t: (e: { bn: string; en: string }) => string,
): string {
  switch (template) {
    case 'classic':
      return t({ bn: 'ক্লাসিক', en: 'Classic' });
    case 'modern':
      return t({ bn: 'মডার্ন', en: 'Modern' });
    case 'minimal':
      return t({ bn: 'মিনিমাল', en: 'Minimal' });
  }
}

export function CertificateMakerTool() {
  const { t, lang } = useLanguage();
  const [recipient, setRecipient] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  // Issuer is fixed: Eduvelto only — no person's name, no signature
  // (corrected spec, 28 Nov 2026).
  const issuer = 'Eduvelto';
  const [date, setDate] = useState(() => todayIsoDate());
  const [template, setTemplate] = useState<CertificateTemplate>('classic');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);

  // The "Copied" label resets whenever the certificate changes — no
  // timer is used in this file (see the component test).
  useEffect(() => {
    setCopied(false);
  }, [recipient, courseTitle, issuer, date, template]);

  const missing = useMemo(
    () =>
      validateCertificateData({ recipient, courseTitle, issuer, date, template }),
    [recipient, courseTitle, issuer, date, template],
  );
  const ready = missing.length === 0;
  const style = getCertificateTemplateStyle(template);
  const filename = buildCertificateFilename(recipient);

  /**
   * Canvas-rendered PDF (A-tools spec-08, landed 27 Nov 2026): the
   * certificate is drawn onto an A4-landscape canvas at 200 DPI, so
   * the browser shapes Bangla text with system fonts, then embedded
   * as a full-page image in jsPDF. The downloaded PDF now shows Bangla
   * names exactly as the on-screen preview does.
   */
  function drawCertificateCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    // A4 landscape at 200 DPI: 297 mm x 210 mm -> 2338 x 1654 px.
    const W = 2338;
    const H = 1654;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable in this browser');
    const mm = W / 297; // px per mm
    const cx = W / 2;
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = 1.2 * mm;
    ctx.strokeRect(10 * mm, 10 * mm, W - 20 * mm, H - 20 * mm);
    ctx.lineWidth = 0.4 * mm;
    ctx.strokeRect(13 * mm, 13 * mm, W - 26 * mm, H - 26 * mm);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const font = (px: number, bold: boolean): string =>
      `${bold ? '700' : '400'} ${px}px "Noto Sans Bengali", "Hind Siliguri", sans-serif`;
    // Title
    ctx.fillStyle = style.accentColor;
    ctx.font = font(74, true);
    ctx.fillText(t({ bn: 'সার্টিফিকেট', en: 'Certificate' }), cx, 45 * mm);
    // Divider
    ctx.strokeStyle = style.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 36 * mm, 58 * mm);
    ctx.lineTo(cx + 36 * mm, 58 * mm);
    ctx.stroke();
    // Presented-to line
    ctx.fillStyle = '#666666';
    ctx.font = font(34, false);
    ctx.fillText(t({ bn: 'এই সার্টিফিকেটটি দেওয়া হচ্ছে', en: 'This certificate is proudly presented to' }), cx, 68 * mm);
    // Recipient name
    ctx.fillStyle = style.nameColor;
    ctx.font = font(78, true);
    ctx.fillText(recipient.trim(), cx, 88 * mm);
    // Course line
    ctx.fillStyle = '#666666';
    ctx.font = font(34, false);
    ctx.fillText(t({ bn: 'সফলভাবে সম্পন্ন করেছেন', en: 'for successfully completing' }), cx, 106 * mm);
    ctx.fillStyle = style.accentColor;
    ctx.font = font(48, true);
    ctx.fillText(courseTitle.trim(), cx, 120 * mm);
    // Date + issuer (Eduvelto only — no person's name, no signature).
    ctx.fillStyle = '#1a1a1a';
    ctx.font = font(34, false);
    ctx.fillText(formatCertificateDate(date), cx, 156 * mm);
    ctx.fillText('Eduvelto', cx, 172 * mm);
    ctx.font = font(24, false);
    ctx.fillStyle = '#8a6d1b';
    ctx.fillText('Official Seal — Eduvelto', cx, 182 * mm);
    return canvas;
  }

  async function handleDownload(): Promise<void> {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    setDownloaded(false);
    try {
      // Dynamic import only — jspdf stays out of the main bundle.
      const { jsPDF } = await import('jspdf');
      const canvas = drawCertificateCanvas();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210);
      doc.save(filename);
      setDownloaded(true);
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="certificate-maker-title">
      <div style={heroStyle}>
        <h2 id="certificate-maker-title" style={{ fontSize: 22, color: '#fff', margin: '0 0 4px', fontFamily: 'var(--font-head)' }}>
          {t({ bn: 'সার্টিফিকেট বানান', en: 'Certificate Maker' })}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.92)', fontSize: 14, margin: 0 }}>
          {t({
            bn: 'নাম ও কোর্সের নাম দিন — সার্টিফিকেট বানানো সম্পূর্ণ ফ্রি। পিডিএফ ডাউনলোড করতে ফ্রি ডাউনলোড চাপুন। সব কাজ আপনার ডিভাইসেই হয়। প্রদানকারী: Eduvelto।',
            en: 'Enter the name and course — making the certificate is completely free. Press Free Download for the PDF. Everything happens on your device. Issued by: Eduvelto.',
          })}
        </p>
        <span style={trustChipStyle}>
          {t({ bn: '১০০% ফ্রি • কোনো আপলোড নয়', en: '100% free • nothing uploaded' })}
        </span>
      </div>
      <div style={gridStyle}>
        <div>
          <label style={labelStyle} htmlFor="cert-recipient">
            {t({ bn: 'প্রাপকের নাম', en: 'Recipient name' })}
          </label>
          <input
            id="cert-recipient"
            style={inputStyle}
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={t({ bn: 'যেমন: রহিম উদ্দিন', en: 'e.g. Rahim Uddin' })}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cert-course">
            {t({ bn: 'কোর্স / অনুষ্ঠানের নাম', en: 'Course / event title' })}
          </label>
          <input
            id="cert-course"
            style={inputStyle}
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder={t({ bn: 'যেমন: ইংরেজি স্পোকেন কোর্স', en: 'e.g. English Spoken Course' })}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cert-date">
            {t({ bn: 'তারিখ', en: 'Date' })}
          </label>
          <input
            id="cert-date"
            style={inputStyle}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cert-template">
            {t({ bn: 'ডিজাইন', en: 'Template' })}
          </label>
          <select
            id="cert-template"
            style={inputStyle}
            value={template}
            onChange={(e) => setTemplate(e.target.value as CertificateTemplate)}
          >
            {CERTIFICATE_TEMPLATES.map((tpl) => (
              <option key={tpl} value={tpl}>
                {templateLabel(tpl, t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="cert-occasion">
            {t({ bn: 'উপলক্ষ (ঐচ্ছিক — শিরোনাম বসিয়ে দেয়)', en: 'Occasion (optional — fills the title)' })}
          </label>
          <select
            id="cert-occasion"
            style={inputStyle}
            value=""
            onChange={(e) => {
              if (e.target.value) setCourseTitle(e.target.value);
            }}
          >
            <option value="">
              {t({ bn: 'নিজের মতো লিখুন', en: 'Write your own' })}
            </option>
            {OCCASION_PRESETS.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {t({ bn: preset.bn, en: preset.en })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ready ? (
        <div style={resultStyle} role="status">
          <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>
            {t({ bn: 'প্রিভিউ', en: 'Preview' })}
          </p>
          <div
            style={{
              border: `3px solid ${style.borderColor}`,
              outline: `1px solid ${style.borderColor}`,
              outlineOffset: 4,
              background: style.backgroundColor,
              borderRadius: 4,
              padding: '28px 20px',
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700, color: style.accentColor, fontFamily: 'var(--font-head)' }}>
              {t({ bn: 'সার্টিফিকেট', en: 'Certificate' })}
            </p>
            <div style={{ width: 72, margin: '0 auto 14px', borderTop: `2px solid ${style.accentColor}` }} />
            <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--muted)' }}>
              {t({ bn: 'এই সার্টিফিকেটটি দেওয়া হচ্ছে', en: 'This certificate is proudly presented to' })}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 30, fontWeight: 700, color: style.nameColor, fontFamily: 'var(--font-head)' }}>
              {recipient.trim()}
            </p>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--muted)' }}>
              {t({ bn: 'সফলভাবে সম্পন্ন করেছেন', en: 'for successfully completing' })}
            </p>
            <p style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700, color: style.accentColor }}>
              {courseTitle.trim()}
            </p>
            <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--heading)' }}>
              {formatCertificateDate(date)}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--heading)' }}>Eduvelto</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              {t({ bn: 'Eduvelto-র অফিসিয়াল সিল', en: 'Official Seal — Eduvelto' })}
            </p>
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'পিডিএফে বাংলা নাম প্রিভিউয়ের মতোই দেখাবে — সার্টিফিকেটটি ক্যানভাসে আঁকা হয়, তারপর পিডিএফে বসানো হয়। ফাইলের নাম: ',
              en: 'Bangla names render in the PDF just as in the preview — the certificate is drawn on a canvas, then placed in the PDF. File name: ',
            })}
            {filename}
          </p>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <RewardedAdButton lang={lang} onFreeDownload={() => void handleDownload()} />
            <button
              type="button"
              className="ev-btn ev-btn-outline"
              style={copyButtonStyle}
              onClick={() => {
                const summary = `${recipient.trim()} — ${courseTitle.trim()} — ${issuer.trim()}, ${formatCertificateDate(date)}`;
                void navigator.clipboard.writeText(summary).then(
                  () => setCopied(true),
                  () => setCopied(false),
                );
              }}
            >
              {copied
                ? t({ bn: 'কপি হয়েছে', en: 'Copied' })
                : t({ bn: 'সারাংশ কপি করুন', en: 'Copy summary' })}
            </button>
          </div>
            {busy ? (
              <p style={noteStyle} role="status">
                {t({ bn: 'পিডিএফ তৈরি হচ্ছে…', en: 'Making the PDF…' })}
              </p>
            ) : null}
            {downloaded ? (
              <p style={noteStyle} role="status">
                {t({ bn: 'ডাউনলোড হয়েছে।', en: 'Downloaded.' })}
              </p>
            ) : null}
        </div>
      ) : (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'সার্টিফিকেট দেখতে নাম, কোর্স ও সঠিক তারিখ দিন।',
            en: 'Enter the name, course and a valid date to see the certificate.',
          })}
        </p>
      )}
      {error ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'পিডিএফ বানানো যায়নি — আবার চেষ্টা করুন।',
            en: 'Could not make the PDF — please try again.',
          })}
        </p>
      ) : null}
    </section>
  );
}
