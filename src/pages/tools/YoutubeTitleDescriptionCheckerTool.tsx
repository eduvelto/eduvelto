// Eduvelto — YouTube Title & Description Character Checker tool UI (Text batch, 27 Nov 2026).
// Limits: title 100 chars, description 5000 chars.
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useMemo, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, ClearButton, ExampleButton, shortInputStyle, inputStyle, labelStyle, cardStyle, noteStyle } from './toolUi';
import { checkYoutubeTitleDescription } from '../../lib/tools/textTools';

export function YoutubeTitleDescriptionCheckerTool() {
  const { t } = useLanguage();
  const [title, setTitle] = useState('My First Vlog in Cox\'s Bazar | Beautiful Beach');
  const [description, setDescription] = useState('Welcome to my channel! In this video I show you the beautiful beach of Cox\'s Bazar. Please like, comment and subscribe.');
  const result = useMemo(() => checkYoutubeTitleDescription(title, description), [title, description]);
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="ইউটিউব শিরোনাম ও বিবরণ অক্ষর পরীক্ষক" titleEn="YouTube Title & Description Checker" descBn="শিরোনাম ও বিবরণ ইউটিউবের অক্ষরসীমার মধ্যে আছে কি না দেখুন।" descEn="Check whether your title and description fit YouTube's character limits." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <div>
        <label style={labelStyle} htmlFor="yt-title">{t({ bn: 'ভিডিওর শিরোনাম', en: 'Video title' })}</label>
        <input id="yt-title" style={shortInputStyle} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My video title" />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={labelStyle} htmlFor="yt-desc">{t({ bn: 'ভিডিওর বিবরণ', en: 'Video description' })}</label>
        <textarea id="yt-desc" style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Video description" />
      </div>
      <ButtonRow>
        <ExampleButton onLoad={() => { setTitle('My First Vlog in Cox\'s Bazar | Beautiful Beach'); setDescription('Welcome to my channel! In this video I show you the beautiful beach of Cox\'s Bazar. Please like, comment and subscribe.'); }} />
        <ClearButton onClear={() => { setTitle(''); setDescription(''); }} disabled={title === '' && description === ''} />
      </ButtonRow>
      <Tiles items={[
        { labelBn: 'শিরোনাম: অক্ষর', labelEn: 'Title: characters', value: `${result.titleLength} / ${result.titleLimit}` },
        { labelBn: 'শিরোনাম: বাকি', labelEn: 'Title: remaining', value: result.titleOk ? String(result.titleRemaining) : t({ bn: `${-result.titleRemaining} বেশি`, en: `${-result.titleRemaining} over` }) },
        { labelBn: 'বিবরণ: অক্ষর', labelEn: 'Description: characters', value: `${result.descriptionLength} / ${result.descriptionLimit}` },
        { labelBn: 'বিবরণ: বাকি', labelEn: 'Description: remaining', value: result.descriptionOk ? String(result.descriptionRemaining) : t({ bn: `${-result.descriptionRemaining} বেশি`, en: `${-result.descriptionRemaining} over` }) },
      ]} />
      {!result.titleOk || !result.descriptionOk ? (
        <p style={{ color: '#b3261e', fontSize: 14, marginTop: 12 }}>{t({ bn: 'সীমা ছাড়িয়ে গেছে — ইউটিউব অতিরিক্ত অংশ ছেঁটে ফেলবে।', en: 'Over the limit — YouTube will cut off the extra part.' })}</p>
      ) : null}
      <p style={noteStyle}>{t({ bn: 'ইউটিউবের সীমা: শিরোনাম ১০০ অক্ষর, বিবরণ ৫০০০ অক্ষর। খোঁজের ফলে সাধারণত শিরোনামের প্রথম ৬০ অক্ষরই দেখা যায়।', en: 'YouTube limits: title 100 characters, description 5000 characters. In search results usually only the first 60 characters of the title show.' })}</p>
    </section>
  );
}
