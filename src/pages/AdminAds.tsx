import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AD_PLACEMENTS,
  ADSENSE_CLIENT_ID,
  ADS_CHILD_SAFETY,
  BOTTOM_BANNER_ELIGIBLE_PAGES,
  getPlacementEnabled,
  isBannerPlacement,
  isPlacementConfigured,
  placementStatus,
  setPlacementEnabled,
  type AdPlacement,
  type AdPlacementStatus,
} from '../lib/ads';
import { ADS_MASTER_ENABLED } from '../lib/adsConfig';

// Eduvelto — Admin advertising page (/admin/ads).
//
// Owner-only (route is guarded by AdminGuard in App.tsx).
//
// - Placement list with status (Not configured / Ready / Active).
// - The persistent bottom banner is MANDATORY (owner brief 20 Nov 2026,
//   21:52) and has NO off-switch anywhere — not a checkbox, not a
//   toggle in code (lib/ads.ts ignores bottom-banner toggles).
// - The in-feed toggles are stored in THIS browser's localStorage only
//   (see the warning at the top of the page). They are NOT a global
//   setting until they move to Firestore (settings/ads — the rule
//   already exists; the move is a follow-up).
// - Reporting is honest placeholders only: impressions / clicks /
//   estimated revenue show "—" with one shared notice — NO invented
//   numbers, NO fake data.
// - Website (AdSense) and App (AdMob) reports are kept separate. AdMob
//   lives in the mobile apps, not in this web app — so there is no
//   AdMob table here at all (it would imply numbers appear here later;
//   they never will).

const STATUS_LABEL: Record<AdPlacementStatus, { bn: string; en: string }> = {
  'not-configured': { bn: 'সেট করা হয়নি', en: 'Not configured' },
  ready: { bn: 'প্রস্তুত', en: 'Ready' },
  active: { bn: 'সক্রিয়', en: 'Active' },
};

const STATUS_STYLE: Record<AdPlacementStatus, { background: string; color: string }> = {
  // Brand palette only — NO green (review 20 Nov 2026, a11y B2).
  active: { background: 'var(--hover)', color: 'var(--heading)' },
  ready: { background: 'var(--soon-bg)', color: 'var(--heading)' },
  'not-configured': { background: 'var(--hover)', color: 'var(--ink-soft)' },
};

function StatusPill(props: { status: AdPlacementStatus }) {
  const { t } = useLanguage();
  const label = STATUS_LABEL[props.status];
  const style = STATUS_STYLE[props.status];
  return (
    <span
      aria-live="polite"
      style={{
        marginLeft: 'auto',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 14,
        background: style.background,
        color: style.color,
      }}
    >
      {t(label)}
    </span>
  );
}

