import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, LinkButton } from '../components/ui';

// Study Routine (Phase 2, Step 7 — smart study planner) is NOT built yet.
// This page says so honestly instead of pretending the feature exists,
// and points the student at the library, exams and progress pages that
// do work today.

export default function RoutinePage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="পড়ার রুটিন" titleEn="Study Routine">
      <Card style={{ textAlign: 'center', padding: '28px 20px' }}>
        <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: 'var(--heading)', margin: '0 0 8px' }}>
          {t({ bn: 'পড়ার রুটিন এখনো তৈরি হয়নি', en: 'The study routine is not built yet' })}
        </h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 20px', lineHeight: 1.7 }}>
          {t({ bn: 'স্মার্ট পড়ার পরিকল্পনা এখনো তৈরি হয়নি — তৈরি হলে আপনার ক্লাস, বিষয় ও অগ্রগতি অনুযায়ী রুটিন সাজাবে। ততদিন নিচের পাতাগুলো ব্যবহার করুন।', en: 'A smart study plan is not built yet — when it is ready, it will arrange your routine according to your class, subjects and progress. Until then, use the pages below.' })}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <LinkButton to="/library" variant="primary">
            {t({ bn: 'লাইব্রেরি', en: 'Library' })}
          </LinkButton>
          <LinkButton to="/exam" variant="outline">
            {t({ bn: 'পরীক্ষা', en: 'Exams' })}
          </LinkButton>
          <LinkButton to="/progress" variant="outline">
            {t({ bn: 'অগ্রগতি', en: 'Progress' })}
          </LinkButton>
        </div>
      </Card>
    </PageShell>
  );
}
