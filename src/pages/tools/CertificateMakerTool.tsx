// Eduvelto — Certificate Maker tool UI (100-Tools Project, Phase 2).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// FREE to make; the PDF download goes through the existing
// <RewardedAdButton> — Free Download is live and downloads the PDF,
// Unlock (Watch 30s Ad) stays disabled until AdSense approves (honest
// copy from src/lib/rewardedAd.ts; no ad API, no fake timer).
//
// jspdf is loaded with a dynamic import() only (never a static
// import), so it stays out of the main bundle. Pure shaping /
// validation / filename logic lives in src/lib/tools/certificateMaker.ts.
//
// NOTE: the PDF uses jspdf's built-in Latin font, so Bangla script in
// a name renders on the on-screen preview but not in the PDF itself —
// the note under the preview says so honestly.

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
 * title in English (Latin script) so it also renders inside the PDF,
 * whose font has no Bangla glyphs; the label is bn/en via t().
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
  const [issuer, setIssuer] = useState('');
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

  async function handleDownload(): Promise<void> {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    setDownloaded(false);
    try {
      // Dynamic import only — jspdf stays out of the main bundle.
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = 297;
      const H = 210;
      doc.setFillColor(style.backgroundColor);
      doc.rect(0, 0, W, H, 'F');
      doc.setDrawColor(style.borderColor);
      doc.setLineWidth(1.2);
      doc.rect(10, 10, W - 20, H - 20);
      doc.setLineWidth(0.4);
      doc.rect(13, 13, W - 26, H - 26);
      doc.setTextColor(style.accentColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('Certificate', W / 2, 45, { align: 'center' });
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text('This certificate is proudly presented to', W / 2, 62, { align: 'center' });
      doc.setTextColor(style.nameColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.text(recipient.trim(), W / 2, 82, { align: 'center' });
      doc.setTextColor(style.accentColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('for successfully completing', W / 2, 98, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(courseTitle.trim(), W / 2, 112, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.text(formatCertificateDate(date), W / 2, 150, { align: 'center' });
      doc.text(issuer.trim(), W / 2, 168, { align: 'center' });
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
            bn: 'নাম, কোর্স ও প্রতিষ্ঠানের নাম দিন — সার্টিফিকেট বানানো সম্পূর্ণ ফ্রি। পিডিএফ ডাউনলোড করতে ফ্রি ডাউনলোড চাপুন। সব কাজ আপনার ডিভাইসেই হয়।',
            en: 'Enter the name, course and issuer — making the certificate is completely free. Press Free Download for the PDF. Everything happens on your device.',
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
          <label style={labelStyle} htmlFor="cert-issuer">
            {t({ bn: 'প্রদানকারী প্রতিষ্ঠান', en: 'Issuer name' })}
          </label>
          <input
            id="cert-issuer"
            style={inputStyle}
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            placeholder={t({ bn: 'যেমন: Eduvelto', en: 'e.g. Eduvelto' })}
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
            <p style={{ margin: 0, fontSize: 14, color: 'var(--heading)' }}>{issuer.trim()}</p>
          </div>
          <p style={noteStyle}>
            {t({
              bn: 'পিডিএফে বাংলা অক্ষর দেখা যায় না (পিডিএফের ফন্টে বাংলা নেই) — বাংলা নাম প্রিভিউতেই ঠিকভাবে দেখাবে। ফাইলের নাম: ',
              en: 'Bangla script does not render inside the PDF (the PDF font has no Bangla glyphs) — a Bangla name shows correctly in the preview above. File name: ',
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
            bn: 'সার্টিফিকেট দেখতে নাম, কোর্স, প্রতিষ্ঠান ও সঠিক তারিখ দিন।',
            en: 'Enter the name, course, issuer and a valid date to see the certificate.',
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
