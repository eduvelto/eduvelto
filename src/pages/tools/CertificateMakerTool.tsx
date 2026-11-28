// Eduvelto — Certificate Maker tool UI (100-Tools Project, Phase 2).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// FREE to make; the download goes through the existing
// <RewardedAdButton> — Free Download is live and downloads the
// chosen format, Unlock stays disabled until AdSense approves (honest
// copy from src/lib/rewardedAd.ts; no ad API, no fake timer).
// Ads policy (27 Nov 2026): PDF is a high-value download — 30s;
// PNG is a lighter image download — 15s.
//
// CORRECTED SPEC (28 Nov 2026, quiz + certificate batch): the issuer
// is ALWAYS Eduvelto — no issuer-name input, no person's name, no
// signature of any person on the certificate. The issuer side is
// only Eduvelto's name + logo + the "Issued by Eduvelto" line.
//
// PREMIUM DESIGN (28 Nov 2026): the certificate is drawn by the
// SHARED renderer in src/lib/certificate.ts — the exact same design
// as the quiz certificate (2480×1754, wave header, ribbon +
// rosette, logo, QR + verification ID). There is ONE
// premium layout with 3 colour themes (gold-navy default, teal-gold,
// maroon-gold) and an editable achievement line — the old template
// selector and the old A4-at-200-DPI canvas are gone. The on-screen
// preview IS the real shared canvas, so the preview is exactly what
// downloads.
//
// The verification ID is minted ONCE per certificate (kept in
// state) and regenerates only on an explicit New certificate /
// reset — never on keystrokes. The QR encodes the self-contained
// verify URL (qrcode via dynamic import, as in FreeQuizPage);
// the certificate carries no score and its footer never says
// "Practice certificate" (that wording is quiz-only).
//
// jspdf / qrcode are loaded with dynamic import() only (never a
// static import), so they stay out of the main bundle. Pure
// validation / date logic lives in src/lib/tools/certificateMaker.ts.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {
  formatCertificateDate,
  todayIsoDate,
  validateCertificateData,
} from '../../lib/tools/certificateMaker';
import {
  buildMakerCertificateData,
  CERTIFICATE_THEMES,
  certificateFileBase,
  downloadCanvasPng,
  downloadCertificatePdf,
  drawQuizCertificateCanvas,
  type CertificateThemeId,
  type QuizCertificateData,
} from '../../lib/certificate';
import { makeVerificationId } from '../../lib/freeQuiz';

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
 * title. The PDF embeds the canvas image, so a Bangla title works
 * in the PDF too; presets stay in English because schools usually
 * print the event title in Latin script.
 */
const OCCASION_PRESETS: readonly { value: string; bn: string; en: string }[] = [
  { value: 'Annual Examination — Merit Position', bn: 'বার্ষিক পরীক্ষা — মেধা', en: 'Annual Exam — Merit' },
  { value: 'Annual Examination — Attendance', bn: 'বার্ষিক পরীক্ষা — উপস্থিতি', en: 'Annual Exam — Attendance' },
  { value: 'Annual Sports Competition', bn: 'বার্ষিক ক্রীড়া প্রতিযোগিতা', en: 'Annual Sports Competition' },
  { value: 'Quran and Hadith Competition', bn: 'কুরআন ও হাদিস প্রতিযোগিতা', en: 'Quran & Hadith Competition' },
];

type DownloadFormat = 'pdf' | 'png';

