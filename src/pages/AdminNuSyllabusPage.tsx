// Eduvelto — Admin: NU syllabus seed (NU-6, 22 Nov 2026; design
// doc §19.2.3, §19.3.4).
//
// Owner/Admin only (AdminGuard on the route + firestore.rules on
// every write). One button applies the 177 seed documents
// (nuSubjects 6, nuChapters 11, nuTopics 80, nuLessons 80) through
// lib/nuAdmin.ts: everything is validated client-side first, then
// written in dependency order, then one audit entry is logged, then
// every doc is read back and compared to the seed. The page shows
// per-collection summary counts and a per-doc status (matches /
// differs / missing / unreadable), grouped by collection so the 177
// rows stay readable.
//
// All 177 docs are status 'draft' and syllabusVerified false —
// nothing is Published until a verified teacher reviews it (0
// verified teachers today). Applying the seed here does NOT switch
// the subject/topic pages' read path to Firestore — the pages still
// render the code-backed syllabus until a live seed exists and
// matches (NU_SYLLABUS_READ_FROM_FIRESTORE stays false).

import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Card, AlertBox } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { requireDb } from '../components/AdminShared';
import { applyNuSyllabusSeedDocs, checkNuSyllabusSeedStatus, type NuSeedStatusRow } from '../lib/nuAdmin';
import { nuSyllabusSeedDocs } from '../lib/nuSyllabus';

const STATUS_BN: Record<NuSeedStatusRow['status'], string> = {
  matches: 'মিলেছে ✓',
  differs: 'অমিল — সীডের সঙ্গে মেলে না',
  missing: 'নেই — এখনো প্রয়োগ হয়নি',
  unreadable: 'পড়া যায়নি — আবার চেষ্টা করুন',
};
const STATUS_EN: Record<NuSeedStatusRow['status'], string> = {
  matches: 'Matches ✓',
  differs: 'Differs — does not match the seed',
  missing: 'Missing — not applied yet',
  unreadable: 'Unreadable — try again',
};

const COLLECTIONS = ['nuSubjects', 'nuChapters', 'nuTopics', 'nuLessons'] as const;

const COLLECTION_BN: Record<string, string> = {
  nuSubjects: 'বিষয়',
  nuChapters: 'অধ্যায়',
  nuTopics: 'টপিক',
  nuLessons: 'পাঠ',
};

