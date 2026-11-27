// Eduvelto — Average (Mean) Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: averageOf + parseNumberList in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { averageOf, parseNumberList } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

export function AverageCalculatorTool() {
  const { t } = useLanguage();
  const [list, setList] = useState('10, 20, 30, 40, 50');
  const result = useMemo(() => {
    const values = parseNumberList(list);
    return values ? averageOf(values) : null;
  }, [list]);
  const clear = () => setList('');
  const loadExample = () => setList('10, 20, 30, 40, 50');

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="গড় (গাণিতিক গড়) ক্যালকুলেটর" titleEn="Average (Mean) Calculator" descBn="কয়েকটি সংখ্যার গড় বের করুন — কমা, স্পেস বা নতুন লাইনে সংখ্যাগুলো লিখুন।" descEn="Find the mean of a list of numbers — separate them with commas, spaces or new lines." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="avg-list">{t({ bn: 'সংখ্যাগুলো', en: 'Numbers' })}</label>
        <textarea id="avg-list" style={inputStyle} value={list} onChange={(e) => setList(e.target.value)} placeholder="10, 20, 30, 40, 50" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'গড়', en: 'Mean' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.mean}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সূত্র: সব সংখ্যার যোগফল ÷ সংখ্যার পরিমাণ = ${result.sum} ÷ ${result.count}`, en: `Formula: sum of all numbers ÷ count = ${result.sum} ÷ ${result.count}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'যোগফল', labelEn: 'Sum', value: `${result.sum}` },
            { labelBn: 'সংখ্যার পরিমাণ', labelEn: 'Count', value: `${result.count}` },
            { labelBn: 'সবচেয়ে ছোট', labelEn: 'Smallest', value: `${result.min}` },
            { labelBn: 'সবচেয়ে বড়', labelEn: 'Largest', value: `${result.max}` },
          ]} />
          <ButtonRow><CopyButton text={`Mean ${result.mean} (sum ${result.sum}, count ${result.count})`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'অন্তত একটি সঠিক সংখ্যা দিন — কমা, স্পেস বা নতুন লাইন দিয়ে আলাদা করুন।', en: 'Enter at least one valid number — separate them with commas, spaces or new lines.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'গড় হলো সব সংখ্যার যোগফলকে সংখ্যার পরিমাণ দিয়ে ভাগ করলে যা পাওয়া যায়। মধ্যমা বা প্রচুরক জানতে মধ্যমা ও প্রচুরক ক্যালকুলেটর দেখুন।', en: 'The mean is the sum of all numbers divided by how many there are. For the median or mode, see the median & mode calculator.' })}</p>
    </section>
  );
}
