// Eduvelto — Job Step 16 (viva / career / CV) guide pages.
//
// Three reading pages — /jobs/viva, /jobs/career, /jobs/cv — sharing one
// renderer. READING MATERIAL ONLY: no quiz, no mock, no scoring, no
// "viva simulator", no AI interviewer. The 15 items are code content in
// src/lib/jobVivaCareer.ts (zero Firestore reads/writes) and are shaped
// 1:1 on the jobLessons schema so a future loader can swap the source
// without rewriting the pages.
//
// Honesty (binding): the disclaimer at the top of every page states the
// material is general guidance, not an official syllabus, verified exam
// pattern or circular. No "Verified" badge anywhere. No viva marks, no
// NTRCA cycle pattern, no age limit, fee or date is written as fact.
// The viva checklist + self-introduction draft are LOCAL ONLY
// (localStorage) — nothing leaves the device.
//
// Typography (Gemini + ChatGPT): Bangla body 16px, line-height 1.75,
// headings 20px, stacked cards / simple bullet lists — no cramped
// multi-column tables on narrow screens.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { AlertBox, Card, Chip, LinkButton, Reveal } from '../components/ui';
import { useLanguage, type LangEntry } from '../i18n/LanguageContext';
import {
  JOB_CAREER_ITEMS,
  JOB_CV_ITEMS,
  JOB_VIVA_ITEMS,
  type JobGuideItem,
  type JobGuideKind,
} from '../lib/jobVivaCareer';

export type GuideKind = JobGuideKind;

/** The reusable general-guidance disclaimer (ChatGPT) — on all 3 pages. */
const DISCLAIMER_BN =
  'গুরুত্বপূর্ণ তথ্য: এই পৃষ্ঠার বিষয়বস্তু সাধারণ শিক্ষামূলক ও প্রস্তুতিমূলক নির্দেশনা। ' +
  'এখানে দেওয়া পরামর্শ কোনো নির্দিষ্ট নিয়োগ পরীক্ষার অফিসিয়াল সিলেবাস, প্রশ্নপ্যাটার্ন, নম্বরবণ্টন, ' +
  'যোগ্যতার শর্ত বা নিয়োগ বিজ্ঞপ্তির বিকল্প নয়। নিয়োগসংক্রান্ত বয়সসীমা, ফি, তারিখ, যোগ্যতা ও অন্যান্য শর্ত ' +
  'জানতে সংশ্লিষ্ট প্রতিষ্ঠানের সর্বশেষ অফিসিয়াল বিজ্ঞপ্তি অনুসরণ করুন। উদাহরণগুলো অনুশীলনের জন্য তৈরি; ' +
  'এগুলো কোনো প্রকৃত পরীক্ষার প্রশ্ন বা নিশ্চিত প্রশ্নের তালিকা নয়।';

const DISCLAIMER_EN =
  'Important: this page is general educational and preparatory guidance. ' +
  'It is not a substitute for any specific recruitment exam’s official syllabus, question pattern, ' +
  'mark distribution, eligibility conditions, or recruitment circular. For age limits, fees, dates, ' +
  'eligibility and other conditions, follow the latest official circular of the relevant institution. ' +
  'Examples are for practice only; they are not real exam questions or a confirmed question list.';

const PAGE_META: Record<
  GuideKind,
  {
    title: LangEntry;
    tagline: LangEntry;
    note: LangEntry | null;
    items: JobGuideItem[];
    related: Array<{ to: string; label: LangEntry }>;
  }
