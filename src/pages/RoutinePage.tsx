import { PageShell } from '../components/PageShell';
import { Card, LinkButton } from '../components/ui';

// Study Routine (Phase 2, Step 7 — smart study planner) is NOT built yet.
// This page says so honestly instead of pretending the feature exists,
// and points the student at the library, exams and progress pages that
// do work today.

export default function RoutinePage() {
  return (
    <PageShell titleBn="পড়ার রুটিন" titleEn="Study Routine">
      <Card style={{ textAlign: 'center', padding: '28px 20px' }}>
        <h2 style={{ fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif", fontSize: 20, color: '#0A1F44', margin: '0 0 8px' }}>
          পড়ার রুটিন শীঘ্রই আসছে / Study routine coming soon
        </h2>
        <p style={{ color: '#5A6478', margin: '0 0 20px', lineHeight: 1.7 }}>
          স্মার্ট পড়ার পরিকল্পনা তৈরি হচ্ছে — আপনার ক্লাস, বিষয় ও অগ্রগতি অনুযায়ী রুটিন সাজাবে।
          ততদিন নিচের পাতাগুলো ব্যবহার করুন।
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          <LinkButton to="/library" variant="primary">
            লাইব্রেরি / Library
          </LinkButton>
          <LinkButton to="/exam" variant="outline">
            পরীক্ষা / Exams
          </LinkButton>
          <LinkButton to="/progress" variant="outline">
            অগ্রগতি / Progress
          </LinkButton>
        </div>
      </Card>
    </PageShell>
  );
}
