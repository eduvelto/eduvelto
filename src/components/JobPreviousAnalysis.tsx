// Eduvelto — previous-question analysis panel (design §4).
//
// The three concepts are kept apart (§4.1): previous-question
// analysis / high-priority topics / probable-question model test.
// With 0 verified previous questions today, EVERY exam is at
// Evidence Level C (§4.5): no rankings, no probability estimates.
// Practice is built from the verified syllabus instead, labelled
// "সিলেবাস-ভিত্তিক অগ্রাধিকার — বিগত প্রশ্নের তথ্য এখনো নেই".
//
// This panel renders under the hub's existing previous-tab empty
// state (TAB_EMPTY.previous copy, reused verbatim). It never
// manufactures a historical trend and never shows a "% chance".

import { Link } from 'react-router-dom';
import { Card, LinkButton, Reveal } from './ui';
import { useLanguage } from '../i18n/LanguageContext';
import { LEVEL_C_LABEL, ANALYSIS_NOTICE } from '../lib/jobTopicAnalytics';

export default function JobPreviousAnalysis({ examSlug }: { examSlug: string }) {
  const { t } = useLanguage();
  return (
    <Reveal>
      <Card style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
          {t({ bn: 'বিগত প্রশ্নের বিশ্লেষণ', en: 'Previous-question analysis' })}
        </div>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {t({ bn: LEVEL_C_LABEL.bn, en: LEVEL_C_LABEL.en })}
        </p>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {t({ bn: ANALYSIS_NOTICE.bn, en: ANALYSIS_NOTICE.en })}
        </p>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {t({
            bn: 'যা এখানে আছে: সিলেবাস-ভিত্তিক বিষয়ভিত্তিক MCQ অনুশীলন, অসুবিধা-ভারসাম্যপূর্ণ মডেল টেস্ট, লিখিত অনুশীলন। যা এখানে নেই: বিগত প্রশ্নের ধারা, "ঘনঘন আসে" এমন দাবি, কোনো সম্ভাবনার সংখ্যা।',
            en: 'What is here: syllabus-based subject-wise MCQ practice, difficulty-balanced model tests, written practice. What is not here: previous-question trends, any "frequently asked" claim, any probability number.',
          })}
        </p>
        <p style={{ margin: '12px 0 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <LinkButton to="/jobs/common" variant="accent">
            {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
          </LinkButton>
          <Link to={`/jobs/${examSlug}/written`} style={{ fontWeight: 600, alignSelf: 'center' }}>
            {t({ bn: 'লিখিত প্রস্তুতি →', en: 'Written preparation →' })}
          </Link>
        </p>
      </Card>
    </Reveal>
  );
}
