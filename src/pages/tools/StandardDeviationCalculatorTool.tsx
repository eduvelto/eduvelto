// Eduvelto — Standard Deviation Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: standardDeviationOf + parseNumberList in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { standardDeviationOf, parseNumberList } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

export function StandardDeviationCalculatorTool() {
  const { t } = useLanguage();
  const [list, setList] = useState('10, 12, 23, 23, 16, 23, 21, 16');
  const result = useMemo(() => {
    const values = parseNumberList(list);
    return values ? standardDeviationOf(values) : null;
  }, [list]);
  const clear = () => setList('');
  const loadExample = () => setList('10, 12, 23, 23, 16, 23, 21, 16');

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="পরিমিত ব্যবধান (স্ট্যান্ডার্ড ডেভিয়েশন) ক্যালকুলেটর" titleEn="Standard Deviation Calculator" descBn="একগুচ্ছ সংখ্যার পরিমিত ব্যবধান ও ভেদাঙ্ক বের করুন — সমগ্রক ও নমুনা দুইভাবেই।" descEn="Find the standard deviation and variance of a list of numbers — both population and sample versions." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="sd-list">{t({ bn: 'সংখ্যাগুলো', en: 'Numbers' })}</label>
        <textarea id="sd-list" style={inputStyle} value={list} onChange={(e) => setList(e.target.value)} placeholder="10, 12, 23, 23, 16, 23, 21, 16" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'পরিমিত ব্যবধান (সমগ্রক)', en: 'Standard deviation (population)' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.populationSd}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `নমুনা পরিমিত ব্যবধান: ${result.sampleSd === null ? '— (অন্তত ২টি মান দরকার)' : result.sampleSd}`, en: `Sample standard deviation: ${result.sampleSd === null ? '— (needs at least 2 values)' : result.sampleSd}` })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `গড়: ${result.mean} • সংখ্যার পরিমাণ: ${result.count}`, en: `Mean: ${result.mean} • Count: ${result.count}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'সমগ্রক ভেদাঙ্ক', labelEn: 'Population variance', value: `${result.populationVariance}` },
            { labelBn: 'নমুনা ভেদাঙ্ক', labelEn: 'Sample variance', value: result.sampleVariance === null ? '—' : `${result.sampleVariance}` },
            { labelBn: 'নমুনা পরিমিত ব্যবধান', labelEn: 'Sample SD', value: result.sampleSd === null ? '—' : `${result.sampleSd}` },
            { labelBn: 'গড়', labelEn: 'Mean', value: `${result.mean}` },
          ]} />
          <ButtonRow><CopyButton text={`Population SD ${result.populationSd}, sample SD ${result.sampleSd ?? 'n/a'}, mean ${result.mean}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'অন্তত একটি সঠিক সংখ্যা দিন — কমা, স্পেস বা নতুন লাইন দিয়ে আলাদা করুন।', en: 'Enter at least one valid number — separate them with commas, spaces or new lines.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'সমগ্রক হিসাবটি পুরো তালিকাকে সমগ্রক ধরে (n দিয়ে ভাগ), আর নমুনা হিসাবটি তালিকাকে একটি বড় দলের নমুনা ধরে (n−1 দিয়ে ভাগ)। নমুনা হিসাবে অন্তত ২টি মান লাগে।', en: 'The population figure treats the whole list as the population (divided by n); the sample figure treats it as a sample of a larger group (divided by n−1). The sample figure needs at least 2 values.' })}</p>
    </section>
  );
}
