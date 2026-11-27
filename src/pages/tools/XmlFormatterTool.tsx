// Eduvelto — XML Formatter tool UI (landed 27 Nov 2026, A-tools).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Engine: formatXml() + minifyXml() in src/lib/tools/docConverters.ts (hand-rolled tokenizer, no dependency). 100% in-browser; nothing is uploaded.
import { useMemo, useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import RewardedAdButton from '../../components/RewardedAdButton';
import {ToolHero, CopyButton, ButtonRow, ExampleButton, ClearButton, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { formatXml, minifyXml } from '../../lib/tools/docConverters';


const errorStyle: CSSProperties = {
  marginTop: 14,
  color: '#b3261e',
  fontSize: 14,
};



function downloadText(filename: string, text: string, type = 'text/plain'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


const SAMPLE_XML = '<note><to>Rahim</to><from>Karim</from><heading>Reminder</heading><body>Class starts at 10am.</body></note>';

export function XmlFormatterTool() {
  const { t, lang } = useLanguage();
  const [input, setInput] = useState(SAMPLE_XML);
  const [indent, setIndent] = useState(2);
  const [minify, setMinify] = useState(false);
  const result = useMemo(() => {
    try {
      if (minify) return { output: minifyXml(input).minified };
      return { output: formatXml(input, indent).formatted };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Invalid XML' };
    }
  }, [input, indent, minify]);

  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="XML ফরম্যাটার" titleEn="XML Formatter" descBn="XML সুন্দরভাবে সাজান বা ছোট করুন — ভুল থাকলে লাইন নম্বরসহ জানায়।" descEn="Pretty-print or minify XML — errors are reported with a line number." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="xf-input">{t({ bn: 'XML লেখা', en: 'XML text' })}</label>
        <textarea id="xf-input" style={{ ...inputStyle, minHeight: 160 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="<note><to>Rahim</to></note>" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput(SAMPLE_XML)} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
        <div>
          <label style={labelStyle} htmlFor="xf-indent">{t({ bn: 'ইনডেন্ট (ফাঁকা জায়গা)', en: 'Indent (spaces)' })}</label>
          <select id="xf-indent" style={inputStyle} value={indent} onChange={(e) => setIndent(Number(e.target.value))} disabled={minify}>
            <option value={2}>2</option>
            <option value={4}>4</option>
          </select>
        </div>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 15, marginTop: 18 }}>
          <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} />
          {t({ bn: 'ছোট করুন (মিনিফাই)', en: 'Minify' })}
        </label>
      </div>
      {'error' in result ? (
        <p style={errorStyle} role="alert">{result.error}</p>
      ) : (
        <>
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle} htmlFor="xf-output">{t({ bn: 'ফলাফল', en: 'Result' })}</label>
            <textarea id="xf-output" style={{ ...inputStyle, minHeight: 160 }} value={result.output} readOnly />
          </div>
          <ButtonRow>
            <CopyButton text={result.output} labelBn="ফলাফল কপি করুন" labelEn="Copy result" />
            {/* Ads rollout B3 (27 Nov 2026): this download goes through RewardedAdButton (15s) — Free Download is live, the 15s Unlock stays disabled until AdSense approval (never a fake timer). */}
            <RewardedAdButton lang={lang} durationSeconds={15} onFreeDownload={() => downloadText('eduvelto-formatted.xml', result.output, 'application/xml')} />
          </ButtonRow>
        </>
      )}
      <p style={noteStyle}>{t({ bn: 'কমেন্ট, CDATA ও &amp;-এর মতো এনটিটি হুবহু থাকে। বন্ধ না হওয়া ট্যাগ বা ভুল বন্ধ ট্যাগের ক্ষেত্রে কোন লাইনে সমস্যা তা জানানো হয় — শুধু “ভুল XML” বলা হয় না।', en: 'Comments, CDATA and entities like &amp; are kept verbatim. An unclosed or mismatched tag is reported with its line — never just “invalid XML”.' })}</p>
    </section>
  );
}
