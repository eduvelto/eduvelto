// Eduvelto — Aspect Ratio Calculator (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Ratio from width/height + find a missing dimension from a ratio.
// 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { simplifyAspectRatio, findMissingDimension, formatConverted } from '../../lib/tools/converterTools';

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

function parseNum(s: string): number | null {
  if (s.trim() === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function AspectRatioCalculatorTool() {
  const { t } = useLanguage();
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('1080');
  const [known, setKnown] = useState('1280');
  const [knownIsWidth, setKnownIsWidth] = useState(true);
  const [ratioW, setRatioW] = useState('16');
  const [ratioH, setRatioH] = useState('9');
  const w = parseNum(width);
  const h = parseNum(height);
  const ratio = useMemo(() => (w !== null && h !== null ? simplifyAspectRatio(w, h) : null), [w, h]);
  const k = parseNum(known);
  const rw = parseNum(ratioW);
  const rh = parseNum(ratioH);
  const missing = useMemo(
    () => (k !== null && rw !== null && rh !== null ? findMissingDimension(k, knownIsWidth, rw, rh) : null),
    [k, knownIsWidth, rw, rh],
  );
  const loadExample = () => { setWidth('1920'); setHeight('1080'); setKnown('1280'); setKnownIsWidth(true); setRatioW('16'); setRatioH('9'); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="অ্যাসপেক্ট রেশিও ক্যালকুলেটর" titleEn="Aspect Ratio Calculator" descBn="প্রস্থ-উচ্চতা থেকে রেশিও বের করুন, আর রেশিও জানা থাকলে হারানো মাপটি খুঁজুন।" descEn="Get the ratio from width and height, and find a missing dimension from a ratio." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ar-width">{t({ bn: 'প্রস্থ (পিক্সেল)', en: 'Width (pixels)' })}</label>
          <input id="ar-width" style={shortInputStyle} type="number" min="1" inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="1920" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ar-height">{t({ bn: 'উচ্চতা (পিক্সেল)', en: 'Height (pixels)' })}</label>
          <input id="ar-height" style={shortInputStyle} type="number" min="1" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="1080" />
        </div>
      </div>
      <ButtonRow>
        <ClearButton onClear={() => { setWidth(''); setHeight(''); }} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {ratio ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'অ্যাসপেক্ট রেশিও', en: 'Aspect ratio' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{ratio.w}:{ratio.h}</p>
          </div>
          <Tiles items={[
            { labelBn: 'দশমিকে', labelEn: 'As a decimal', value: (ratio.w / ratio.h).toFixed(4) },
            { labelBn: 'প্রস্থ', labelEn: 'Width', value: w !== null ? formatConverted(w) : '—' },
            { labelBn: 'উচ্চতা', labelEn: 'Height', value: h !== null ? formatConverted(h) : '—' },
          ]} />
          <ButtonRow><CopyButton text={`${w}×${h} = ${ratio.w}:${ratio.h}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক প্রস্থ ও উচ্চতা দিন — দুটোই পূর্ণসংখ্যা ও ০-এর বেশি হতে হবে।', en: 'Enter a valid width and height — both must be whole numbers above 0.' })}</p>
      )}
      <div style={{ marginTop: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>{t({ bn: 'রেশিও থেকে হারানো মাপ খুঁজুন', en: 'Find a missing dimension from a ratio' })}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button type="button" style={knownIsWidth ? activeButtonStyle : buttonStyle} onClick={() => setKnownIsWidth(true)}>{t({ bn: 'প্রস্থ জানা', en: 'Width known' })}</button>
          <button type="button" style={!knownIsWidth ? activeButtonStyle : buttonStyle} onClick={() => setKnownIsWidth(false)}>{t({ bn: 'উচ্চতা জানা', en: 'Height known' })}</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle} htmlFor="ar-known">{t({ bn: knownIsWidth ? 'জানা প্রস্থ (পিক্সেল)' : 'জানা উচ্চতা (পিক্সেল)', en: knownIsWidth ? 'Known width (pixels)' : 'Known height (pixels)' })}</label>
            <input id="ar-known" style={shortInputStyle} type="number" min="1" inputMode="numeric" value={known} onChange={(e) => setKnown(e.target.value)} placeholder="1280" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ar-ratiow">{t({ bn: 'রেশিও — প্রস্থ', en: 'Ratio — width' })}</label>
            <input id="ar-ratiow" style={shortInputStyle} type="number" min="1" inputMode="numeric" value={ratioW} onChange={(e) => setRatioW(e.target.value)} placeholder="16" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ar-ratioh">{t({ bn: 'রেশিও — উচ্চতা', en: 'Ratio — height' })}</label>
            <input id="ar-ratioh" style={shortInputStyle} type="number" min="1" inputMode="numeric" value={ratioH} onChange={(e) => setRatioH(e.target.value)} placeholder="9" />
          </div>
        </div>
        {missing !== null ? (
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: knownIsWidth ? 'উচ্চতা হবে' : 'প্রস্থ হবে', en: knownIsWidth ? 'Height will be' : 'Width will be' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{formatConverted(missing)} px</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `${k} px × ${rw}:${rh} রেশিওতে`, en: `${k} px at a ${rw}:${rh} ratio` })}</p>
          </div>
        ) : (
          <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — জানা মাপ ও রেশিওর দুটো সংখ্যাই ০-এর বেশি হতে হবে।', en: 'Enter valid values — the known size and both ratio numbers must be above 0.' })}</p>
        )}
      </div>
      <p style={noteStyle}>{t({ bn: 'সাধারণ রেশিও: ১৬:৯ (ভিডিও/ইউটিউব), ৪:৩ (পুরনো টিভি), ১:১ (বর্গাকার), ৯:১৬ (ভার্টিকাল রিল/শর্টস), ৩:২ (ছবি)।', en: 'Common ratios: 16:9 (video/YouTube), 4:3 (old TV), 1:1 (square), 9:16 (vertical Reels/Shorts), 3:2 (photos).' })}</p>
    </section>
  );
}
