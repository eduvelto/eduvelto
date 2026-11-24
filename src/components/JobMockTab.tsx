// Eduvelto — Job hub Mock Tests tab (Step 9).
//
// Lists the exam's Published full mock definitions (kind full)
// with "মক শুরু করুন" → /jobs/mock/:docId. Empty bank ⇒ the
// same honest empty copy the hub showed before (no fake
// readiness). Signed-out visitors see the LIST too — published
// definitions are readable without sign-in (Step 9 rules) — with
// "লগইন করে মক দিন" buttons instead of start buttons (D2).
//
// LANGUAGE: all UI text is Bangla (one-language rule).

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { Card, LinkButton, Reveal } from './ui';
import { useAuth } from '../lib/auth';
import type { JobExamDef } from '../lib/jobExams';
import { listPublishedMocks } from '../lib/jobMock';
import { jobMockPatternSummaryBn, type JobMockWithId } from '../lib/jobMocks';

export default function JobMockTab({ def }: { def: JobExamDef }) {
  const { user } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const [loading, setLoading] = useState(true);
  const [mocks, setMocks] = useState<JobMockWithId[]>([]);

  // D2: the list loads for EVERYONE — published definitions are
  // readable signed-out (Step 9 rules: read when published), so a
  // signed-out visitor must see a published mock instead of being
  // told "no mocks yet". Only STARTING a mock needs sign-in.
  useEffect(() => {
    let alive = true;
    listPublishedMocks({ examSlug: def.slug, kind: 'full' })
      .then((list) => {
        if (alive) {
          setMocks(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [def.slug]);

  if (loading) {
    return (
      <Reveal>
        <Card>
          <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
        </Card>
      </Reveal>
    );
  }

  if (mocks.length === 0) {
    return (
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>এখনো কোনো মক তৈরি হয়নি</div>
          <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            আসল ধরনে সময়ভিত্তিক পূর্ণ মক (নম্বর, সময়, নেগেটিভ মার্কিং) প্রশ্ন ব্যাংক প্রস্তুত হলে এখানে আসবে।
          </p>
          {!user ? (
            <p style={{ margin: 0 }}>
              <Link to="/login" state={back} style={{ fontWeight: 600 }}>
                লগইন করুন →
              </Link>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              <Link to="/jobs/common" style={{ fontWeight: 600 }}>
                কমন প্রস্তুতি দেখুন →
              </Link>
            </p>
          )}
        </Card>
      </Reveal>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {mocks.map((m, i) => (
          <Reveal key={m.docId} delayMs={i * 40}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{m.titleBn}</div>
              <p style={{ margin: '6px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                {jobMockPatternSummaryBn(m.rulesSnapshot)}
                {m.rulesSnapshot.passPercent !== null ? ` · পাস ${m.rulesSnapshot.passPercent}%` : ''}
              </p>
              {user ? (
                <LinkButton to={`/jobs/mock/${m.docId}`} variant="accent">
                  মক শুরু করুন →
                </LinkButton>
              ) : (
                <LinkButton to="/login" state={back} variant="accent">
                  লগইন করে মক দিন →
                </LinkButton>
              )}
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <Card style={{ marginTop: 12 }}>
          <p style={{ margin: 0, color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            মক সময়ভিত্তিক — শুরু হলে সময় আর থামবে না। ফলাফলে লেখা থাকবে “অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়”।
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <Link to="/jobs/common" style={{ fontWeight: 600 }}>
              দৈনিক ও সাপ্তাহিক মক দেখুন →
            </Link>
          </p>
        </Card>
      </Reveal>
    </>
  );
}
