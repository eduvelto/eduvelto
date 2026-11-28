// Eduvelto — Interview Questions tool UI (28 Nov 2026).
//
// Category filter + expandable list of 12 common interview questions.
// Each answer is a preparation guide (how to answer well), not a script
// to memorize. Static data only — no network, no storage, no AI.
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolSection, noteStyle } from './eduToolUi';
import {
  INTERVIEW_CATEGORIES,
  INTERVIEW_INTRO,
  interviewCategoryById,
  interviewQuestionsByCategory,
  type InterviewCategoryId,
} from '../../lib/tools/interviewQuestions';

export function InterviewQuestionsTool() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<InterviewCategoryId | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = interviewQuestionsByCategory(category);

  return (
    <ToolSection id="interview-questions-title" titleBn="ইন্টারভিউ প্রশ্নোত্তর" titleEn="Interview Questions"
      descBn="১২টি সাধারণ ইন্টারভিউ প্রশ্ন ও প্রতিটির উত্তরের প্রস্তুতি-নির্দেশনা।"
      descEn="12 common interview questions, each with a guide on how to prepare a good answer.">
      <p style={noteStyle}>{t(INTERVIEW_INTRO)}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }} role="group"
        aria-label={t({ bn: 'বিভাগ অনুযায়ী ছাঁকুন', en: 'Filter by category' })}>
        <button
          type="button"
          className="ev-btn ev-btn-outline"
          style={{ minHeight: 40 }}
          aria-pressed={category === 'all'}
          onClick={() => { setCategory('all'); setOpenId(null); }}
        >
          {t({ bn: 'সবগুলো', en: 'All' })}
        </button>
        {INTERVIEW_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className="ev-btn ev-btn-outline"
            style={{ minHeight: 40 }}
            aria-pressed={category === c.id}
            onClick={() => { setCategory(c.id); setOpenId(null); }}
          >
            {t({ bn: c.bn, en: c.en })}
          </button>
        ))}
      </div>

      <ol style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
        {visible.map((q, index) => {
          const open = openId === q.id;
          const cat = interviewCategoryById(q.category);
          return (
            <li key={q.id} style={{
              border: '1px solid var(--line)',
              borderRadius: 10,
              background: 'var(--surface)',
              overflow: 'hidden',
            }}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`iq-guide-${q.id}`}
                onClick={() => setOpenId(open ? null : q.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  color: 'var(--heading)',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                <span aria-hidden="true" style={{ flexShrink: 0, color: 'var(--muted)' }}>
                  {open ? '−' : '+'}
                </span>
                <span>
                  {index + 1}. {t({ bn: q.questionBn, en: q.questionEn })}
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 400, color: 'var(--muted)', marginTop: 2 }}>
                    {t({ bn: cat.bn, en: cat.en })}
                  </span>
                </span>
              </button>
              {open && (
                <p id={`iq-guide-${q.id}`} style={{ margin: 0, padding: '0 14px 14px 38px', fontSize: 14, lineHeight: 1.7, color: 'var(--heading)' }}>
                  {t({ bn: q.guideBn, en: q.guideEn })}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <p style={noteStyle}>
        {t({
          bn: 'মনে রাখবেন: ভালো উত্তর মানে নিজের অভিজ্ঞতার সত্যিকারের উদাহরণ — অন্যের মুখস্থ উত্তর নয়।',
          en: 'Remember: a good answer means a real example from your own experience — not someone else’s memorized answer.',
        })}
      </p>
    </ToolSection>
  );
}
