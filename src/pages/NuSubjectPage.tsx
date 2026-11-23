// Eduvelto — National University subject page (NU-6, 22 Nov 2026;
// design doc §5.4).
//
// `/admissions/national-university/:group/subjects/:subject` —
// subject → chapter → topic structure from the HSC syllabus.
// The chapter/topic lists are DRAFT (syllabusVerified: false —
// teacher review pending), so the page always shows the draft
// banner: this is textbook structure, NOT the official NU syllabus.
// The group-40 block has no subject page: its card on the group
// page is not a link, and an unknown subject slug shows an honest
// "not found" card (design §5.2's wrong-slug pattern).

import { Link, useParams } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { useNotFoundMeta } from '../lib/useNotFoundMeta';
import { NU_GROUPS, type NuGroupSlug } from '../lib/nuProfile';
import { NU_HUB_ROUTE } from '../lib/nuStructure';
import {
  NU_SYLLABUS_DRAFT_BANNER_BN,
  nuSyllabusChaptersForSubject,
  nuSyllabusSubjectBySlug,
  nuSyllabusSubjectsForGroup,
  nuSyllabusTopicsForChapter,
  nuTopicRoute,
} from '../lib/nuSyllabus';

function NotFound(props: { group: NuGroupSlug }) {
  const { t } = useLanguage();
  // This component only renders for an unknown subject slug — keep the
  // not-found state out of the index with a distinct title + noindex.
  useNotFoundMeta('বিষয় পাওয়া যায়নি — Eduvelto', true);
  return (
    <PageShell titleBn="বিষয় পাওয়া যায়নি" titleEn="Subject not found" hideHomeLink>
      <EmptyState
        bn="এই বিষয়টি এই শাখায় নেই।"
        en="This subject does not exist for this group."
      />
      <p style={{ marginTop: 16 }}>
        <Link to={`/admissions/national-university/${props.group}`} style={{ fontWeight: 600 }}>
          {t({ bn: '← শাখায় ফিরে যান', en: '← Back to the group' })}
        </Link>
      </p>
    </PageShell>
  );
}

export default function NuSubjectPage() {
  const { t } = useLanguage();
  const { group = '', subject = '' } = useParams<{ group: string; subject: string }>();
  const groupSlug = group as NuGroupSlug;
  const g = NU_GROUPS.find((x) => x.slug === groupSlug);
  const subj = nuSyllabusSubjectBySlug(subject);

  if (!g || !subj || subj.isGroupBlock || !subj.groupIds.includes(groupSlug)) {
    return <NotFound group={g ? groupSlug : 'humanities'} />;
  }

  const chapters = nuSyllabusChaptersForSubject(subj.id);
  const topicsTotal = chapters.reduce(
    (acc, c) => acc + nuSyllabusTopicsForChapter(c.id).length,
    0,
  );
  const groupSubjects = nuSyllabusSubjectsForGroup(groupSlug);

  return (
    <PageShell titleBn={subj.nameBn} titleEn={subj.nameEn} wide hideHomeLink>
      <p style={{ marginTop: 0 }}>
        <Link to={`/admissions/national-university/${groupSlug}`} style={{ fontWeight: 600 }}>
          {t({ bn: `← ${g.bn}`, en: `← ${g.en}` })}
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
            en: 'This syllabus structure is a draft — taken from the HSC textbooks, teacher verification is pending; the list may change. It is not NU’s official syllabus.',
          })}
        </p>
      </div>

      <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#142B3B' }}>
        {t({ bn: subj.nameBn, en: subj.nameEn })}
      </h2>
      <p style={{ margin: '0 0 16px', color: '#57616A', lineHeight: 1.8 }}>
        {t({
          bn: `এই বিষয়ে ${subj.marks} নম্বর — বিজ্ঞপ্তি থেকে যাচাইকৃত। উৎস: ${subj.syllabusSource}। অধ্যায় ${chapters.length}টি · টপিক ${topicsTotal}টি (খসড়া)।`,
          en: `${subj.marks} marks in this subject — verified from the circular. Source: ${subj.syllabusSource}. ${chapters.length} chapters · ${topicsTotal} topics (draft).`,
        })}
      </p>

      {chapters.map((ch) => {
        const topics = nuSyllabusTopicsForChapter(ch.id);
        return (
          <section key={ch.id} style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, color: '#142B3B', margin: '0 0 4px' }}>
              {t({ bn: `${ch.order}. ${ch.nameBn}`, en: `${ch.order}. ${ch.nameEn}` })}
            </h3>
            <p style={{ color: '#57616A', fontSize: 13, margin: '0 0 10px', lineHeight: 1.7 }}>
              {t({ bn: `উৎস: ${ch.syllabusSource}`, en: `Source: ${ch.syllabusSource}` })}
            </p>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              {topics.map((topic) => (
                <Card key={topic.id}>
                  <Link
                    to={nuTopicRoute(groupSlug, subj.slug, topic.slug)}
                    style={{ fontWeight: 700, fontSize: 15, color: '#142B3B', textDecoration: 'none' }}
                  >
                    {t({ bn: topic.nameBn, en: topic.nameBn })}
                  </Link>
                  <p style={{ color: '#57616A', fontSize: 13, lineHeight: 1.7, margin: '6px 0 0' }}>
                    {topic.detailBn}
                  </p>
                  <p style={{ color: '#8A6100', fontSize: 12, margin: '6px 0 0' }}>
                    {t({ bn: 'খসড়া — যাচাই চলছে', en: 'Draft — verification pending' })}
                  </p>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8 }}>
        {t({
          bn: 'এই শাখার অন্যান্য বিষয়: ',
          en: 'Other subjects in this group: ',
        })}
        {groupSubjects
          .filter((s) => !s.isGroupBlock && s.slug !== subj.slug)
          .map((s, i, arr) => (
            <span key={s.slug}>
              <Link to={`/admissions/national-university/${groupSlug}/subjects/${s.slug}`} style={{ fontWeight: 600 }}>
                {t({ bn: s.nameBn, en: s.nameEn })}
              </Link>
              {i < arr.length - 1 ? ' · ' : ''}
            </span>
          ))}
      </p>
    </PageShell>
  );
}
