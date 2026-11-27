// Eduvelto — PDF to Word tool UI (27 Nov 2026).
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Logic in src/lib/tools/pdfToWord.ts (pdf.js 5.4.624 legacy + docx
// 9.16.0, both lazy). The PDF never leaves the device: text is
// extracted and the .docx is generated 100% in the browser.
//
// Font selection is the point of this tool: the user picks a Bangla
// font (6) and an English font (4); each run is set in the font for
// its script. SutonnyMJ is a Bijoy font, so Bangla runs are converted
// to Bijoy encoding first (see the engine); runs that cannot convert
// fall back to SolaimanLipi and the UI warns about it — never silent
// garbage. Honest notes: the font NAME is embedded, so a Word without
// that font installed falls back; layout is best-effort, text is
// preserved; scanned/image PDFs (no text layer) are refused.
//
// ADS (owner 27 Nov 17:18): conversion is FREE; the .docx download
// goes through <RewardedAdButton> (same pattern as Certificate
// Maker) — a 30-second rewarded ad once AdSense is approved. AdSense
// is still in review, so the placeholder reports unavailable and the
// Free Download path stays live with honest copy; NEVER a fake timer.
// The page also carries the standard display slots (<AdSlot>
// in-content below the hero + in-content-2 at the end, the tool-page
// placement in lib/adsConfig.ts).
//
// PREVIEW WATERMARK (owner 27 Nov 17:19): the on-screen preview of
// the converted text (PdfToWordPreview) carries a diagonal repeating
// "Eduvelto" watermark and cannot be selected/copied. The downloaded
// .docx is CLEAN — no watermark text or artifact goes into the
// document. The watermark deters casual copying only; it does not
// stop a determined user inspecting the DOM, and the UI does not
// claim otherwise.

import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui';
import AdSlot from '../../components/AdSlot';
import RewardedAdButton from '../../components/RewardedAdButton';
import { useRewardedAd } from '../../lib/rewardedAd';
import {
  BANGLA_FONTS, DEFAULT_BANGLA_FONT, DEFAULT_ENGLISH_FONT, ENGLISH_FONTS,
  PDF_TO_WORD_MAX_MB, PDF_TO_WORD_MAX_PAGES, PDF_TO_WORD_MIN_TEXT_CHARS,
  buildWordDocument, extractPdfText, packWordDocument, triggerBlobDownload,
  type BanglaFont, type EnglishFont, type ExtractedPdfText,
} from '../../lib/tools/pdfToWord';
import { isPdfFile } from '../../lib/tools/pdfToJpg';
import {
  cardStyle, errorStyle, fmtBytes, headlineLabelStyle, headlineStyle,
  heroDescStyle, heroStyle, heroTitleStyle, inputStyle, isOverLimit, labelStyle,
  noteStyle, PrivacyNote, resultStyle, Tile, tileGridStyle, trustChipStyle,
} from './toolShared';
import { PdfToWordPreview } from './PdfToWordPreview';

export function PdfToWordTool() {
  const { t } = useLanguage();
  const { available: rewardedAdAvailable } = useRewardedAd();
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedPdfText | null>(null);
  const [banglaFont, setBanglaFont] = useState<BanglaFont>(DEFAULT_BANGLA_FONT);
  const [englishFont, setEnglishFont] = useState<EnglishFont>(DEFAULT_ENGLISH_FONT);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fallbackRuns, setFallbackRuns] = useState(0);
  const [convertedRuns, setConvertedRuns] = useState(0);
  const [result, setResult] = useState<{ url: string; name: string; bytes: number } | null>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  function clearResult(): void {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    urlsRef.current = [];
    setResult(null);
    setFallbackRuns(0);
    setConvertedRuns(0);
  }

  async function handleFile(next: File | null): Promise<void> {
    setError(null);
    setExtracted(null);
    clearResult();
    setProgress('');
    if (!next) {
      setFile(null);
      return;
    }
    if (!isPdfFile(next, next.name)) {
      setFile(null);
      setError('not-pdf');
      return;
    }
    if (isOverLimit(next, PDF_TO_WORD_MAX_MB)) {
      setFile(null);
      setError('too-big');
      return;
    }
    setFile(next);
    setBusy(true);
    try {
      const text = await extractPdfText(next, {
        onProgress: (done, total) => setProgress(`${done}/${total}`),
      });
      if (text.pageCount > PDF_TO_WORD_MAX_PAGES) {
        setError('too-many-pages');
        return;
      }
      setExtracted(text);
      if (text.totalChars < PDF_TO_WORD_MIN_TEXT_CHARS) {
        setError('no-text');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'failed';
      setError(
        message.includes('password-protected')
          ? 'password-protected'
          : message.includes('Could not read')
            ? 'unreadable'
            : message.includes('pages — this tool converts')
              ? 'too-many-pages'
              : 'failed',
      );
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  async function handleConvert(): Promise<void> {
    if (!file || !extracted) return;
    setBusy(true);
    setError(null);
    clearResult();
    try {
      // Extracted text is already in hand — build + pack only, so the
      // PDF is not read a second time.
      const built = await buildWordDocument(extracted, { banglaFont, englishFont });
      const blob = await packWordDocument(built.document);
      const url = URL.createObjectURL(blob);
      urlsRef.current.push(url);
      setFallbackRuns(built.fallbackRuns);
      setConvertedRuns(built.convertedRuns);
      setResult({
        url,
        name: file.name.replace(/\.pdf$/i, '') || 'document',
        bytes: blob.size,
      });
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  /** Download the built .docx — the RewardedAdButton's free-download path calls this. */
  function handleDownload(): void {
    if (!result) return;
    triggerBlobDownload(result.url, `${result.name}.docx`);
  }

  const hasText = extracted !== null && extracted.totalChars >= PDF_TO_WORD_MIN_TEXT_CHARS;

  return (
    <section className="ev-card" style={cardStyle} aria-labelledby="pdf-to-word-title">
      <div style={heroStyle}>
        <h2 id="pdf-to-word-title" style={heroTitleStyle}>{t({ bn: 'পিডিএফ থেকে ওয়ার্ড', en: 'PDF to Word' })}</h2>
        <p style={heroDescStyle}>{t({ bn: 'পিডিএফের লেখা Word (.docx) ফাইলে রূপান্তর করুন — বাংলা ও ইংরেজি ফন্ট নিজে বেছে নিন।', en: 'Convert a PDF’s text into an editable Word (.docx) file — choose your own Bangla and English fonts.' })}</p>
        <span style={trustChipStyle}>{t({ bn: '✓ আপনার ডিভাইসেই প্রক্রিয়া হয়', en: '✓ Processed on your device' })}</span>
        <span style={trustChipStyle}>PDF.js (Mozilla) • docx</span>
        <span style={trustChipStyle}>{t({ bn: '১০ MB পর্যন্ত, সর্বোচ্চ ৫০ পাতা', en: 'Up to 10 MB, max 50 pages' })}</span>
      </div>
      <AdSlot placement="in-content" />
      <div>
        <label style={labelStyle} htmlFor="pdf-word-file">{t({ bn: 'পিডিএফ ফাইল', en: 'PDF file' })}</label>
        <input id="pdf-word-file" style={inputStyle} type="file" accept="application/pdf,.pdf" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
      </div>
      {/* Font choice is always visible: the user picks fonts first,
          then a file — the choice applies to whatever is converted. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
        <div>
          <label style={labelStyle} htmlFor="pdf-word-bn-font">{t({ bn: 'বাংলা ফন্ট', en: 'Bangla font' })}</label>
          <select
            id="pdf-word-bn-font"
            style={inputStyle}
            value={banglaFont}
            onChange={(e) => setBanglaFont(e.target.value as BanglaFont)}
          >
            {BANGLA_FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <p style={noteStyle}>
            {banglaFont === 'SutonnyMJ'
              ? t({ bn: 'SutonnyMJ একটি বিজয় ফন্ট — বাংলা লেখা বিজয় কোডে রূপান্তর করে দেওয়া হবে, যাতে Word-এ সঠিক দেখায়।', en: 'SutonnyMJ is a Bijoy font — Bangla text will be converted to Bijoy encoding so it displays correctly in Word.' })
              : t({ bn: 'ইউনিকোড ফন্ট — বাংলা লেখা ইউনিকোডেই থাকবে।', en: 'Unicode font — Bangla text stays in Unicode.' })}
          </p>
        </div>
        <div>
          <label style={labelStyle} htmlFor="pdf-word-en-font">{t({ bn: 'ইংরেজি ফন্ট', en: 'English font' })}</label>
          <select
            id="pdf-word-en-font"
            style={inputStyle}
            value={englishFont}
            onChange={(e) => setEnglishFont(e.target.value as EnglishFont)}
          >
            {ENGLISH_FONTS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <p style={noteStyle}>
            {t({ bn: 'বাংলা ও ইংরেজি মেশানো লাইনে প্রতিটি অংশ নিজের ফন্টেই থাকবে।', en: 'In mixed Bangla–English lines, each part keeps its own font.' })}
          </p>
        </div>
      </div>
      <p style={noteStyle}>
        {t({
          bn: 'মনে রাখবেন: ফাইলে ফন্টের নাম লেখা থাকে — আপনার Word-এ সেই ফন্ট না থাকলে Word অন্য ফন্টে দেখাবে। জটিল লেআউট, টেবিল ও ছবি হুবহু আসবে না; লেখার বিষয়বস্তু ঠিক থাকবে, সাজানো যথাসম্ভব চেষ্টা করা হবে।',
          en: 'Note: the font name is stored in the file — if your Word does not have that font installed, Word will show another font. Complex layouts, tables and images will not convert exactly; the text content is preserved and the layout is best-effort.',
        })}
      </p>
      <p style={noteStyle}>
        {rewardedAdAvailable
          ? t({
            bn: 'রূপান্তর সম্পূর্ণ বিনামূল্যে। ডাউনলোডের আগে ৩০ সেকেন্ডের একটি বিজ্ঞাপন দেখাতে হয়।',
            en: 'Conversion is completely free. A 30-second ad plays before the download.',
          })
          : t({
            bn: 'রূপান্তর সম্পূর্ণ বিনামূল্যে। ডাউনলোডের আগে একটি ছোট বিজ্ঞাপন দেখাতে হয় — তবে AdSense এখনো review-এ আছে বলে বিজ্ঞাপন আসছে না, তাই ডাউনলোড এখন বিনামূল্যে হচ্ছে।',
            en: 'Conversion is completely free. A short ad plays before the download — but AdSense is still in review so no ad can load yet, and the download is free for now.',
          })}
      </p>
      {extracted ? (
        <div style={{ marginTop: 14 }}>
          <p style={noteStyle} role="status">
            {t({ bn: 'এই পিডিএফে মোট পাতা: ', en: 'This PDF has ' })}
            {extracted.pageCount}
            {t({ bn: 'টি, মোট অক্ষর: ', en: ' page(s), ' })}
            {extracted.totalChars.toLocaleString()}
            {t({ bn: 'টি।', en: ' characters in total.' })}
          </p>
          <div style={{ marginTop: 14 }}>
            <Button onClick={() => void handleConvert()} loading={busy} disabled={!file || !hasText}>
              {t({ bn: 'Word ফাইলে রূপান্তর করুন', en: 'Convert to Word' })}
            </Button>
            {busy && progress ? (
              <p style={noteStyle} role="status">
                {t({ bn: 'পড়া হচ্ছে: ', en: 'Reading: ' })}
                {progress}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <PrivacyNote limitMb={PDF_TO_WORD_MAX_MB} />
      {error ? (
        <p style={errorStyle} role="alert">
          {error === 'not-pdf' ? t({ bn: 'শুধু পিডিএফ ফাইল চলবে — একটি .pdf ফাইল বাছুন।', en: 'Only PDF files work — choose a .pdf file.' })
            : error === 'too-big' ? t({ bn: 'ফাইলটি ১০ MB-এর বেশি — ছোট পিডিএফ বাছুন।', en: 'The file is over 10 MB — choose a smaller PDF.' })
            : error === 'too-many-pages' ? t({ bn: 'এই পিডিএফে ৫০টির বেশি পাতা আছে — একবারে সর্বোচ্চ ৫০ পাতা রূপান্তর করা যায়।', en: 'This PDF has more than 50 pages — at most 50 pages can be converted at once.' })
            : error === 'password-protected' ? t({ bn: 'এই পিডিএফে পাসওয়ার্ড দেওয়া আছে — আগে পাসওয়ার্ড সরিয়ে নিন।', en: 'This PDF is password-protected — remove the password first.' })
            : error === 'unreadable' ? t({ bn: 'এই ফাইলটি পিডিএফ হিসেবে পড়া যায়নি — ফাইলটি নষ্ট বা পিডিএফ নয়।', en: 'This file could not be read as a PDF — it may be corrupt or not a PDF.' })
            : error === 'no-text' ? t({ bn: 'এই পিডিএফে পড়ার মতো লেখা পাওয়া যায়নি — এটি সম্ভবত স্ক্যান করা বা ছবির পিডিএফ। ছবির পাতা থেকে লেখা বের করা যায় না, তাই খালি Word ফাইল দেওয়া হচ্ছে না।', en: 'No readable text was found in this PDF — it is probably a scanned or image PDF. Text cannot be extracted from pictures of pages, so no empty Word file is given.' })
            : t({ bn: 'রূপান্তর করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not convert — please try again.' })}
        </p>
      ) : null}
      {fallbackRuns > 0 ? (
        <p style={errorStyle} role="alert">
          {t({
            bn: `সতর্কতা: ${fallbackRuns}টি বাংলা অংশ বিজয় কোডে রূপান্তর করা যায়নি (এমন অক্ষর আছে যার বিজয় রূপ নেই), তাই সেগুলো SolaimanLipi ফন্টে ইউনিকোড হিসেবে রাখা হয়েছে — নইলে Word-এ ভুল অক্ষর দেখাত।`,
            en: `Note: ${fallbackRuns} Bangla part(s) could not be converted to Bijoy encoding (they contain a character with no Bijoy form), so they were kept in Unicode with the SolaimanLipi font — otherwise Word would show wrong characters.`,
          })}
        </p>
      ) : null}
      {result && extracted ? (
        <PdfToWordResult
          extracted={extracted}
          result={result}
          banglaFont={banglaFont}
          englishFont={englishFont}
          convertedRuns={convertedRuns}
          onDownload={handleDownload}
        />
      ) : null}
      <AdSlot placement="in-content-2" />
    </section>
  );
}

/**
 * Result area after a successful conversion: headline tiles, the
 * watermarked preview, and the rewarded-ad download button.
 * Exported so the download flow (free-download live while the ad is
 * unavailable + unlock disabled with honest copy) is testable without
 * driving the whole file flow.
 */
export function PdfToWordResult({
  extracted,
  result,
  banglaFont,
  englishFont,
  convertedRuns,
  onDownload,
}: {
  extracted: ExtractedPdfText;
  result: { url: string; name: string; bytes: number };
  banglaFont: BanglaFont;
  englishFont: EnglishFont;
  convertedRuns: number;
  onDownload: () => void;
}) {
  const { t, lang } = useLanguage();
  const { available: rewardedAdAvailable } = useRewardedAd();
  const previewLines = extracted.pages.flatMap((p) => p.lines);
  return (
    <div style={resultStyle} role="status">
      <p style={headlineLabelStyle}>{t({ bn: 'Word ফাইল তৈরি হয়েছে', en: 'Word file created' })}</p>
      <p style={headlineStyle}>.docx</p>
      <div style={tileGridStyle}>
        <Tile label={t({ bn: 'পাতা', en: 'Pages' })} value={extracted.pageCount} />
        <Tile label={t({ bn: 'অক্ষর', en: 'Characters' })} value={extracted.totalChars.toLocaleString()} />
        <Tile label={t({ bn: 'বাংলা ফন্ট', en: 'Bangla font' })} value={banglaFont} />
        <Tile label={t({ bn: 'ইংরেজি ফন্ট', en: 'English font' })} value={englishFont} />
        <Tile label={t({ bn: 'ফাইলের আকার', en: 'File size' })} value={fmtBytes(result.bytes)} />
        {convertedRuns > 0 ? (
          <Tile label={t({ bn: 'বিজয়ে রূপান্তরিত', en: 'Converted to Bijoy' })} value={convertedRuns} />
        ) : null}
      </div>
      <PdfToWordPreview
        lines={previewLines}
        totalLines={previewLines.length}
        banglaFont={banglaFont}
        englishFont={englishFont}
      />
      <div style={{ marginTop: 14 }}>
        <RewardedAdButton lang={lang} onFreeDownload={onDownload} />
        <p style={noteStyle}>
          {rewardedAdAvailable
            ? t({
              bn: 'ডাউনলোড করতে ৩০ সেকেন্ডের বিজ্ঞাপনটি দেখুন — বিজ্ঞাপন শেষ হলে ডাউনলোড শুরু হবে।',
              en: 'Watch the 30-second ad to download — the download starts when the ad finishes.',
            })
            : t({
              bn: 'বিজ্ঞাপন এখনো চালু হয়নি (AdSense review-এ আছে), তাই ডাউনলোড এখন বিনামূল্যে হচ্ছে — কোনো ভুয়া টাইমার নেই।',
              en: 'Ads are not live yet (AdSense is in review), so the download is free for now — no fake timer.',
            })}
        </p>
      </div>
    </div>
  );
}
