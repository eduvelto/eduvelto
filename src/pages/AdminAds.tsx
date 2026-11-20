import { useState } from 'react';
import { PageShell } from '../components/PageShell';
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
      {label.bn} · {label.en}
    </span>
  );
}

function ReportRows() {
  const rows: Array<[string, string]> = [
    ['দেখা / Impressions', '—'],
    ['ক্লিক / Clicks', '—'],
    ['আনুমানিক আয় / Estimated revenue', '—'],
  ];
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
      <caption style={{ textAlign: 'left', color: '#555', fontSize: 14, paddingBottom: 4 }}>
        রিপোর্ট দেখতে <span lang="en">AdSense</span> সংযুক্ত করুন · Connect{' '}
        <span lang="en">AdSense</span> to see reports
      </caption>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '6px 0' }}>{label}</td>
            <td style={{ padding: '6px 0', textAlign: 'right', color: '#555' }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminAds() {
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
        ওয়েবসাইট বিজ্ঞাপন (<span lang="en">Google AdSense</span>) — প্রস্তুতির পর্যায়ে।{' '}
        <span lang="en">AdSense</span> অনুমোদন না হওয়া পর্যন্ত কোথাও কোনো বিজ্ঞাপন দেখানো হয় না।
      </p>
      <p style={{ color: '#555' }}>
        Website advertising (<span lang="en">Google AdSense</span>) — preparation stage. No ads
        are shown anywhere until <span lang="en">AdSense</span> approves the site.
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
          এই পাতার টগল শুধু এই ব্রাউজারে প্রযোজ্য — অন্য ফোন/কম্পিউটারে আলাদা থাকবে।
        </strong>
        <p style={{ margin: '6px 0 0' }}>
          টগল এই ব্রাউজারের <span lang="en">localStorage</span>-এ সংরক্ষিত হয়; এগুলো সারা সাইটের
          সেটিং নয়। নিচের ব্যানারের কোনো টগল নেই — সেটি সবসময় চালু (মালিকের নির্দেশ)।
        </p>
        <p style={{ margin: '6px 0 0', color: '#555' }}>
          Toggles on this page apply to THIS browser only — other phones/computers are unaffected.
          They are stored in this browser&apos;s <span lang="en">localStorage</span>, not as a
          site-wide setting. The bottom banner has no toggle — it is always on.
        </p>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>AdSense স্থিতি / AdSense status</h2>
      <p>
        Publisher ID:{' '}
        {ADSENSE_CLIENT_ID === '' ? (
          <strong>
            সেট করা হয়নি — <span lang="en">AdSense</span> অনুমোদনের পর বসানো হবে / Not set — added
            after <span lang="en">AdSense</span> approval
          </strong>
        ) : (
          <strong>সেট করা আছে / Set</strong>
        )}
      </p>
      <p style={{ color: '#555', fontSize: 14 }}>
        অনুমোদনের জন্য যা যা লাগবে (চেকলিস্ট) — Approval checklist:
      </p>
      <ul style={{ color: '#333', fontSize: 15 }}>
        <li>✗ সাইট <span lang="en">eduvelto.com</span>-এ লাইভ — এখনো নয় (ডোমেইন সংযোগ চলছে)</li>
        <li>✗ আসল কনটেন্ট (পাঠ, বই, পরীক্ষা) — এখনো নয় (শুধু লগইন/প্রোফাইল তৈরি হয়েছে)</li>
        <li>✗ গোপনীয়তা নীতি (Privacy Policy) — এখনো লেখা হয়নি</li>
      </ul>
      <p style={{ color: '#555', fontSize: 14 }}>
        অনুমোদন পেলে Publisher ID ও ৩টি Slot ID ডেভেলপার (Muse) ডেপ্লয়মেন্ট সেটিংসে বসাবে ও
        সাইট আবার ডেপ্লয় করবে — এই পাতা থেকে ID বসানো যায় না। অনুমোদন পেলে ID গুলো Muse-কে
        পাঠান। / After approval, the developer (Muse) enters the publisher ID and 3 slot IDs in
        deployment settings and redeploys — IDs cannot be entered from this page. Send the IDs to
        Muse when approved.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>স্থায়ী নিচের ব্যানার / Persistent bottom banner</h2>
      <p>
        <strong>সব পাতায় প্রযোজ্য সেটিং (global setting):</strong> নিচের ব্যানারটি অ্যাপের সব
        যোগ্য পাতায় স্থায়ীভাবে থাকে — হোম, লাইব্রেরি, পাঠ, বই, কুইজ, পরীক্ষা, এডুভেল্টো এআই
        শিক্ষক, প্রোফাইল। এটি ২০ নভেম্বর ২০২৬, রাত ৯:৫২-এর মালিকের নির্দেশে &quot;AI পাঠ বা
        পরীক্ষার সময় বিজ্ঞাপন নয়&quot; নিয়মের ওপরে প্রযোজ্য — ব্যানার এখন সব যোগ্য পাতায়
        আবশ্যক; কনটেন্টের নিচে জায়গা রেখে দেওয়া হয়, তাই ব্যানার কিছু ঢাকে না।
        ব্যবহারকারীদের বন্ধ করার কোনো সুইচ নেই — মালিকেরও এই পাতায় বন্ধ করার সুইচ নেই।
      </p>
      <p style={{ color: '#555' }}>
        Global setting: the bottom banner is persistent on all eligible pages — home, library,
        lessons, books, quizzes, exams, <span lang="en">Eduvelto AI Teacher</span>, profiles. Per
        the owner&apos;s 20 Nov 2026, 21:52 brief it supersedes the earlier &quot;no ads during AI
        lessons or active exams&quot; rule; reserved space is the reconciliation. Users have no
        off switch — and neither does the owner on this page.
      </p>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <strong>নিচের ব্যানার — সবসময় চালু / Bottom banner — always on</strong>
          <StatusPill status={placementStatus('bottom-banner')} />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 15 }}>
          🔒 ব্যানার সবসময় চালু — মালিকের ২০ নভেম্বর ২০২৬, রাত ৯:৫২-এর নির্দেশে বন্ধ করা যায়
          না। / Always on — cannot be turned off (owner brief 20 Nov 2026, 21:52).
        </p>
        <p style={{ margin: '8px 0 0', color: '#555', fontSize: 14 }}>
          দর্শকরা এখন বিজ্ঞাপন দেখছে:{' '}
          {isPlacementConfigured('bottom-banner') ? (
            <strong>হ্যাঁ — AdSense ID বসানো আছে</strong>
          ) : (
            <strong>না — AdSense অনুমোদন হয়নি, ID বসানো হয়নি</strong>
          )}
          {' / '}
          {isPlacementConfigured('bottom-banner')
            ? 'Visitors are seeing ads now — AdSense IDs are set.'
            : 'Visitors are NOT seeing ads now — AdSense is not approved, no IDs set.'}
        </p>
        <p style={{ margin: '10px 0 0', color: '#555', fontSize: 14 }}>
          যোগ্য পাতা / Eligible pages: {BOTTOM_BANNER_ELIGIBLE_PAGES.join(' · ')}
        </p>
        <p style={{ margin: '6px 0 0', color: '#555', fontSize: 14 }}>
          কনটেন্টের নিচে জায়গা রিজার্ভ থাকে (+ মোবাইলের safe-area) — ব্যানার কনটেন্ট, বোতাম বা
          কুইজের উত্তর ঢাকে না। বিজ্ঞাপন না থাকলে ব্যানার শূন্য উচ্চতায় গুটিয়ে যায় — কোনো ভুয়া
          বিজ্ঞাপন বা খালি বাক্স নেই। / Space is reserved below the content (+ mobile safe-area),
          so the banner never covers content, buttons or quiz answers. With no ad available the
          slot collapses to zero height — no fake ads, no empty boxes.
        </p>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>বিজ্ঞাপনের জায়গা / Placements</h2>
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
                {p.labelBn} / {p.labelEn}
              </strong>
              <StatusPill status={status} />
            </div>
            <p style={{ margin: '8px 0', color: '#555', fontSize: 14 }}>
              {p.whereBn} / {p.whereEn}
            </p>
            <p style={{ margin: '8px 0', fontSize: 15 }}>
              দর্শকরা এখন বিজ্ঞাপন দেখছে:{' '}
              {visitorsSeeAds ? (
                <strong>হ্যাঁ</strong>
              ) : (
                <strong>
                  না — {configured ? 'এই ব্রাউজারে টগল বন্ধ আছে' : 'AdSense ID বসানো হয়নি'}
                </strong>
              )}
              {' / '}
              {visitorsSeeAds
                ? 'Visitors are seeing ads now.'
                : configured
                  ? 'Visitors are NOT seeing ads — the toggle is off in this browser.'
                  : 'Visitors are NOT seeing ads — no AdSense IDs set.'}
            </p>
            {p.id === 'bottom-banner' ? (
              <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
                এই জায়গাটি ওপরের &quot;স্থায়ী নিচের ব্যানার&quot; সেটিং দিয়ে চলে — এখানে কোনো
                টগল নেই। / This placement follows the &quot;Persistent bottom banner&quot; setting
                above — there is no toggle here.
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
                চালু / Enabled
                <span style={{ color: '#555', fontSize: 14 }}>
                  — এই ব্রাউজারে মাত্র / This browser only
                  {!configured ? ' — AdSense ID না বসা পর্যন্ত টগল বন্ধ থাকে' : ''}
                </span>
              </label>
            )}
          </div>
        );
      })}

      <h2 style={{ fontSize: 18, marginTop: 24 }}>রিপোর্ট / Reporting</h2>
      <h3 style={{ fontSize: 16 }}>ওয়েবসাইট (AdSense) / Website (AdSense)</h3>
      <ReportRows />
      <h3 style={{ fontSize: 16, marginTop: 20 }}>অ্যাপ (AdMob) / Apps (AdMob)</h3>
      <p style={{ color: '#555', fontSize: 14 }}>
        <span lang="en">AdMob</span> রিপোর্ট শুধু <span lang="en">AdMob</span> কনসোলে / অ্যাপে
        দেখা যায়, এখানে নয়। / <span lang="en">AdMob</span> reports are seen only in the{' '}
        <span lang="en">AdMob</span> console / apps, never here.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>শিশু সুরক্ষা / Child safety</h2>
      <ul style={{ color: '#333' }}>
        <li>
          ব্যক্তিগতকৃত বিজ্ঞাপন: {ADS_CHILD_SAFETY.personalisedAds ? 'চালু' : 'বন্ধ (সবসময়)'} /
          Personalised ads: {ADS_CHILD_SAFETY.personalisedAds ? 'ON' : 'OFF (always)'}
        </li>
        <li>শুধু পরিবার-নিরাপদ বিজ্ঞাপন / Family-safe ads only</li>
        <li>
          <span lang="en">AdSense</span> অ্যাকাউন্টেও Non-personalised ads + সংবেদনশীল ক্যাটাগরি
          ব্লক চালু রাখতে হবে — শুধু কোড যথেষ্ট নয়। / Also enable non-personalised ads +
          sensitive-category blocks in the <span lang="en">AdSense</span> account — code alone
          is not enough.
        </li>
        <li>
          খারাপ/ব্যক্তিগতকৃত বিজ্ঞাপন দেখলে স্ক্রিনশট নিয়ে Muse-কে জানান — ব্যানার বন্ধ করার
          কোনো সুইচ নেই, তাই খারাপ বিজ্ঞাপন <span lang="en">AdSense</span> অ্যাকাউন্ট থেকে ব্লক
          করতে হবে। / If you see a bad/personalised ad, screenshot it and tell Muse — there is
          no banner off-switch, so bad ads must be blocked from the{' '}
          <span lang="en">AdSense</span> account.
        </li>
        <li>
          নিচের ব্যানার সব যোগ্য পাতায় থাকে — পাঠ, কুইজ, পরীক্ষা ও এডুভেল্টো এআই শিক্ষক সহ
          (মালিকের ২০ নভেম্বর ২০২৬, রাত ৯:৫২-এর নির্দেশ; আগের &quot;AI পাঠ বা পরীক্ষার সময়
          বিজ্ঞাপন নয়&quot; নিয়মের ওপরে)। কনটেন্টের নিচে জায়গা রিজার্ভ থাকে, তাই ব্যানার
          কনটেন্ট, বোতাম বা কুইজের উত্তর ঢাকে না। / The bottom banner appears on all eligible
          pages — including lessons, quizzes, exams and the{' '}
          <span lang="en">Eduvelto AI Teacher</span> (owner brief 20 Nov 2026, 21:52,
          superseding the earlier rule). Reserved space below the content means it never covers
          content, buttons or quiz answers.
        </li>
        <li>
          তালিকার ভেতরের বিজ্ঞাপনের চারপাশে কমপক্ষে {ADS_CHILD_SAFETY.minSpacingPx}px ফাঁকা জায়গা
          — ভুল ক্লিক এড়াতে / At least {ADS_CHILD_SAFETY.minSpacingPx}px spacing around in-feed
          ads, to prevent accidental clicks
        </li>
        <li>
          ভিডিও বিজ্ঞাপন ও ক্রিয়েটর মনিটাইজেশন বন্ধ আছে / Video ads and creator monetisation are
          OFF
        </li>
      </ul>
    </PageShell>
  );
}
