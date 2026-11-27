// Eduvelto — PDF Password Protector tool UI (27 Nov 2026).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/pdfPasswordProtector.ts (QPDF WASM, lazy).
// Real AES-256 encryption: after protecting, the UI itself verifies
// with QPDF that the entered password opens the file, and shows the
// result — a file that opens without a password is never offered.

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import {
  checkProtectedPdf, isPdfFile, protectPdf, validateProtectOptions,
  PDF_PROTECT_MAX_MB, PDF_PROTECT_MIN_PASSWORD,
} from '../../lib/tools/pdfPasswordProtector';
import {
  cardStyle, downloadStyle, errorStyle, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';

export function PdfPasswordProtectorTool() {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [userPassword, setUserPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBytes, setResultBytes] = useState(0);
  const [verified, setVerified] = useState<'idle' | 'checking' | 'ok' | 'wrong'>('idle');
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    const url = urlRef.current;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  function handleFile(next: File | null): void {
    setError(null);
    setVerified('idle');
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setResultUrl(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!isPdfFile(next, next.name)) {
      setFile(null);
      setError('not-pdf');
      return;
    }
    if (isOverLimit(next, PDF_PROTECT_MAX_MB)) {
      setFile(null);
      setError('too-big');
      return;
    }
    setFile(next);
  }

  async function handleProtect(): Promise<void> {
    if (!file) return;
    setError(null);
    setVerified('idle');
    if (userPassword !== confirmPassword) {
      setError('mismatch');
      return;
    }
    try {
      validateProtectOptions(userPassword, ownerPassword);
    } catch {
      setError('short');
      return;
    }
    setBusy(true);
    try {
      const blob = await protectPdf(file, userPassword, ownerPassword);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setResultUrl(url);
      setResultBytes(blob.size);
      // Verify with QPDF itself: the entered password must open the file.
      setVerified('checking');
      const check = await checkProtectedPdf(blob, userPassword);
      setVerified(check === 'ok' ? 'ok' : 'wrong');
      if (check !== 'ok') {
        setError('verify-failed');
      }
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  const protectedName = file ? file.name.replace(/\.pdf$/i, '') + '-protected.pdf' : 'protected.pdf';

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-password-title">
      <div style={heroStyle}>
        <h2 id="pdf-password-title" style={heroTitleStyle}>{t({ bn: 'পিডিএফ পাসওয়ার্ড প্রোটেক্টর', en: 'PDF Password Protector' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'PDF ফাইলে পাসওয়ার্ড বসিয়ে তা পাসওয়ার্ড ছাড়া যাতে না খোলা যায় সেই ব্যবস্থা করুন।', en: 'Add a password to a PDF file so it cannot be opened without it.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>QPDF • AES-256</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত', en: 'Up to 10 MB' })}</span>
      </div>
      <div>
        <label style={labelStyle} htmlFor="pdf-protect-file">{t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}</label>
        <input id="pdf-protect-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="pdf-protect-password">{t({ bn: 'পাসওয়ার্ড (খুলতে লাগবে)', en: 'Password (needed to open)' })}</label>
        <input
          id="pdf-protect-password"
          style={inputStyle}
          type="password"
          autoComplete="new-password"
          value={userPassword}
          onChange={(e) => setUserPassword(e.target.value)}
          placeholder={t({ bn: `কমপক্ষে ${PDF_PROTECT_MIN_PASSWORD} অক্ষর`, en: `At least ${PDF_PROTECT_MIN_PASSWORD} characters` })}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="pdf-protect-confirm">{t({ bn: 'পাসওয়ার্ড আবার লিখুন', en: 'Type the password again' })}</label>
        <input
          id="pdf-protect-confirm"
          style={inputStyle}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="pdf-protect-owner">{t({ bn: 'মালিকের পাসওয়ার্ড (ঐচ্ছিক — খালি থাকলে উপরেরটিই হবে)', en: 'Owner password (optional — blank means the same as above)' })}</label>
        <input
          id="pdf-protect-owner"
          style={inputStyle}
          type="password"
          autoComplete="new-password"
          value={ownerPassword}
          onChange={(e) => setOwnerPassword(e.target.value)}
        />
      </div>
      <div style={{ marginTop: 14 }}>
        <Button onClick={() => void handleProtect()} loading={busy} disabled={!file || userPassword === ''}>
          {t({ bn: 'পাসওয়ার্ড বসান', en: 'Protect PDF' })}
        </Button>
      </div>
      <PrivacyNote limitMb={PDF_PROTECT_MAX_MB} />
      <p style={noteStyle}>
        {t({
          bn: 'পাসওয়ার্ড কোথাও পাঠানো হয় না — ফাইল ও পাসওয়ার্ড আপনার ডিভাইসেই থাকে। পাসওয়ার্ড ভুলে গেলে ফাইলটি আর খোলা যাবে না, তাই কোথাও লিখে রাখুন।',
          en: 'The password is never sent anywhere — the file and the password stay on your device. If you forget the password, the file cannot be opened again, so write it down somewhere.',
        })}
      </p>
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-pdf' ? t({ bn: 'শুধু পিডিএফ ফাইল চলবে — একটি .pdf ফাইল বাছুন।', en: 'Only PDF files work — choose a .pdf file.' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট পিডিএফ বাছুন।', en: 'The file is over 10 MB — choose a smaller PDF.' })
            : error === 'mismatch' ? t({ bn: 'দুইবার লেখা পাসওয়ার্ড মিলছে না — আবার লিখুন।', en: 'The two passwords do not match — please type them again.' })
            : error === 'short' ? t({ bn: `পাসওয়ার্ড কমপক্ষে ${PDF_PROTECT_MIN_PASSWORD} অক্ষরের হতে হবে।`, en: `The password must be at least ${PDF_PROTECT_MIN_PASSWORD} characters.` })
            : error === 'verify-failed' ? t({ bn: 'সুরক্ষা যাচাই করা যায়নি — ফাইলটি ডাউনলোড করবেন না, আবার চেষ্টা করুন।', en: 'Protection could not be verified — do not download the file, please try again.' })
            : t({ bn: 'সুরক্ষা দেওয়া যায়নি — ফাইলটি নষ্ট হতে পারে বা এতে আগেই পাসওয়ার্ড দেওয়া আছে। আবার চেষ্টা করুন।', en: 'Could not protect — the file may be corrupt or already password-protected. Please try again.' })}
        </p>
      ) : null}
      {resultUrl ? (
        <div style={resultStyle} role="status">
          <p style={headlineLabelStyle}>{t({ bn: 'সুরক্ষিত পিডিএফ', en: 'Protected PDF' })}</p>
          <p style={headlineStyle}>AES-256</p>
          <div style={tileGridStyle}>
            <Tile label={t({ bn: 'আগের আকার', en: 'Original size' })} value={file ? `${(file.size / 1024).toFixed(1)} KB` : '—'} />
            <Tile label={t({ bn: 'সুরক্ষিত আকার', en: 'Protected size' })} value={`${(resultBytes / 1024).toFixed(1)} KB`} />
            <Tile
              label={t({ bn: 'যাচাই', en: 'Verified' })}
              value={
                verified === 'ok'
                  ? t({ bn: '✓ পাসওয়ার্ডে খোলে', en: '✓ Opens with password' })
                  : verified === 'checking'
                    ? t({ bn: 'যাচাই চলছে…', en: 'Checking…' })
                    : t({ bn: 'যাচাই হয়নি', en: 'Not verified' })
              }
            />
          </div>
          {verified === 'ok' ? (
            <a href={resultUrl} download={protectedName} style={downloadStyle}>
              {t({ bn: 'সুরক্ষিত পিডিএফ ডাউনলোড করুন', en: 'Download the protected PDF' })}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
