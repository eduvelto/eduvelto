// Eduvelto — DPI / PPI Calculator (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// PPI from pixel resolution + diagonal screen size. 100% in-browser.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { calculatePpi, aspectRatioString, formatConverted } from '../../lib/tools/converterTools';

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

export function DpiPpiCalculatorTool() {
  const { t } = useLanguage();
  const [width, setWidth] = useState('1920');
  const [height, setHeight] = useState('1080');
  const [diagonal, setDiagonal] = useState('24');
  const w = parseNum(width);
  const h = parseNum(height);
  const d = parseNum(diagonal);
  const ppi = useMemo(() => (w !== null && h !== null && d !== null ? calculatePpi(w, h, d) : null), [w, h, d]);
  const ratio = w !== null && h !== null && Number.isInteger(w) && Number.isInteger(h) ? aspectRatioString(w, h) : null;
  const megapixels = w !== null && h !== null ? (w * h) / 1e6 : null;
  const loadExample = () => { setWidth('1920'); setHeight('1080'); setDiagonal('24'); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="DPI / PPI ক্যালকুলেটর" titleEn="DPI / PPI Calculator" descBn="স্ক্রিনের রেজোলিউশন ও ডায়াগোনাল সাইজ থেকে PPI (পিক্সেল প্রতি ইঞ্চি) বের করুন।" descEn="Work out PPI (pixels per inch) from a screen's resolution and diagonal size." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="ppi-width">{t({ bn: 'প্রস্থ (পিক্সেল)', en: 'Width (pixels)' })}</label>
          <input id="ppi-width" style={shortInputStyle} type="number" min="1" inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="1920" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ppi-height">{t({ bn: 'উচ্চতা (পিক্সেল)', en: 'Height (pixels)' })}</label>
          <input id="ppi-height" style={shortInputStyle} type="number" min="1" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="1080" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="ppi-diagonal">{t({ bn: 'ডায়াগোনাল সাইজ (ইঞ্চি)', en: 'Diagonal size (inches)' })}</label>
          <input id="ppi-diagonal" style={shortInputStyle} type="number" min="0.1" step="0.1" inputMode="decimal" value={diagonal} onChange={(e) => setDiagonal(e.target.value)} placeholder="24" />
        </div>
      </div>
      <ButtonRow>
        <ClearButton onClear={() => { setWidth(''); setHeight(''); setDiagonal(''); }} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {ppi !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'পিক্সেল ঘনত্ব', en: 'Pixel density' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{ppi.toFixed(2)} PPI</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: √(প্রস্থ² + উচ্চতা²) ÷ ডায়াগোনাল`, en: 'Formula: √(width² + height²) ÷ diagonal' })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'অ্যাসপেক্ট রেশিও', labelEn: 'Aspect ratio', value: ratio ?? '—' },
            { labelBn: 'মোট পিক্সেল', labelEn: 'Total pixels', value: megapixels !== null ? `${formatConverted(megapixels)} MP` : '—' },
            { labelBn: 'ডায়াগোনাল (পিক্সেল)', labelEn: 'Diagonal (pixels)', value: w !== null && h !== null ? formatConverted(Math.sqrt(w * w + h * h)) : '—' },
          ]} />
          <ButtonRow><CopyButton text={`${w}×${h} on ${d}" screen = ${ppi.toFixed(2)} PPI`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — প্রস্থ, উচ্চতা ও ডায়াগোনাল সবই ০-এর বেশি হতে হবে।', en: 'Enter valid values — width, height and diagonal must all be above 0.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'PPI বেশি হলে ছবি তীক্ষ্ণ দেখায় — ফোনে সাধারণত ৩০০–৫০০ PPI, মনিটরে ৯০–১৬০ PPI থাকে। প্রিন্টের DPI হিসাবেও একই সূত্র চলে, তবে প্রিন্টে কাগজের সাইজ (ইঞ্চি) বসাতে হয়।', en: 'Higher PPI looks sharper — phones are usually 300–500 PPI, monitors 90–160 PPI. The same formula works for print DPI, using the paper size in inches instead.' })}</p>
    </section>
  );
}
