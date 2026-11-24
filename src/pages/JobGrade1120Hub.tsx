// Eduvelto — Grades 11–20 hub sections (design §1.2).
//
// Rendered inside JobHubPage when def.slug === 'grade-11-20',
// same pattern as JobSubjectsTab. Reuses the JobHubPage 8-tab
// shell (R-7) — this file holds only the hub-specific sections:
// intro, verification legend, searchable post directory, common
// subjects, practical strip, post-family cards, model tests,
// previous questions, recruitment notices.
//
// No marks, no times, no stages are shown as fact anywhere here:
// every family is 'not-verified' until a gazette/circular is
// actually opened and checked (GRADE_11_20_CONFIGS is empty).

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, LinkButton, Reveal } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { jobExamBySlug } from '../lib/jobExams';
import {
  GRADE_11_20_EMPTY_RESULTS,
  GRADE_11_20_POST_FAMILIES,
  filterGrade1120Directory,
  grade1120PreparationLinks,
  grade1120VerificationLabel,
  type Grade1120DirectoryFilters,
  type PracticalSkill,
} from '../lib/jobGrade1120';

function VerificationChip({ status }: { status: 'verified' | 'partially-verified' | 'not-verified' }) {
  const { t } = useLanguage();
  const label = grade1120VerificationLabel(status);
  const tone =
    status === 'verified'
      ? { bg: '#E7F4EB', fg: '#14532D' }
      : status === 'partially-verified'
        ? { bg: '#FBF0E2', fg: '#78350F' }
        : { bg: '#F0EFEA', fg: '#57534E' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: tone.bg,
        color: tone.fg,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {t({ bn: label.chipBn, en: label.chipEn })}
    </span>
  );
}

