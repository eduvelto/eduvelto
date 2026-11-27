// Eduvelto — Slug Generator tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, ButtonRow, ClearButton, ExampleButton, shortInputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { generateSlug } from '../../lib/tools/textTools';

export function SlugGeneratorTool() {
  const { t } = useLanguage();
  const [input, setInput] = useState('আমার প্রথম ব্লগ পোস্ট ২০২৬');
  const slug = useMemo(() => generateSlug(input), [input]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="স্লাগ জেনারেটর" titleEn="Slug Generator" descBn="শিরোনাম থেকে URL-বান্ধব স্লাগ বানান — বাংলা শিরোনামও চলে।" descEn="Turn a title into a URL-friendly slug — Bangla titles work too." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="slug-input">{t({ bn: 'শিরোনাম', en: 'Title' })}</label>
        <input id="slug-input" style={shortInputStyle} value={input} onChange={(e) => setInput(e.target.value)} placeholder="আমার প্রথম ব্লগ পোস্ট ২০২৬" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => setInput('আমার প্রথম ব্লগ পোস্ট ২০২৬')} />
        <ClearButton onClear={() => setInput('')} disabled={input === ''} />
      </ButtonRow>
      <div>
        <label style={labelStyle} htmlFor="slug-output">{t({ bn: 'স্লাগ', en: 'Slug' })}</label>
        <input id="slug-output" style={shortInputStyle} value={slug} readOnly />
      </div>
      <ButtonRow>
        <CopyButton text={slug} disabled={slug === ''} labelBn="স্লাগ কপি করুন" labelEn="Copy slug" />
      </ButtonRow>
      <p style={noteStyle}>{t({ bn: 'ইংরেজি অক্ষর ছোট হাতের হয়, ফাঁকা হাইফেন হয়, যতিচিহ্ন বাদ যায়। বাংলা অক্ষর স্লাগে থাকে — ব্রাউজার URL-এ সেগুলো এনকোড করে দেখায়।', en: 'English letters become lowercase, spaces become hyphens, punctuation is dropped. Bangla letters stay in the slug — browsers show them encoded in the URL.' })}</p>
    </section>
  );
}
