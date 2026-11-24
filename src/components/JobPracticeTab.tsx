// Eduvelto — Job hub Practice tab (Step 8).
//
// Lists the exam's Published practice bundles (kind topic /
// previous) with "অনুশীলন শুরু করুন" → /jobs/practice/:bundleId.
// Empty bank ⇒ the same honest empty copy the hub showed before
// (no fake readiness). Signed-out visitors see the honest copy
// too — bundles are readable only when signed in (Step 7 rules).
//
// LANGUAGE: all UI text is Bangla (one-language rule).

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { Card, LinkButton, Reveal } from './ui';
import { useAuth } from '../lib/auth';
import { listPublishedPracticeBundles, type PracticeBundleWithId } from '../lib/jobPractice';
import type { JobExamDef } from '../lib/jobExams';

export default function JobPracticeTab({ def }: { def: JobExamDef }) {
  const { user } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const [loading, setLoading] = useState(true);
  const [bundles, setBundles] = useState<PracticeBundleWithId[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let alive = true;
    listPublishedPracticeBundles(def.slug)
      .then((list) => {
        if (alive) {
          setBundles(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user, def.slug]);

  if (loading) {
    return (
      <Reveal>
        <Card>
          <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>লোড হচ্ছে…</p>
        </Card>
      </Reveal>
    );
  }

  if (!user || bundles.length === 0) {
    return (
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>অনুশীলন প্রশ্ন তৈরি হচ্ছে</div>
          <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            টপিকভিত্তিক MCQ (উত্তর ও ব্যাখ্যাসহ) শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।
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
        {bundles.map((b, i) => (
          <Reveal key={b.docId} delayMs={i * 40}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{b.titleBn}</div>
              <p style={{ margin: '6px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                {b.questionCount}টি MCQ · {b.kind === 'previous' ? 'বিগত প্রশ্নের সেট' : 'টপিকভিত্তিক অনুশীলন'} · টাইমার নেই
              </p>
              <LinkButton to={`/jobs/practice/${b.docId}`} variant="accent">
                অনুশীলন শুরু করুন →
              </LinkButton>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <Card style={{ marginTop: 12 }}>
          <p style={{ margin: 0, color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            অনুশীলনে প্রতিটি প্রশ্নের পরেই সঠিক/ভুল ও ব্যাখ্যা দেখাবে। ফলাফলে লেখা থাকবে “অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়”।
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <Link to={`/jobs/${def.slug}/mocks`} style={{ fontWeight: 600 }}>
              মক টেস্ট দেখুন →
            </Link>
          </p>
        </Card>
      </Reveal>
    </>
  );
}
