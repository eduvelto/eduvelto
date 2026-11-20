import { useState } from 'react';
import { PageShell } from '../components/PageShell';
import { useAuth } from '../lib/auth';
import {
  AD_PLACEMENTS,
  ADSENSE_CLIENT_ID,
  ADS_CHILD_SAFETY,
  BOTTOM_BANNER_ELIGIBLE_PAGES,
  BOTTOM_BANNER_RESERVE_PX,
  getPlacementEnabled,
  placementStatus,
  setPlacementEnabled,
  type AdPlacement,
  type AdPlacementStatus,
} from '../lib/ads';

// Eduvelto — Admin advertising page (/admin/ads).
//
// Part of the existing admin area (same treatment as /admin: the app has
// no role-based guard yet — admin roles are assigned in the Firebase
// console and the guard arrives with admin verification. Placement toggles
// need sign-in; viewing status is harmless — no IDs, no data, no fake
// numbers anywhere on this page).
//
// - Placement list with status (Not configured / Ready / Active) and
//   toggles stored in this browser's localStorage (see lib/ads.ts).
//   No Firestore collection and no rules change for this.
// - Reporting is honest placeholders only: impressions / clicks /
//   estimated revenue show "Connect AdSense/AdMob to see reports" —
//   NO invented numbers, NO fake data.
// - Website (AdSense) and App (AdMob) reports are kept separate. AdMob
//   lives in the mobile apps, not in this web app.

const STATUS_LABEL: Record<AdPlacementStatus, { bn: string; en: string }> = {
  'not-configured': { bn: 'সেট করা হয়নি', en: 'Not configured' },
  ready: { bn: 'প্রস্তুত', en: 'Ready' },
  active: { bn: 'সক্রিয়', en: 'Active' },
};

const REPORT_NOT_CONNECTED_BN = 'রিপোর্ট দেখতে AdSense সংযুক্ত করুন';
const REPORT_NOT_CONNECTED_EN = 'Connect AdSense to see reports';

