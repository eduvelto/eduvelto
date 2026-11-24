// Eduvelto — Job hub Practice tab (Step 8).
//
// Lists the exam's Published practice bundles (kind topic /
// previous) with "অনুশীলন শুরু করুন" → /jobs/practice/:bundleId.
// Empty bank ⇒ the same honest empty copy the hub showed before
// (no fake readiness). Signed-out visitors see the honest copy
// too — bundles are readable only when signed in (Step 7 rules).
//
// LANGUAGE: UI follows the selected language (24 Nov 2026 language system).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, LinkButton, Reveal } from './ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { listPublishedPracticeBundles, type PracticeBundleWithId } from '../lib/jobPractice';
import type { JobExamDef } from '../lib/jobExams';

export default function JobPracticeTab({ def }: { def: JobExamDef }) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
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
          <p style={{ margin: 0, color: '#68747B', fontSize: 14 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
        </Card>
      </Reveal>
    );
  }

  if (!user || bundles.length === 0) {
    return (
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'অনুশীলন প্রশ্ন তৈরি হচ্ছে', en: 'Practice questions are being prepared' })}</div>
          <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'টপিকভিত্তিক MCQ (উত্তর ও ব্যাখ্যাসহ) শিক্ষক যাচাইয়ের পর প্রকাশিত হবে।', en: 'Topic-wise MCQs (with answers and explanations) will be published after teacher review.' })}
          </p>
          {!user ? (
            <p style={{ margin: 0 }}>
              <Link to="/login" style={{ fontWeight: 600 }}>
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
        {bundles.map((b, i) => (
          <Reveal key={b.docId} delayMs={i * 40}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 16 }}>{lang === 'bn' ? b.titleBn : b.titleEn}</div>
              <p style={{ margin: '6px 0 10px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: `${b.questionCount}টি MCQ · ${b.kind === 'previous' ? 'বিগত প্রশ্নের সেট' : 'টপিকভিত্তিক অনুশীলন'} · টাইমার নেই`, en: `${b.questionCount} MCQs · ${b.kind === 'previous' ? 'Previous-question set' : 'Topic-wise practice'} · No timer` })}
              </p>
              <LinkButton to={`/jobs/practice/${b.docId}`} variant="accent">
                {t({ bn: 'অনুশীলন শুরু করুন →', en: 'Start practice →' })}
              </LinkButton>
            </Card>
          </Reveal>
        ))}
      </div>
      <Reveal>
        <Card style={{ marginTop: 12 }}>
          <p style={{ margin: 0, color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'অনুশীলনে প্রতিটি প্রশ্নের পরেই সঠিক/ভুল ও ব্যাখ্যা দেখাবে। ফলাফলে লেখা থাকবে “অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়”।', en: 'After every practice question you will see the correct/wrong mark and explanation. The result will say “Practice result — not a recruitment exam result”.' })}
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <Link to={`/jobs/${def.slug}/mocks`} style={{ fontWeight: 600 }}>
              {t({ bn: 'মক টেস্ট দেখুন →', en: 'See mock tests →' })}
            </Link>
          </p>
        </Card>
      </Reveal>
    </>
  );
}