export default function AdminNuSyllabusPage() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<NuSeedStatusRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [appliedAt, setAppliedAt] = useState('');

  async function load(): Promise<void> {
    setLoading(true);
    setError('');
    try {
      setRows(await checkNuSyllabusSeedStatus(requireDb()));
    } catch {
      setError(
        t({
          bn: 'সীডের স্থিতি পড়া যায়নি — আবার চেষ্টা করুন।',
          en: 'Could not read the seed status — please try again.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function apply(): Promise<void> {
    setBusy(true);
    setError('');
    setAppliedAt('');
    try {
      const next = await applyNuSyllabusSeedDocs(requireDb());
      setRows(next);
      setAppliedAt(new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-GB'));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t({ bn: 'প্রয়োগ করা যায়নি — আবার চেষ্টা করুন।', en: 'Could not apply — please try again.' }),
      );
    } finally {
      setBusy(false);
    }
  }

  const seeds = nuSyllabusSeedDocs();
  const matched = rows?.filter((r) => r.status === 'matches').length ?? 0;

  return (
    <PageShell titleBn="NU পাঠ্যসূচি — সীড ডকুমেন্ট" titleEn="NU syllabus — seed documents" wide>
      <p style={{ color: '#444', lineHeight: 1.8 }}>
        {t({
          bn: 'জাতীয় বিশ্ববিদ্যালয় ভর্তির পাঠ্যসূচি — বিষয়, অধ্যায়, টপিক ও পাঠ — Firestore ডকুমেন্ট হিসেবে। শুধু Owner/Admin প্রয়োগ করতে পারেন। প্রয়োগের আগে সব ডকুমেন্ট যাচাই করা হয়; প্রয়োগের পরে প্রতিটি ডকুমেন্ট পড়ে সীডের সঙ্গে মিলিয়ে দেখা হয়; প্রতিটি প্রয়োগ অডিট লগে লেখা হয়। সব ডকুমেন্ট খসড়া (draft) — শিক্ষক যাচাই ছাড়া কিছুই প্রকাশিত নয়।',
          en: 'The National University admission syllabus — subjects, chapters, topics and lessons — as Firestore documents. Only Owner/Admin can apply them. Every document is validated before applying; after applying, each document is read back and compared to the seed; every application is written to the audit log. All documents are drafts — nothing is published without teacher verification.',
        })}
      </p>
      <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8 }}>
        {t({
          bn: 'সতর্কতা: সীড প্রয়োগ করলেই বিষয়/টপিক পাতার পড়ার পথ Firestore-এ বদলে যায় না — পাতাগুলো এখনো যাচাইকৃত পাঠ্যসূচি কোড থেকে দেখায়। পড়ার পথ বদলানো পরের ধাপের আলাদা সিদ্ধান্ত।',
          en: 'Note: applying the seed does not switch the subject/topic pages’ read path to Firestore — the pages still show the verified syllabus from code. Switching the read path is a separate later decision.',
        })}
      </p>

      {error ? <AlertBox tone="error">{error}</AlertBox> : null}
      {appliedAt ? (
        <AlertBox tone="ok">
          {t({ bn: `প্রয়োগ হয়েছে — ${appliedAt}। নিচে প্রতিটি ডকুমেন্টের মিল যাচাই করুন।`, en: `Applied — ${appliedAt}. Verify each document’s match below.` })}
        </AlertBox>
      ) : null}

      <Card>
        <h3 style={{ marginTop: 0 }}>
          {t({ bn: `সীড ডকুমেন্ট — ${seeds.length}টি`, en: `Seed documents — ${seeds.length}` })}
          {rows ? ` · ${matched}/${seeds.length} ${t({ bn: 'মিলেছে', en: 'match' })}` : ''}
        </h3>
        <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8, marginTop: 0 }}>
          {COLLECTIONS.map((c) => {
            const total = seeds.filter((s) => s.collection === c).length;
            const ok = rows?.filter((r) => r.collection === c && r.status === 'matches').length ?? 0;
            return `${c} ${rows ? `${ok}/${total}` : `${total}`} · `;
          }).join('').replace(/ · $/, '')}
        </p>
        {COLLECTIONS.map((collection, idx) => {
          const group = seeds.filter((s) => s.collection === collection);
          return (
            <details key={collection} open={idx === 0} style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
                {t({ bn: `${COLLECTION_BN[collection]} — ${collection} (${group.length}টি)`, en: `${collection} (${group.length})` })}
              </summary>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 6 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #D9DEE2' }}>
                    <th style={{ padding: '8px 4px' }}>{t({ bn: 'ডকুমেন্ট', en: 'Document' })}</th>
                    <th style={{ padding: '8px 4px' }}>{t({ bn: 'স্থিতি', en: 'Status' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((s) => {
                    const row = rows?.find((r) => r.collection === s.collection && r.docId === s.docId);
                    return (
                      <tr key={`${s.collection}/${s.docId}`} style={{ borderBottom: '1px solid #E5E8E5' }}>
                        <td style={{ padding: '8px 4px', fontWeight: 600 }}>{s.docId}</td>
                        <td style={{ padding: '8px 4px' }}>
                          {loading
                            ? t({ bn: 'পড়া হচ্ছে…', en: 'Reading…' })
                            : row
                              ? lang === 'bn' ? STATUS_BN[row.status] : STATUS_EN[row.status]
                              : t({ bn: 'অজানা', en: 'Unknown' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          );
        })}
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            {t({ bn: 'সীডের মান দেখুন (যাচাইকৃত বিজ্ঞপ্তি ও NCTB বই থেকে)', en: 'See the seed values (from the verified circular and NCTB books)' })}
          </summary>
          <ul style={{ lineHeight: 1.9, color: '#3A444B', fontSize: 14 }}>
            <li>{t({ bn: 'বাংলা ২০ / ইংরেজি ২০ / সাধারণ জ্ঞান ২০ / শাখা ৪০ — শাখা-৪০ একটিই ব্লক (বিভাজন: null)', en: 'Bangla 20 / English 20 / General Knowledge 20 / Group 40 — the group 40 is a single block (split: null)' })}</li>
            <li>{t({ bn: 'অধ্যায় ১১টি · টপিক ৮০টি · পাঠ ৮০টি (খসড়া) — উৎস: NCTB সাহিত্যপাঠ, English for Today, HSC ব্যাকরণ/লিখন', en: '11 chapters · 80 topics · 80 lessons (drafts) — sources: NCTB Sahityapath, English for Today, HSC grammar/writing' })}</li>
            <li>{t({ bn: '২০২৬-২৭-এর কোনো বিজ্ঞপ্তি নেই — সিলেবাস যাচাই না হওয়া পর্যন্ত সবকিছু খসড়া থাকবে।', en: 'No 2026-27 circular exists — everything stays draft until the syllabus is verified.' })}</li>
          </ul>
        </details>
      </Card>

      <p style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => void apply()}
          disabled={busy || loading}
          style={{ padding: '12px 22px', minHeight: 48, borderRadius: 6, border: 'none', background: '#1E3A5F', color: '#fff', fontWeight: 700, cursor: busy ? 'wait' : 'pointer', fontSize: 15 }}
        >
          {busy
            ? t({ bn: 'প্রয়োগ করা হচ্ছে…', en: 'Applying…' })
            : t({ bn: 'সীড ডকুমেন্ট প্রয়োগ করুন', en: 'Apply seed documents' })}
        </button>
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy || loading}
          style={{ padding: '12px 22px', minHeight: 48, borderRadius: 6, border: '1px solid #1E3A5F', background: '#fff', color: '#1E3A5F', fontWeight: 700, cursor: 'pointer', fontSize: 15 }}
        >
          {t({ bn: 'স্থিতি আবার পড়ুন', en: 'Re-read status' })}
        </button>
      </p>
      <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8 }}>
        {t({
          bn: 'প্রয়োগের আগে সব ডকুমেন্ট যাচাই করা হয় — একটিও ভুল হলে কিছুই লেখা হয় না। লেখা ডকুমেন্ট কখনো মোছা যায় না (নিয়মে delete নিষিদ্ধ) — ভুল হলে নতুন সংস্করণে সংশোধন করতে হয়।',
          en: 'All documents are validated before applying — if even one is wrong, nothing is written. Written documents can never be deleted (delete is forbidden in the rules) — a mistake is fixed in a new version.',
        })}
      </p>
    </PageShell>
  );
}
