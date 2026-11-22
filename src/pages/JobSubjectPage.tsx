// Eduvelto — Job Preparation subject page (Step 6).
//
// /jobs/:exam/subjects/:subject — one verified subject of one exam's
// syllabus. Reads ONLY the hardcoded canonical lib (jobContent.ts);
// no Firestore reads, no read-path switch.
//
// Step 6 defines SUBJECTS ONLY — no topics exist yet, so the topic
// list is an honest empty state and the progress card shows 0 topics
// done (no fake numbers). Unknown exam or subject slug → the honest
// not-found state; the raw URL slug is never rendered as a title.
//
// LANGUAGE: all UI text is Bangla (one-language rule). PageShell still
// takes a titleEn prop — the canonical English subject name from the
// lib is passed there (lib data, not a new content string); the
// not-found title passes the Bangla string for both props.

import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, Chip, Reveal } from '../components/ui';
import { jobExamBySlug } from '../lib/jobExams';
import { jobSubjectById } from '../lib/jobContent';

/** Bangla digits for marks / counts ("৩৫ নম্বর", "০টি টপিক"). */
function bnNum(n: number): string {
  return String(n)
    .split('')
    .map((d) => '০১২৩৪৫৬৭৮৯'[Number(d)])
    .join('');
}

export default function JobSubjectPage() {
  const { exam = '', subject = '' } = useParams<{ exam: string; subject: string }>();
  const def = jobExamBySlug(exam);
  const subj = def ? jobSubjectById(`${exam}__${subject}`) : null;

  if (!def || !subj) {
    return (
      <PageShell titleBn="বিষয়টি পাওয়া যায়নি" titleEn="বিষয়টি পাওয়া যায়নি" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>বিষয়টি পাওয়া যায়নি</div>
          <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            এই ঠিকানার বিষয়টি খুঁজে পাওয়া যায়নি — হয় পরীক্ষা বা বিষয়ের নাম ভুল, নয় বিষয়টি এখনো প্রকাশিত হয়নি।
          </p>
          <p style={{ margin: 0 }}>
            {def ? (
              <Link to={`/jobs/${def.slug}/subjects`} style={{ fontWeight: 600 }}>
                ← বিষয় তালিকায় ফিরুন
              </Link>
            ) : (
              <Link to="/jobs" style={{ fontWeight: 600 }}>
                ← সব পরীক্ষা দেখুন
              </Link>
            )}
          </p>
        </Card>
      </PageShell>
    );
  }

  // Step 6: no topics exist for any subject — the topic count is
  // always 0, and 0 topics are done. Both numbers are honest.
  const topicCount = 0;
  const doneCount = 0;

  return (
    <PageShell titleBn={subj.nameBn} titleEn={subj.nameEn} wide maxWidth={1240}>
      {/* Breadcrumb: hub ← subjects tab ← this subject. */}
      <nav aria-label="ব্রেডক্রাম্ব" style={{ margin: '0 0 12px', color: '#57616A', fontSize: 14 }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          চাকরির প্রস্তুতি
        </Link>
        {' › '}
        <Link to={`/jobs/${def.slug}`} style={{ fontWeight: 600 }}>
          {def.bn}
        </Link>
        {' › '}
        <Link to={`/jobs/${def.slug}/subjects`} style={{ fontWeight: 600 }}>
          বিষয়
        </Link>
        {' › '}
        <span style={{ color: '#142B3B', fontWeight: 600 }}>{subj.nameBn}</span>
      </nav>

      <h2 style={{ color: '#142B3B', fontSize: 24, margin: '0 0 4px' }}>{subj.nameBn}</h2>
      <p style={{ color: '#57616A', margin: '0 0 8px', fontSize: 15 }}>
        {def.bn} — {subj.marks !== null ? `${bnNum(subj.marks)} নম্বর` : 'নম্বর যাচাই হয়নি'}
      </p>
      <p style={{ color: '#68747B', margin: '0 0 20px', fontSize: 13 }}>উৎস: {subj.syllabusSource ?? 'যাচাই চলছে'}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {/* Topic list — EMPTY in Step 6 (no topics exist yet). */}
        <div style={{ flex: '1 1 520px', minWidth: 0 }}>
          <Reveal>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>টপিক</div>
              <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                এই বিষয়ের টপিক তৈরি হচ্ছে — অফিসিয়াল সিলেবাস থেকে যাচাই করে প্রকাশিত হবে।
              </p>
              <Chip tone="gold">শীঘ্রই আসছে</Chip>
            </Card>
          </Reveal>
        </div>

        {/* Progress — 0 topics done; honest, no fake numbers. On
            desktop this sits to the right of the topic list; on mobile
            it stacks below (design §2.3). */}
        <div style={{ flex: '1 1 260px', maxWidth: 320 }}>
          <Reveal delayMs={80}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>এই বিষয়ে আমার অগ্রগতি</div>
              <p style={{ margin: '8px 0 4px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                শেষ করা টপিক: {bnNum(doneCount)}টি
              </p>
              <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                মোট টপিক: {bnNum(topicCount)}টি
              </p>
              <div
                aria-hidden="true"
                style={{ height: 8, borderRadius: 4, background: '#E5E8E5', overflow: 'hidden' }}
              >
                <div style={{ width: '0%', height: '100%', background: '#12766E' }} />
              </div>
              <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 13, lineHeight: 1.7 }}>
                এই বিষয়ে এখনো কোনো টপিক প্রকাশিত হয়নি, তাই অগ্রগতি ০।
              </p>
            </Card>
          </Reveal>
        </div>
      </div>

      <p style={{ marginTop: 20 }}>
        <Link to={`/jobs/${def.slug}/subjects`} style={{ fontWeight: 600 }}>
          ← সব বিষয় দেখুন
        </Link>
      </p>
    </PageShell>
  );
}
