// Eduvelto — Median & Mode Calculator tool UI (Math batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: medianModeOf + parseNumberList in src/lib/tools/mathTools.ts.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, CopyButton, ButtonRow, ClearButton, ExampleButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { medianModeOf, parseNumberList } from '../../lib/tools/mathTools';

const resultStyle: CSSProperties = { marginTop: 14, padding: '18px 16px', borderRadius: 12, background: 'var(--teal-soft)', boxShadow: 'var(--shadow-sm)' };
const errorStyle: CSSProperties = { marginTop: 14, color: '#b3261e', fontSize: 14 };

export function MedianModeCalculatorTool() {
  const { t } = useLanguage();
  const [list, setList] = useState('4, 8, 6, 5, 3, 6, 9');
  const result = useMemo(() => {
    const values = parseNumberList(list);
    return values ? medianModeOf(values) : null;
  }, [list]);
  const clear = () => setList('');
  const loadExample = () => setList('4, 8, 6, 5, 3, 6, 9');

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="মধ্যমা ও প্রচুরক ক্যালকুলেটর" titleEn="Median & Mode Calculator" descBn="একগুচ্ছ সংখ্যার মধ্যমা (মাঝের মান) ও প্রচুরক (সবচেয়ে বেশি বার আসা মান) বের করুন।" descEn="Find the median (middle value) and mode (most frequent value) of a list of numbers." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="mm-list">{t({ bn: 'সংখ্যাগুলো', en: 'Numbers' })}</label>
        <textarea id="mm-list" style={inputStyle} value={list} onChange={(e) => setList(e.target.value)} placeholder="4, 8, 6, 5, 3, 6, 9" />
      </div>
      {result ? (
        <>
          <div style={resultStyle} role="status">
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>{t({ bn: 'মধ্যমা', en: 'Median' })}</p>
            <p style={{ margin: 0, fontSize: '2rem', fontFamily: 'var(--font-head)', color: 'var(--teal-deep)' }}>{result.median}</p>
            <p style={{ margin: '8px 0 0', fontSize: 15 }}>{t({ bn: `প্রচুরক: ${result.modes.length > 0 ? result.modes.join(', ') : 'নেই — কোনো সংখ্যাই একাধিকবার আসেনি'}`, en: `Mode: ${result.modes.length > 0 ? result.modes.join(', ') : 'none — no number repeats'}` })}</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--muted)' }}>{t({ bn: `সাজানো তালিকা: ${result.sorted.join(', ')}`, en: `Sorted list: ${result.sorted.join(', ')}` })}</p>
          </div>
          <Tiles items={[
            { labelBn: 'মধ্যমা', labelEn: 'Median', value: `${result.median}` },
            { labelBn: 'প্রচুরক', labelEn: 'Mode', value: result.modes.length > 0 ? result.modes.join(', ') : '—' },
            { labelBn: 'সংখ্যার পরিমাণ', labelEn: 'Count', value: `${result.count}` },
          ]} />
          <ButtonRow><CopyButton text={`Median ${result.median}, mode ${result.modes.length > 0 ? result.modes.join(', ') : 'none'}`} labelBn="ফলাফল কপি করুন" labelEn="Copy result" /><ClearButton onClear={clear} /><ExampleButton onLoad={loadExample} /></ButtonRow>
        </>
      ) : (
        <p style={errorStyle} role="alert">{t({ bn: 'অন্তত একটি সঠিক সংখ্যা দিন — কমা, স্পেস বা নতুন লাইন দিয়ে আলাদা করুন।', en: 'Enter at least one valid number — separate them with commas, spaces or new lines.' })}</p>
      )}
      <p style={noteStyle}>{t({ bn: 'মধ্যমা বের করতে সংখ্যাগুলো ছোট থেকে বড় সাজিয়ে মাঝেরটি নেওয়া হয়; জোড় সংখ্যক মান থাকলে মাঝের দুটির গড়ই মধ্যমা। একাধিক সংখ্যা সমান সর্বোচ্চ বার আসলে সবগুলোই প্রচুরক।', en: 'To find the median the numbers are sorted and the middle one is taken; with an even count the median is the mean of the middle two. If several numbers tie for the highest frequency, all of them are modes.' })}</p>
    </section>
  );
}
