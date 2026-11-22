// Eduvelto — National University group page (NU-5, 22 Nov 2026;
// design doc §5.3).
//
// `/admissions/national-university/:group` — humanities / science /
// business. Static routes in App.tsx (one per group) so they rank
// above the hub's `:tab` route and never collide with it.
//
// Content: hero in the group accent, marks distribution, the
// subject list — the three common subjects (Bangla, English,
// General Knowledge) plus the group-40 block as ONE block. The
// block's inner split is unverified until the Guideline arrives
// (Blocker B), so no subject list is invented for it. Mock card
// (100 MCQ / 1 hour / pass 35 comparison-only), eligibility card
// (verified GPA limits from the circular). 0 topics = honest empty
// state. A signed-in student can set this group as their target
// (profile: admissionTargetInstitution + admissionTargetGroup);
// switching the target never deletes progress.

import { Link } from 'react-router-dom';
import { useState } from 'react';
import { PageShell, EmptyState } from '../components/PageShell';
import { Card, LinkButton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { NU_GROUPS, profileNuPreferences, type NuGroupSlug } from '../lib/nuProfile';
import { NU_HUB_ROUTE, nuExamPattern, nuGroupSubjects } from '../lib/nuStructure';

export default function NuGroupPage(props: { group: NuGroupSlug }) {
  const { t } = useLanguage();
  const { user, profile, saveProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const g = NU_GROUPS.find((x) => x.slug === props.group) as (typeof NU_GROUPS)[number];
  const pattern = nuExamPattern();
  const subjects = nuGroupSubjects(props.group);
  const prefs = profileNuPreferences(profile);
  const isMyGroup = prefs.admissionTargetGroup === props.group;

  async function setAsTarget(): Promise<void> {
    if (!user || !profile) return;
    setBusy(true);
    try {
      await saveProfile({
        admissionTargetInstitution: 'national-university',
        admissionTargetGroup: props.group,
      });
      setSaved(true);
    } catch {
      // The friendly message is in `error` from the AuthProvider.
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell titleBn={g.bn} titleEn={g.en} wide hideHomeLink>
      <p style={{ marginTop: 0 }}>
        <Link to={NU_HUB_ROUTE} style={{ fontWeight: 600 }}>
          {t({ bn: '← জাতীয় বিশ্ববিদ্যালয় ভর্তি', en: '← National University Admission' })}
        </Link>
      </p>
      <div
        style={{
          background: g.accentSoft,
          borderLeft: `6px solid ${g.accent}`,
          borderRadius: 12,
          padding: '20px 18px',
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: '0 0 6px', fontSize: 22, color: g.accentDeep }}>{t({ bn: g.bn, en: g.en })}</h2>
        <p style={{ margin: 0, color: '#3A444B', lineHeight: 1.8 }}>
          {t({ bn: g.descriptionBn, en: g.descriptionEn })}
        </p>
        <p style={{ margin: '8px 0 0', color: '#57616A', fontSize: 14 }}>
          {t({
            bn: 'মানবণ্টন: বাংলা ২০, ইংরেজি ২০, সাধারণ জ্ঞান ২০, শাখা-ভিত্তিক ৪০ — মোট ১০০।',
            en: 'Distribution: Bangla 20, English 20, General Knowledge 20, Group subjects 40 — total 100.',
          })}
        </p>
      </div>

      {user ? (
        <p style={{ marginTop: 0 }}>
          {isMyGroup ? (
            <span style={{ fontWeight: 700, color: '#12766E' }}>
              {t({ bn: 'এটিই আপনার লক্ষ্য শাখা।', en: 'This is your target group.' })}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void setAsTarget()}
              disabled={busy}
              style={{ padding: '10px 18px', minHeight: 44, borderRadius: 6, border: `1px solid ${g.accent}`, background: '#fff', color: g.accentDeep, fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
            >
              {t({ bn: 'এই শাখাকে আমার লক্ষ্য করুন', en: 'Set this as my target group' })}
            </button>
          )}
          {saved && !isMyGroup ? (
            <span style={{ marginLeft: 10, color: '#12766E', fontWeight: 700 }}>
              {t({ bn: 'সংরক্ষণ হয়েছে।', en: 'Saved.' })}
            </span>
          ) : null}
        </p>
      ) : (
        <p style={{ marginTop: 0 }}>
          <LinkButton to="/login" variant="primary">
            {t({ bn: 'লগইন করুন', en: 'Sign in' })}
          </LinkButton>{' '}
          <span style={{ color: '#57616A', fontSize: 14 }}>
            {t({ bn: 'লক্ষ্য শাখা ঠিক করতে লগইন করুন — শাখা বদলালে অগ্রগতি মোছে না।', en: 'Sign in to set your target group — switching groups never deletes progress.' })}
          </span>
        </p>
      )}

      <h2 style={{ fontSize: 19, color: '#142B3B' }}>{t({ bn: 'বিষয়', en: 'Subjects' })}</h2>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {subjects.map((s) => (
          <Card key={s.nameBn} style={s.isGroupBlock ? { border: '1px dashed #9AA5AD', background: '#F8F9F9' } : undefined}>
            <strong style={{ fontSize: 16, color: '#142B3B' }}>{s.nameBn}</strong>
            <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8, margin: '8px 0 0' }}>{s.detailBn}</p>
            {s.isGroupBlock ? (
              <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8, margin: '8px 0 0' }}>
                {t({
                  bn: 'শাখা-৪০-এর বিষয়ভিত্তিক বিভাজন Guideline-এ নিশ্চিত হলে এখানে আসবে — এখন কমন তিন বিষয়ের অনুশীলন চলছে।',
                  en: 'The subject-wise split of the group-40 block will appear here once the Guideline confirms it — for now, practice runs on the three common subjects.',
                })}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <EmptyState
          bn="এই শাখার টপিকের তালিকা এখনো তৈরি হয়নি — সিলেবাস যাচাই চলছে।"
          en="This group’s topic list is not ready yet — the syllabus is being verified."
        />
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 16 }}>
        <Card>
          <h3 style={{ marginTop: 0, fontSize: 17, color: '#142B3B' }}>
            {t({ bn: 'এই শাখার মক', en: 'Mocks for this group' })}
          </h3>
          <p style={{ color: '#444', lineHeight: 1.8, margin: 0 }}>
            {t({
              bn: `${pattern.totalQuestions} MCQ · ${pattern.durationMinutes} মিনিট · নেগেটিভ মার্কিং নেই · পাস ${pattern.passMark} (তুলনার জন্য)`,
              en: `${pattern.totalQuestions} MCQ · ${pattern.durationMinutes} minutes · no negative marking · pass ${pattern.passMark} (for comparison)`,
            })}
          </p>
          <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8, margin: '8px 0 0' }}>
            {t({
              bn: 'এখনো কোনো মক নেই — প্রশ্ন তৈরি হলে এখানে আসবে।',
              en: 'No mocks yet — they will appear here once the questions are ready.',
            })}
          </p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0, fontSize: 17, color: '#142B3B' }}>
            {t({ bn: 'যোগ্যতা (বিজ্ঞপ্তি থেকে)', en: 'Eligibility (from the circular)' })}
          </h3>
          <p style={{ color: '#444', lineHeight: 1.8, margin: 0 }}>
            {props.group === 'science'
              ? t({
                  bn: 'SSC ২০২২/২০২৩ GPA ২.২৫+, HSC ২০২৪/২০২৫ GPA ২.০+, মোট GPA ৪.৭৫+ (৪র্থ বিষয়সহ)।',
                  en: 'SSC 2022/2023 GPA 2.25+, HSC 2024/2025 GPA 2.0+, combined GPA 4.75+ (with 4th subject).',
                })
              : t({
                  bn: 'SSC ২০২২/২০২৩ GPA ২.০+, HSC ২০২৪/২০২৫ GPA ২.০+, মোট GPA ৪.৫+ (৪র্থ বিষয়সহ)।',
                  en: 'SSC 2022/2023 GPA 2.0+, HSC 2024/2025 GPA 2.0+, combined GPA 4.5+ (with 4th subject).',
                })}
          </p>
          <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8, margin: '8px 0 0' }}>
            {t({
              bn: 'বিষয়-যোগ্যতা আলাদাভাবে যাচাই করতে হবে — বিষয়-তালিকা এখনো যাচাই হয়নি।',
              en: 'Subject eligibility must be checked separately — the subject list is not verified yet.',
            })}
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
