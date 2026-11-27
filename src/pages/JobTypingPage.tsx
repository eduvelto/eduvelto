// Eduvelto — typing practice page (design §1.8).
//
// /jobs/grade-11-20/typing — the standalone typing simulator
// (also embedded in the post-family pages that need it).

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import ShareButton from '../components/ShareButton';
import JobTypingSimulator from '../components/JobTypingSimulator';
import { useLanguage } from '../i18n/LanguageContext';

export default function JobTypingPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="টাইপিং অনুশীলন" titleEn="Typing practice" wide maxWidth={1240}>
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/jobs/grade-11-20" style={{ fontWeight: 600 }}>
          {t({ bn: '← সরকারি চাকরি (১১–২০ গ্রেড)', en: '← Government Jobs (Grades 11–20)' })}
        </Link>
      </p>
      <div style={{ margin: '0 0 16px' }}>
        <ShareButton />
      </div>
      <JobTypingSimulator />
    </PageShell>
  );
}
