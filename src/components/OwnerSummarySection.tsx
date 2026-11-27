// Eduvelto — Owner Summary section (Worker G, 27 Nov 2026).
//
// Rendered inside `CeoDashboardPage` (route /ceo/dashboard) BELOW the
// Growth Overview section and ABOVE the bottom platform card — NOT a new
// page, NOT a new route (SPEC §0). Data lives in src/lib/ceo.ts
// (`getOwnerSummary`). Reuses CeoShared (CeoStatTile / CeoSectionHead /
// CeoEmpty) and the ev-ceo-* classes, useLanguage/t(), formatBnNumber —
// no new UI language. Owner-only via the existing AdminGuard on /ceo.
// No TrxID (last 4 only), no phone numbers, no donor names here.
//
// HONESTY GATES (SPEC §6 — do not silently undo):
// - D1: institution definition not confirmed → tile shows "—
//   (definition not decided)", never a proxy count.
// - D4: stuck thresholds (12h review / 7d custom) are PROPOSALS —
//   labelled as such wherever they appear.
// - P6 failed submissions: NOT tracked anywhere — shown as "not
//   tracked", never 0.
// - Backup is a dated snapshot (26 Nov 2026) until D3 wires live runs.

import { useEffect, useState } from 'react';
import { requireDb } from './AdminShared';
import { getOwnerSummary, backupStaleness, type OwnerSummary } from '../lib/ceo';
import { formatBnNumber } from '../lib/admin';
import { QUOTAS } from '../lib/usage';
import { useLanguage } from '../i18n/LanguageContext';
import { CeoEmpty, CeoSectionHead, CeoStatTile, CEO_ICON } from './CeoShared';

function SourceBadgeLine(props: { badge: OwnerSummary['incomeSource'] }) {
  const { t } = useLanguage();
  const b = props.badge;
  if (b.kind === 'live')
    return <span style={{ fontSize: 12, color: '#2E7D32' }}>{t({ bn: 'সরাসরি তথ্য', en: 'Live' })}</span>;
  if (b.kind === 'not-wired')
    return <span style={{ fontSize: 12, color: '#B00020' }}>{t({ bn: 'এখনো সংযুক্ত হয়নি', en: 'Not wired yet' })}</span>;
  return (
    <span style={{ fontSize: 12, color: '#68747B' }}>
      {t({ bn: `সর্বশেষ যাচাই: ${b.checkedBn}`, en: `Last checked: ${b.checkedEn}` })}
    </span>
  );
}

function bdt(value: number | null, lang: string): string {
  if (value === null) return '—';
  return lang === 'bn' ? `৳${formatBnNumber(value)}` : `৳${value}`;
}