function ReportRows() {
  const { t } = useLanguage();
  const rows: Array<{ bn: string; en: string }> = [
    { bn: 'দেখা', en: 'Impressions' },
    { bn: 'ক্লিক', en: 'Clicks' },
    { bn: 'আনুমানিক আয়', en: 'Estimated revenue' },
  ];
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
      <caption style={{ textAlign: 'left', color: 'var(--ink-soft)', fontSize: 14, paddingBottom: 4 }}>
        {t({ bn: 'রিপোর্ট দেখতে AdSense সংযুক্ত করুন', en: 'Connect AdSense to see reports' })}
      </caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.en} style={{ borderBottom: '1px solid var(--line)' }}>
            <td style={{ padding: '6px 0' }}>{t(row)}</td>
            <td style={{ padding: '6px 0', textAlign: 'right', color: 'var(--ink-soft)' }}>—</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminAds() {
  const { lang, t } = useLanguage();
  const [toggles, setToggles] = useState<Record<AdPlacement, boolean>>(() =>
    Object.fromEntries(
      AD_PLACEMENTS.map((p) => [p.id, getPlacementEnabled(p.id)]),
    ) as Record<AdPlacement, boolean>,
  );

  function onToggle(placement: AdPlacement, enabled: boolean): void {
    setPlacementEnabled(placement, enabled);
    setToggles((prev) => ({ ...prev, [placement]: enabled }));
  }

  return (
    <PageShell titleBn="বিজ্ঞাপন ব্যবস্থাপনা" titleEn="Advertising management">
      <p>
        {t({
          bn: 'ওয়েবসাইট বিজ্ঞাপন (Google AdSense) — প্রস্তুতির পর্যায়ে। AdSense অনুমোদন না হওয়া পর্যন্ত কোথাও কোনো বিজ্ঞাপন দেখানো হয় না।',
          en: 'Website advertising (Google AdSense) — preparation stage. No ads are shown anywhere until AdSense approves the site.',
        })}
      </p>

      <div
        style={{
          border: '1px solid #F1B308',
          borderRadius: 8,
          padding: '12px 14px',
          background: 'var(--soon-bg)',
          marginTop: 16,
        }}
      >
        <strong>
          {t({ bn: 'এই পাতার টগল শুধু এই ব্রাউজারে প্রযোজ্য — অন্য ফোন/কম্পিউটারে আলাদা থাকবে।', en: 'Toggles on this page apply to THIS browser only — other phones/computers are unaffected.' })}
        </strong>
        <p style={{ margin: '6px 0 0' }}>
          {t({
            bn: 'টগল এই ব্রাউজারের localStorage-এ সংরক্ষিত হয়; এগুলো সারা সাইটের সেটিং নয়। নিচের ব্যানারের কোনো টগল নেই — সেটি সবসময় চালু (মালিকের নির্দেশ)।',
            en: 'They are stored in this browser’s localStorage, not as a site-wide setting. The bottom banner has no toggle — it is always on.',
          })}
        </p>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>{t({ bn: 'AdSense স্থিতি', en: 'AdSense status' })}</h2>
      <p>
        {t({ bn: 'মাস্টার সুইচ:', en: 'Master switch:' })}{' '}
        <strong>
          {ADS_MASTER_ENABLED
            ? t({ bn: 'চালু', en: 'ON' })
            : t({ bn: 'বন্ধ (ডিফল্ট) — AdSense অনুমোদন + unit ID-র পর চালু করা হবে', en: 'OFF (default) — turned on after AdSense approval + unit IDs' })}
        </strong>
      </p>
      <p>
        Publisher ID:{' '}
        {ADSENSE_CLIENT_ID === '' ? (
          <strong>
            {t({ bn: 'সেট করা হয়নি — AdSense অনুমোদনের পর বসানো হবে', en: 'Not set — added after AdSense approval' })}
          </strong>
        ) : (
          <strong>{t({ bn: 'সেট করা আছে', en: 'Set' })}</strong>
        )}
      </p>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        {t({ bn: 'অনুমোদনের জন্য যা যা লাগবে (চেকলিস্ট):', en: 'Approval checklist:' })}
      </p>
      <ul style={{ color: 'var(--ink)', fontSize: 15 }}>
        <li>{t({ bn: '✓ সাইট eduvelto.com-এ লাইভ — হ্যাঁ (২১ নভেম্বর ২০২৬ থেকে Connected)', en: '✓ Site live on eduvelto.com — yes (Connected since 21 Nov 2026)' })}</li>
        <li>{t({ bn: '✓ আসল কনটেন্ট (পাঠ, বই, পরীক্ষা) — হ্যাঁ (৬০৯ বই, ২১২ পরীক্ষা লাইভ)', en: '✓ Real content (lessons, books, exams) — yes (609 books, 212 exams live)' })}</li>
        <li>{t({ bn: '✓ গোপনীয়তা নীতি (Privacy Policy) — লাইভ', en: '✓ Privacy Policy — live' })}</li>
        <li>{t({ bn: '… সাইট Google-এর রিভিউতে আছে (২২ নভেম্বর ০৭:৪১ থেকে) — ফলাফলের অপেক্ষায়', en: '… Site is in Google review (since 22 Nov 07:41) — awaiting the result' })}</li>
      </ul>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        {t({
          bn: 'অনুমোদন পেলে Publisher ID ও ৭টি Slot ID (নিচের ব্যানার, টপ ব্যানার, সাইডবার, ইন-কনটেন্ট, ইন-ফিড, ইন-ফিড ২, মোবাইল — ছোট পরীক্ষা-ব্যানার নিচের ব্যানারের unit-ই ব্যবহার করে) ডেভেলপার (Muse) ডেপ্লয়মেন্ট সেটিংসে বসাবে, মাস্টার সুইচ চালু করবে ও সাইট আবার ডেপ্লয় করবে — এই পাতা থেকে ID বসানো যায় না। অনুমোদন পেলে ID গুলো Muse-কে পাঠান।',
          en: 'After approval, the developer (Muse) enters the publisher ID and 7 slot IDs (bottom banner, top banner, sidebar, in-content, in-feed, in-feed 2, mobile — the small exam banner shares the bottom banner unit) in deployment settings, flips the master switch and redeploys — IDs cannot be entered from this page. Send the IDs to Muse when approved.',
        })}
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>{t({ bn: 'স্থায়ী নিচের ব্যানার', en: 'Persistent bottom banner' })}</h2>
      <p>
        <strong>{t({ bn: 'সব পাতায় প্রযোজ্য সেটিং (global setting):', en: 'Global setting:' })}</strong>{' '}
        {t({
          bn: 'নিচের ব্যানারটি অ্যাপের সব যোগ্য পাতায় স্থায়ীভাবে থাকে — হোম, লাইব্রেরি, পাঠ, বই, কুইজ, পরীক্ষা, এডুভেল্টো এআই শিক্ষক, প্রোফাইল। এটি ২০ নভেম্বর ২০২৬, রাত ৯:৫২-এর মালিকের নির্দেশে "AI পাঠ বা পরীক্ষার সময় বিজ্ঞাপন নয়" নিয়মের ওপরে প্রযোজ্য — ব্যানার এখন সব যোগ্য পাতায় আবশ্যক; কনটেন্টের নিচে জায়গা রেখে দেওয়া হয়, তাই ব্যানার কিছু ঢাকে না। ব্যবহারকারীদের বন্ধ করার কোনো সুইচ নেই — মালিকেরও এই পাতায় বন্ধ করার সুইচ নেই।',
          en: 'the bottom banner is persistent on all eligible pages — home, library, lessons, books, quizzes, exams, Eduvelto AI Teacher, profiles. Per the owner’s 20 Nov 2026, 21:52 brief it supersedes the earlier "no ads during AI lessons or active exams" rule; reserved space is the reconciliation. Users have no off switch — and neither does the owner on this page.',
        })}
      </p>
      <div style={{ border: '1px solid var(--line-strong)', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <strong>{t({ bn: 'নিচের ব্যানার — সবসময় চালু', en: 'Bottom banner — always on' })}</strong>
          <StatusPill status={placementStatus('bottom-banner')} />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 15 }}>
          {t({
            bn: '🔒 ব্যানার সবসময় চালু — মালিকের ২০ নভেম্বর ২০২৬, রাত ৯:৫২-এর নির্দেশে বন্ধ করা যায় না।',
            en: '🔒 Always on — cannot be turned off (owner brief 20 Nov 2026, 21:52).',
          })}
        </p>
        <p style={{ margin: '8px 0 0', color: 'var(--ink-soft)', fontSize: 14 }}>
          {t({ bn: 'দর্শকরা এখন বিজ্ঞাপন দেখছে:', en: 'Visitors are seeing ads now:' })}{' '}
          {isPlacementConfigured('bottom-banner') && ADS_MASTER_ENABLED ? (
            <strong>{t({ bn: 'হ্যাঁ — AdSense ID বসানো আছে', en: 'Yes — AdSense IDs are set' })}</strong>
          ) : (
            <strong>
              {!isPlacementConfigured('bottom-banner')
                ? t({ bn: 'না — AdSense অনুমোদন হয়নি, ID বসানো হয়নি', en: 'No — AdSense is not approved, no IDs set' })
                : t({ bn: 'না — মাস্টার সুইচ বন্ধ আছে', en: 'No — the master switch is off' })}
            </strong>
          )}
        </p>
        <p style={{ margin: '10px 0 0', color: 'var(--ink-soft)', fontSize: 14 }}>
          {t({
            bn: 'পরীক্ষার পাতায় ব্যানার একদম ছোট (সর্বোচ্চ ৫০px) — মালিকের নির্দেশ ২২ নভেম্বর ২০২৬, ১০:৪৫। লগইন/রেজিস্টার ও অ্যাডমিন পাতায় কোনো ব্যানার নেই।',
            en: 'On exam pages the banner is extra small (max 50px) — owner rule 22 Nov 2026, 10:45. No banner on login/register or admin pages.',
          })}
        </p>
        <p style={{ margin: '10px 0 0', color: 'var(--ink-soft)', fontSize: 14 }}>
          {t({ bn: 'যোগ্য পাতা:', en: 'Eligible pages:' })} {BOTTOM_BANNER_ELIGIBLE_PAGES.join(' · ')}
        </p>
        <p style={{ margin: '6px 0 0', color: 'var(--ink-soft)', fontSize: 14 }}>
          {t({
            bn: 'কনটেন্টের নিচে জায়গা রিজার্ভ থাকে (+ মোবাইলের safe-area) — ব্যানার কনটেন্ট, বোতাম বা কুইজের উত্তর ঢাকে না। বিজ্ঞাপন না থাকলে ব্যানার শূন্য উচ্চতায় গুটিয়ে যায় — কোনো ভুয়া বিজ্ঞাপন বা খালি বাক্স নেই।',
            en: 'Space is reserved below the content (+ mobile safe-area), so the banner never covers content, buttons or quiz answers. With no ad available the slot collapses to zero height — no fake ads, no empty boxes.',
          })}
        </p>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>{t({ bn: 'বিজ্ঞাপনের জায়গা', en: 'Placements' })}</h2>
      {AD_PLACEMENTS.map((p) => {
        const status = placementStatus(p.id);
        const configured = isPlacementConfigured(p.id);
        const visitorsSeeAds = isBannerPlacement(p.id)
          ? configured && ADS_MASTER_ENABLED
          : configured && toggles[p.id] && ADS_MASTER_ENABLED;
        return (
          <div
            key={p.id}
            style={{ border: '1px solid var(--line-strong)', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <strong>
                {lang === 'bn' ? p.labelBn : p.labelEn}
              </strong>
              <StatusPill status={status} />
            </div>
            <p style={{ margin: '8px 0', color: 'var(--ink-soft)', fontSize: 14 }}>
              {lang === 'bn' ? p.whereBn : p.whereEn}
            </p>
            <p style={{ margin: '8px 0', fontSize: 15 }}>
              {t({ bn: 'দর্শকরা এখন বিজ্ঞাপন দেখছে:', en: 'Visitors are seeing ads now:' })}{' '}
              {visitorsSeeAds ? (
                <strong>{t({ bn: 'হ্যাঁ', en: 'Yes' })}</strong>
              ) : (
                <strong>
                  {!configured
                    ? t({ bn: 'না — AdSense ID বসানো হয়নি', en: 'No — no AdSense IDs set' })
                    : !ADS_MASTER_ENABLED
                      ? t({ bn: 'না — মাস্টার সুইচ বন্ধ আছে', en: 'No — the master switch is off' })
                      : t({ bn: 'না — এই ব্রাউজারে টগল বন্ধ আছে', en: 'No — the toggle is off in this browser' })}
                </strong>
              )}
            </p>
            {isBannerPlacement(p.id) ? (
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 14 }}>
                {t({
                  bn: 'এই জায়গাটি ওপরের "স্থায়ী নিচের ব্যানার" সেটিং দিয়ে চলে — এখানে কোনো টগল নেই।',
                  en: 'This placement follows the "Persistent bottom banner" setting above — there is no toggle here.',
                })}
              </p>
            ) : (
              <label
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  minHeight: 44,
                  padding: '10px 0',
                  cursor: configured ? 'pointer' : 'not-allowed',
                }}
              >
                <input
                  type="checkbox"
                  style={{ width: 24, height: 24, accentColor: '#1E7CE8' }}
                  checked={toggles[p.id]}
                  disabled={!configured}
                  onChange={(e) => onToggle(p.id, e.target.checked)}
                />
                {t({ bn: 'চালু', en: 'Enabled' })}
                <span style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
                  {t({ bn: '— এই ব্রাউজারে মাত্র', en: '— This browser only' })}
                  {!configured ? t({ bn: ' — AdSense ID না বসা পর্যন্ত টগল বন্ধ থাকে', en: ' — toggle stays off until AdSense IDs are set' }) : ''}
                </span>
              </label>
            )}
          </div>
        );
      })}

      <h2 style={{ fontSize: 18, marginTop: 24 }}>{t({ bn: 'রিপোর্ট', en: 'Reporting' })}</h2>
      <h3 style={{ fontSize: 16 }}>{t({ bn: 'ওয়েবসাইট (AdSense)', en: 'Website (AdSense)' })}</h3>
      <ReportRows />
      <h3 style={{ fontSize: 16, marginTop: 20 }}>{t({ bn: 'অ্যাপ (AdMob)', en: 'Apps (AdMob)' })}</h3>
      <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
        {t({
          bn: 'AdMob রিপোর্ট শুধু AdMob কনসোলে / অ্যাপে দেখা যায়, এখানে নয়।',
          en: 'AdMob reports are seen only in the AdMob console / apps, never here.',
        })}
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>{t({ bn: 'শিশু সুরক্ষা', en: 'Child safety' })}</h2>
      <ul style={{ color: 'var(--ink)' }}>
        <li>
          {t({ bn: 'ব্যক্তিগতকৃত বিজ্ঞাপন:', en: 'Personalised ads:' })}{' '}
          {ADS_CHILD_SAFETY.personalisedAds
            ? t({ bn: 'চালু', en: 'ON' })
            : t({ bn: 'বন্ধ (সবসময়)', en: 'OFF (always)' })}
        </li>
        <li>{t({ bn: 'শুধু পরিবার-নিরাপদ বিজ্ঞাপন', en: 'Family-safe ads only' })}</li>
        <li>
          {t({
            bn: 'AdSense অ্যাকাউন্টেও Non-personalised ads + সংবেদনশীল ক্যাটাগরি ব্লক চালু রাখতে হবে — শুধু কোড যথেষ্ট নয়।',
            en: 'Also enable non-personalised ads + sensitive-category blocks in the AdSense account — code alone is not enough.',
          })}
        </li>
        <li>
          {t({
            bn: 'খারাপ/ব্যক্তিগতকৃত বিজ্ঞাপন দেখলে স্ক্রিনশট নিয়ে Muse-কে জানান — ব্যানার বন্ধ করার কোনো সুইচ নেই, তাই খারাপ বিজ্ঞাপন AdSense অ্যাকাউন্ট থেকে ব্লক করতে হবে।',
            en: 'If you see a bad/personalised ad, screenshot it and tell Muse — there is no banner off-switch, so bad ads must be blocked from the AdSense account.',
          })}
        </li>
        <li>
          {t({
            bn: 'নিচের ব্যানার সব যোগ্য পাতায় থাকে — পাঠ, কুইজ, পরীক্ষা ও এডুভেল্টো এআই শিক্ষক সহ (মালিকের ২০ নভেম্বর ২০২৬, রাত ৯:৫২-এর নির্দেশ; আগের "AI পাঠ বা পরীক্ষার সময় বিজ্ঞাপন নয়" নিয়মের ওপরে)। কনটেন্টের নিচে জায়গা রিজার্ভ থাকে, তাই ব্যানার কনটেন্ট, বোতাম বা কুইজের উত্তর ঢাকে না।',
            en: 'The bottom banner appears on all eligible pages — including lessons, quizzes, exams and the Eduvelto AI Teacher (owner brief 20 Nov 2026, 21:52, superseding the earlier rule). Reserved space below the content means it never covers content, buttons or quiz answers.',
          })}
        </li>
        <li>
          {t({
            bn: `তালিকার ভেতরের বিজ্ঞাপনের চারপাশে কমপক্ষে ${ADS_CHILD_SAFETY.minSpacingPx}px ফাঁকা জায়গা — ভুল ক্লিক এড়াতে`,
            en: `At least ${ADS_CHILD_SAFETY.minSpacingPx}px spacing around in-feed ads, to prevent accidental clicks`,
          })}
        </li>
        <li>
          {t({ bn: 'ভিডিও বিজ্ঞাপন ও ক্রিয়েটর মনিটাইজেশন বন্ধ আছে', en: 'Video ads and creator monetisation are OFF' })}
        </li>
      </ul>
    </PageShell>
  );
}
