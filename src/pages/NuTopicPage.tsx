// Eduvelto — National University topic page (NU-6, 22 Nov 2026;
// design doc §5.4).
//
// `/admissions/national-university/:group/subjects/:subject/:topic` —
// one topic: its lesson (shown only when published — every lesson
// is a draft stub today, so the card is hidden) + an honest
// "no questions" state. Practice (NU-8), favorites (NU-13) and
// progress (NU-10/11) do not exist yet, so they are not shown at all —
// never as buttons that do nothing. The group-40 block has no topic
// page: its card on the group page is not a link, and an unknown slug
// shows an honest "not found" card (design §5.2's wrong-slug pattern).

import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotFoundMeta } from '../lib/useNotFoundMeta';
import { NU_GROUPS, type NuGroupSlug } from '../lib/nuProfile';
import { NU_HUB_ROUTE } from '../lib/nuStructure';
import {
  NU_SYLLABUS_DRAFT_BANNER_BN,
  nuSubjectRoute,
  nuSyllabusChaptersForSubject,
  nuSyllabusLessonForTopic,
  nuSyllabusSubjectBySlug,
  nuSyllabusTopicBySlug,
  nuSyllabusTopicsForChapter,
  nuTopicRoute,
} from '../lib/nuSyllabus';

function NotFound(props: { group: NuGroupSlug; subjectSlug: string }) {
  const { t } = useLanguage();
  // This component only renders for an unknown topic slug — keep the
  // not-found state out of the index with a distinct title + noindex.
  useNotFoundMeta(t({ bn: 'টপিক পাওয়া যায়নি — Eduvelto', en: 'Topic not found — Eduvelto' }), true);
  return (
    <PageShell titleBn="টপিক পাওয়া যায়নি" titleEn="Topic not found" hideHomeLink>
      <EmptyState
        bn="এই টপিকটি এই বিষয়ে নেই।"
        en="This topic does not exist for this subject."
      />
      <p style={{ marginTop: 16 }}>
        <Link to={nuSubjectRoute(props.group, props.subjectSlug)} style={{ fontWeight: 600 }}>
          {t({ bn: '← বিষয়ে ফিরে যান', en: '← Back to the subject' })}
        </Link>
      </p>
    </PageShell>
  );
}

export default function NuTopicPage() {
  const { t } = useLanguage();
  const { group = '', subject = '', topic = '' } = useParams<{ group: string; subject: string; topic: string }>();
  const groupSlug = group as NuGroupSlug;
  const g = NU_GROUPS.find((x) => x.slug === groupSlug);
  const subj = nuSyllabusSubjectBySlug(subject);
  const topicDoc = subj ? nuSyllabusTopicBySlug(subj.id, topic) : undefined;
  const chapter = subj && topicDoc
    ? nuSyllabusChaptersForSubject(subj.id).find((c) => c.id === topicDoc.chapterId)
    : undefined;
  const lesson = topicDoc ? nuSyllabusLessonForTopic(topicDoc.id) : undefined;

  if (!g || !subj || subj.isGroupBlock || !subj.groupIds.includes(groupSlug) || !topicDoc || !chapter) {
    return <NotFound group={g ? groupSlug : 'humanities'} subjectSlug={subj && !subj.isGroupBlock ? subj.slug : 'bangla'} />;
  }

  const siblings = nuSyllabusTopicsForChapter(chapter.id).filter((x) => x.slug !== topicDoc.slug);

  return (
    <PageShell titleBn={topicDoc.nameBn} titleEn={topicDoc.nameBn} wide hideHomeLink>
      <p style={{ marginTop: 0 }}>
        <Link to={`/admissions/national-university/${groupSlug}`} style={{ fontWeight: 600 }}>
          {t({ bn: `← ${g.bn}`, en: `← ${g.en}` })}
        </Link>
        {' · '}
        <Link to={nuSubjectRoute(groupSlug, subj.slug)} style={{ fontWeight: 600 }}>
          {t({ bn: `← ${subj.nameBn}`, en: `← ${subj.nameEn}` })}
        </Link>
        {' · '}
        <Link to={NU_HUB_ROUTE} style={{ fontWeight: 600 }}>
          {t({ bn: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি', en: 'National University Admission' })}
        </Link>
      </p>

      <div
        style={{
          background: '#FFF8E1',
          borderLeft: '6px solid #D9A441',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 16,
        }}
      >
        <p style={{ margin: 0, lineHeight: 1.8, color: '#5D4037' }}>
          {t({
            bn: NU_SYLLABUS_DRAFT_BANNER_BN,
            en: 'This syllabus structure is taken from the HSC textbooks; the list may change. It is not NU’s official syllabus.',
          })}
        </p>
      </div>

      <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#142B3B' }}>
        {t({ bn: topicDoc.nameBn, en: topicDoc.nameBn })}
      </h2>
      <p style={{ margin: '0 0 16px', color: '#57616A', lineHeight: 1.8 }}>
        {t({
          bn: `${subj.nameBn} · ${chapter.nameBn} · উৎস: ${topicDoc.syllabusSource}। ${topicDoc.detailBn}`,
          en: `${subj.nameEn} · ${chapter.nameEn} · Source: ${topicDoc.syllabusSource}. ${topicDoc.detailBn}`,
        })}
      </p>

      {/* Lesson card — shown ONLY when a real (published) lesson exists.
          Every NU lesson today is a draft stub, so the card is hidden
          rather than showing a "being prepared" note (AdSense-review
          cleanup, 28 Nov 2026). */}
      {lesson?.status === 'published' ? (
        <Card>
          <h3 style={{ marginTop: 0, fontSize: 18, color: '#142B3B' }}>
            {t({ bn: lesson.titleBn, en: topicDoc.nameBn })}
          </h3>
          <p style={{ color: '#444', lineHeight: 1.8, margin: '0 0 8px' }}>
            {t({ bn: lesson.bodyBn, en: lesson.bodyBn })}
          </p>
        </Card>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <EmptyState
          bn="এই টপিকে এখন কোনো প্রশ্ন নেই।"
          en="There are no questions for this topic right now."
        />
      </div>

      {siblings.length > 0 ? (
        <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8 }}>
          {t({ bn: 'এই অধ্যায়ের অন্যান্য টপিক: ', en: 'Other topics in this chapter: ' })}
          {siblings.map((s, i, arr) => (
            <span key={s.slug}>
              <Link to={nuTopicRoute(groupSlug, subj.slug, s.slug)} style={{ fontWeight: 600 }}>
                {t({ bn: s.nameBn, en: s.nameBn })}
              </Link>
              {i < arr.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </p>
      ) : null}
    </PageShell>
  );
}
