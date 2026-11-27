// Eduvelto — Pressure Converter (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle } from './toolUi';
import { convertPressure, PRESSURE_UNITS, formatConverted } from '../../lib/tools/converterTools';

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

export function PressureConverterTool() {
  const { t } = useLanguage();
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState('atmosphere');
  const [to, setTo] = useState('psi');

  const v = parseNum(value);
  const result = useMemo(() => (v !== null ? convertPressure(v, from, to) : null), [v, from, to]);
  const fromLabel = PRESSURE_UNITS.find((u) => u.id === from);
  const toLabel = PRESSURE_UNITS.find((u) => u.id === to);
  const tileItems = useMemo(() => {
    if (v === null) return [];
    return PRESSURE_UNITS.filter((u) => u.id !== from && u.id !== to).slice(0, 3).map((u) => {
      const cv = convertPressure(v, from, u.id);
      return { labelBn: u.bn, labelEn: u.en, value: cv === null ? '—' : formatConverted(cv) };
    });
  }, [v, from, to]);
  const swap = () => { setFrom(to); setTo(from); };
  const clear = () => setValue('');
  const loadExample = () => { setValue('1'); setFrom('atmosphere'); setTo('psi'); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="চাপ কনভার্টার" titleEn="Pressure Converter" descBn="প্যাসকেল, বার, psi, atm ও mmHg-এর মধ্যে চাপের একক বদলান।" descEn="Convert pressure between pascals, bar, psi, atm and mmHg." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="pressure-converter-value">{t({ bn: 'মান', en: 'Value' })}</label>
          <input id="pressure-converter-value" style={shortInputStyle} type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="pressure-converter-from">{t({ bn: 'থেকে', en: 'From' })}</label>
          <select id="pressure-converter-from" style={shortInputStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
            {PRESSURE_UNITS.map((u) => (<option key={u.id} value={u.id}>{t({ bn: u.bn, en: u.en })}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="pressure-converter-to">{t({ bn: 'এতে', en: 'To' })}</label>
          <select id="pressure-converter-to" style={shortInputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
            {PRESSURE_UNITS.map((u) => (<option key={u.id} value={u.id}>{t({ bn: u.bn, en: u.en })}</option>))}
          </select>
        </div>
      </div>

      <ButtonRow>
        <button type="button" style={buttonStyle} onClick={swap}>{t({ bn: '⇄ অদলবদল করুন', en: '⇄ Swap' })}</button>
        <ClearButton onClear={clear} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {result !== null && v !== null ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${formatConverted(v)} ${fromLabel ? fromLabel.bn : ''} =`, en: `${formatConverted(v)} ${fromLabel ? fromLabel.en : ''} =` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{formatConverted(result)} {toLabel ? t({ bn: toLabel.bn, en: toLabel.en }) : ''}</p>
          </div>
          <Tiles items={tileItems} />
          <ButtonRow><CopyButton text={`${formatConverted(v)} ${fromLabel ? fromLabel.en : ''} = ${formatConverted(result)} ${toLabel ? toLabel.en : ''}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'সঠিক মান দিন — সংখ্যা লিখুন এবং একক বেছে নিন।', en: 'Enter a valid number and pick both units.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: '১ atm = ১০১৩২৫ Pa = ১৪.৭ psi; টায়ারের চাপ সাধারণত psi-তে মাপা হয়।', en: '1 atm = 101325 Pa = 14.7 psi; tyre pressure is usually measured in psi.' })}</p>
    </section>
  );
}
