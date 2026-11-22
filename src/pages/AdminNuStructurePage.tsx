// Eduvelto — Admin: NU structure seed (NU-5, 22 Nov 2026; design
// doc §19.2.1–§19.2.2, §19.3.4).
//
// Owner/Admin only (AdminGuard on the route + firestore.rules on
// every write). One button applies the 7 seed documents
// (nuInstitutions 1, nuGroups 3, nuExamConfigs 2, nuCircularConfigs
// 1) through lib/nuAdmin.ts: everything is validated client-side
// first, then written, then one audit entry is logged, then every
// doc is read back and compared to the seed. The page shows the
// per-doc status (matches / differs / missing / unreadable).
//
// The hub UI does NOT read from Firestore yet (lib/nuStructure.ts):
// it renders the verified facts from code until these live docs
// exist and match. Applying the seed here does NOT switch the read
// path — that switch is a later, explicit step.

import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { Card, AlertBox } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { requireDb } from '../components/AdminShared';
import { applyNuSeedDocs, checkNuSeedStatus, type NuSeedStatusRow } from '../lib/nuAdmin';
import { nuSeedDocs } from '../lib/nuStructure';

const STATUS_BN: Record<NuSeedStatusRow['status'], string> = {
  matches: 'মিলেছে ✓',
  differs: 'অমিল — সীডের সঙ্গে মেলে না',
  missing: 'নেই — এখনো প্রয়োগ হয়নি',
  unreadable: 'পড়া যায়নি — আবার চেষ্টা করুন',
};

export default function AdminNuStructurePage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<NuSeedStatusRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [appliedAt, setAppliedAt] = useState('');

  async function load(): Promise<void> {
    setLoading(true);
    setError('');
    try {
      setRows(await checkNuSeedStatus(requireDb()));
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
      const next = await applyNuSeedDocs(requireDb());
      setRows(next);
      setAppliedAt(new Date().toLocaleString('bn-BD'));
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

  const seeds = nuSeedDocs();
  const matched = rows?.filter((r) => r.status === 'matches').length ?? 0;

  return (
    <PageShell titleBn="NU কাঠামো — সীড ডকুমেন্ট" titleEn="NU structure — seed documents" wide>
      <p style={{ color: '#444', lineHeight: 1.8 }}>
        {t({
          bn: 'জাতীয় বিশ্ববিদ্যালয়ের প্রতিষ্ঠান, শাখা, পরীক্ষার কনফিগ ও বিজ্ঞপ্তি-কনফিগ — Firestore ডকুমেন্ট হিসেবে। শুধু Owner/Admin প্রয়োগ করতে পারেন। প্রয়োগের আগে সব ডকুমেন্ট যাচাই করা হয়; প্রয়োগের পরে প্রতিটি ডকুমেন্ট পড়ে সীডের সঙ্গে মিলিয়ে দেখা হয়; প্রতিটি প্রয়োগ অডিট লগে লেখা হয়।',
          en: 'National University institution, groups, exam configs and circular config — as Firestore documents. Only Owner/Admin can apply them. Every document is validated before applying; after applying, each document is read back and compared to the seed; every application is written to the audit log.',
        })}
      </p>
      <p style={{ color: '#57616A', fontSize: 14, lineHeight: 1.8 }}>
        {t({
          bn: 'সতর্কতা: সীড প্রয়োগ করলেই হাবের পড়ার পথ Firestore-এ বদলে যায় না — হাব এখনো যাচাইকৃত তথ্য কোড থেকে দেখায়। পড়ার পথ বদলানো পরের ধাপের আলাদা সিদ্ধান্ত।',
          en: 'Note: applying the seed does not switch the hub’s read path to Firestore — the hub still shows the verified information from code. Switching the read path is a separate later decision.',
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
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #D9DEE2' }}>
              <th style={{ padding: '8px 4px' }}>{t({ bn: 'কালেকশন', en: 'Collection' })}</th>
              <th style={{ padding: '8px 4px' }}>{t({ bn: 'ডকুমেন্ট', en: 'Document' })}</th>
              <th style={{ padding: '8px 4px' }}>{t({ bn: 'স্থিতি', en: 'Status' })}</th>
            </tr>
          </thead>
          <tbody>
            {seeds.map((s) => {
              const row = rows?.find((r) => r.collection === s.collection && r.docId === s.docId);
              return (
                <tr key={`${s.collection}/${s.docId}`} style={{ borderBottom: '1px solid #E5E8E5' }}>
                  <td style={{ padding: '8px 4px' }}>{s.collection}</td>
                  <td style={{ padding: '8px 4px', fontWeight: 600 }}>{s.docId}</td>
                  <td style={{ padding: '8px 4px' }}>
                    {loading
                      ? t({ bn: 'পড়া হচ্ছে…', en: 'Reading…' })
                      : row
                        ? STATUS_BN[row.status]
                        : t({ bn: 'অজানা', en: 'Unknown' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            {t({ bn: 'সীডের মান দেখুন (যাচাইকৃত বিজ্ঞপ্তি থেকে)', en: 'See the seed values (from the verified circular)' })}
          </summary>
          <ul style={{ lineHeight: 1.9, color: '#3A444B', fontSize: 14 }}>
            <li>{t({ bn: 'পূর্ণ মক: ১০০ MCQ · ৬০ মিনিট · নেগেটিভ মার্কিং নেই · পাস ৩৫ (তুলনার জন্য) · বাংলা ২০ / ইংরেজি ২০ / সাধারণ জ্ঞান ২০ / শাখা ৪০ · শাখা-৪০-এর বিভাজন: null', en: 'Full mock: 100 MCQ · 60 minutes · no negative marking · pass 35 (for comparison) · Bangla 20 / English 20 / General Knowledge 20 / Group 40 · group-40 split: null' })}</li>
            <li>{t({ bn: 'দৈনিক মক (খসড়া): ২৫ MCQ · ২৫ মিনিট · নেগেটিভ মার্কিং নেই', en: 'Daily mock (draft): 25 MCQ · 25 minutes · no negative marking' })}</li>
            <li>{t({ bn: 'বিজ্ঞপ্তি ২০২৫-২৬: স্থিতি historical (আবেদন শেষ ৩১ ডিসেম্বর ২০২৫) · পরীক্ষার তারিখ: null', en: 'Circular 2025-26: status historical (application ended 31 Dec 2025) · exam date: null' })}</li>
            <li>{t({ bn: '২০২৬-২৭-এর কোনো বিজ্ঞপ্তি-কনফিগ নেই — বিজ্ঞপ্তি যাচাই হলে তবে তৈরি হবে।', en: 'No 2026-27 circular config exists — it will be created only once that circular is verified.' })}</li>
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
