// Eduvelto — Admin: schedule management
// (design §5.1 #11, §5.2).
//
// /admin/jobs/schedule — the schedule is derived from the weekly
// mock cycle + daily mock + 11–20 model-test calendar. A test goes
// on the schedule ONLY when it is published (publishedAt set) and
// matches the scheduled set (jobExamId, difficultyMix) — never a
// draft, never an off-cycle mock. The calendar is a view over
// published modelTests, not a second store.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card, Chip } from '../components/ui';
import { EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import { DAILY_MOCK, WEEKLY_MOCK_CYCLE } from '../lib/jobExams';
import { listPublishedMocks } from '../lib/jobMock';
import type { JobMockWithId } from '../lib/jobMocks';

export default function AdminJobSchedulePage() {
  const { t } = useLanguage();
  const [mocks, setMocks] = useState<JobMockWithId[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setMocks(null);
    setError(false);
    listPublishedMocks()
      .then((list) => {
        if (alive) setMocks(list);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'সময়সূচি ব্যবস্থাপনা', en: 'Schedule Management' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'সময়সূচিতে শুধু প্রকাশিত মক ওঠে — খসড়া কখনো নয়। সাপ্তাহিক চক্রের নিয়ম ভঙ্গ করা যাবে না: একই পরীক্ষার সেট দুইবার যাবে না, অফ-সাইকেল মক যাবে না।',
          en: 'Only published mocks go on the schedule — never a draft. The weekly-cycle rules cannot be broken: the same exam set never runs twice, and off-cycle mocks never run.',
        })}
      </p>

      <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>
        {t({ bn: 'সাপ্তাহিক মক চক্র', en: 'Weekly mock cycle' })}
      </h2>
      <div style={{ display: 'grid', gap: 10 }}>
        {WEEKLY_MOCK_CYCLE.map((examSlug, i) => (
          <Card key={examSlug}>
            <strong>
              {t({
                bn: `সপ্তাহের ${i + 1} নম্বর মক — ${examSlug}`,
                en: `Week mock ${i + 1} — ${examSlug}`,
              })}
            </strong>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
              {t({ bn: 'চক্র: বিসিএস → ব্যাংক → প্রাথমিক → এনটিআরসিএ', en: 'Cycle: BCS → Bank → Primary → NTRCA' })}
            </div>
          </Card>
        ))}
      </div>

      <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>
        {t({ bn: 'দৈনিক মক', en: 'Daily mock' })}
      </h2>
      <Card>
        <strong>{t({ bn: 'দৈনিক মক', en: 'Daily mock' })}</strong>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
          {t({ bn: `${DAILY_MOCK.sizeBn} · ${DAILY_MOCK.timeBn}`, en: `${DAILY_MOCK.sizeEn} · ${DAILY_MOCK.timeEn}` })}
        </div>
      </Card>

      <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>
        {t({ bn: 'প্রকাশিত মক (সময়সূচিতে উঠবে)', en: 'Published mocks (go on the schedule)' })}
      </h2>
      {error ? (
        <AlertBox tone="error" onRetry={() => setNonce((x) => x + 1)}>
          {t({ bn: 'তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not load the data. Try again.' })}
        </AlertBox>
      ) : mocks === null ? (
        <LoadingBox />
      ) : mocks.length === 0 ? (
        <EmptyAdminBox
          bn="এখনো কোনো মক প্রকাশিত হয়নি — সময়সূচি খালি। প্রথমে মক তৈরি করে প্রকাশ করুন।"
          en="No mock is published yet — the schedule is empty. Create and publish a mock first."
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {mocks.map((m) => (
            <Card key={m.docId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>{m.titleBn}</strong>
                <Chip tone="blue">{m.examSlug}</Chip>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                {m.kind} · {m.scheduleDate ?? t({ bn: 'তারিখ নেই', en: 'no date' })}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/admin/jobs">{t({ bn: '← চাকরি ব্যবস্থাপনা', en: '← Job Management' })}</Link>
      </p>
    </div>
  );
}
