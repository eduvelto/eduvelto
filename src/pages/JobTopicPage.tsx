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
// LANGUAGE: UI text is Bangla + English via useLanguage(). PageShell
// takes the canonical English subject name from the lib (lib data,
// not a new content string) for titleEn.

import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, Reveal } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { jobExamBySlug } from '../lib/jobExams';
import { jobSubjectById } from '../lib/jobContent';

/**
 * What Step 7's topic lookup will return (shape stub only — no topic
 * data exists in Step 6, and none is invented here).
 */
interface JobTopicStub {
  slug: string;
  nameBn: string;
  nameEn: string;
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
  const { t, lang } = useLanguage();
  const { exam = '', subject = '', topic = '' } = useParams<{ exam: string; subject: string; topic: string }>();
  const def = jobExamBySlug(exam);
  const subj = def ? jobSubjectById(`${exam}__${subject}`) : null;
  const topicDef = subj ? lookupJobTopic(exam, subject, topic) : null;

  if (!def || !subj) {
    return (
      <PageShell titleBn="বিষয়টি পাওয়া যায়নি" titleEn="Subject not found" wide>
        <Card>
          <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'বিষয়টি পাওয়া যায়নি', en: 'Subject not found' })}</div>
          <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: 'এই ঠিকানার বিষয়টি খুঁজে পাওয়া যায়নি — হয় পরীক্ষা বা বিষয়ের নাম ভুল, নয় বিষয়টি এখনো প্রকাশিত হয়নি।', en: 'This subject could not be found at this address — either the exam or subject name is wrong, or the subject has not been published yet.' })}
          </p>
          <p style={{ margin: 0 }}>
            {def ? (
              <Link to={`/jobs/${def.slug}/subjects`} style={{ fontWeight: 600 }}>
                {t({ bn: '← বিষয় তালিকায় ফিরুন', en: '← Back to the subject list' })}
              </Link>
            ) : (
              <Link to="/jobs" style={{ fontWeight: 600 }}>
                {t({ bn: '← সব পরীক্ষা দেখুন', en: '← See all exams' })}
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
      <nav aria-label={t({ bn: 'ব্রেডক্রাম্ব', en: 'Breadcrumb' })} style={{ margin: '0 0 12px', color: '#57616A', fontSize: 14 }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          {t({ bn: 'চাকরির প্রস্তুতি', en: 'Job Preparation' })}
        </Link>
        {' › '}
        <Link to={`/jobs/${def.slug}`} style={{ fontWeight: 600 }}>
          {lang === 'bn' ? def.bn : def.en}
        </Link>
        {' › '}
        <Link to={`/jobs/${def.slug}/subjects`} style={{ fontWeight: 600 }}>
          {t({ bn: 'বিষয়', en: 'Subjects' })}
        </Link>
        {' › '}
        <Link to={`/jobs/${def.slug}/subjects/${subj.slug}`} style={{ fontWeight: 600 }}>
          {lang === 'bn' ? subj.nameBn : subj.nameEn}
        </Link>
        {' › '}
        <span style={{ color: '#142B3B', fontWeight: 600 }}>{t({ bn: 'টপিক', en: 'Topic' })}</span>
      </nav>

      <h2 style={{ color: '#142B3B', fontSize: 24, margin: '0 0 4px' }}>{lang === 'bn' ? subj.nameBn : subj.nameEn}</h2>
      <p style={{ color: '#68747B', margin: '0 0 20px', fontSize: 13 }}>{t({ bn: `উৎস: ${subj.syllabusSource ?? 'যাচাই চলছে'}`, en: `Source: ${subj.syllabusSource ?? 'Verification in progress'}` })}</p>

      {topicDef === null ? (
        <>
          {/* No topics exist in Step 6 — honest empty state. */}
          <Reveal>
            <Card style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'এই টপিকটি এখনো তৈরি হয়নি', en: 'This topic has not been created yet' })}</div>
              <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: 'এই টপিকটি এখনো তৈরি হয়নি — অফিসিয়াল সিলেবাস থেকে যাচাই করে প্রকাশিত হবে।', en: 'This topic has not been created yet — it will be published after verification against the official syllabus.' })}
              </p>
            </Card>
          </Reveal>

          {/* Practice entry — shown as unavailable. Questions arrive
              in Step 7/8; no practice flow is built here. */}
          <Reveal delayMs={80}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'অনুশীলন', en: 'Practice' })}</div>
              <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: 'প্রশ্ন তৈরি হলে এখানে অনুশীলন শুরু করা যাবে — এখনো কোনো প্রশ্ন তৈরি হয়নি।', en: 'Once questions are ready, practice will start here — no questions have been created yet.' })}
              </p>
            </Card>
          </Reveal>
        </>
      ) : (
        // Step 7 shell: reached only once the lookup above returns a
        // real topic. Lessons / practice plug in here.
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{lang === 'bn' ? topicDef.nameBn : topicDef.nameEn}</div>
            <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: 'এই টপিকের পাঠ ও অনুশীলন এখানে প্রকাশিত হবে।', en: 'Lessons and practice for this topic will be published here.' })}
            </p>
          </Card>
        </Reveal>
      )}

      <p style={{ marginTop: 20 }}>
        <Link to={`/jobs/${def.slug}/subjects/${subj.slug}`} style={{ fontWeight: 600 }}>
          {t({ bn: `← ${subj.nameBn} বিষয়ে ফিরুন`, en: `← Back to ${subj.nameEn}` })}
        </Link>
      </p>
    </PageShell>
  );
}
