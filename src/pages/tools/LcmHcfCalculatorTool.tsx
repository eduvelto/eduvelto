// Eduvelto — LCM & HCF Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: lcmHcfOf + parseNumberList in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { lcmHcfOf, parseNumberList } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

export function LcmHcfCalculatorTool() {
  const { t } = useLanguage();
  const [list, setList] = useState('12, 18, 24');
  const result = useMemo(() => {
    const values = parseNumberList(list);
    return values ? lcmHcfOf(values) : null;
  }, [list]);
  const clear = () => setList('');
  const loadExample = () => setList('12, 18, 24');

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="লসাগু ও গসাগু ক্যালকুলেটর" titleEn="LCM & HCF Calculator" descBn="দুই বা ততোধিক সংখ্যার লসাগু (LCM) ও গসাগু (HCF/GCD) বের করুন।" descEn="Find the LCM and HCF (GCD) of two or more numbers." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="lcm-list">{t({ bn: 'সংখ্যাগুলো (কমা দিয়ে আলাদা করুন)', en: 'Numbers (separate with commas)' })}</label>
        <textarea id="lcm-list" style={inputStyle} value={list} onChange={(e) => setList(e.target.value)} placeholder="12, 18, 24" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'লসাগু (LCM)', en: 'LCM' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.lcm}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `গসাগু (HCF): ${result.hcf}`, en: `HCF (GCD): ${result.hcf}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'লসাগু', labelEn: 'LCM', value: `${result.lcm}` },
            { labelBn: 'গসাগু', labelEn: 'HCF (GCD)', value: `${result.hcf}` },
            { labelBn: 'সংখ্যার পরিমাণ', labelEn: 'Count', value: `${result.count}` },
          ]} />
          <ButtonRow><CopyButton text={`LCM ${result.lcm}, HCF ${result.hcf} of ${list}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'অন্তত ২টি পূর্ণসংখ্যা দিন (সর্বোচ্চ ১০টি, প্রতিটি ১০০ কোটির মধ্যে, ০ নয়)।', en: 'Enter at least 2 whole numbers (at most 10, each within 1 billion, none 0).' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'লসাগু হলো সব সংখ্যা দিয়ে ভাগ যায় এমন সবচেয়ে ছোট সংখ্যা; গসাগু হলো সব সংখ্যাকে ভাগ করে এমন সবচেয়ে বড় সংখ্যা।', en: 'The LCM is the smallest number divisible by all of them; the HCF is the largest number that divides all of them.' })}</p>
    </section>
  );
}