export default function OwnerSummarySection() {
  const { lang, t } = useLanguage();
  const [summary, setSummary] = useState<OwnerSummary | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    void (async () => {
      try {
        setSummary(await getOwnerSummary(requireDb()));
      } catch {
        setError(t({ bn: 'সারাংশ লোড করা যায়নি — পরে আবার চেষ্টা করুন।', en: 'Summary could not be loaded — please try again later.' }));
      }
    })();
  };

  useEffect(load, []); // loads with the dashboard; no polling (Spark quota)

  const errorsTotal =
    summary === null ||
    summary.errorsRejectedPro === null ||
    summary.errorsDuplicateTrxId === null ||
    summary.errorsStuckReview === null ||
    summary.errorsStuckCustom === null
      ? null
      : summary.errorsRejectedPro + summary.errorsDuplicateTrxId + summary.errorsStuckReview + summary.errorsStuckCustom;

  // Hours since the last verified successful backup (snapshot, SPEC §1.5).
  const lastSuccess = summary ? new Date(`${summary.backup.lastSuccessAtDhaka.replace(' ', 'T')}:00+06:00`) : null;
  const hoursSinceBackup = lastSuccess ? Math.max(0, (Date.now() - lastSuccess.getTime()) / 3_600_000) : null;
  const stale = hoursSinceBackup === null ? null : backupStaleness(hoursSinceBackup);
  const snapshotStale = hoursSinceBackup !== null && hoursSinceBackup > 7 * 24;
  const latestFailure = summary?.backup.failuresSince[0];

  return (
    <div style={{ marginTop: 16 }}>
      <CeoSectionHead bn="মালিকের সারাংশ" en="Owner Summary" />
      <p className="ev-ceo-note">
        {summary
          ? t({
              bn: `এই মাস: ${summary.month.labelBn} (ঢাকা ক্যালেন্ডার মাস) — উপরের সময়কাল ট্যাব এই অংশে প্রযোজ্য নয়।`,
              en: `This month: ${summary.month.labelEn} (Dhaka calendar month) — the period tabs above do not apply to this section.`,
            })
          : t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}
        {summary ? (
          <>
            {' '}
            <SourceBadgeLine badge={summary.incomeSource} />
          </>
        ) : null}
      </p>
      {error ? (
        <p role="alert" style={{ color: '#B00020' }}>
          {error}
        </p>
      ) : null}

      <div className="ev-ceo-stats">
        <CeoStatTile
          icon={<svg {...CEO_ICON}><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" /></svg>}
          iconBg="#E3F2F0"
          value={summary?.activeInstitutions === null || summary?.activeInstitutions === undefined ? '—' : lang === 'bn' ? formatBnNumber(summary.activeInstitutions) : String(summary.activeInstitutions)}
          labelBn="সক্রিয় প্রতিষ্ঠান"
          labelEn="Active Institutions"
          subBn={summary?.institutionsNoteBn}
          subEn={summary?.institutionsNoteEn}
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M15.5 9.5c-.8-1-2-1.5-3.5-1.5-2 0-3.5 1-3.5 2.5 0 3.5 7 1.5 7 5 0 1.5-1.5 2.5-3.5 2.5-1.5 0-2.7-.5-3.5-1.5" /></svg>}
          iconBg="#FBF3E2"
          value={bdt(summary?.incomeSalesBdt ?? null, lang)}
          labelBn="মাসিক আয় (বিক্রি)"
          labelEn="Monthly Income (Sales)"
          subBn="লক্ষ্য ৳১৫,০০০–২৫,০০০/মাস"
          subEn="Target ৳15,000–25,000/month"
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /></svg>}
          iconBg="#E7F6E7"
          value="$0"
          labelBn="সার্ভার খরচ"
          labelEn="Server Cost"
          subBn="Spark (ফ্রি) — Blaze চালু হয়নি"
          subEn="Spark (free) — Blaze not enabled"
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /></svg>}
          iconBg="#FDECEA"
          value={errorsTotal === null ? '—' : lang === 'bn' ? formatBnNumber(errorsTotal) : String(errorsTotal)}
          labelBn="পেমেন্ট ত্রুটি (৩০ দিন)"
          labelEn="Payment Errors (30d)"
          subBn={errorsTotal === null ? 'লোড হয়নি (কোটা)' : 'আটকে-থাকা: ১২ ঘণ্টা / ৭ দিন — প্রস্তাবিত সীমা (D4)'}
          subEn={errorsTotal === null ? 'Not loaded (quota)' : 'Stuck = 12h / 7d — proposed thresholds (D4)'}
        />
      </div>

      {/* Income breakdown — each line states its source; AdSense is status only. */}
      <div className="ev-ceo-card" style={{ marginTop: 16 }}>
        <strong>{t({ bn: 'আয়ের ভাগ (এই মাস)', en: 'Income Breakdown (This Month)' })}</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#37474F', fontSize: 14, lineHeight: 1.9 }}>
          <li>{t({ bn: `Pro অর্ডার: ${bdt(summary?.incomeProBdt ?? null, lang)}`, en: `Pro orders: ${bdt(summary?.incomeProBdt ?? null, lang)}` })}</li>
          <li>{t({ bn: `কাস্টম প্রশ্নপত্র (ডেলিভারি হয়েছে): ${bdt(summary?.incomeCustomBdt ?? null, lang)}`, en: `Custom papers (delivered): ${bdt(summary?.incomeCustomBdt ?? null, lang)}` })}</li>
          <li>
            {t({
              bn: `সাজেশন PDF: বিক্রি বন্ধ — যাচাইকৃত কনটেন্ট নেই (অপেক্ষমাণ অর্ডার: ${summary?.suggestionPendingCount ?? '—'}টি)`,
              en: `Suggestion PDFs: sales closed — no verified content yet (pending orders: ${summary?.suggestionPendingCount ?? '—'})`,
            })}
          </li>
          <li>{t({ bn: `অনুদান (আলাদা — বিক্রি নয়): ${bdt(summary?.donationsBdt ?? null, lang)}`, en: `Donations (separate — not sales): ${bdt(summary?.donationsBdt ?? null, lang)}` })}</li>
          <li>{t({ bn: 'AdSense: পর্যালোচনায় (২২ নভেম্বর থেকে) — কোনো আয় নেই', en: 'AdSense: in review (since 22 Nov) — no revenue' })}</li>
        </ul>
        <p style={{ margin: '8px 0 0', fontSize: 13 }}>
          <a href="/ceo/revenue">{t({ bn: 'বিস্তারিত দেখুন →', en: 'See details →' })}</a>
        </p>
      </div>

      {/* Server cost — static Spark plan + quotas (no live billing API). */}
      <div className="ev-ceo-card" style={{ marginTop: 16 }}>
        <strong>{t({ bn: 'সার্ভার খরচ — Spark (ফ্রি)', en: 'Server Cost — Spark (Free)' })}</strong>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#37474F', fontSize: 14, lineHeight: 1.9 }}>
          <li>{t({ bn: `Firestore পড়া ${formatBnNumber(QUOTAS.firestoreReadsPerDay)}/দিন · লেখা ${formatBnNumber(QUOTAS.firestoreWritesPerDay)}/দিন · মুছা ${formatBnNumber(QUOTAS.firestoreDeletesPerDay)}/দিন`, en: `Firestore reads ${QUOTAS.firestoreReadsPerDay}/day · writes ${QUOTAS.firestoreWritesPerDay}/day · deletes ${QUOTAS.firestoreDeletesPerDay}/day` })}</li>
          <li>{t({ bn: `Firestore সংরক্ষণ ${formatBnNumber(QUOTAS.firestoreStorageGiB)} GiB · এগ্রেস ${formatBnNumber(QUOTAS.firestoreEgressGiBPerMonth)} GiB/মাস`, en: `Firestore storage ${QUOTAS.firestoreStorageGiB} GiB · egress ${QUOTAS.firestoreEgressGiBPerMonth} GiB/month` })}</li>
          <li>{t({ bn: `Hosting ট্রান্সফার ${formatBnNumber(QUOTAS.hostingTransferMBPerDay)} MB/দিন · সংরক্ষণ ${formatBnNumber(QUOTAS.hostingStorageGB)} GB (ব্যবহৃত ৮.৬১ GB — ২৬ নভেম্বর ২০২৬ যাচাই)`, en: `Hosting transfer ${QUOTAS.hostingTransferMBPerDay} MB/day · storage ${QUOTAS.hostingStorageGB} GB (used 8.61 GB — checked 26 Nov 2026)` })}</li>
          <li>{t({ bn: `Auth ${formatBnNumber(QUOTAS.authMau)} MAU`, en: `Auth ${QUOTAS.authMau} MAU` })}</li>
          <li>{t({ bn: 'Blaze চালু হয়নি — খরচের পূর্বাভাসের জন্য ব্যবহারের ইতিহাস + মালিকের সিদ্ধান্ত দরকার।', en: 'Blaze not enabled — a cost projection needs usage history + an owner decision.' })}</li>
        </ul>
      </div>

      {/* Latest payment errors — empty state is honest, not blank. */}
      <div style={{ marginTop: 16 }}>
        <CeoSectionHead bn="সাম্প্রতিক পেমেন্ট ত্রুটি" en="Recent Payment Errors" />
        {summary && summary.latestErrors.length === 0 ? (
          <CeoEmpty
            bn="গত ৩০ দিনে কোনো বাতিল Pro অর্ডার নেই।"
            en="No rejected Pro orders in the last 30 days."
            nextBn="ব্যর্থ সাবমিশন গণনা করা হয় না — সেগুলো কোথাও লগ হয় না।"
            nextEn="Failed submissions are not counted — they are not logged anywhere."
          />
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.9 }}>
            {(summary?.latestErrors ?? []).map((e, i) => (
              <li key={i}>
                {lang === 'bn' ? e.typeBn : e.typeEn} · {e.ref} · {lang === 'bn' ? e.ageBn : e.ageEn}
              </li>
            ))}
          </ul>
        )}
        <p style={{ margin: '8px 0 0', color: '#68747B', fontSize: 13 }}>
          {t({
            bn: 'আটকে-থাকা গণনায় ১২ ঘণ্টা (রিভিউ) ও ৭ দিন (কাস্টম) সীমা ব্যবহার করা হয়েছে — এগুলো প্রস্তাবিত, মালিকের নিশ্চিতকরণ অপেক্ষমাণ (D4)। ডুপ্লিকেট TrxID শুধু অপেক্ষমাণ রিভিউ অর্ডারের মধ্যে যাচাই করা হয়।',
            en: 'Stuck counts use the 12h (review) and 7d (custom) limits — these are proposed, awaiting owner confirmation (D4). Duplicate TrxID is checked over pending-review orders only.',
          })}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 13 }}>
          <a href="/admin/qpg-orders">{t({ bn: 'রিভিউ কিউ →', en: 'Review queue →' })}</a>
        </p>
      </div>

      {/* Backup card — dated snapshot until Decision D3 wires live runs. */}
      <div className="ev-ceo-card" style={{ marginTop: 16 }}>
        <strong>{t({ bn: 'ব্যাকআপ', en: 'Backup' })}</strong>{' '}
        {summary ? <SourceBadgeLine badge={summary.backupSource} /> : null}
        <p style={{ margin: '8px 0 0', color: '#37474F', fontSize: 14 }}>
          {summary
            ? t({
                bn: `সর্বশেষ সফল: ${summary.backup.lastSuccessAtDhaka} (ঢাকা) — ${formatBnNumber(summary.backup.lastSuccessDocs)} ডকুমেন্ট · যাচাই: ${summary.backup.lastSuccessVerify}`,
                en: `Last success: ${summary.backup.lastSuccessAtDhaka} (Dhaka) — ${summary.backup.lastSuccessDocs} docs · verify: ${summary.backup.lastSuccessVerify}`,
              })
            : t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}
        </p>
        <p style={{ margin: '4px 0 0', color: '#37474F', fontSize: 14 }}>
          {summary
            ? t({
                bn: `এর পর ব্যর্থতা: ${formatBnNumber(summary.backup.failuresSince.length)}টি · সর্বশেষ: ${latestFailure?.atDhaka} — ${latestFailure?.error}`,
                en: `Failures since: ${summary.backup.failuresSince.length} · latest: ${latestFailure?.atDhaka} — ${latestFailure?.error}`,
              })
            : null}
        </p>
        <p style={{ margin: '4px 0 0', color: '#37474F', fontSize: 14 }}>
          {stale === 'overdue'
            ? t({ bn: '⚠ নির্ধারিত সময় পেরিয়ে গেছে (৩৬ ঘণ্টার বেশি)।', en: '⚠ Overdue (more than 36h).' })
            : stale === 'due'
              ? t({ bn: 'শীঘ্রই দরকার (২৪–৩৬ ঘণ্টা)।', en: 'Due soon (24–36h).' })
              : t({ bn: 'সময়মতো আছে।', en: 'On schedule.' })}
        </p>
        {snapshotStale ? (
          <p role="status" style={{ margin: '8px 0 0', color: '#B00020', fontSize: 14, fontWeight: 700 }}>
            {t({ bn: '⚠ এই স্ন্যাপশট ৭ দিনের বেশি পুরনো — আবার যাচাই করুন।', en: '⚠ This snapshot is more than 7 days old — re-check it.' })}
          </p>
        ) : null}
        <p role="status" style={{ margin: '8px 0 0', color: '#8D6E00', fontSize: 14, fontWeight: 700 }}>
          {t({ bn: '⚠ Restore কখনো পরীক্ষা করা হয়নি।', en: '⚠ Restore has never been tested.' })}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 13 }}>
          <a href="/admin/backup">{t({ bn: 'ব্যাকআপ →', en: 'Backup →' })}</a>
        </p>
      </div>

      <p style={{ marginTop: 12 }}>
        <button type="button" className="ev-ceo-tab" onClick={load}>
          {t({ bn: 'রিফ্রেশ', en: 'Refresh' })}
        </button>
      </p>
    </div>
  );
}
