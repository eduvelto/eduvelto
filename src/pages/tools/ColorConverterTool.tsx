// Eduvelto — Color Converter tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ExampleButton, shortInputStyle, labelStyle, cardStyle } from './toolUi';
import { convertColor, rgbString, hslString, cmykString } from '../../lib/tools/colorConverter';


const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '10px 12px',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
};

export function ColorConverterTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('#0d9488');
  const color = useMemo(() => convertColor(input), [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="রং কনভার্টার" titleEn="Color Converter" descBn="HEX, RGB, HSL ও CMYK রংয়ের মধ্যে রূপান্তর করুন।" descEn="Convert colours between HEX, RGB, HSL and CMYK." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px' }}>
          <label style={labelStyle} htmlFor="cc-input">{t({ bn: 'রং লিখুন (HEX / rgb() / hsl())', en: 'Enter a colour (HEX / rgb() / hsl())' })}</label>
          <input id="cc-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="#0d9488" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cc-picker">{t({ bn: 'বেছে নিন', en: 'Pick' })}</label>
          <input id="cc-picker" type="color" style={{ width: 64, height: 44, padding: 4, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)' }} value={color ? color.hex : '#000000'} onChange={(e) => setInput(e.target.value)} />
        </div>
      </div>
      {color ? (
        <>
          <div style={{ marginTop: 16, height: 90, borderRadius: 12, background: color.hex, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {color.hex}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
            {[
              { label: 'HEX', value: color.hex },
              { label: 'RGB', value: rgbString(color.rgb) },
              { label: 'HSL', value: hslString(color.hsl) },
              { label: 'CMYK', value: cmykString(color.cmyk) },
            ].map((row) => (
              <div key={row.label} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{row.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', wordBreak: 'break-all' }}>{row.value}</div>
                <div style={{ marginTop: 8 }}><CopyButton text={row.value} /></div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={errorStyle} role="alert">{t({ bn: 'রংটি চেনা যায়নি। উদাহরণ: #0d9488, rgb(13, 148, 136) বা hsl(174, 84%, 31%)।', en: 'Could not read that colour. Examples: #0d9488, rgb(13, 148, 136) or hsl(174, 84%, 31%).' })}</div>
      )}
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('#f59e0b')} />
      </ButtonRow>
    </section>
  );
}