export function CertificateMakerTool() {
  const { t, lang } = useLanguage();
  const [recipient, setRecipient] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  // Issuer is fixed: Eduvelto only — no person's name, no signature
  // (corrected spec, 28 Nov 2026).
  const issuer = 'Eduvelto';
  const [date, setDate] = useState(() => todayIsoDate());
  // Customizations (28 Nov 2026): the achievement line above the
  // course title, and the premium theme. Both flow into the shared
  // renderer, so the preview canvas and the download are identical.
  // The logo, verification ID + QR and the Eduvelto name are
  // FIXED — there are no controls for them anywhere in this panel.
  const [achievementLine, setAchievementLine] = useState(
    'for successfully completing',
  );
  const [theme, setTheme] = useState<CertificateThemeId>('gold-navy');
  const [format, setFormat] = useState<DownloadFormat>('pdf');
  // ONE verification ID per certificate — minted when the form first
  // becomes ready, kept in state, and regenerated only by an
  // explicit New certificate action below, never on keystrokes.
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [cert, setCert] = useState<QuizCertificateData | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const certCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const slotRef = useRef<HTMLCanvasElement | null>(null);

  // The "Copied" label resets whenever the certificate changes — no
  // timer is used for it (see the component test).
  useEffect(() => {
    setCopied(false);
  }, [recipient, courseTitle, issuer, date, verificationId, achievementLine, theme]);

  const missing = useMemo(
    () => validateCertificateData({ recipient, courseTitle, issuer, date }),
    [recipient, courseTitle, issuer, date],
  );
  // The achievement line must not be blank — an empty line would
  // leave a gap in the certificate.
  const ready = missing.length === 0 && achievementLine.trim().length > 0;

  useEffect(() => {
    if (ready && !verificationId) setVerificationId(makeVerificationId());
  }, [ready, verificationId]);

  // Debounced preview: render the REAL shared canvas whenever the
  // form or the verification ID changes, so the preview IS the
  // certificate that downloads. The 400 ms debounce keeps typing
  // from re-rendering the 2480×1754 canvas on every keystroke.
  useEffect(() => {
    if (!ready || !verificationId) {
      setCert(null);
      certCanvasRef.current = null;
      return;
    }
    let cancelled = false;
    setPreviewBusy(true);
    setPreviewError(false);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const data = buildMakerCertificateData(
            recipient,
            courseTitle,
            date,
            verificationId,
            { achievementLine: achievementLine.trim(), theme },
          );
          const { default: QRCode } = await import('qrcode');
          const qrDataUrl: string = await QRCode.toDataURL(data.verifyUrl, {
            width: 360,
            margin: 1,
            errorCorrectionLevel: 'M',
          });
          const canvas = await drawQuizCertificateCanvas(data, qrDataUrl);
          if (cancelled) return;
          certCanvasRef.current = canvas;
          setCert(data);
        } catch {
          if (!cancelled) setPreviewError(true);
        } finally {
          if (!cancelled) setPreviewBusy(false);
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready, recipient, courseTitle, date, verificationId, achievementLine, theme]);

  // Paint the drawn certificate into the preview slot once React has
  // mounted it (the slot only exists after `cert` is set, so painting
  // must happen in an effect — not in the same tick as setCert).
  useEffect(() => {
    const slot = slotRef.current;
    const canvas = certCanvasRef.current;
    if (!cert || !slot || !canvas) return;
    slot.width = canvas.width;
    slot.height = canvas.height;
    const ctx = slot.getContext('2d');
    if (ctx) ctx.drawImage(canvas, 0, 0);
  }, [cert]);

  function handleNewCertificate(): void {
    setRecipient('');
    setCourseTitle('');
    setDate(todayIsoDate());
    setAchievementLine('for successfully completing');
    setTheme('gold-navy');
    setVerificationId(null);
    setCert(null);
    certCanvasRef.current = null;
    setDownloaded(false);
    setCopied(false);
    setError(null);
    setPreviewError(false);
  }

  async function handleDownload(): Promise<void> {
    const canvas = certCanvasRef.current;
    if (!ready || !cert || !canvas || busy) return;
    setBusy(true);
    setError(null);
    setDownloaded(false);
    try {
      const base = certificateFileBase(cert);
      if (format === 'pdf') {
        await downloadCertificatePdf(canvas, `${base}.pdf`);
      } else {
        downloadCanvasPng(canvas, `${base}.png`);
      }
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
            bn: 'নাম ও কোর্সের নাম দিন — সার্টিফিকেট বানানো সম্পূর্ণ ফ্রি। ফরম্যাট বেছে ফ্রি ডাউনলোড চাপুন। সব কাজ আপনার ডিভাইসেই হয়। প্রদানকারী: Eduvelto।',
            en: 'Enter the name and course — making the certificate is completely free. Choose a format and press Free Download. Everything happens on your device. Issued by: Eduvelto.',
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
          <label style={labelStyle} htmlFor="cert-achievement">
            {t({ bn: 'অর্জনের লাইন', en: 'Achievement line' })}
          </label>
          <input
            id="cert-achievement"
            style={inputStyle}
            type="text"
            value={achievementLine}
            onChange={(e) => setAchievementLine(e.target.value)}
            placeholder={t({ bn: 'যেমন: for successfully completing', en: 'e.g. for successfully completing' })}
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
          <label style={labelStyle} htmlFor="cert-theme">
            {t({ bn: 'ডিজাইন', en: 'Design' })}
          </label>
          <select
            id="cert-theme"
            style={inputStyle}
            value={theme}
            onChange={(e) => setTheme(e.target.value as CertificateThemeId)}
          >
            {CERTIFICATE_THEMES.map((th) => (
              <option key={th.id} value={th.id}>
                {t({ bn: th.nameBn, en: th.nameEn })}
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
          {previewBusy && !cert ? (
            <p style={noteStyle} role="status">
              {t({ bn: 'সার্টিফিকেট আঁকা হচ্ছে…', en: 'Drawing the certificate…' })}
            </p>
          ) : null}
          {cert ? (
            <>
              <canvas
                ref={slotRef}
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }}
                aria-label={t({ bn: 'সার্টিফিকেট প্রিভিউ', en: 'Certificate preview' })}
              />
              <p style={noteStyle}>
                {t({
                  bn: 'এটাই আসল সার্টিফিকেট — প্রিভিউয়ের ক্যানভাসটিই ডাউনলোড হবে। যাচাই আইডি: ',
                  en: 'This is the real certificate — the preview canvas itself is what downloads. Verification ID: ',
                })}
                <strong>{cert.verificationId}</strong>
              </p>
              <p style={noteStyle}>
                {t({
                  bn: 'পিডিএফে বাংলা নাম প্রিভিউয়ের মতোই দেখাবে — সার্টিফিকেটটি ক্যানভাসে আঁকা হয়, তারপর পিডিএফে বসানো হয়। ফাইলের নাম: ',
                  en: 'Bangla names render in the PDF just as in the preview — the certificate is drawn on a canvas, then placed in the PDF. File name: ',
                })}
                {`${certificateFileBase(cert)}.${format}`}
              </p>
            </>
          ) : null}
          {previewError ? (
            <p style={errorStyle} role="alert">
              {t({
                bn: 'প্রিভিউ আঁকা যায়নি — আবার চেষ্টা করুন।',
                en: 'Could not draw the preview — please try again.',
              })}
            </p>
          ) : null}
          <div style={{ marginTop: 12 }}>
            <span style={{ ...labelStyle, marginBottom: 6 }}>
              {t({ bn: 'ডাউনলোড ফরম্যাট', en: 'Download format' })}
            </span>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--heading)' }}>
                <input
                  id="cert-format-pdf"
                  type="radio"
                  name="cert-format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                />
                {t({ bn: 'পিডিএফ (প্রিন্টের জন্য)', en: 'PDF (for print)' })}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--heading)' }}>
                <input
                  id="cert-format-png"
                  type="radio"
                  name="cert-format"
                  value="png"
                  checked={format === 'png'}
                  onChange={() => setFormat('png')}
                />
                {t({ bn: 'পিএনজি ছবি', en: 'PNG image' })}
              </label>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <RewardedAdButton
              lang={lang}
              durationSeconds={format === 'pdf' ? 30 : 15}
              onFreeDownload={() => void handleDownload()}
            />
            <button
              type="button"
              className="ev-btn ev-btn-outline"
              style={copyButtonStyle}
              onClick={() => {
                const summary = `${recipient.trim()} — ${courseTitle.trim()} — ${issuer.trim()}, ${formatCertificateDate(date)} — ${cert?.verificationId ?? verificationId ?? ''}`;
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
            <button
              type="button"
              className="ev-btn ev-btn-outline"
              style={copyButtonStyle}
              onClick={handleNewCertificate}
            >
              {t({ bn: 'নতুন সার্টিফিকেট', en: 'New certificate' })}
            </button>
          </div>
          {busy ? (
            <p style={noteStyle} role="status">
              {t({ bn: 'ডাউনলোড তৈরি হচ্ছে…', en: 'Preparing the download…' })}
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
            bn: 'সার্টিফিকেট দেখতে নাম, কোর্স, অর্জনের লাইন ও সঠিক তারিখ দিন।',
            en: 'Enter the name, course, achievement line and a valid date to see the certificate.',
          })}
        </p>
      )}
      {error ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: 'ডাউনলোড বানানো যায়নি — আবার চেষ্টা করুন।',
            en: 'Could not make the download — please try again.',
          })}
        </p>
      ) : null}
    </section>
  );
}
