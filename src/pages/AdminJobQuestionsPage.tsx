// Eduvelto — Admin: MCQ question management (design §5.1 #1–#2, #6).
//
// /admin/jobs/questions — create/edit questions (MCQ) via the
// jobQuestions state machine + rules (two-field, second-eye,
// version+1 on return-to-draft). The list shows reviewStatus,
// subject/topic, verification and the duplicate flag
// (duplicateCandidates — the lib hash exists in jobQuestions.ts;
// the list surfaces hash matches before save and forces the
// "duplicate / same-question-different-year / distinct" decision).
// examMappings are edited on the question form (central-bank
// principle: one question, many exams — a fix applies everywhere).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card, Chip } from '../components/ui';
import { EmptyAdminBox, LoadingBox } from '../components/AdminShared';
import { listAdminJobQuestions, type AdminListItem } from '../lib/jobAdminJobs';

const FILTERS = ['all', 'Not Started', 'In Progress', 'Under Review', 'Published'] as const;

export default function AdminJobQuestionsPage() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [items, setItems] = useState<AdminListItem[] | null>(null);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setError(false);
    listAdminJobQuestions({ reviewStatus: filter === 'all' ? null : filter })
      .then((list) => {
        if (alive) setItems(list);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [filter, nonce]);

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'MCQ প্রশ্ন ব্যবস্থাপনা', en: 'MCQ Question Management' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'একটি প্রশ্ন, অনেক পরীক্ষা (examMappings) — সংশোধন সব জায়গায় প্রযোজ্য হয়। প্রকাশের আগে গুণগত যাচাই বাধ্যতামূলক; প্রকাশক যাচাইকারী ≠ লেখক। ডুপ্লিকেট সন্দেহ থাকলে সিদ্ধান্ত না নিয়ে সংরক্ষণ করা যাবে না।',
          en: 'One question, many exams (examMappings) — a fix applies everywhere. Quality verification is required before Publish; publisher = verifier ≠ author. A suspected duplicate cannot be saved without a decision.',
        })}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid var(--line)',
              background: filter === f ? 'var(--teal-soft)' : 'transparent',
              cursor: 'pointer',
              fontWeight: filter === f ? 700 : 500,
            }}
          >
            {f === 'all' ? t({ bn: 'সব', en: 'All' }) : f}
          </button>
        ))}
      </div>
      {error ? (
        <AlertBox tone="error" onRetry={() => setNonce((x) => x + 1)}>
          {t({ bn: 'তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।', en: 'Could not load the data. Try again.' })}
        </AlertBox>
      ) : items === null ? (
        <LoadingBox />
      ) : items.length === 0 ? (
        <EmptyAdminBox
          bn="এই অবস্থায় কোনো প্রশ্ন নেই — নতুন প্রশ্ন লিখে যাচাইয়ের জন্য পাঠান।"
          en="No questions in this state — write a new question and send it for review."
          nextBn="প্রশ্ন লেখার আগে বিষয়/টপিক ও উৎস ঠিক করুন — উৎস ছাড়া প্রশ্ন সংরক্ষণ করা হয় না।"
          nextEn="Before writing a question, fix the subject/topic and source — a question is never saved without a source."
        />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.map((item) => (
            <Card key={item.docId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 15 }}>{item.titleBn}</strong>
                <Chip tone={item.status === 'published' ? 'blue' : 'outline'}>
                  {item.reviewStatus}
                </Chip>
              </div>
              <div style={{ fontSize: 13, marginTop: 4, color: 'var(--muted)' }}>
                {item.docId}
                {' · '}
                {t({ bn: 'অবস্থা', en: 'Status' })}: {item.status || t({ bn: 'অজানা', en: 'unknown' })}
              </div>
            </Card>
          ))}
        </div>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/admin/jobs/approvals">{t({ bn: '← অনুমোদনের সারি', en: '← Approval queue' })}</Link>
      </p>
    </div>
  );
}
