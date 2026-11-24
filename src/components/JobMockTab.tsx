// Eduvelto — Job hub Mock Tests tab (Step 9).
//
// Lists the exam's Published full mock definitions (kind full)
// with "মক শুরু করুন" → /jobs/mock/:docId. Empty bank ⇒ the
// same honest empty copy the hub showed before (no fake
// readiness). Signed-out visitors see the LIST too — published
// definitions are readable without sign-in (Step 9 rules) — with
// "লগইন করে মক দিন" buttons instead of start buttons (D2).
//
// LANGUAGE: UI text is Bangla + English via useLanguage(). Mock
// titles and pattern lines come from the lib's En variants.

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { Card, LinkButton, Reveal } from './ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import type { JobExamDef } from '../lib/jobExams';
import { listPublishedMocks } from '../lib/jobMock';
import { jobMockPatternSummary, type JobMockWithId } from '../lib/jobMocks';

export default function JobMockTab({ def }: { def: JobExamDef }) {
  const { user } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { t, lang } = useLanguage();
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
          <p style={{ margin: 0, color: '#57616A', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
        </Card>
      </Reveal>
    );
  }

  if (mocks.length === 0) {
    return (
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'এখনো কোনো মক তৈরি হয়নি', en: 'No mock has been created yet' })}</div>
          <p style={{ margin: '8px 0 12px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'আসল ধরনে সময়ভিত্তিক পূর্ণ মক (নম্বর, সময়, নেগেটিভ মার্কিং) প্রশ্ন ব্যাংক প্রস্তুত হলে এখানে আসবে।', en: 'A timed full mock in the real pattern (marks, time, negative marking) will appear here once the question bank is ready.' })}
          </p>
          {!user ? (
            <p style={{ margin: 0 }}>
              <Link to="/login" state={back} style={{ fontWeight: 600 }}>
                {t({ bn: 'লগইন করুন →', en: 'Log in →' })}
              </Link>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              <Link to="/jobs/common" style={{ fontWeight: 600 }}>
                {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
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
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{lang === 'bn' ? m.titleBn : m.titleEn}</div>
              <p style={{ margin: '6px 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                {jobMockPatternSummary(m.rulesSnapshot, undefined, lang)}
                {m.rulesSnapshot.passPercent !== null ? t({ bn: ` · পাস ${m.rulesSnapshot.passPercent}%`, en: ` · Pass ${m.rulesSnapshot.passPercent}%` }) : ''}
              </p>
              {user ? (
                <LinkButton to={`/jobs/mock/${m.docId}`} variant="accent">
                  {t({ bn: 'মক শুরু করুন →', en: 'Start the mock →' })}
                </LinkButton>
              ) : (
                <LinkButton to="/login" state={back} variant="accent">
                  {t({ bn: 'লগইন করে মক দিন →', en: 'Log in to take the mock →' })}
                </LinkButton>
              )}
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <Card style={{ marginTop: 12 }}>
          <p style={{ margin: 0, color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'মক সময়ভিত্তিক — শুরু হলে সময় আর থামবে না। ফলাফলে লেখা থাকবে “অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়”।', en: 'Mocks are timed — once started, the clock does not stop. The result will say "Practice result — not a recruitment exam result".' })}
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <Link to="/jobs/common" style={{ fontWeight: 600 }}>
              {t({ bn: 'দৈনিক ও সাপ্তাহিক মক দেখুন →', en: 'See daily and weekly mocks →' })}
            </Link>
          </p>
        </Card>
      </Reveal>
    </>
  );
}