function PostDirectory() {
  const { t, lang } = useLanguage();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [family, setFamily] = useState(params.get('family') ?? 'all');
  const [skill, setSkill] = useState(params.get('skill') ?? 'all');
  const [examType, setExamType] = useState(params.get('examType') ?? 'all');

  const filters: Grade1120DirectoryFilters = {
    query,
    family,
    gradeBand: 'all',
    authority: '',
    examType: examType as Grade1120DirectoryFilters['examType'],
    skill: skill as PracticalSkill | 'all',
  };
  const results = useMemo(
    () => filterGrade1120Directory(GRADE_11_20_POST_FAMILIES, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, family, skill, examType],
  );

  const syncParams = (next: { q?: string; family?: string; skill?: string; examType?: string }) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '' || v === 'all') p.delete(k);
      else p.set(k, v);
    }
    setParams(p, { replace: true });
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
        {t({ bn: 'পদের তালিকা', en: 'Post directory' })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            syncParams({ q: e.target.value });
          }}
          placeholder={t({ bn: 'পদের নাম / কর্তৃপক্ষ খুঁজুন…', en: 'Search post name / authority…' })}
          style={{ flex: '1 1 220px', padding: '8px 10px', borderRadius: 6, fontSize: 15 }}
          aria-label={t({ bn: 'পদ খুঁজুন', en: 'Search posts' })}
        />
        <select
          value={family}
          onChange={(e) => {
            setFamily(e.target.value);
            syncParams({ family: e.target.value });
          }}
          style={{ padding: '8px', borderRadius: 6 }}
          aria-label={t({ bn: 'পদ পরিবার', en: 'Post family' })}
        >
          <option value="all">{t({ bn: 'সব পদ', en: 'All posts' })}</option>
          {GRADE_11_20_POST_FAMILIES.map((f) => (
            <option key={f.slug} value={f.slug}>
              {lang === 'bn' ? f.nameBn : f.nameEn}
            </option>
          ))}
        </select>
        <select
          value={skill}
          onChange={(e) => {
            setSkill(e.target.value);
            syncParams({ skill: e.target.value });
          }}
          style={{ padding: '8px', borderRadius: 6 }}
          aria-label={t({ bn: 'ব্যবহারিক দক্ষতা', en: 'Practical skill' })}
        >
          <option value="all">{t({ bn: 'সব দক্ষতা', en: 'All skills' })}</option>
          <option value="typing">{t({ bn: 'টাইপিং', en: 'Typing' })}</option>
          <option value="computer">{t({ bn: 'কম্পিউটার', en: 'Computer' })}</option>
          <option value="shorthand">{t({ bn: 'সাঁটলিপি', en: 'Shorthand' })}</option>
          <option value="accounting">{t({ bn: 'হিসাববিজ্ঞান', en: 'Accounting' })}</option>
          <option value="none">{t({ bn: 'কোনো ব্যবহারিক দক্ষতা নয়', en: 'No practical skill' })}</option>
        </select>
        <select
          value={examType}
          onChange={(e) => {
            setExamType(e.target.value);
            syncParams({ examType: e.target.value });
          }}
          style={{ padding: '8px', borderRadius: 6 }}
          aria-label={t({ bn: 'পরীক্ষার ধরন', en: 'Exam type' })}
        >
          <option value="all">{t({ bn: 'সব ধরন', en: 'All types' })}</option>
          <option value="written-only">{t({ bn: 'শুধু লিখিত', en: 'Written only' })}</option>
          <option value="written-practical">{t({ bn: 'লিখিত + ব্যবহারিক', en: 'Written + practical' })}</option>
          <option value="written-viva">{t({ bn: 'লিখিত + ভাইভা', en: 'Written + viva' })}</option>
        </select>
      </div>
      {results.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
          {t({ bn: GRADE_11_20_EMPTY_RESULTS.bn, en: GRADE_11_20_EMPTY_RESULTS.en })}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {results.map((f) => {
            const label = grade1120VerificationLabel(f.verificationStatus);
            const links = grade1120PreparationLinks(f);
            return (
              <div
                key={f.slug}
                style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 12 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <Link to={`/jobs/grade-11-20/posts/${f.slug}`} style={{ fontWeight: 700, fontSize: 15 }}>
                    {lang === 'bn' ? f.nameBn : f.nameEn}
                  </Link>
                  <VerificationChip status={f.verificationStatus} />
                </div>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                  {t({ bn: label.meaningBn, en: label.meaningEn })}
                </p>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                  {t({ bn: `গ্রেড: উল্লেখ নেই`, en: `Grade: not stated` })}
                  {f.practicalSkill !== 'none'
                    ? t({ bn: ` · ব্যবহারিক: ${f.practicalBn}`, en: ` · Practical: ${f.practicalEn}` })
                    : ''}
                </p>
                <p style={{ margin: '8px 0 0', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {links.map((l) =>
                    l.href ? (
                      <Link key={l.key} to={l.href} style={{ fontWeight: 600 }}>
                        {lang === 'bn' ? l.bn : l.en}
                      </Link>
                    ) : (
                      <span key={l.key} style={{ color: 'var(--muted)' }}>
                        {lang === 'bn' ? l.bn : l.en} — {t({ bn: 'নেই', en: 'none' })}
                      </span>
                    ),
                  )}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export default function JobGrade1120Hub() {
  const { t, lang } = useLanguage();
  const bcs = jobExamBySlug('bcs');

  return (
    <>
      {/* Intro — the sentence that governs the whole section (§1.2.1). */}
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: '১১–২০ গ্রেড কী', en: 'What Grades 11–20 are' })}
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({
              bn: 'জাতীয় বেতন স্কেলের অধীনে নন-ক্যাডার পদ — তত্ত্বাবধায়ক/কেরানি থেকে অফিস সহায়ক/কারিগরি পদ পর্যন্ত। একটি কথা পুরো বিভাগটি পরিচালনা করে: গ্রেড পরীক্ষার ধরন নির্ধারণ করে না; নির্ধারণ করে নিয়োগকারী কর্তৃপক্ষ, নিয়োগ বিধিমালা, পদের প্রকৃতি ও নির্দিষ্ট বিজ্ঞপ্তি।',
              en: 'Non-cadre posts under the National Pay Scale — from supervisory/clerical to office support/operational posts. One sentence governs this whole section: grade does not determine the exam pattern; the recruiting authority, the recruitment rules, the nature of the post and the specific circular do.',
            })}
          </p>
        </Card>
      </Reveal>

      {/* Verification-status legend (§1.2.2, §1.5). */}
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'যাচাইয়ের অবস্থা', en: 'Verification status' })}
          </div>
          {(['verified', 'partially-verified', 'not-verified'] as const).map((status) => {
            const label = grade1120VerificationLabel(status);
            return (
              <div key={status} style={{ marginTop: 10 }}>
                <VerificationChip status={status} />
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                  {t({ bn: label.meaningBn, en: label.meaningEn })}
                </p>
              </div>
            );
          })}
        </Card>
      </Reveal>

      {/* Searchable post directory (§1.2.3, §1.6). */}
      <Reveal>
        <PostDirectory />
      </Reveal>

      {/* Common subjects (§1.2.4) — the shared bank. No counts: the
          cards state only what the bank actually holds, via the
          common-preparation page. */}
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'সাধারণ বিষয়', en: 'Common subjects' })}</h2>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { bn: 'বাংলা', en: 'Bangla' },
          { bn: 'ইংরেজি', en: 'English' },
          { bn: 'গণিত', en: 'Math' },
          { bn: 'সাধারণ জ্ঞান', en: 'General Knowledge' },
        ].map((s, i) => (
          <Reveal key={s.en} delayMs={Math.min(i, 3) * 60}>
            <Card>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>{t(s)}</div>
              <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14 }}>
                {t({ bn: 'সাধারণ ব্যাংক থেকে অনুশীলন', en: 'Practice from the shared bank' })}
              </p>
              <Link to="/jobs/common" style={{ fontWeight: 600 }}>
                {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
              </Link>
            </Card>
          </Reveal>
        ))}
      </div>

      {/* Practical preparation strip (§1.2.5). */}
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'ব্যবহারিক প্রস্তুতি', en: 'Practical preparation' })}</h2>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <Reveal delayMs={0}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
              {t({ bn: 'টাইপিং অনুশীলন', en: 'Typing practice' })}
            </div>
            <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'বাংলা + ইংরেজি টাইপিং — গতি, নির্ভুলতা, ভুলের সংখ্যা। কর্তৃপক্ষের ব্যবহারিক পরীক্ষার হুবহু নকল নয়।',
                en: 'Bangla + English typing — speed, accuracy, error count. Not an exact replica of the authority’s practical test.',
              })}
            </p>
            <LinkButton to="/jobs/grade-11-20/typing" variant="accent">
              {t({ bn: 'টাইপিং অনুশীলন করুন →', en: 'Practise typing →' })}
            </LinkButton>
          </Card>
        </Reveal>
        <Reveal delayMs={80}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
              {t({ bn: 'কম্পিউটার দক্ষতা', en: 'Computer skills' })}
            </div>
            <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'Word/Excel/PowerPoint ও ফাইল ব্যবস্থাপনার অনুশীলন এখনো তৈরি হচ্ছে।',
                en: 'Word/Excel/PowerPoint and file-management practice is still being prepared.',
              })}
            </p>
          </Card>
        </Reveal>
        <Reveal delayMs={160}>
          <Card>
            <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
              {t({ bn: 'হিসাববিজ্ঞান অনুশীলন', en: 'Accounting practice' })}
            </div>
            <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: 'ডেবিট/ক্রেডিট, খতিয়ান ও নগদান বইয়ের অনুশীলন এখনো তৈরি হচ্ছে।',
                en: 'Debit/credit, ledger and cash-book practice is still being prepared.',
              })}
            </p>
          </Card>
        </Reveal>
      </div>

      {/* Post-family cards (§1.2.6, §1.3). */}
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'পদ পরিবার', en: 'Post families' })}</h2>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 20 }}>
        {GRADE_11_20_POST_FAMILIES.map((f, i) => {
          const label = grade1120VerificationLabel(f.verificationStatus);
          return (
            <Reveal key={f.slug} delayMs={Math.min(i, 5) * 60}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
                    {lang === 'bn' ? f.nameBn : f.nameEn}
                  </div>
                  <VerificationChip status={f.verificationStatus} />
                </div>
                <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.7 }}>
                  {t({ bn: label.meaningBn, en: label.meaningEn })}
                </p>
                <p style={{ margin: '0 0 10px', color: 'var(--muted)', fontSize: 13 }}>
                  {t({ bn: `গ্রেড: উল্লেখ নেই`, en: `Grade: not stated` })}
                  {f.practicalSkill !== 'none'
                    ? t({ bn: ` · ${f.practicalBn}`, en: ` · ${f.practicalEn}` })
                    : ''}
                </p>
                <p style={{ margin: 0 }}>
                  <Link to={`/jobs/grade-11-20/posts/${f.slug}`} style={{ fontWeight: 600 }}>
                    {t({ bn: 'পদটি দেখুন →', en: 'See this post →' })}
                  </Link>
                </p>
              </Card>
            </Reveal>
          );
        })}
      </div>

      {/* Model tests (§1.2.7) — only verified-pattern tests are
          "real-pattern"; everything else is general practice. */}
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'মডেল টেস্ট', en: 'Model tests' })}
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({
              bn: 'যাচাইকৃত ধরনের মডেল টেস্ট এখনো নেই — কোনো পদের ধরনই এখনো যাচাই হয়নি। সাধারণ অনুশীলন টেস্ট (আসল ধরনের দাবি ছাড়া) কমন প্রস্তুতি থেকে দেওয়া যাবে।',
              en: 'There is no verified-pattern model test yet — no post’s pattern is verified yet. General practice tests (with no real-pattern claim) can be taken from common preparation.',
            })}
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <LinkButton to="/jobs/common" variant="accent">
              {t({ bn: 'কমন প্রস্তুতি দেখুন →', en: 'See common preparation →' })}
            </LinkButton>
          </p>
        </Card>
      </Reveal>

      {/* Previous questions (§1.2.8) — the honest empty state (§3.1). */}
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'যাচাইকৃত বিগত প্রশ্ন এখনো সংগ্রহ হয়নি', en: 'No verified previous questions collected yet' })}
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'বিগত প্রশ্ন সংগ্রহ ও যাচাই চলছে। অযাচাইকৃত প্রশ্ন কখনো "বিগত প্রশ্ন" হিসেবে দেখানো হবে না।',
              en: 'Previous questions are being collected and verified. Unverified questions are never shown as "previous questions".',
            })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14 }}>
            {t({ bn: 'যাচাইকৃত বিগত প্রশ্ন: ০টি', en: 'Verified previous questions: 0' })}
          </p>
        </Card>
      </Reveal>

      {/* Recruitment notices (§1.2.9). */}
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'নিয়োগ বিজ্ঞপ্তি', en: 'Recruitment notices' })}
          </div>
          <p style={{ margin: '8px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: '১১–২০ গ্রেডের পদের বিজ্ঞপ্তি — শুধু যাচাইকৃত বিজ্ঞপ্তিই যাচাইকৃত বলে দেখানো হয়।',
              en: 'Circulars for Grades 11–20 posts — only verified circulars are shown as verified.',
            })}
          </p>
          <p style={{ margin: 0 }}>
            <LinkButton to="/jobs/circulars" variant="accent">
              {t({ bn: 'বিজ্ঞপ্তি দেখুন →', en: 'See circulars →' })}
            </LinkButton>
          </p>
        </Card>
      </Reveal>

      {bcs ? (
        <Reveal>
          <Card>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
              {t({
                bn: '১১–২০ গ্রেডের নিয়োগ BCS/BPSC-র নিয়োগ নয় — BPSC একটি আলাদা কর্তৃপক্ষ। BCS প্রস্তুতি আলাদা বিভাগে আছে।',
                en: 'Grades 11–20 recruitment is not BCS/BPSC recruitment — BPSC is a distinct authority. BCS preparation is in its own section.',
              })}
            </p>
            <p style={{ margin: '12px 0 0' }}>
              <Link to={`/jobs/${bcs.slug}`} style={{ fontWeight: 600 }}>
                {t({ bn: 'BCS প্রস্তুতি দেখুন →', en: 'See BCS preparation →' })}
              </Link>
            </p>
          </Card>
        </Reveal>
      ) : null}
    </>
  );
}
