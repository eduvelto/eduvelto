// Approval Center (owner brief 21 Nov 20:27, §4) — owner-only.
//
// The 7 actions that need the Owner's explicit approval before they
// happen. Each category shows its audit history from the REAL
// adminActions log (listAdminActions — append-only, owner-readable).
//
// HONEST WIRING: only ONE existing audit action maps to these
// categories — 'user-role-change' → "Important Security or Ownership
// changes". No audit action exists for paid services, Firebase plan
// upgrades, costs/subscriptions, production deploys, DB migrations or
// permanent deletions, so those categories show an honest empty state
// ("no record yet"), never an invented Pending/Approved entry.
// Approve / Reject buttons are DISABLED + Coming Soon: recording an
// approval decision needs a new write path + rules, and this screen is
// design scope only (no new backend, no rules change).

import { useEffect, useState } from 'react';
import { requireDb } from '../components/AdminShared';
import {
  auditActionLabel,
  formatTime,
  listAdminActions,
  type AuditRow,
} from '../lib/admin';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoEmpty, CeoSoonPill } from '../components/CeoShared';

type CategoryKey =
  | 'paid-service'
  | 'firebase-upgrade'
  | 'cost-subscription'
  | 'production-deploy'
  | 'db-migration'
  | 'security-ownership'
  | 'data-deletion';

/** Only audit actions that genuinely belong to a category. */
const CATEGORY_ACTIONS: Record<CategoryKey, string[]> = {
  'paid-service': [],
  'firebase-upgrade': [],
  'cost-subscription': [],
  'production-deploy': [],
  'db-migration': [],
  'security-ownership': ['user-role-change'],
  'data-deletion': [],
};

const CATEGORIES: {
  key: CategoryKey;
  bn: string;
  en: string;
  descBn: string;
  descEn: string;
}[] = [
  {
    key: 'paid-service',
    bn: 'পেইড সার্ভিস বা বিলিং চালু',
    en: 'Paid Service or Billing',
    descBn: 'কোনো পেইড সার্ভিস চালু বা বিলিং যুক্ত করার আগে মালিকের অনুমোদন লাগবে।',
    descEn: 'Starting any paid service or adding billing needs the owner’s approval first.',
  },
  {
    key: 'firebase-upgrade',
    bn: 'Firebase প্ল্যান আপগ্রেড',
    en: 'Firebase Plan Upgrade',
    descBn: 'Spark থেকে Blaze বা অন্য কোনো প্ল্যানে যাওয়ার আগে মালিকের অনুমোদন লাগবে।',
    descEn: 'Moving from Spark to Blaze or any other plan needs the owner’s approval first.',
  },
  {
    key: 'cost-subscription',
    bn: 'যেকোনো খরচ বা সাবস্ক্রিপশন',
    en: 'Any Cost or Subscription',
    descBn: 'যেকোনো খরচ, সাবস্ক্রিপশন বা কেনাকাটার আগে মালিকের অনুমোদন লাগবে।',
    descEn: 'Any cost, subscription or purchase needs the owner’s approval first.',
  },
  {
    key: 'production-deploy',
    bn: 'প্রোডাকশন ডেপ্লয়মেন্ট',
    en: 'Production Deployment',
    descBn: 'লাইভ সাইটে কিছু প্রকাশের আগে মালিকের অনুমোদন লাগবে।',
    descEn: 'Publishing anything to the live site needs the owner’s approval first.',
  },
  {
    key: 'db-migration',
    bn: 'ডাটাবেস মাইগ্রেশন',
    en: 'Database Migration',
    descBn: 'ডাটাবেসের গঠন বদলানোর আগে মালিকের অনুমোদন লাগবে।',
    descEn: 'Changing the database structure needs the owner’s approval first.',
  },
  {
    key: 'security-ownership',
    bn: 'গুরুত্বপূর্ণ নিরাপত্তা বা মালিকানা পরিবর্তন',
    en: 'Important Security or Ownership Changes',
    descBn: 'ভূমিকা, মালিকানা বা নিরাপত্তা-সংক্রান্ত বড় পরিবর্তনের আগে মালিকের অনুমোদন লাগবে।',
    descEn: 'Role, ownership or major security changes need the owner’s approval first.',
  },
  {
    key: 'data-deletion',
    bn: 'স্থায়ীভাবে ডেটা মোছা',
    en: 'Permanent Data Deletion',
    descBn: 'কোনো ডেটা স্থায়ীভাবে মোছার আগে মালিকের অনুমোদন লাগবে।',
    descEn: 'Permanently deleting any data needs the owner’s approval first.',
  },
];

