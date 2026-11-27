// Eduvelto — structured tool guide renderer (27 Nov 2026, AdSense guides).
//
// Renders one entry from TOOL_GUIDE_SECTIONS (src/lib/toolsGuides.ts):
// title, intro, numbered how-to steps, the formula/rule, one worked
// example, and 3-5 FAQs — in the visitor's language (bn/en). Used by
// ToolsDetailPage for tools that have a structured guide; tools with
// only a legacy prose guide keep rendering that prose paragraph.
import type { CSSProperties } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { ToolGuideSections } from '../../lib/toolsGuides';

const sectionTitleStyle: CSSProperties = {
  fontSize: 20,
  margin: '28px 0 12px',
};

const bodyStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.75,
};

const faqQuestionStyle: CSSProperties = {
  fontSize: 16,
  margin: '16px 0 4px',
};

export default function ToolGuide({ guide }: { guide: ToolGuideSections }) {
  const { lang } = useLanguage();
  const content = guide[lang];
  const howToLabel = lang === 'en' ? 'How to use it' : 'কীভাবে ব্যবহার করবেন';
  const formulaLabel = lang === 'en' ? 'Formula' : 'সূত্র';
  const exampleLabel = lang === 'en' ? 'Worked example' : 'উদাহরণ';
  const faqLabel = lang === 'en' ? 'Frequently asked questions' : 'সচরাচর প্রশ্ন';

  return (
    <section aria-label={content.title}>
      <h2 style={sectionTitleStyle}>{content.title}</h2>
      <p style={bodyStyle}>{content.intro}</p>
      <h3 style={sectionTitleStyle}>{howToLabel}</h3>
      <ol style={bodyStyle}>
        {content.howTo.map((step) => (
          <li key={step.slice(0, 24)}>{step}</li>
        ))}
      </ol>
      <h3 style={sectionTitleStyle}>{formulaLabel}</h3>
      <p style={bodyStyle}>{content.formula}</p>
      <h3 style={sectionTitleStyle}>{exampleLabel}</h3>
      <p style={bodyStyle}>{content.example}</p>
      <h3 style={sectionTitleStyle}>{faqLabel}</h3>
      {content.faq.map((item) => (
        <div key={item.q.slice(0, 24)}>
          <h4 style={faqQuestionStyle}>{item.q}</h4>
          <p style={bodyStyle}>{item.a}</p>
        </div>
      ))}
    </section>
  );
}
