// Eduvelto — Admin: Referral Leaderboard (28 Nov 2026, /free-quiz share).
//
// Owner/admin only (route sits under AdminGuard in App.tsx; the
// `quizReferrals` read rule is isAdmin()). Table sorted by visitor
// count, highest first: referral code, name, visitor count, last visit.
//
// HONESTY (shown on the page, bn+en): counts are a guide, not
// fraud-proof — anyone can open a referral link and there is no
// CAPTCHA/rate-limit on the free Spark plan — so winners are picked
// by count PLUS a sanity check, never by count alone.

import { useEffect, useState } from 'react';
import { formatBnNumber, formatTime } from '../lib/admin';
import {
  fetchReferralLeaderboard,
  type ReferralRow,
} from '../lib/referralLeaderboard';
import { useLanguage } from '../i18n/LanguageContext';
import { EmptyAdminBox, ErrorBox, LoadingBox, requireDb } from '../components/AdminShared';

export default function AdminReferralsPage() {
  const { lang, t } = useLanguage();
  const [rows, setRows] = useState<ReferralRow[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchReferralLeaderboard(requireDb());
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) {
          setError(
            t({
              bn: 'লিডারবোর্ড লোড করা যায়নি — পরে আবার চেষ্টা করুন।',
              en: 'The leaderboard could not be loaded — please try again later.',
            }),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="ev-admin-page-title">
        {t({ bn: 'রেফারেল লিডারবোর্ড', en: 'Referral Leaderboard' })}
      </h1>
      <p className="ev-admin-note">
        {t({
          bn: 'ভিজিটর সংখ্যা শুধু একটি নির্দেশক, জালিয়াতি-প্রমাণ নয় — যে কেউ রেফারেল লিঙ্ক খুলতে পারে। বিজয়ী বাছাই হবে সংখ্যা + যাচাই মিলিয়ে, শুধু সংখ্যা দেখে নয়। এই তালিকা শুধু মালিকের জন্য, পাবলিক নয়।',
          en: 'Visitor counts are a guide, not fraud-proof — anyone can open a referral link. Winners are picked by count plus a sanity check, never by count alone. This leaderboard is owner-only, not public.',
        })}
      </p>

      {error ? <ErrorBox message={error} /> : null}
      {rows === null && !error ? (
        <LoadingBox
          label={t({ bn: 'লিডারবোর্ড লোড হচ্ছে…', en: 'Loading leaderboard…' })}
        />
      ) : null}
      {rows !== null && rows.length === 0 ? (
        <EmptyAdminBox
          bn="এখনো কোনো রেফারেল নেই — কেউ ফ্রি কুইজ শেয়ার করলে এখানে দেখা যাবে।"
          en="No referrals yet — once someone shares the free quiz, they will appear here."
        />
      ) : null}
      {rows !== null && rows.length > 0 ? (
        <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
          <caption
            style={{
              textAlign: 'left',
              color: 'var(--ink-soft)',
              fontSize: 14,
              paddingBottom: 4,
            }}
          >
            {t({
              bn: `${rows.length}টি রেফারেল কোড — ভিজিটর সংখ্যা অনুযায়ী সাজানো`,
              en: `${rows.length} referral code(s) — sorted by visitor count`,
            })}
          </caption>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left' }}>
              <th style={{ padding: '6px 8px 6px 0' }}>#</th>
              <th style={{ padding: '6px 8px 6px 0' }}>
                {t({ bn: 'রেফারেল কোড', en: 'Referral Code' })}
              </th>
              <th style={{ padding: '6px 8px 6px 0' }}>{t({ bn: 'নাম', en: 'Name' })}</th>
              <th style={{ padding: '6px 8px 6px 0' }}>
                {t({ bn: 'ভিজিটর', en: 'Visitors' })}
              </th>
              <th style={{ padding: '6px 8px 6px 0' }}>
                {t({ bn: 'শেষ ভিজিট', en: 'Last Visit' })}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.code} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '6px 8px 6px 0' }}>
                  {lang === 'bn' ? formatBnNumber(i + 1) : String(i + 1)}
                </td>
                <td style={{ padding: '6px 8px 6px 0' }}>
                  <code>{row.code}</code>
                </td>
                <td style={{ padding: '6px 8px 6px 0' }}>{row.name}</td>
                <td style={{ padding: '6px 8px 6px 0' }}>
                  {lang === 'bn' ? formatBnNumber(row.count) : String(row.count)}
                </td>
                <td style={{ padding: '6px 8px 6px 0' }}>{formatTime(row.lastSeen, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
