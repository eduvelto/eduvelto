// Eduvelto — Clothing Size Converter (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Standard XS–XXL ↔ US/UK/EU chart; sizes vary by brand — approximate.
// 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { CLOTHING_SIZE_MEN, CLOTHING_SIZE_WOMEN, clothingSizeRow, type ClothingSystem, type ShoeGender } from '../../lib/tools/converterTools';

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

const SYSTEMS: Array<{ id: ClothingSystem; bn: string; en: string }> = [
  { id: 'label', bn: 'লেটার সাইজ (XS–XXL)', en: 'Letter size (XS–XXL)' },
  { id: 'us', bn: 'মার্কিন (US)', en: 'US' },
  { id: 'uk', bn: 'ব্রিটিশ (UK)', en: 'UK' },
  { id: 'eu', bn: 'ইউরোপীয় (EU)', en: 'EU' },
];

export function ClothingSizeConverterTool() {
  const { t } = useLanguage();
  const [gender, setGender] = useState<ShoeGender>('men');
  const [from, setFrom] = useState<ClothingSystem>('label');
  const [size, setSize] = useState('M');
  const table = gender === 'men' ? CLOTHING_SIZE_MEN : CLOTHING_SIZE_WOMEN;
  const row = useMemo(() => (size.trim() === '' ? null : clothingSizeRow(size, from, gender)), [size, from, gender]);
  const pickGender = (g: ShoeGender) => { setGender(g); setSize('M'); };
  const loadExample = () => { setGender('men'); setFrom('label'); setSize('M'); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পোশাকের সাইজ কনভার্টার" titleEn="Clothing Size Converter" descBn="XS–XXL লেটার সাইজ ও US/UK/EU নম্বর সাইজের মধ্যে বদলান।" descEn="Convert between XS–XXL letter sizes and US/UK/EU number sizes." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={gender === 'men' ? activeButtonStyle : buttonStyle} onClick={() => pickGender('men')}>{t({ bn: 'পুরুষ', en: "Men's" })}</button>
        <button type="button" style={gender === 'women' ? activeButtonStyle : buttonStyle} onClick={() => pickGender('women')}>{t({ bn: 'নারী', en: "Women's" })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="clothing-from">{t({ bn: 'কোন সাইজ থেকে', en: 'Size system' })}</label>
          <select id="clothing-from" style={shortInputStyle} value={from} onChange={(e) => { setFrom(e.target.value as ClothingSystem); setSize(''); }}>
            {SYSTEMS.map((s) => (<option key={s.id} value={s.id}>{t({ bn: s.bn, en: s.en })}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="clothing-size">{t({ bn: 'সাইজ', en: 'Size' })}</label>
          <select id="clothing-size" style={shortInputStyle} value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="">{t({ bn: 'বেছে নিন', en: 'Choose' })}</option>
            {table.map((r) => (<option key={r[from]} value={r[from]}>{r[from]}</option>))}
          </select>
        </div>
      </div>
      <ButtonRow>
        <ClearButton onClear={() => setSize('')} />
        <ExampleButton onLoad={loadExample} />
      </ButtonRow>
      {row ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${gender === 'men' ? 'পুরুষদের' : 'নারীদের'} সাইজ ${size}`, en: `${gender === 'men' ? "Men's" : "Women's"} size ${size}` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{row.label} · US {row.us} · UK {row.uk} · EU {row.eu}</p>
          </div>
          <Tiles items={[
            { labelBn: 'লেটার সাইজ', labelEn: 'Letter size', value: row.label },
            { labelBn: 'মার্কিন (US)', labelEn: 'US', value: row.us },
            { labelBn: 'ব্রিটিশ (UK)', labelEn: 'UK', value: row.uk },
            { labelBn: 'ইউরোপীয় (EU)', labelEn: 'EU', value: row.eu },
          ]} />
          <ButtonRow><CopyButton text={`${gender === 'men' ? "Men's" : "Women's"} clothing size ${size} = ${row.label}, US ${row.us}, UK ${row.uk}, EU ${row.eu}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'একটি সাইজ বেছে নিন।', en: 'Pick a size.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'পোশাকের সাইজ ব্র্যান্ডভেদে অনেক আলাদা হয় — এটি স্ট্যান্ডার্ড চার্টের আনুমানিক মান। নারীদের US/UK সাইজ এখানে রেঞ্জ হিসেবে দেওয়া হয়েছে (যেমন ৮–১০)। কেনার আগে ব্র্যান্ডের সাইজ চার্ট ও বুক/কোমরের মাপ মিলিয়ে নিন।', en: 'Clothing sizes vary a lot by brand — these are approximate values from a standard chart. Women’s US/UK sizes are shown as ranges (e.g. 8–10). Check the brand’s chart and your chest/waist measurements before buying.' })}</p>
    </section>
  );
}
