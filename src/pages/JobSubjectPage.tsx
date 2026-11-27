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
// LANGUAGE: UI text is Bangla + English via useLanguage(). PageShell
// takes the canonical English subject name from the lib (lib data,
// not a new content string) for titleEn.

import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, Reveal } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
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
  const { t, lang } = useLanguage();
  const { exam = '', subject = '' } = useParams<{ exam: string; subject: string }>();
  const def = jobExamBySlug(exam);
  const subj = def ? jobSubjectById(`${exam}__${subject}`) : null;

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

  // Step 6: no topics exist for any subject — the topic count is
  // always 0, and 0 topics are done. Both numbers are honest.
  const topicCount = 0;
  const doneCount = 0;

  return (
    <PageShell titleBn={subj.nameBn} titleEn={subj.nameEn} wide maxWidth={1240}>
      {/* Breadcrumb: hub ← subjects tab ← this subject. */}
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
        <span style={{ color: '#142B3B', fontWeight: 600 }}>{lang === 'bn' ? subj.nameBn : subj.nameEn}</span>
      </nav>

      <h2 style={{ color: '#142B3B', fontSize: 24, margin: '0 0 4px' }}>{lang === 'bn' ? subj.nameBn : subj.nameEn}</h2>
      <p style={{ color: '#57616A', margin: '0 0 8px', fontSize: 15 }}>
        {t({ bn: `${def.bn} — ${subj.marks !== null ? `${bnNum(subj.marks)} নম্বর` : 'নম্বর যাচাই হয়নি'}`, en: `${def.en} — ${subj.marks !== null ? `${subj.marks} marks` : 'Marks not verified'}` })}
      </p>
      <p style={{ color: '#68747B', margin: '0 0 20px', fontSize: 13 }}>{t({ bn: `উৎস: ${subj.syllabusSource ?? 'যাচাই চলছে'}`, en: `Source: ${subj.syllabusSource ?? 'Verification in progress'}` })}</p>

      {/* BCS English only (23 Nov 2026, AdSense Part 1): this is the
          one subject with live practice — link its practice hub.
          No other subject page gets this card. */}
      {exam === 'bcs' && subject === 'english' && (
        <Reveal>
          <Card>
            <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'বিসিএস ইংরেজি অনুশীলন', en: 'BCS English practice' })}</div>
            <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: 'ব্যাকরণ, শব্দভান্ডার ও রিডিং — সম্পূর্ণ বিনামূল্যে।', en: 'Grammar, vocabulary and reading — completely free.' })}
            </p>
            <Link to="/jobs/bcs/practice/english" style={{ fontWeight: 600 }}>
              {t({ bn: '৩৫টি যাচাইকৃত প্রশ্নের অনুশীলন →', en: 'Practise the 35 verified questions →' })}
            </Link>
          </Card>
        </Reveal>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {/* Topic list — EMPTY in Step 6 (no topics exist yet). */}
        <div style={{ flex: '1 1 520px', minWidth: 0 }}>
          <Reveal>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'টপিক', en: 'Topics' })}</div>
              <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: 'এই বিষয়ের টপিক তৈরি হচ্ছে — অফিসিয়াল সিলেবাস থেকে যাচাই করে প্রকাশিত হবে।', en: 'Topics for this subject are being prepared — they will be published after verification against the official syllabus.' })}
              </p>
            </Card>
          </Reveal>
        </div>

        {/* Progress — 0 topics done; honest, no fake numbers. On
            desktop this sits to the right of the topic list; on mobile
            it stacks below (design §2.3). */}
        <div style={{ flex: '1 1 260px', maxWidth: 320 }}>
          <Reveal delayMs={80}>
            <Card>
              <div style={{ fontWeight: 700, color: '#142B3B', fontSize: 17 }}>{t({ bn: 'এই বিষয়ে আমার অগ্রগতি', en: 'My progress in this subject' })}</div>
              <p style={{ margin: '8px 0 4px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: `শেষ করা টপিক: ${bnNum(doneCount)}টি`, en: `Completed topics: ${doneCount}` })}
              </p>
              <p style={{ margin: '0 0 10px', color: '#57616A', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: `মোট টপিক: ${bnNum(topicCount)}টি`, en: `Total topics: ${topicCount}` })}
              </p>
              <div
                aria-hidden="true"
                style={{ height: 8, borderRadius: 4, background: '#E5E8E5', overflow: 'hidden' }}
              >
                <div style={{ width: '0%', height: '100%', background: '#12766E' }} />
              </div>
              <p style={{ margin: '10px 0 0', color: '#68747B', fontSize: 13, lineHeight: 1.7 }}>
                {t({ bn: 'এই বিষয়ে এখনো কোনো টপিক প্রকাশিত হয়নি, তাই অগ্রগতি ০।', en: 'No topic has been published in this subject yet, so progress is 0.' })}
              </p>
            </Card>
          </Reveal>
        </div>
      </div>

      <p style={{ marginTop: 20 }}>
        <Link to={`/jobs/${def.slug}/subjects`} style={{ fontWeight: 600 }}>
          {t({ bn: '← সব বিষয় দেখুন', en: '← See all subjects' })}
        </Link>
      </p>
    </PageShell>
  );
}
