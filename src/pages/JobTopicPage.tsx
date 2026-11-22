// Eduvelto — Job Preparation topic page (Step 6).
//
// /jobs/:exam/subjects/:subject/:topic — one topic of one subject.
// Reads ONLY the hardcoded canonical lib (jobContent.ts); no
// Firestore reads, no read-path switch.
//
// Step 6 defines NO topics: the single lookup point below
// (lookupJobTopic) always returns null today, so the page shows the
// honest not-ready state and the practice entry as unavailable.
// Questions arrive in Step 7/8 — no practice flow is built here.
// Unknown exam / subject / topic → the honest not-found state; the
// raw URL slug is never rendered as a title.
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

/**
 * What Step 7's topic lookup will return (shape stub only — no topic
 * data exists in Step 6, and none is invented here).
 */
interface JobTopicStub {
  slug: string;
  nameBn: string;
}

/**
 * Single lookup point for a topic (Step 7 plug-point). Step 6 defines
 * NO topics — no verified topic lists exist — so this always returns
 * null today and the page shows the honest not-ready state. Step 7
 * replaces this body with a real canonical-lib lookup; nothing else
 * on this page needs to change.
 */
function lookupJobTopic(_examSlug: string, _subjectSlug: string, _topicSlug: string): JobTopicStub | null {
  return null;
}

export default function JobTopicPage() {
  const { exam = '', subject = '', topic = '' } = useParams<{ exam: string; subject: string; topic: string }>();
  const def = jobExamBySlug(exam);
  const subj = def ? jobSubjectById(`${exam}__${subject}`) : null;
  const topicDef = subj ? lookupJobTopic(exam, subject, topic) : null;

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

  return (
    <PageShell titleBn={subj.nameBn} titleEn={subj.nameEn} wide maxWidth={1240}>
      {/* Breadcrumb: hub ← subjects tab ← subject ← this topic. */}
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
        <Link to={`/jobs/${def.slug}/subjects/${subj.slug}`} style={{ fontWeight: 600 }}>
          {subj.nameBn}
        </Link>
        {' › '}
        <span style={{ color: '#142B3B', fontWeight: 600 }}>টপিক</span>
      </nav>

      <h2 style={{ color: '#142B3B', fontSize: 24, margin: '0 0 4px' }}>{subj.nameBn}</h2>
      <p style={{ color: '#68747B', margin: '0 0 20px', fontSize: 13 }}>উৎস: {subj.syllabusSource ?? 'যাচাই চলছে'}</p>

      {topicDef === null ? (
        <>
          {/* No topics exist in Step 6 — honest empty state. */}
          <Reveal>
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>এই টপিকটি এখনো তৈরি হয়নি</div>
              <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                এই টপিকটি এখনো তৈরি হয়নি — অফিসিয়াল সিলেবাস থেকে যাচাই করে প্রকাশিত হবে।
              </p>
              <Chip tone="gold">শীঘ্রই আসছে</Chip>
            </Card>
          </Reveal>

          {/* Practice entry — shown as unavailable. Questions arrive
              in Step 7/8; no practice flow is built here. */}
          <Reveal delayMs={80}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>অনুশীলন</div>
              <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                প্রশ্ন তৈরি হলে এখানে অনুশীলন শুরু করা যাবে — এখনো কোনো প্রশ্ন তৈরি হয়নি।
              </p>
              <Chip tone="gold">শীঘ্রই আসছে</Chip>
            </Card>
          </Reveal>
        </>
      ) : (
        // Step 7 shell: reached only once the lookup above returns a
        // real topic. Lessons / practice plug in here.
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{topicDef.nameBn}</div>
            <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              এই টপিকের পাঠ ও অনুশীলন এখানে প্রকাশিত হবে।
            </p>
            <Chip tone="gold">শীঘ্রই আসছে</Chip>
          </Card>
        </Reveal>
      )}

      <p style={{ marginTop: 20 }}>
        <Link to={`/jobs/${def.slug}/subjects/${subj.slug}`} style={{ fontWeight: 600 }}>
          ← {subj.nameBn} বিষয়ে ফিরুন
        </Link>
      </p>
    </PageShell>
  );
}