export default function CeoApprovalsPage() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const a = await listAdminActions(requireDb());
        if (!cancelled) setRows(a);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <p className="ev-ceo-note" style={{ marginTop: 0 }}>
        {t({
          bn: 'নিচের ৭টি কাজ মালিকের স্পষ্ট অনুমোদন ছাড়া হয় না। প্রতিটি বিভাগে অনুমোদনের ইতিহাস দেখা যায় — ইতিহাস আসে আসল অডিট লগ (adminActions) থেকে।',
          en: 'The 7 actions below never happen without the owner’s explicit approval. Each section shows its approval history — the history comes from the real audit log (adminActions).',
        })}
      </p>

      {failed ? (
        <p role="alert" style={{ color: '#B00020' }}>
          {t({ bn: 'অডিট লগ লোড করা যায়নি — পরে আবার চেষ্টা করুন।', en: 'The audit log could not be loaded — please try again later.' })}
        </p>
      ) : null}

      <div className="ev-ceo-list">
        {CATEGORIES.map((cat) => {
          const history = rows
            .filter((r) => CATEGORY_ACTIONS[cat.key].includes(r.action))
            .slice(0, 3);
          const hasHistory = history.length > 0;
          return (
            <section key={cat.key} className="ev-ceo-card" aria-label={lang === 'bn' ? cat.bn : cat.en}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>
                    {lang === 'bn' ? cat.bn : cat.en}
                  </h2>
                  <p style={{ margin: 0, fontSize: 14, color: '#68747B' }}>
                    {lang === 'bn' ? cat.descBn : cat.descEn}
                  </p>
                </div>
                {hasHistory ? (
                  <span className="ev-ceo-pill-approved">
                    {t({ bn: 'অনুমোদিত', en: 'Approved' })}
                  </span>
                ) : (
                  <span className="ev-ceo-pill-norecord">
                    {t({ bn: 'কোনো রেকর্ড নেই', en: 'No record' })}
                  </span>
                )}
              </div>

              {hasHistory ? (
                <div style={{ marginTop: 12 }}>
                  {history.map((row) => {
                    const label = auditActionLabel(row.action);
                    return (
                      <div key={row.id} className="ev-ceo-history">
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <strong>{lang === 'bn' ? label.bn : label.en}</strong>
                          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#68747B' }}>
                            {formatTime(row.createdAt, lang)}
                          </span>
                        </div>
                        {row.details ? (
                          <p style={{ margin: '4px 0', fontSize: 14 }}>
                            {t({ bn: 'যা করা হয়েছে: ', en: 'Action taken: ' })}
                            {row.details}
                          </p>
                        ) : null}
                        {row.before !== undefined || row.after !== undefined ? (
                          <p style={{ margin: '4px 0', fontSize: 14, color: '#68747B' }}>
                            {t({ bn: 'আগে', en: 'Before' })}: {row.before ?? '—'} →{' '}
                            {t({ bn: 'পরে', en: 'After' })}: {row.after ?? '—'}
                          </p>
                        ) : null}
                        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#68747B' }}>
                          {t({ bn: 'কারণ: ', en: 'Reason: ' })}
                          {row.reason ?? '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <CeoEmpty
                    bn="এই বিভাগে এখনো কোনো অনুমোদনের রেকর্ড নেই।"
                    en="No approval record in this category yet."
                    nextBn="মালিক অনুমোদন দিলে সিদ্ধান্ত এখানে লেখা হবে।"
                    nextEn="Once the owner approves, the decision will be recorded here."
                  />
                </div>
              )}

              <div className="ev-ceo-approve-row">
                <button type="button" className="ev-ceo-outline-btn" disabled>
                  {t({ bn: 'অনুমোদন দিন', en: 'Approve' })}
                </button>
                <button type="button" className="ev-ceo-outline-btn" disabled>
                  {t({ bn: 'বাতিল করুন', en: 'Reject' })}
                </button>
                <CeoSoonPill />
              </div>
            </section>
          );
        })}
      </div>

      <p className="ev-ceo-note">
        {t({
          bn: 'উৎস: adminActions অডিট লগ (সর্বশেষ ১০০টি)। অনুমোদনের সিদ্ধান্ত আলাদা করে লেখার ব্যবস্থা এখনো তৈরি হয়নি — সেটি ভবিষ্যৎ কাজ, নতুন ব্যাকএন্ড ও নিয়ম লাগবে।',
          en: 'Source: the adminActions audit log (latest 100). Recording approval decisions separately is not built yet — that is future work and needs a new backend and rules.',
        })}
      </p>
    </div>
  );
}