> = {
  viva: {
    title: { bn: 'ভাইভা ও ইন্টারভিউ', en: 'Viva & Interview' },
    tagline: {
      bn: 'নিজেকে কীভাবে উপস্থাপন করবেন — সাধারণ প্রস্তুতিমূলক নির্দেশনা।',
      en: 'How to present yourself — general preparatory guidance.',
    },
    note: {
      bn: 'প্রস্তুতির উপকরণ — অনলাইন ভাইভা নয়।',
      en: 'Preparation material — not an online viva.',
    },
    items: JOB_VIVA_ITEMS,
    related: [
      { to: '/jobs/wrong-answers', label: { bn: 'ভুল-উত্তর নোটবুক', en: 'Wrong-Answer Notebook' } },
      { to: '/jobs/planner', label: { bn: 'পড়ার পরিকল্পনা', en: 'Study Planner' } },
      { to: '/jobs/common', label: { bn: 'কমন প্রস্তুতি (MCQ)', en: 'Common Preparation (MCQ)' } },
    ],
  },
  career: {
    title: { bn: 'ক্যারিয়ার গাইডলাইন', en: 'Career Guidance' },
    tagline: {
      bn: 'কোন পথে এগোবেন — নিজের যোগ্যতা ও আগ্রহ বুঝে সিদ্ধান্ত নিন।',
      en: 'Which path to take — decide by understanding your own ability and interests.',
    },
    note: {
      bn: 'এই পাতার কোনো পরামর্শ চাকরির নিশ্চয়তা দেয় না।',
      en: 'No advice on this page guarantees a job.',
    },
    items: JOB_CAREER_ITEMS,
    related: [
      { to: '/jobs/planner', label: { bn: 'পড়ার পরিকল্পনা', en: 'Study Planner' } },
      { to: '/jobs/dashboard', label: { bn: 'চাকরির ড্যাশবোর্ড', en: 'Job Dashboard' } },
      { to: '/jobs/circulars', label: { bn: 'চাকরির বিজ্ঞপ্তি', en: 'Job Circulars' } },
    ],
  },
  cv: {
    title: { bn: 'সিভি ও রিজিউমে', en: 'CV & Resume' },
    tagline: {
      bn: 'নিজের যোগ্যতা কীভাবে উপস্থাপন করবেন — সত্যি করে, পরিচ্ছন্নভাবে।',
      en: 'How to present your ability — truthfully, and cleanly.',
    },
    note: null,
    items: JOB_CV_ITEMS,
    related: [
      { to: '/jobs/career', label: { bn: 'ক্যারিয়ার গাইডলাইন', en: 'Career Guidance' } },
      { to: '/jobs/viva', label: { bn: 'ভাইভা ও ইন্টারভিউ', en: 'Viva & Interview' } },
    ],
  },
};

const SWITCHER: Array<{ kind: GuideKind; to: string; label: LangEntry }> = [
  { kind: 'viva', to: '/jobs/viva', label: { bn: 'ভাইভা', en: 'Viva' } },
  { kind: 'career', to: '/jobs/career', label: { bn: 'ক্যারিয়ার', en: 'Career' } },
  { kind: 'cv', to: '/jobs/cv', label: { bn: 'সিভি', en: 'CV' } },
];

/** Document checklist (viva page) — general preparation only. Which
 *  documents a circular actually asks for is written in that circular;
 *  the note above the list says so, and no item claims to be compulsory. */
const CHECKLIST_ITEMS: Array<{ slug: string; bn: string; en: string }> = [
  { slug: 'application', bn: 'আবেদনপত্রের কপি', en: 'Copy of the application form' },
  { slug: 'certificates', bn: 'শিক্ষাগত সনদপত্র (মূল ও ফটোকপি)', en: 'Academic certificates (original + photocopy)' },
  { slug: 'nid', bn: 'জাতীয় পরিচয়পত্র', en: 'National ID card' },
  { slug: 'photos', bn: 'পাসপোর্ট সাইজের ছবি', en: 'Passport-size photos' },
  { slug: 'cv', bn: 'সিভির কপি', en: 'Copy of your CV' },
  { slug: 'pen', bn: 'কলম', en: 'A pen' },
];

const CHECKLIST_KEY = 'eduvelto:job:viva-checklist';
const DRAFT_KEY = 'eduvelto:job:viva-intro-draft';

function loadChecked(): string[] {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : [];
  } catch {
    return [];
  }
}

function loadDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) ?? '';
  } catch {
    return '';
  }
}

