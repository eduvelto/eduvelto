// Eduvelto — CSS Gradient Generator tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, shortInputStyle, labelStyle, cardStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { buildGradientCss, buildBoxShadowCss, GRADIENT_PRESETS, type GradientStop } from '../../lib/tools/gradientGenerator';


const outputStyle: CSSProperties = {
  width: '100%',
  minHeight: 120,
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15,
  boxSizing: 'border-box',
  background: 'var(--teal-soft)',
  color: 'var(--heading)',
  fontFamily: 'inherit',
  resize: 'vertical',
};

export function CssGradientGeneratorTool() {
  const { t } = useLanguage();
  const [type, setType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([{ color: '#14532d', position: 0 }, { color: '#0d9488', position: 100 }]);
  const [shadowBlur, setShadowBlur] = useState(12);
  const [shadowY, setShadowY] = useState(4);
  const css = useMemo(() => buildGradientCss({ type, angle, stops }), [type, angle, stops]);
  const shadowCss = useMemo(() => buildBoxShadowCss({ x: 0, y: shadowY, blur: shadowBlur, spread: 0, color: 'rgba(0,0,0,0.25)' }), [shadowY, shadowBlur]);
  const previewBackground = css.replace(/^background: /, '').replace(/;$/, '');
  const updateStop = (i: number, patch: Partial<GradientStop>) => setStops((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="সিএসএস গ্রেডিয়েন্ট জেনারেটর" titleEn="CSS Gradient Generator" descBn="ওয়েবসাইটের জন্য গ্রেডিয়েন্ট রং ও বক্স শ্যাডোর CSS বানান।" descEn="Generate CSS for colour gradients and box shadows." chipBn="লাইভ প্রিভিউ সহ — CSS কপি করে ব্যবহার করুন" chipEn="Live preview — copy the CSS and use it" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {GRADIENT_PRESETS.map((p) => (
          <button key={p.nameEn} type="button" style={buttonStyle} onClick={() => { setAngle(p.angle); setStops(p.stops); setType('linear'); }}>
            {t({ bn: p.nameBn, en: p.nameEn })}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }} role="group" aria-label={t({ bn: 'ধরন', en: 'Type' })}>
        <button type="button" style={type === 'linear' ? activeButtonStyle : buttonStyle} aria-pressed={type === 'linear'} onClick={() => setType('linear')}>Linear</button>
        <button type="button" style={type === 'radial' ? activeButtonStyle : buttonStyle} aria-pressed={type === 'radial'} onClick={() => setType('radial')}>Radial</button>
        {type === 'linear' ? (
          <label style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>{t({ bn: 'কোণ', en: 'Angle' })} {angle}°
            <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
          </label>
        ) : null}
      </div>
      {stops.map((stop, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <input type="color" value={stop.color} onChange={(e) => updateStop(i, { color: e.target.value })} style={{ width: 56, height: 44, padding: 4, borderRadius: 8, border: '1px solid var(--line)' }} aria-label={`${t({ bn: 'রং', en: 'Colour' })} ${i + 1}`} />
          <input style={{ ...shortInputStyle, width: 130 }} value={stop.color} onChange={(e) => updateStop(i, { color: e.target.value })} aria-label={`${t({ bn: 'রংয়ের কোড', en: 'Colour code' })} ${i + 1}`} />
          <label style={{ fontSize: 14 }}>{t({ bn: 'অবস্থান', en: 'Position' })} {stop.position}%
            <input type="range" min={0} max={100} value={stop.position} onChange={(e) => updateStop(i, { position: Number(e.target.value) })} />
          </label>
          {stops.length > 2 ? <button type="button" style={buttonStyle} onClick={() => setStops((prev) => prev.filter((_, j) => j !== i))}>×</button> : null}
        </div>
      ))}
      <ButtonRow>
        <button type="button" style={buttonStyle} onClick={() => setStops((prev) => [...prev, { color: '#f59e0b', position: 100 }])} disabled={stops.length >= 5}>{t({ bn: 'আরেকটি রং যোগ করুন', en: 'Add another colour' })}</button>
      </ButtonRow>
      <div style={{ marginTop: 16, height: 140, borderRadius: 12, background: previewBackground, boxShadow: '0 4px 12px rgba(0,0,0,0.25)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
        {t({ bn: 'প্রিভিউ', en: 'Preview' })}
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="cg-css">CSS</label>
        <textarea id="cg-css" style={{ ...outputStyle, fontFamily: 'monospace' }} value={`${css}
${shadowCss}`} readOnly aria-readonly="true" />
      </div>
      <ButtonRow>
        <CopyButton text={`${css}
${shadowCss}`} />
      </ButtonRow>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        <label style={{ fontSize: 14 }}>{t({ bn: 'ছায়ার ঝাপসা', en: 'Shadow blur' })} {shadowBlur}px <input type="range" min={0} max={40} value={shadowBlur} onChange={(e) => setShadowBlur(Number(e.target.value))} /></label>
        <label style={{ fontSize: 14 }}>{t({ bn: 'ছায়ার নিচে', en: 'Shadow offset' })} {shadowY}px <input type="range" min={0} max={30} value={shadowY} onChange={(e) => setShadowY(Number(e.target.value))} /></label>
      </div>
    </section>
  );
}
