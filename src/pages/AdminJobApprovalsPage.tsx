// Eduvelto — Admin: approval queue
// (design §5.1 #9, §5.3).
//
// /admin/jobs/approvals — the three-level publication model:
//   Level 1 Verified — scored mocks + analytics;
//   Level 2 Reviewed — practice only, never scored;
//   Level 3 Draft — not scored, not in bundles.
// NO self-approval ever (author ≠ verifier ≠ publisher); every
// decision writes an audit entry on the doc. A question with an
// open correction request is blocked from new bundles until
// resolved (correction requests are first-class).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card } from '../components/ui';
import { EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import { listAdminJobQuestions, listAdminWrittenQuestions, type AdminListItem } from '../lib/jobAdminJobs';

export default function AdminJobApprovalsPage() {
  const { t } = useLanguage();
  const [mcq, setMcq] = useState<AdminListItem[] | null>(null);
  const [written, setWritten] = useState<AdminListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setMcq(null);
    setWritten(null);
    setError(false);
    Promise.all([
      listAdminJobQuestions({ reviewStatus: 'Under Review' }),
      listAdminWrittenQuestions({ reviewStatus: 'Under Review' }),
    ])
      .then(([m, w]) => {
        if (alive) {
          setMcq(m);
          setWritten(w);
        }
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [nonce]);

  const pending = (mcq?.length ?? 0) + (written?.length ?? 0);
  const loading = mcq === null || written === null;

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'অনুমোদনের সারি', en: 'Approval Queue' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'তিন স্তর: Level 1 যাচাইকৃত (স্কোর মক + বিশ্লেষণ) · Level 2 পর্যালোচিত (শুধু অনুশীলন, স্কোর নয়) · Level 3 খসড়া (প্রকাশ নয়)। নিজের লেখা নিজে অনুমোদন করা যাবে না — যাচাইকারী ≠ লেখক, প্রকাশক ≠ যাচাইকারী।',
          en: 'Three levels: Level 1 Verified (scored mocks + analytics) · Level 2 Reviewed (practice only, never scored) · Level 3 Draft (not published). No self-approval — verifier ≠ author, publisher ≠ verifier.',
        })}
      </p>
      {error ? (
        <AlertBox tone="error" onRetry={() => setNonce((x) => x + 1)}>
          {t({ bn: 'তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not load the data. Try again.' })}
        </AlertBox>
      ) : loading ? (
        <LoadingBox />
      ) : pending === 0 ? (
        <EmptyAdminBox
          bn="অনুমোদনের সারি খালি — যাচাইয়ের অপেক্ষায় কোনো প্রশ্ন নেই।"
          en="The approval queue is empty — no questions awaiting review."
        />
      ) : (
        <>
          <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>
            {t({ bn: `MCQ — যাচাইয়ের অপেক্ষায় (${mcq?.length ?? 0})`, en: `MCQ — awaiting review (${mcq?.length ?? 0})` })}
          </h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {(mcq ?? []).map((item) => (
              <Card key={item.docId}>
                <strong style={{ fontSize: 15 }}>{item.titleBn}</strong>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{item.docId}</div>
              </Card>
            ))}
          </div>
          <h2 style={{ fontSize: 16, margin: '16px 0 8px' }}>
            {t({ bn: `লিখিত — যাচাইয়ের অপেক্ষায় (${written?.length ?? 0})`, en: `Written — awaiting review (${written?.length ?? 0})` })}
          </h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {(written ?? []).map((item) => (
              <Card key={item.docId}>
                <strong style={{ fontSize: 15 }}>{item.titleBn}</strong>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{item.docId}</div>
              </Card>
            ))}
          </div>
        </>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/admin/jobs">{t({ bn: '← চাকরি ব্যবস্থাপনা', en: '← Job Management' })}</Link>
      </p>
    </div>
  );
}