function VivaPrepTools() {
  const { t } = useLanguage();
  const [checked, setChecked] = useState<string[]>(() => loadChecked());
  const [draft, setDraft] = useState<string>(() => loadDraft());

  useEffect(() => {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked));
    } catch {
      // Local-only state; a storage failure must never break the page.
    }
  }, [checked]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, draft);
    } catch {
      // Local-only state; a storage failure must never break the page.
    }
  }, [draft]);

  const toggle = (slug: string) =>
    setChecked((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );

  return (
    <>
      <Reveal>
        <h2 className="ev-section-h2">
          {t({ bn: 'নিজের প্রস্তুতি', en: 'Your own preparation' })}
        </h2>
      </Reveal>
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'কাগজপত্রের চেকলিস্ট', en: 'Document checklist' })}
          </div>
          <p style={{ margin: '6px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'নিচের তালিকাটি সাধারণ প্রস্তুতির জন্য — কোন কাগজপত্র লাগবে, সেটা প্রতিটি বিজ্ঞপ্তিতে লেখা থাকে; বিজ্ঞপ্তি দিয়েই মিলিয়ে নিন। টিক দেওয়া শুধু আপনার ডিভাইসে থাকে।',
              en: 'This list is for general preparation — each circular states which documents it needs; check against the circular. Your ticks stay on this device only.',
            })}
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {CHECKLIST_ITEMS.map((item) => (
              <li key={item.slug} style={{ marginBottom: 8 }}>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 15, lineHeight: 1.6 }}>
                  <input
                    type="checkbox"
                    checked={checked.includes(item.slug)}
                    onChange={() => toggle(item.slug)}
                    style={{ marginTop: 4, width: 18, height: 18, accentColor: '#0A1F44' }}
                  />
                  <span style={{ color: checked.includes(item.slug) ? 'var(--muted)' : 'var(--text)', textDecoration: checked.includes(item.slug) ? 'line-through' : 'none' }}>
                    {t({ bn: item.bn, en: item.en })}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 13 }}>
            {t({
              bn: `টিক দেওয়া হয়েছে: ${checked.length}/${CHECKLIST_ITEMS.length}`,
              en: `Checked: ${checked.length}/${CHECKLIST_ITEMS.length}`,
            })}
          </p>
        </Card>
      </Reveal>
      <Reveal>
        <Card>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'নিজের পরিচয়ের খসড়া', en: 'Self-introduction draft' })}
          </div>
          <p style={{ margin: '6px 0 12px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
            {t({
              bn: 'নিজের পরিচয় কীভাবে দেবেন, সেটার খসড়া এখানে লিখে রাখুন — নাম, পড়াশোনা, কেন এই পদ। এই খসড়া শুধু আপনার ডিভাইসে থাকে — সার্ভারে পাঠানো হয় না।',
              en: 'Draft your self-introduction here — name, education, why this post. This draft stays on your device only — it is never sent to the server.',
            })}
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder={t({
              bn: 'আমার নাম…। আমি… থেকে পড়াশোনা করেছি। এই পদে আবেদন করেছি কারণ…',
              en: 'My name is… I studied… at…. I applied for this post because…',
            }) as string}
            aria-label={t({ bn: 'নিজের পরিচয়ের খসড়া', en: 'Self-introduction draft' })}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: "'Hind Siliguri','Noto Sans Bengali',system-ui,sans-serif",
              fontSize: 15,
              lineHeight: 1.7,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
          <p style={{ margin: '10px 0 0', display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setDraft('')}
              style={{
                background: 'none',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {t({ bn: 'খসড়া মুছে ফেলুন', en: 'Clear draft' })}
            </button>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>
              {t({ bn: 'স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়।', en: 'Saved automatically.' })}
            </span>
          </p>
        </Card>
      </Reveal>
    </>
  );
}

export default function JobGuidePage({ kind }: { kind: GuideKind }) {
  const { t } = useLanguage();
  const meta = PAGE_META[kind];
  const items = meta.items;
  const totalMinutes = items.reduce((sum, it) => sum + it.readMinutes, 0);

  return (
    <PageShell titleBn={meta.title.bn} titleEn={meta.title.en} wide>
      <p style={{ margin: '0 0 16px' }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          {t({ bn: '← চাকরির প্রস্তুতিতে ফিরুন', en: '← Back to Job Preparation' })}
        </Link>
      </p>

      {/* Top switcher across the three guide pages. */}
      <nav
        aria-label={t({ bn: 'ভাইভা, ক্যারিয়ার ও সিভি', en: 'Viva, Career & CV' })}
        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}
      >
        {SWITCHER.map((s) => (
          <Link
            key={s.kind}
            to={s.to}
            aria-current={s.kind === kind ? 'page' : undefined}
            style={{
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
              padding: '8px 16px',
              borderRadius: 999,
              border: '1px solid var(--line)',
              background: s.kind === kind ? '#0A1F44' : 'var(--surface)',
              color: s.kind === kind ? '#fff' : 'var(--text)',
            }}
          >
            {t(s.label)}
          </Link>
        ))}
      </nav>

      <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 15, lineHeight: 1.7 }}>
        {t(meta.tagline)}
        {meta.note ? (
          <>
            {' '}
            <strong style={{ color: 'var(--text)' }}>{t(meta.note)}</strong>
          </>
        ) : null}
      </p>

      <Reveal>
        <div style={{ marginBottom: 20 }}>
          <AlertBox tone="info">{t({ bn: DISCLAIMER_BN, en: DISCLAIMER_EN })}</AlertBox>
        </div>
      </Reveal>

      {/* Item list — numbered, title + minutes + anchor to the article. */}
      <Reveal>
        <h2 className="ev-section-h2">
          {t({
            bn: `${items.length}টি পাঠ — মোট প্রায় ${totalMinutes} মিনিট`,
            en: `${items.length} lessons — about ${totalMinutes} minutes in total`,
          })}
        </h2>
      </Reveal>
      <Reveal>
        <Card>
          <ol style={{ margin: 0, paddingLeft: 22 }}>
            {items.map((item, i) => (
              <li key={item.slug} style={{ marginBottom: i === items.length - 1 ? 0 : 10, lineHeight: 1.6 }}>
                <a href={`#${item.slug}`} style={{ fontWeight: 700, fontSize: 15 }}>
                  {t({ bn: item.titleBn, en: item.titleEn })}
                </a>{' '}
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {t({ bn: `${item.readMinutes} মিনিট`, en: `${item.readMinutes} min` })}
                </span>{' '}
                <a href={`#${item.slug}`} style={{ fontSize: 13, fontWeight: 600 }}>
                  {t({ bn: 'পড়া শুরু করুন →', en: 'Start reading →' })}
                </a>
              </li>
            ))}
          </ol>
        </Card>
      </Reveal>

      {/* The reading items. */}
      {items.map((item, i) => (
        <Reveal key={item.slug}>
          <article id={item.slug} style={{ scrollMarginTop: 80 }}>
            <Card>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                <Chip tone="blue">
                  {t({ bn: `পাঠ ${i + 1}`, en: `Lesson ${i + 1}` })}
                </Chip>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {t({ bn: `${item.readMinutes} মিনিট`, en: `${item.readMinutes} min` })}
                </span>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {t({ bn: 'পড়ার উপকরণ', en: 'Reading material' })}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--heading)',
                  margin: '0 0 8px',
                  lineHeight: 1.4,
                }}
              >
                {t({ bn: item.titleBn, en: item.titleEn })}
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: 16, lineHeight: 1.75, color: 'var(--text)' }}>
                {item.introBn}
              </p>
              {item.sections.map((section) => (
                <div key={section.headingBn} style={{ marginBottom: 14 }}>
                  <h3
                    style={{
                      fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
                      fontSize: 17,
                      fontWeight: 700,
                      color: 'var(--heading)',
                      margin: '0 0 6px',
                      lineHeight: 1.4,
                    }}
                  >
                    {section.headingBn}
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {section.bulletsBn.map((bullet) => (
                      <li key={bullet} style={{ marginBottom: 6, fontSize: 16, lineHeight: 1.75 }}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div
                style={{
                  background: 'var(--surface-muted)',
                  borderLeft: '4px solid #D9A441',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginTop: 4,
                }}
              >
                <strong style={{ fontSize: 15, color: 'var(--heading)' }}>
                  {t({ bn: 'মনে রাখুন', en: 'Remember' })}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: 15, lineHeight: 1.75 }}>{item.summaryBn}</p>
              </div>
              {/* Previous / Next item links (anchors within the page). */}
              <p
                style={{
                  margin: '16px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  fontSize: 14,
                }}
              >
                {i > 0 ? (
                  <a href={`#${items[i - 1].slug}`} style={{ fontWeight: 600 }}>
                    {t({ bn: `← আগের পাঠ: ${items[i - 1].titleBn}`, en: `← Previous: ${items[i - 1].titleEn}` })}
                  </a>
                ) : (
                  <span />
                )}
                {i < items.length - 1 ? (
                  <a href={`#${items[i + 1].slug}`} style={{ fontWeight: 600 }}>
                    {t({ bn: `পরের পাঠ: ${items[i + 1].titleBn} →`, en: `Next: ${items[i + 1].titleEn} →` })}
                  </a>
                ) : (
                  <span />
                )}
              </p>
            </Card>
          </article>
        </Reveal>
      ))}

      {/* Viva page only: local-only checklist + intro draft. */}
      {kind === 'viva' ? <VivaPrepTools /> : null}

      {/* Related reading links. */}
      <Reveal>
        <h2 className="ev-section-h2">{t({ bn: 'সম্পর্কিত পাতা', en: 'Related pages' })}</h2>
      </Reveal>
      <Reveal>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {meta.related.map((rel) => (
            <LinkButton key={rel.to} to={rel.to} variant="outline">
              {t(rel.label)}
            </LinkButton>
          ))}
        </div>
      </Reveal>
      <p style={{ margin: '20px 0 0', color: 'var(--muted)', fontSize: 13, textAlign: 'center' }}>
        {t({
          bn: 'Eduvelto · শেখার জন্য তৈরি, পরীক্ষার প্যাটার্নের নিশ্চয়তা নয়',
          en: 'Eduvelto · Built for learning, not a guarantee of any exam pattern',
        })}
      </p>
    </PageShell>
  );
}
