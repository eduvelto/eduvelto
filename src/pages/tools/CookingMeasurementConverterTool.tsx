// Eduvelto — Cooking Measurement Converter (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle } from './toolUi';
import { convertCooking, COOKING_UNITS, COOKING_DENSITIES, formatConverted } from '../../lib/tools/converterTools';

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

export function CookingMeasurementConverterTool() {
  const { t } = useLanguage();
  const [value, setValue] = useState('1');
  const [from, setFrom] = useState('cup');
  const [to, setTo] = useState('gram');
  const [ingredient, setIngredient] = useState('water');

  const v = parseNum(value);
  const result = useMemo(() => (v !== null ? convertCooking(v, from, to, ingredient) : null), [v, from, to, ingredient]);
  const fromLabel = COOKING_UNITS.find((u) => u.id === from);
  const toLabel = COOKING_UNITS.find((u) => u.id === to);
  const tileItems = useMemo(() => {
    if (v === null) return [];
    return COOKING_UNITS.filter((u) => u.id !== from && u.id !== to).slice(0, 3).map((u) => {
      const cv = convertCooking(v, from, u.id, ingredient);
      return { labelBn: u.bn, labelEn: u.en, value: cv === null ? '—' : formatConverted(cv) };
    });
  }, [v, from, to, ingredient]);
  const swap = () => { setFrom(to); setTo(from); };
  const clear = () => setValue('');
  const loadExample = () => { setValue('1'); setFrom('cup'); setTo('gram'); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="রান্নার মাপ কনভার্টার" titleEn="Cooking Measurement Converter" descBn="কাপ, চামচ, মিলিলিটার ও গ্রামের মধ্যে রান্নার উপকরণের মাপ বদলান।" descEn="Convert cooking measures between cups, spoons, millilitres and grams." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="cooking-measurement-converter-value">{t({ bn: 'মান', en: 'Value' })}</label>
          <input id="cooking-measurement-converter-value" style={shortInputStyle} type="number" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="1" />
        </div>
        <div>
          <label style={labelStyle} htmlFor="cooking-measurement-converter-from">{t({ bn: 'থেকে', en: 'From' })}</label>
          <select id="cooking-measurement-converter-from" style={shortInputStyle} value={from} onChange={(e) => setFrom(e.target.value)}>
            {COOKING_UNITS.map((u) => (<option key={u.id} value={u.id}>{t({ bn: u.bn, en: u.en })}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="cooking-measurement-converter-to">{t({ bn: 'এতে', en: 'To' })}</label>
          <select id="cooking-measurement-converter-to" style={shortInputStyle} value={to} onChange={(e) => setTo(e.target.value)}>
            {COOKING_UNITS.map((u) => (<option key={u.id} value={u.id}>{t({ bn: u.bn, en: u.en })}</option>))}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="cooking-measurement-converter-ingredient">{t({ bn: 'উপকরণ (গ্রামের হিসাবে)', en: 'Ingredient (for gram conversions)' })}</label>
        <select id="cooking-measurement-converter-ingredient" style={shortInputStyle} value={ingredient} onChange={(e) => setIngredient(e.target.value)}>
          {Object.entries(COOKING_DENSITIES).map(([id, info]) => (<option key={id} value={id}>{t({ bn: info.bn, en: info.en })}</option>))}
        </select>
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
      <p style={noteStyle}>{t({ bn: 'গ্রামে বদলাতে উপকরণের ঘনত্ব লাগে — এখানে আনুমানিক ঘনত্ব ব্যবহার করা হয়েছে (পানি ১, ময়দা ০.৫৩, চিনি ০.৮৫, মধু ১.৪২ গ্রাম/মিলি)। রান্নায় হালকা পার্থক্য হতে পারে।', en: 'Converting to grams needs each ingredient’s density — approximate densities are used here (water 1, flour 0.53, sugar 0.85, honey 1.42 g/mL). Small differences in cooking are normal.' })}</p>
    </section>
  );
}
