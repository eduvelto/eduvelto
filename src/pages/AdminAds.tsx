import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AD_PLACEMENTS,
  ADSENSE_CLIENT_ID,
  ADS_CHILD_SAFETY,
  BOTTOM_BANNER_ELIGIBLE_PAGES,
  getPlacementEnabled,
  isPlacementConfigured,
  placementStatus,
  setPlacementEnabled,
  type AdPlacement,
  type AdPlacementStatus,
} from '../lib/ads';

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
  active: { background: '#E8EFFA', color: '#0A1F44' },
  ready: { background: '#FDF3D0', color: '#041742' },
  'not-configured': { background: '#F1F1F1', color: '#444' },
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
      <caption style={{ textAlign: 'left', color: '#555', fontSize: 14, paddingBottom: 4 }}>
        {t({ bn: 'রিপোর্ট দেখতে AdSense সংযুক্ত করুন', en: 'Connect AdSense to see reports' })}
      </caption>
      <tbody>
        {rows.map((row) => (
          <tr key={row.en} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '6px 0' }}>{t(row)}</td>
            <td style={{ padding: '6px 0', textAlign: 'right', color: '#555' }}>—</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminAds() {
  const { lang, t } = useLanguage();
  const [toggles, setToggles] = useState<Record<AdPlacement, boolean>>(() => ({
    'bottom-banner': getPlacementEnabled('bottom-banner'),
    'in-feed': getPlacementEnabled('in-feed'),
    'in-feed-2': getPlacementEnabled('in-feed-2'),
  }));

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
          background: '#FDF3D0',
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
        Publisher ID:{' '}
        {ADSENSE_CLIENT_ID === '' ? (
          <strong>
            {t({ bn: 'সেট করা হয়নি — AdSense অনুমোদনের পর বসানো হবে', en: 'Not set — added after AdSense approval' })}
          </strong>
        ) : (
          <strong>{t({ bn: 'সেট করা আছে', en: 'Set' })}</strong>
        )}
      </p>
      <p style={{ color: '#555', fontSize: 14 }}>
        {t({ bn: 'অনুমোদনের জন্য যা যা লাগবে (চেকলিস্ট):', en: 'Approval checklist:' })}
      </p>
      <ul style={{ color: '#333', fontSize: 15 }}>
        <li>{t({ bn: '✗ সাইট eduvelto.com-এ লাইভ — এখনো নয় (ডোমেইন সংযোগ চলছে)', en: '✗ Site live on eduvelto.com — not yet (domain connection in progress)' })}</li>
        <li>{t({ bn: '✗ আসল কনটেন্ট (পাঠ, বই, পরীক্ষা) — এখনো নয় (শুধু লগইন/প্রোফাইল তৈরি হয়েছে)', en: '✗ Real content (lessons, books, exams) — not yet (only login/profile built so far)' })}</li>
        <li>{t({ bn: '✗ গোপনীয়তা নীতি (Privacy Policy) — এখনো লেখা হয়নি', en: '✗ Privacy Policy — not written yet' })}</li>
      </ul>
      <p style={{ color: '#555', fontSize: 14 }}>
        {t({
          bn: 'অনুমোদন পেলে Publisher ID ও ৩টি Slot ID ডেভেলপার (Muse) ডেপ্লয়মেন্ট সেটিংসে বসাবে ও সাইট আবার ডেপ্লয় করবে — এই পাতা থেকে ID বসানো যায় না। অনুমোদন পেলে ID গুলো Muse-কে পাঠান।',
          en: 'After approval, the developer (Muse) enters the publisher ID and 3 slot IDs in deployment settings and redeploys — IDs cannot be entered from this page. Send the IDs to Muse when approved.',
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
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
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
        <p style={{ margin: '8px 0 0', color: '#555', fontSize: 14 }}>
          {t({ bn: 'দর্শকরা এখন বিজ্ঞাপন দেখছে:', en: 'Visitors are seeing ads now:' })}{' '}
          {isPlacementConfigured('bottom-banner') ? (
            <strong>{t({ bn: 'হ্যাঁ — AdSense ID বসানো আছে', en: 'Yes — AdSense IDs are set' })}</strong>
          ) : (
            <strong>{t({ bn: 'না — AdSense অনুমোদন হয়নি, ID বসানো হয়নি', en: 'No — AdSense is not approved, no IDs set' })}</strong>
          )}
        </p>
        <p style={{ margin: '10px 0 0', color: '#555', fontSize: 14 }}>
          {t({ bn: 'যোগ্য পাতা:', en: 'Eligible pages:' })} {BOTTOM_BANNER_ELIGIBLE_PAGES.join(' · ')}
        </p>
        <p style={{ margin: '6px 0 0', color: '#555', fontSize: 14 }}>
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
        const visitorsSeeAds = p.id === 'bottom-banner' ? configured : configured && toggles[p.id];
        return (
          <div
            key={p.id}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <strong>
                {lang === 'bn' ? p.labelBn : p.labelEn}
              </strong>
              <StatusPill status={status} />
            </div>
            <p style={{ margin: '8px 0', color: '#555', fontSize: 14 }}>
              {lang === 'bn' ? p.whereBn : p.whereEn}
            </p>
            <p style={{ margin: '8px 0', fontSize: 15 }}>
              {t({ bn: 'দর্শকরা এখন বিজ্ঞাপন দেখছে:', en: 'Visitors are seeing ads now:' })}{' '}
              {visitorsSeeAds ? (
                <strong>{t({ bn: 'হ্যাঁ', en: 'Yes' })}</strong>
              ) : (
                <strong>
                  {configured
                    ? t({ bn: 'না — এই ব্রাউজারে টগল বন্ধ আছে', en: 'No — the toggle is off in this browser' })
                    : t({ bn: 'না — AdSense ID বসানো হয়নি', en: 'No — no AdSense IDs set' })}
                </strong>
              )}
            </p>
            {p.id === 'bottom-banner' ? (
              <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
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
                <span style={{ color: '#555', fontSize: 14 }}>
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
      <p style={{ color: '#555', fontSize: 14 }}>
        {t({
          bn: 'AdMob রিপোর্ট শুধু AdMob কনসোলে / অ্যাপে দেখা যায়, এখানে নয়।',
          en: 'AdMob reports are seen only in the AdMob console / apps, never here.',
        })}
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>{t({ bn: 'শিশু সুরক্ষা', en: 'Child safety' })}</h2>
      <ul style={{ color: '#333' }}>
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
