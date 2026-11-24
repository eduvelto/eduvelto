// Eduvelto — Admin: exam creation (gated)
// (design §5.1 #4, §6.3).
//
// /admin/jobs/exams — a new exam is NOT a Firestore write. It is
// a code + rules + seed change (JobExamDef in jobExams.ts, the
// rules allowlist, the seed doc, the route), and it needs OWNER
// approval before it ships. This form gates the proposal: slug,
// Bangla + English names, recruiting body, official URL (or an
// explicit null + reason, as for Private & NGO jobs), and
// scopeStatus. Until every field is filled, the prepared JSON is
// shown as "not ready" and nothing is submitted anywhere.

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Card } from '../components/ui';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export default function AdminJobExamsPage() {
  const { t } = useLanguage();
  const [slug, setSlug] = useState('');
  const [bn, setBn] = useState('');
  const [en, setEn] = useState('');
  const [orgBn, setOrgBn] = useState('');
  const [orgEn, setOrgEn] = useState('');
  const [officialUrl, setOfficialUrl] = useState('');
  const [noOfficialUrl, setNoOfficialUrl] = useState(false);
  const [noOfficialUrlReason, setNoOfficialUrlReason] = useState('');
  const [scopeStatus, setScopeStatus] = useState('');

  const problems = useMemo(() => {
    const p: string[] = [];
    if (!SLUG_RE.test(slug)) p.push(t({ bn: 'স্লাগ: ছোট হাতের অক্ষর/সংখ্যা/হাইফেন (যেমন dgfood)', en: 'Slug: lowercase letters/numbers/hyphens (e.g. dgfood)' }));
    if (bn.trim() === '') p.push(t({ bn: 'বাংলা নাম লাগবে', en: 'Bangla name is required' }));
    if (en.trim() === '') p.push(t({ bn: 'ইংরেজি নাম লাগবে', en: 'English name is required' }));
    if (orgBn.trim() === '' || orgEn.trim() === '') p.push(t({ bn: 'নিয়োগকারী সংস্থার নাম (বাংলা + ইংরেজি) লাগবে', en: 'Recruiting body name (Bangla + English) is required' }));
    if (noOfficialUrl) {
      if (noOfficialUrlReason.trim() === '') p.push(t({ bn: 'অফিসিয়াল URL না থাকলে কারণ লিখতে হবে', en: 'Without an official URL, a reason is required' }));
    } else if (!/^https?:\/\/.+/.test(officialUrl.trim())) {
      p.push(t({ bn: 'অফিসিয়াল URL লাগবে (https://…)', en: 'Official URL is required (https://…)' }));
    }
    if (scopeStatus.trim() === '') p.push(t({ bn: 'scopeStatus লাগবে (যেমন: official-syllabus / community-collected)', en: 'scopeStatus is required (e.g. official-syllabus / community-collected)' }));
    return p;
  }, [slug, bn, en, orgBn, orgEn, officialUrl, noOfficialUrl, noOfficialUrlReason, scopeStatus, t]);

  const ready = problems.length === 0;
  const prepared = ready
    ? JSON.stringify(
        {
          slug,
          bn: bn.trim(),
          en: en.trim(),
          fullBn: bn.trim(),
          fullEn: en.trim(),
          orgBn: orgBn.trim(),
          orgEn: orgEn.trim(),
          officialUrl: noOfficialUrl ? null : officialUrl.trim(),
          officialUrlReason: noOfficialUrl ? noOfficialUrlReason.trim() : null,
          scopeStatus: scopeStatus.trim(),
          patternStatus: 'not_verified',
        },
        null,
        2,
      )
    : null;

  const inputStyle: React.CSSProperties = { padding: '6px 8px', borderRadius: 6, width: '100%' };

  return (
    <div>
      <h1 className="ev-admin-page-title">{t({ bn: 'পরীক্ষা তৈরি (গেটেড)', en: 'New Exam (Gated)' })}</h1>
      <p className="ev-admin-note">
        {t({
          bn: 'নতুন পরীক্ষা Firestore-এ লেখা হয় না — এটি কোড + rules + seed পরিবর্তন, মালিকের অনুমোদন লাগে। এই ফর্মটি প্রস্তাবটি প্রস্তুত করে; সব ক্ষেত্র পূরণ না হলে কিছুই জমা দেওয়া হয় না।',
          en: 'A new exam is not a Firestore write — it is a code + rules + seed change, and it needs owner approval. This form prepares the proposal; nothing is submitted until every field is filled.',
        })}
      </p>
      <Card>
        <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
          <label>
            {t({ bn: 'স্লাগ', en: 'Slug' })}{' '}
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="dgfood" style={inputStyle} />
          </label>
          <label>
            {t({ bn: 'বাংলা নাম', en: 'Bangla name' })}{' '}
            <input value={bn} onChange={(e) => setBn(e.target.value)} style={inputStyle} />
          </label>
          <label>
            {t({ bn: 'ইংরেজি নাম', en: 'English name' })}{' '}
            <input value={en} onChange={(e) => setEn(e.target.value)} style={inputStyle} />
          </label>
          <label>
            {t({ bn: 'নিয়োগকারী সংস্থা (বাংলা)', en: 'Recruiting body (Bangla)' })}{' '}
            <input value={orgBn} onChange={(e) => setOrgBn(e.target.value)} style={inputStyle} />
          </label>
          <label>
            {t({ bn: 'নিয়োগকারী সংস্থা (ইংরেজি)', en: 'Recruiting body (English)' })}{' '}
            <input value={orgEn} onChange={(e) => setOrgEn(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={noOfficialUrl} onChange={(e) => setNoOfficialUrl(e.target.checked)} />
            {t({ bn: 'কোনো একক অফিসিয়াল সাইট নেই', en: 'No single official site' })}
          </label>
          {noOfficialUrl ? (
            <label>
              {t({ bn: 'কারণ', en: 'Reason' })}{' '}
              <input value={noOfficialUrlReason} onChange={(e) => setNoOfficialUrlReason(e.target.value)} style={inputStyle} />
            </label>
          ) : (
            <label>
              {t({ bn: 'অফিসিয়াল URL', en: 'Official URL' })}{' '}
              <input value={officialUrl} onChange={(e) => setOfficialUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
            </label>
          )}
          <label>
            {t({ bn: 'scopeStatus', en: 'scopeStatus' })}{' '}
            <input value={scopeStatus} onChange={(e) => setScopeStatus(e.target.value)} placeholder="official-syllabus" style={inputStyle} />
          </label>
        </div>
        {!ready ? (
          <AlertBox tone="error">
            {t({ bn: 'প্রস্তাব প্রস্তুত নয়:', en: 'Proposal is not ready:' })}
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </AlertBox>
        ) : (
          <>
            <p style={{ margin: '12px 0 0', fontSize: 14, color: '#14532D' }}>
              {t({ bn: 'প্রস্তাব প্রস্তুত — এখন মালিকের অনুমোদন লাগবে। এই প্রস্তাব কোথাও সংরক্ষণ করা হয়নি; অনুমোদনের পর কোড + rules + seed পরিবর্তন হবে।', en: 'Proposal ready — owner approval is now required. This proposal was not saved anywhere; after approval it becomes a code + rules + seed change.' })}
            </p>
            <pre style={{ margin: '12px 0 0', padding: 12, background: 'var(--hover)', borderRadius: 6, overflow: 'auto', fontSize: 13 }}>
              {prepared}
            </pre>
          </>
        )}
      </Card>
      <p style={{ marginTop: 16 }}>
        <Link to="/admin/jobs">{t({ bn: '← চাকরি ব্যবস্থাপনা', en: '← Job Management' })}</Link>
      </p>
    </div>
  );
}
