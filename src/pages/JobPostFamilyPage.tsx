// Eduvelto — Grades 11–20 post-family page (design §1.3).
//
// ONE shared template (R-1), data-driven per family. A section is
// HIDDEN, not faked, when its data does not exist. Release 1: zero
// verified configs, zero verified previous questions, so every
// family shows the honest "pattern not yet verified" card and the
// previous-questions empty state (real zero).
//
// Route: /jobs/grade-11-20/posts/:postSlug (before /jobs/:exam/:tab).

import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card, LinkButton, Reveal } from '../components/ui';
import JobTypingSimulator from '../components/JobTypingSimulator';
import { useLanguage } from '../i18n/LanguageContext';
import { grade1120ConfigsForFamily } from '../lib/jobExams';
import {
  GRADE_11_20_POST_FAMILIES,
  GRADE_11_20_STAGES_NOT_VERIFIED,
  grade1120FamilyBySlug,
  grade1120VerificationLabel,
} from '../lib/jobGrade1120';
import { writtenQuestionsForPostFamily } from '../lib/jobWrittenContent';

export default function JobPostFamilyPage() {
  const { t, lang } = useLanguage();
  const { postSlug = '' } = useParams<{ postSlug: string }>();
  const family = grade1120FamilyBySlug(postSlug);
  const configs = family ? grade1120ConfigsForFamily(family.slug) : [];
  const written = family ? writtenQuestionsForPostFamily(family.slug) : [];

  if (!family) {
    return (
      <PageShell titleBn="পদ পাওয়া যায়নি" titleEn="Post not found" wide>
        <p style={{ margin: '16px 0' }}>
          {t({
            bn: 'এই পদ পরিবারটি খুঁজে পাওয়া যায়নি। প্রথম প্রকাশের ৬টি পদ পরিবার:',
            en: 'This post family could not be found. The 6 first-release families:',
          })}
        </p>
        <ul>
          {GRADE_11_20_POST_FAMILIES.map((f) => (
            <li key={f.slug}>
              <Link to={`/jobs/grade-11-20/posts/${f.slug}`}>{lang === 'bn' ? f.nameBn : f.nameEn}</Link>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 16 }}>
          <Link to="/jobs/grade-11-20" style={{ fontWeight: 600 }}>
            {t({ bn: '← ১১–২০ গ্রেড হাব', en: '← Grades 11–20 hub' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  const label = grade1120VerificationLabel(family.verificationStatus);

  return (
    <PageShell
      titleBn={family.nameBn}
      titleEn={family.nameEn}
      wide
      maxWidth={1240}
    >
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/jobs/grade-11-20" style={{ fontWeight: 600 }}>
          {t({ bn: '← সরকারি চাকরি (১১–২০ গ্রেড)', en: '← Government Jobs (Grades 11–20)' })}
        </Link>
      </p>

      {/* Header: name, authorities, verification label. */}
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 18 }}>
              {lang === 'bn' ? family.nameBn : family.nameEn}
            </div>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 999,
                background: '#F0EFEA',
                color: '#57534E',
                fontSize: 12,
                fontWeight: 700,
                height: 'fit-content',
              }}
            >
              {t({ bn: label.chipBn, en: label.chipEn })}
            </span>
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({ bn: label.meaningBn, en: label.meaningEn })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            {t({
              bn: `নিয়োগকারী কর্তৃপক্ষ: ${family.authoritiesBn.join('、 ')} · গ্রেড: উল্লেখ নেই (উৎসে গ্রেড উল্লেখ নেই — অনুমান করে লেখা হয়নি)`,
              en: `Recruiting authorities: ${family.authoritiesEn.join(', ')} · Grade: not stated (the source does not state a grade — none is assumed)`,
            })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            {t({
              bn: `${GRADE_11_20_STAGES_NOT_VERIFIED.bn} — নিচের ধাপগুলো শুধু সম্ভাব্য ধাপ, নিয়ম নয়।`,
              en: `${GRADE_11_20_STAGES_NOT_VERIFIED.en} — the stages below are only possible stages, not rules.`,
            })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            {t({ bn: `সম্ভাব্য ধাপ: ${family.possibleStagesBn}`, en: `Possible stages: ${family.possibleStagesEn}` })}
          </p>
        </Card>
      </Reveal>

      {/* Exam pattern card(s) — zero configs → honest card, never a generic table. */}
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'পরীক্ষার ধরন', en: 'Exam pattern' })}
          </div>
          {configs.length === 0 ? (
            <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
              {t({
                bn: 'এই পদের পরীক্ষার ধরন সম্পর্কে কোনো নির্ভরযোগ্য সরকারি সূত্র এখনো পাওয়া যায়নি। গেজেট / বিধিমালা / বিজ্ঞপ্তি যাচাই হলে ধরনটি এখানে উৎসসহ দেওয়া হবে — তার আগে কোনো নম্বর, সময় বা ধাপ অনুমান করে লেখা হয়নি।',
                en: 'No authoritative government source for this post’s exam pattern has been found yet. Once a gazette / regulation / circular is verified, the pattern will be shown here with its source — until then no marks, time or stages are assumed.',
              })}
            </p>
          ) : (
            configs.map((c) => (
              <div key={c.configId} style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700 }}>{c.authorityBn}</div>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                  {t({ bn: `উৎস: ${c.source.title}`, en: `Source: ${c.source.title}` })}
                </p>
              </div>
            ))
          )}
        </Card>
      </Reveal>

      {/* Four preparation blocks — shown only as applicable (§1.3). */}
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'প্রস্তুতি', en: 'Preparation' })}</h2>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 20 }}>
        {family.offers.mcq ? (
          <Reveal delayMs={0}>
            <Card>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                {t({ bn: 'MCQ অনুশীলন', en: 'MCQ Practice' })}
              </div>
              <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({ bn: 'সাধারণ বিষয় — বাংলা, ইংরেজি, গণিত, সাধারণ জ্ঞান — সাধারণ ব্যাংক থেকে।', en: 'Common subjects — Bangla, English, Math, GK — from the shared bank.' })}
              </p>
              <LinkButton to="/jobs/common" variant="accent">
                {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
              </LinkButton>
            </Card>
          </Reveal>
        ) : null}
        {family.offers.modelTest ? (
          <Reveal delayMs={80}>
            <Card>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                {t({ bn: 'মডেল টেস্ট', en: 'Model Test' })}
              </div>
              <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'যাচাইকৃত ধরন নেই বলে এখন শুধু সাধারণ অনুশীলন টেস্ট — আসল ধরনের দাবি ছাড়া। যাচাইকৃত ধরন এলে ধরন-ভিত্তিক মডেল টেস্ট আসবে।',
                  en: 'With no verified pattern, only a general practice test for now — with no real-pattern claim. A pattern-based model test comes once a pattern is verified.',
                })}
              </p>
              <Link to="/jobs/common" style={{ fontWeight: 600 }}>
                {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
              </Link>
            </Card>
          </Reveal>
        ) : null}
        {family.offers.previous ? (
          <Reveal delayMs={160}>
            <Card>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                {t({ bn: 'বিগত প্রশ্ন', en: 'Previous Questions' })}
              </div>
              <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {t({
                  bn: 'এই পদের যাচাইকৃত বিগত প্রশ্ন এখনো সংগ্রহ হয়নি। যাচাইকৃত বিগত প্রশ্ন: ০টি।',
                  en: 'No verified previous questions for this post have been collected yet. Verified previous questions: 0.',
                })}
              </p>
            </Card>
          </Reveal>
        ) : null}
        {family.offers.written ? (
          <Reveal delayMs={240}>
            <Card>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                {t({ bn: 'লিখিত প্রস্তুতি', en: 'Written Preparation' })}
              </div>
              <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                {written.length > 0
                  ? t({
                      bn: `${written.length}টি লিখিত প্রশ্ন আছে — লেখা শেখার পদ্ধতিসহ।`,
                      en: `${written.length} written question(s) — with the writing-learning method.`,
                    })
                  : t({
                      bn: 'এই পদের লিখিত ধাপের প্রশ্ন এখনো তৈরি হয়নি — লিখিত প্রস্তুতির পদ্ধতি দেখুন।',
                      en: 'Written-stage questions for this post are not prepared yet — see the written preparation method.',
                    })}
              </p>
              <LinkButton to="/jobs/grade-11-20/written" variant="accent">
                {t({ bn: 'লিখিত প্রস্তুতি দেখুন →', en: 'See written preparation →' })}
              </LinkButton>
            </Card>
          </Reveal>
        ) : null}
      </div>

      {/* Practical preparation block (E-2 — per family, §1.3 table). */}
      {family.practicalSkill === 'typing' ? (
        <Reveal>
          <div style={{ marginBottom: 20 }}>
            <JobTypingSimulator />
          </div>
        </Reveal>
      ) : family.practicalSkill === 'computer' ? (
        <Reveal>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'কম্পিউটার ব্যবহারিক প্রস্তুতি', en: 'Computer practical preparation' })}
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'Word/Excel/PowerPoint ও ফাইল ব্যবস্থাপনার অনুশীলন এখনো তৈরি হচ্ছে। কর্তৃপক্ষের আসল ব্যবহারিক পরীক্ষার প্রয়োজনীয়তা যাচাই না হওয়া পর্যন্ত কোনো অনুশীলনকে অফিসিয়াল পরীক্ষা বলা হবে না।',
                en: 'Word/Excel/PowerPoint and file-management practice is still being prepared. Until the authority’s actual practical-test requirements are verified, no practice is called the official test.',
              })}
            </p>
          </Card>
        </Reveal>
      ) : family.practicalSkill === 'accounting' ? (
        <Reveal>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'হিসাববিজ্ঞান ব্যবহারিক প্রস্তুতি', en: 'Accounting practical preparation' })}
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'ডেবিট/ক্রেডিট, খতিয়ান ও নগদান বইয়ের অনুশীলন এখনো তৈরি হচ্ছে।',
                en: 'Debit/credit, ledger and cash-book practice is still being prepared.',
              })}
            </p>
          </Card>
        </Reveal>
      ) : family.practicalSkill === 'shorthand' ? (
        <Reveal>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
              {t({ bn: 'সাঁটলিপি প্রস্তুতি', en: 'Shorthand preparation' })}
            </div>
            <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'সাঁটলিপি ও প্রতিলিপি (ট্রান্সক্রিপশন) অনুশীলন এখনো তৈরি হচ্ছে। টাইপিং অনুশীলন দিয়ে শুরু করতে পারেন।',
                en: 'Shorthand and transcription practice is still being prepared. You can start with typing practice.',
              })}
            </p>
            <p style={{ margin: '12px 0 0' }}>
              <LinkButton to="/jobs/grade-11-20/typing" variant="accent">
                {t({ bn: 'টাইপিং অনুশীলন করুন →', en: 'Practise typing →' })}
              </LinkButton>
            </p>
          </Card>
        </Reveal>
      ) : null}

      {/* Official sources + related circulars. */}
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'অফিসিয়াল উৎস ও বিজ্ঞপ্তি', en: 'Official sources & circulars' })}
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'এই পদের ধরন যাচাই করে এমন কোনো গেজেট / বিধিমালা / বিজ্ঞপ্তি এখনো সংযুক্ত হয়নি। উৎস পাওয়া গেলে এখানে প্রকাশের তারিখসহ দেওয়া হবে।',
              en: 'No gazette / regulation / circular verifying this post’s pattern is linked yet. When a source is found, it will be shown here with its publication date.',
            })}
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <LinkButton to="/jobs/circulars" variant="accent">
              {t({ bn: 'বিজ্ঞপ্তি দেখুন →', en: 'See circulars →' })}
            </LinkButton>
          </p>
        </Card>
      </Reveal>
    </PageShell>
  );
}
