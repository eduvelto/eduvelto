// Eduvelto — Shoe Size Converter (Converters batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Standard US/UK/EU/JP size charts; sizes vary by brand — results are approximate.
// 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { SHOE_SIZE_MEN, SHOE_SIZE_WOMEN, shoeSizeRow, type ShoeGender, type ShoeSystem } from '../../lib/tools/converterTools';

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

const SYSTEMS: Array<{ id: ShoeSystem; bn: string; en: string }> = [
  { id: 'us', bn: 'মার্কিন (US)', en: 'US' },
  { id: 'uk', bn: 'ব্রিটিশ (UK)', en: 'UK' },
  { id: 'eu', bn: 'ইউরোপীয় (EU)', en: 'EU' },
  { id: 'jp', bn: 'জাপানি (JP)', en: 'Japan (JP)' },
];

export function ShoeSizeConverterTool() {
  const { t } = useLanguage();
  const [gender, setGender] = useState<ShoeGender>('men');
  const [from, setFrom] = useState<ShoeSystem>('us');
  const [size, setSize] = useState('9');
  const table = gender === 'men' ? SHOE_SIZE_MEN : SHOE_SIZE_WOMEN;
  const sizeNum = Number(size);
  const row = useMemo(
    () => (Number.isFinite(sizeNum) ? shoeSizeRow(sizeNum, from, gender) : null),
    [sizeNum, from, gender],
  );
  const pickGender = (g: ShoeGender) => {
    setGender(g);
    setSize(g === 'men' ? '9' : '8');
  };
  const loadExample = () => { setGender('men'); setFrom('us'); setSize('9'); };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="জুতার সাইজ কনভার্টার" titleEn="Shoe Size Converter" descBn="মার্কিন, ব্রিটিশ, ইউরোপীয় ও জাপানি জুতার সাইজের মধ্যে বদলান।" descEn="Convert shoe sizes between US, UK, EU and Japanese systems." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" style={gender === 'men' ? activeButtonStyle : buttonStyle} onClick={() => pickGender('men')}>{t({ bn: 'পুরুষ', en: "Men's" })}</button>
        <button type="button" style={gender === 'women' ? activeButtonStyle : buttonStyle} onClick={() => pickGender('women')}>{t({ bn: 'নারী', en: "Women's" })}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="shoe-from">{t({ bn: 'কোন সাইজ থেকে', en: 'Size system' })}</label>
          <select id="shoe-from" style={shortInputStyle} value={from} onChange={(e) => setFrom(e.target.value as ShoeSystem)}>
            {SYSTEMS.map((s) => (<option key={s.id} value={s.id}>{t({ bn: s.bn, en: s.en })}</option>))}
          </select>
        </div>
        <div>
          <label style={labelStyle} htmlFor="shoe-size">{t({ bn: 'সাইজ', en: 'Size' })}</label>
          <select id="shoe-size" style={shortInputStyle} value={size} onChange={(e) => setSize(e.target.value)}>
            {table.map((r) => (<option key={r[from]} value={String(r[from])}>{r[from]}</option>))}
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
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: `${gender === 'men' ? 'পুরুষদের' : 'নারীদের'} ${size} (${from.toUpperCase()})`, en: `${gender === 'men' ? "Men's" : "Women's"} ${size} (${from.toUpperCase()})` })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{t({ bn: `EU ${row.eu} · UK ${row.uk} · JP ${row.jp}`, en: `EU ${row.eu} · UK ${row.uk} · JP ${row.jp}` })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `পায়ের আনুমানিক দৈর্ঘ্য ${row.cm} সেমি`, en: `Approximate foot length ${row.cm} cm` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'মার্কিন (US)', labelEn: 'US', value: String(row.us) },
            { labelBn: 'ব্রিটিশ (UK)', labelEn: 'UK', value: String(row.uk) },
            { labelBn: 'ইউরোপীয় (EU)', labelEn: 'EU', value: String(row.eu) },
            { labelBn: 'জাপানি (JP)', labelEn: 'Japan', value: String(row.jp) },
          ]} />
          <ButtonRow><CopyButton text={`${gender === 'men' ? "Men's" : "Women's"} shoe size ${size} ${from.toUpperCase()} = US ${row.us}, UK ${row.uk}, EU ${row.eu}, JP ${row.jp}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'তালিকায় এই সাইজটি নেই — ওপরের তালিকা থেকে একটি সাইজ বেছে নিন।', en: 'That size is not in the chart — pick a size from the list above.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'সাইজ ব্র্যান্ডভেদে আলাদা হতে পারে — এটি স্ট্যান্ডার্ড সাইজ চার্টের আনুমানিক মান। কেনার আগে ব্র্যান্ডের নিজের সাইজ চার্ট দেখে নিন, আর সম্ভব হলে পায়ের দৈর্ঘ্য (সেমি) মিলিয়ে কিনুন।', en: 'Sizes vary by brand — these are approximate values from standard size charts. Check the brand’s own chart before buying, and match by foot length (cm) when you can.' })}</p>
    </section>
  );
}
