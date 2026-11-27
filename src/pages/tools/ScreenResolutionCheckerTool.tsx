// Eduvelto — Screen Resolution Checker tool UI.
//
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools — this file is presentation only.
// All processing is 100% in-browser; nothing is uploaded.

import { useState, type CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, CopyButton, Tiles, ButtonRow, cardStyle, buttonStyle, noteStyle } from './toolUi';
import { useEffect } from 'react';
import { readScreenInfo, screenSummary, isCommonResolution, type ScreenInfo } from '../../lib/tools/screenResolution';


const resultStyle: CSSProperties = {
  marginTop: 14,
  padding: '18px 16px',
  borderRadius: 12,
  background: 'var(--teal-soft)',
  boxShadow: 'var(--shadow-sm)',
};

export function ScreenResolutionCheckerTool() {
  const { t } = useLanguage();
  const [info, setInfo] = useState<ScreenInfo | null>(null);
  useEffect(() => { setInfo(readScreenInfo()); }, []);
  const refresh = () => setInfo(readScreenInfo());
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="স্ক্রিন রেজোলিউশন চেকার" titleEn="Screen Resolution Checker" descBn="আপনার ডিভাইসের পর্দার রেজোলিউশন ও আকার দেখুন।" descEn="See the resolution and size of your device screen." chipBn="আপনার নিজের ডিভাইসের আসল তথ্য" chipEn="Your own device’s real data" />
      {info ? (
        <>
          <div style={resultStyle} role="status">
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{t({ bn: 'আপনার স্ক্রিন', en: 'Your screen' })}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{screenSummary(info)}</div>
            <div style={{ marginTop: 4, fontSize: 14 }}>{t({ bn: 'এটি এই ডিভাইসের আসল রেজোলিউশন — অনুমান নয়।', en: 'This is this device’s real resolution — not an estimate.' })}</div>
          </div>
          <Tiles items={[
            { labelBn: 'প্রস্থ', labelEn: 'Width', value: `${info.width}px` },
            { labelBn: 'উচ্চতা', labelEn: 'Height', value: `${info.height}px` },
            { labelBn: 'ব্যবহারযোগ্য', labelEn: 'Available', value: `${info.availWidth} × ${info.availHeight}` },
            { labelBn: 'রংয়ের গভীরতা', labelEn: 'Colour depth', value: `${info.colorDepth}-bit` },
            { labelBn: 'ডিভাইস পিক্সেল অনুপাত', labelEn: 'Pixel ratio', value: String(info.devicePixelRatio) },
            { labelBn: 'দিক', labelEn: 'Orientation', value: info.orientation },
          ]} />
          <p style={noteStyle}>{isCommonResolution(info)
            ? t({ bn: 'এটি একটি সাধারণ স্ক্রিন আকার।', en: 'This is a common screen size.' })
            : t({ bn: 'এটি সাধারণ আকারগুলোর মধ্যে পড়ে না।', en: 'This is not one of the most common screen sizes.' })}</p>
          <ButtonRow>
            <button type="button" style={buttonStyle} onClick={refresh}>{t({ bn: 'আবার দেখুন', en: 'Check again' })}</button>
            <CopyButton text={screenSummary(info)} />
          </ButtonRow>
        </>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t({ bn: 'স্ক্রিনের তথ্য পড়া যায়নি। ব্রাউজারে খুলে আবার চেষ্টা করুন।', en: 'Could not read the screen information. Open this in a browser and try again.' })}</p>
      )}
    </section>
  );
}