function ReportRows(props: { notConnectedBn: string; notConnectedEn: string }) {
  const rows: Array<[string, string]> = [
    ['Impressions / দেখা', ''],
    ['Clicks / ক্লিক', ''],
    ['Estimated revenue / আনুমানিক আয়', ''],
  ];
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
      <tbody>
        {rows.map(([label]) => (
          <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
            <td style={{ padding: '6px 0' }}>{label}</td>
            <td style={{ padding: '6px 0', textAlign: 'right', color: '#555' }}>
              {props.notConnectedBn} · {props.notConnectedEn}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminAds() {
  const { user } = useAuth();
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
        ওয়েবসাইট বিজ্ঞাপন (Google AdSense) — প্রস্তুতির পর্যায়ে। AdSense অনুমোদন না হওয়া পর্যন্ত
        কোথাও কোনো বিজ্ঞাপন দেখানো হয় না।
      </p>
      <p style={{ color: '#555' }}>
        Website advertising (Google AdSense) — preparation stage. No ads are shown anywhere until
        AdSense approves the site.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>AdSense স্থিতি / AdSense status</h2>
      <p>
        Publisher ID:{' '}
        {ADSENSE_CLIENT_ID === '' ? (
          <strong>সেট করা হয়নি — AdSense অনুমোদনের পর বসানো হবে / Not set — added after AdSense approval</strong>
        ) : (
          <strong>সেট করা আছে / Set</strong>
        )}
      </p>
      <p style={{ color: '#555', fontSize: 14 }}>
        অনুমোদন জমা দেওয়া যাবে শুধু সাইটটি eduvelto.com-এ লাইভ হলে ও আসল কনটেন্ট থাকলে। ডোমেইন
        সংযোগ ও ডেপ্লয়মেন্টের জন্য মালিকের আলাদা অনুমোদন লাগবে।
        Approval can be submitted only once the site is live on eduvelto.com with real content.
        Domain connection and deployment need the owner&apos;s separate approval.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>স্থায়ী নিচের ব্যানার / Persistent bottom banner</h2>
      <p>
        <strong>বিশ্বব্যাপী সেটিং (global setting):</strong> নিচের ব্যানারটি অ্যাপের সব যোগ্য পাতায়
        স্থায়ীভাবে থাকে — হোম, লাইব্রেরি, পাঠ, বই, কুইজ, পরীক্ষা, AI Teacher, প্রোফাইল। এটি
        ২০ নভেম্বর ২০২১-এর মালিকের নির্দেশে &quot;AI পাঠ বা পরীক্ষার সময় বিজ্ঞাপন নয়&quot; নিয়মের
        ওপরে প্রযোজ্য — ব্যানার এখন সব যোগ্য পাতায় আবশ্যক; কনটেন্টের নিচে জায়গা রেখে দেওয়া হয়,
        তাই ব্যানার কিছু ঢাকে না। ব্যবহারকারীদের বন্ধ করার কোনো সুইচ নেই।
      </p>
      <p style={{ color: '#555' }}>
        Global setting: the bottom banner is persistent on all eligible pages — home, library,
        lessons, books, quizzes, exams, AI Teacher, profiles. Per the owner&apos;s 20 Nov 21:52
        brief it supersedes the earlier &quot;no ads during AI lessons or active exams&quot; rule;
        reserved space is the reconciliation. Users have no off switch.
      </p>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <strong>নিচের ব্যানার চালু / Bottom banner enabled</strong>
          <span
            style={{
              marginLeft: 'auto',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 13,
              background:
                placementStatus('bottom-banner') === 'active'
                  ? '#e6f4ea'
                  : placementStatus('bottom-banner') === 'ready'
                    ? '#fef7e0'
                    : '#f1f1f1',
              color: placementStatus('bottom-banner') === 'active' ? '#137333' : '#444',
            }}
          >
            {STATUS_LABEL[placementStatus('bottom-banner')].bn} ·{' '}
            {STATUS_LABEL[placementStatus('bottom-banner')].en}
          </span>
        </div>
        <label
          style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, cursor: user ? 'pointer' : 'not-allowed' }}
        >
          <input
            type="checkbox"
            checked={toggles['bottom-banner']}
            disabled={!user}
            onChange={(e) => onToggle('bottom-banner', e.target.checked)}
          />
          স্থায়ী ব্যানার চালু / Persistent banner enabled
        </label>
        <p style={{ margin: '10px 0 0', color: '#555', fontSize: 14 }}>
          যোগ্য পাতা / Eligible pages: {BOTTOM_BANNER_ELIGIBLE_PAGES.join(' · ')}
        </p>
        <p style={{ margin: '6px 0 0', color: '#555', fontSize: 14 }}>
          কনটেন্টের নিচে {BOTTOM_BANNER_RESERVE_PX}px জায়গা রিজার্ভ থাকে (+ মোবাইলের safe-area) —
          ব্যানার কনটেন্ট, বোতাম বা কুইজের উত্তর ঢাকে না। বিজ্ঞাপন না থাকলে ব্যানার শূন্য উচ্চতায়
          গুটিয়ে যায় — কোনো ভুয়া বিজ্ঞাপন বা খালি বাক্স নেই। / {BOTTOM_BANNER_RESERVE_PX}px of
          space is reserved below the content (+ mobile safe-area), so the banner never covers
          content, buttons or quiz answers. With no ad available the slot collapses to zero
          height — no fake ads, no empty boxes.
        </p>
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>বিজ্ঞাপনের জায়গা / Placements</h2>
      {!user && (
        <p style={{ color: '#b00020' }}>
          টগল বদলাতে সাইন ইন করুন। / Sign in to change placement toggles.
        </p>
      )}
      {AD_PLACEMENTS.map((p) => {
        const status = placementStatus(p.id);
        const label = STATUS_LABEL[status];
        return (
          <div
            key={p.id}
            style={{ border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <strong>
                {p.labelBn} / {p.labelEn}
              </strong>
              <span
                style={{
                  marginLeft: 'auto',
                  padding: '2px 10px',
                  borderRadius: 12,
                  fontSize: 13,
                  background: status === 'active' ? '#e6f4ea' : status === 'ready' ? '#fef7e0' : '#f1f1f1',
                  color: status === 'active' ? '#137333' : '#444',
                }}
              >
                {label.bn} · {label.en}
              </span>
            </div>
            <p style={{ margin: '8px 0', color: '#555', fontSize: 14 }}>
              {p.whereBn} / {p.whereEn}
            </p>
            {p.id === 'bottom-banner' ? (
              <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
                এই জায়গাটি ওপরের &quot;স্থায়ী নিচের ব্যানার&quot; বিশ্বব্যাপী সেটিং দিয়ে চালু/বন্ধ হয়। /
                This placement is controlled by the &quot;Persistent bottom banner&quot; global setting above.
              </p>
            ) : (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: user ? 'pointer' : 'not-allowed' }}>
                <input
                  type="checkbox"
                  checked={toggles[p.id]}
                  disabled={!user}
                  onChange={(e) => onToggle(p.id, e.target.checked)}
                />
                চালু / Enabled
              </label>
            )}
          </div>
        );
      })}
      <p style={{ color: '#555', fontSize: 14 }}>
        টগল শুধু এই ব্রাউজারে সংরক্ষিত হয় (localStorage)। কোনো Firestore সংগ্রহ বা নিয়ম পরিবর্তন
        করা হয়নি। / Toggles are stored only in this browser (localStorage). No Firestore
        collection or rules change was made.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>রিপোর্ট / Reporting</h2>
      <h3 style={{ fontSize: 16 }}>ওয়েবসাইট (AdSense) / Website (AdSense)</h3>
      <ReportRows notConnectedBn={REPORT_NOT_CONNECTED_BN} notConnectedEn={REPORT_NOT_CONNECTED_EN} />
      <h3 style={{ fontSize: 16, marginTop: 20 }}>অ্যাপ (AdMob) / Apps (AdMob)</h3>
      <p style={{ color: '#555', fontSize: 14 }}>
        AdMob মোবাইল অ্যাপে থাকে, এই ওয়েব অ্যাপে নয় — তাই এখানে AdMob-এর কোনো তথ্য নেই। / AdMob
        lives in the mobile apps, not in this web app — so there is no AdMob data here.
      </p>
      <ReportRows
        notConnectedBn="রিপোর্ট দেখতে AdMob সংযুক্ত করুন"
        notConnectedEn="Connect AdMob to see reports"
      />

      <h2 style={{ fontSize: 18, marginTop: 24 }}>শিশু সুরক্ষা / Child safety</h2>
      <ul style={{ color: '#333' }}>
        <li>
          ব্যক্তিগতকৃত বিজ্ঞাপন: {ADS_CHILD_SAFETY.personalisedAds ? 'চালু' : 'বন্ধ (সবসময়)'} /
          Personalised ads: {ADS_CHILD_SAFETY.personalisedAds ? 'ON' : 'OFF (always)'}
        </li>
        <li>শুধু পরিবার-নিরাপদ বিজ্ঞাপন / Family-safe ads only</li>
        <li>
          নিচের ব্যানার সব যোগ্য পাতায় থাকে — পাঠ, কুইজ, পরীক্ষা ও AI Teacher সহ (মালিকের ২০ নভেম্বর
          ২১:৫২ নির্দেশ; আগের &quot;AI পাঠ বা পরীক্ষার সময় বিজ্ঞাপন নয়&quot; নিয়মের ওপরে)। কনটেন্টের
          নিচে জায়গা রিজার্ভ থাকে, তাই ব্যানার কনটেন্ট, বোতাম বা কুইজের উত্তর ঢাকে না। / The
          bottom banner appears on all eligible pages — including lessons, quizzes, exams and the
          AI Teacher (owner brief 20 Nov 21:52, superseding the earlier rule). Reserved space
          below the content means it never covers content, buttons or quiz answers.
        </li>
        <li>
          প্রয়োজনীয় নেভিগেশনের ওপরে কখনো বিজ্ঞাপন নয় — হেডার ওপরে থাকে, ব্যানার নিচে স্থায়ী /
          Never over essential navigation — the header sits at the top, the banner is fixed at the bottom.
        </li>
        <li>
          বিজ্ঞাপনের চারপাশে কমপক্ষে {ADS_CHILD_SAFETY.minSpacingPx}px ফাঁকা জায়গা — ভুল ক্লিক এড়াতে /
          At least {ADS_CHILD_SAFETY.minSpacingPx}px spacing around ads, to prevent accidental clicks
        </li>
        <li>ভিডিও বিজ্ঞাপন ও ক্রিয়েটর মনিটাইজেশন বন্ধ আছে / Video ads and creator monetisation are OFF</li>
      </ul>
    </PageShell>
  );
}
