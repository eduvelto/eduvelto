import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { ErrorBox, LoadingBox, StatusPill, requireDb } from '../components/AdminShared';
import {
  domainDaysLeft,
  formatBnNumber,
  formatTime,
  friendlyAdminError,
  getDashboardCounts,
  getExternalItems,
  listTeacherVerifications,
  type DashboardCounts,
  type VerificationRow,
} from '../lib/admin';
import { ADSENSE_CLIENT_ID } from '../lib/ads';
import { getTodayUsage, usagePercentages, QUOTAS } from '../lib/usage';

interface AreaCard {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  status: 'working' | 'soon';
  to?: string;
  countBn?: string;
}

const LAST_BACKUP_KEY = 'eduvelto-last-backup-v1';

export default function AdminPage() {
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [pending, setPending] = useState<VerificationRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [c, p] = await Promise.all([
          getDashboardCounts(requireDb()),
          listTeacherVerifications(requireDb(), 'pending'),
        ]);
        if (cancelled) return;
        setCounts(c);
        setPending(p);
        try {
          setLastBackup(localStorage.getItem(LAST_BACKUP_KEY));
        } catch {
          setLastBackup(null);
        }
      } catch (e) {
        if (!cancelled) setError(friendlyAdminError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const external = getExternalItems(ADSENSE_CLIENT_ID !== '');
  const usage = getTodayUsage();
  const perc = usagePercentages(usage);
  const days = domainDaysLeft();

  const areas: AreaCard[] = [
    {
      id: 'users',
      titleBn: 'ব্যবহারকারী',
      titleEn: 'Users',
      descBn: 'সব অ্যাকাউন্ট দেখুন, খুঁজুন, স্থগিত/চালু করুন, ভূমিকা বদলান।',
      descEn: 'View, search, suspend/reactivate users, change roles.',
      status: 'working',
      to: '/admin/users',
      countBn: counts ? `${formatBnNumber(counts.users)} জন` : undefined,
    },
    {
      id: 'teachers',
      titleBn: 'শিক্ষক যাচাই',
      titleEn: 'Teacher verification',
      descBn: 'শিক্ষক আবেদন যাচাই করুন — প্রতিটি আবেদন আলাদা সিদ্ধান্ত।',
      descEn: 'Verify teacher applications — one separate decision each.',
      status: 'working',
      to: '/admin/teachers',
      countBn: counts ? `${formatBnNumber(counts.pendingVerifications)}টি অপেক্ষায়` : undefined,
    },
    {
      id: 'content',
      titleBn: 'কনটেন্ট / ভিডিও / লাইব্রেরি',
      titleEn: 'Content / Video / Library',
      descBn: 'পাঠ, বই, কুইজ, ভিডিও প্রকাশ ও ব্যবস্থাপনা — Step 2–4-এ তৈরি হবে।',
      descEn: 'Publish and manage lessons, books, quizzes, videos — built in Steps 2–4.',
      status: 'soon',
    },
    {
      id: 'settings',
      titleBn: 'ওয়েবসাইট + অ্যাপ সেটিংস',
      titleEn: 'Website + app settings',
      descBn: 'সাইটের নাম, ভাষা, সাধারণ সেটিংস — শীঘ্রই আসছে।',
      descEn: 'Site name, language, general settings — coming soon.',
      status: 'soon',
    },
    {
      id: 'ads',
      titleBn: 'বিজ্ঞাপন',
      titleEn: 'Advertising',
      descBn: 'AdSense স্থিতি, ব্যানার ও তালিকার বিজ্ঞাপন, রিপোর্ট।',
      descEn: 'AdSense status, banner and in-feed ads, reporting.',
      status: 'working',
      to: '/admin/ads',
      countBn: ADSENSE_CLIENT_ID === '' ? 'এখনো সংযুক্ত হয়নি' : 'সংযুক্ত আছে',
    },
    {
      id: 'ai',
      titleBn: 'AI সেবা + ব্যবহারের সীমা',
      titleEn: 'AI services + usage limits',
      descBn: 'AI শিক্ষকের খরচ ও ব্যবহারের সীমা — Step 6-এ তৈরি হবে।',
      descEn: 'AI Teacher cost and usage limits — built in Step 6.',
      status: 'soon',
    },
    {
      id: 'finance',
      titleBn: 'আর্থিক + প্ল্যাটফর্ম বিশ্লেষণ',
      titleEn: 'Finance + platform analytics',
      descBn: 'আয়, খরচ, ব্যবহারকারীর সংখ্যা ও অগ্রগতি — শীঘ্রই আসছে।',
      descEn: 'Income, costs, user numbers and progress — coming soon.',
      status: 'soon',
    },
    {
      id: 'moderation',
      titleBn: 'মডারেশন, রিপোর্ট, নিরাপত্তা',
      titleEn: 'Moderation, reports, security',
      descBn: 'খোলা রিপোর্ট পর্যালোচনা ও নিষ্পত্তি, বার্তা যাচাই অনুমোদন (শুধু মালিক), শিশুর বার্তা সম্মতি, বার্তা স্থগিত।',
      descEn: 'Review and resolve open reports, message-access grants (owner only), child DM consents, DM suspension.',
      status: 'working',
      to: '/admin/moderation',
    },
    {
      id: 'features',
      titleBn: 'ফিচার চালু/বন্ধ',
      titleEn: 'Feature toggles',
      descBn: 'কোন ফিচার চালু থাকবে — সীমাবদ্ধ ফিচার তালাবদ্ধ থাকে।',
      descEn: 'Which features are on — restricted features stay locked.',
      status: 'working',
      to: '/admin/features',
    },
    {
      id: 'roles',
      titleBn: 'অ্যাডমিন + স্টাফের ভূমিকা',
      titleEn: 'Admin + staff roles',
      descBn: 'কার কী ভূমিকা — ব্যবহারকারী পাতা থেকে বদলান।',
      descEn: 'Who has which role — change it from the Users page.',
      status: 'working',
      to: '/admin/users',
    },
    {
      id: 'backup',
      titleBn: 'ব্যাকআপ, সিস্টেম স্বাস্থ্য, অডিট লগ',
      titleEn: 'Backup, system health, audit log',
      descBn: 'ব্যাকআপ সংরক্ষণ, সব অ্যাডমিন কাজের লগ।',
      descEn: 'Export backups, see the log of all admin actions.',
      status: 'working',
      to: '/admin/backup',
      countBn: lastBackup
        ? `শেষ ব্যাকআপ: ${formatTime(lastBackup)}`
        : 'এখনো কোনো ব্যাকআপ হয়নি',
    },
    {
      id: 'expansion',
      titleBn: 'ভবিষ্যৎ বিভাগ + সম্প্রসারণ',
      titleEn: 'Future divisions + expansion',
      descBn: 'নতুন বিভাগ, নতুন স্কুল/জেলা — ভবিষ্যৎ পরিকল্পনা।',
      descEn: 'New divisions, new schools/districts — future planning.',
      status: 'soon',
    },
  ];

  return (
    <PageShell titleBn="অ্যাডমিন ড্যাশবোর্ড" titleEn="Admin dashboard">
      <p>
        মালিকের নিয়ন্ত্রণ কেন্দ্র — সব কাজ এখান থেকে, কোড ছাড়া। / The owner&apos;s control
        centre — everything from here, no code.
      </p>
      <p style={{ color: '#555' }}>
        প্রতিটি অনুমোদন আলাদা — একটির সিদ্ধান্ত অন্যটিকে প্রভাবিত করে না। / Every approval is
        separate — one decision never affects another.
      </p>

      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}

      <h2 style={{ fontSize: 18, marginTop: 24 }}>
        অনুমোদনের অপেক্ষায় / Waiting for approval
      </h2>
      {loading ? null : pending.length === 0 ? (
        <p style={{ color: '#555' }}>
          কোনো আবেদন অপেক্ষায় নেই — নতুন আবেদন এলে প্রতিটি আলাদা করে এখানে দেখা যাবে। / Nothing
          waiting — new applications appear here, each separately.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pending.map((row) => (
            <li
              key={row.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 8,
              }}
            >
              <strong>{row.fullName}</strong> — {row.institution}
              <br />
              <span style={{ color: '#555', fontSize: 14 }}>
                শিক্ষক আবেদন · {formatTime(row.createdAt)}
              </span>
              <br />
              <Link to="/admin/teachers">এই আবেদনের সিদ্ধান্ত নিন / Decide this application →</Link>
            </li>
          ))}
        </ul>
      )}

      <h2 style={{ fontSize: 18, marginTop: 24 }}>সব এলাকা / All areas</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {areas.map((a) => (
          <div
            key={a.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: '12px 14px',
              opacity: a.status === 'soon' ? 0.75 : 1,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>{a.titleBn}</strong>
              <StatusPill
                label={a.status === 'working' ? 'চালু / Working' : 'শীঘ্রই আসছে / Coming soon'}
                tone={a.status === 'working' ? 'active' : 'muted'}
              />
              {a.countBn ? (
                <span style={{ marginLeft: 'auto', color: '#555', fontSize: 14 }}>{a.countBn}</span>
              ) : null}
            </div>
            <p style={{ margin: '8px 0 4px', color: '#555', fontSize: 14 }}>{a.descBn}</p>
            <p style={{ margin: '0 0 8px', color: '#555', fontSize: 14 }}>{a.descEn}</p>
            {a.to ? (
              <Link to={a.to}>খুলুন / Open →</Link>
            ) : (
              <span style={{ color: '#888', fontSize: 14 }}>
                এখনো তৈরি হয়নি — চালু হলে এখান থেকে খোলা যাবে। / Not built yet.
              </span>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, marginTop: 24 }}>
        বাইরের জিনিস — অবস্থা ও করণীয় / External items — status &amp; what to do
      </h2>
      <p style={{ color: '#555', fontSize: 14 }}>
        এগুলো ড্যাশবোর্ড থেকে করা যায় না — কিন্তু অবস্থা এখানে দেখা যায়, আর কী করতে হবে তা
        প্রতিটির নিচে লেখা আছে। শেষ যাচাই: {formatTime(new Date())} / These cannot be done from
        the dashboard — but their status is shown here, with what to do under each. Last checked:{' '}
        {formatTime(new Date())}
      </p>
      {external.map((item) => (
        <div
          key={item.id}
          style={{
            border: item.id === 'domain' && days <= 30 ? '2px solid #b00020' : '1px solid #ddd',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <strong>{item.titleBn}</strong>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 14,
                color: item.id === 'domain' && days <= 30 ? '#b00020' : '#0A1F44',
                fontWeight: 700,
              }}
            >
              {item.statusBn}
            </span>
          </div>
          <p style={{ margin: '8px 0', fontSize: 15 }}>{item.detailBn}</p>
          <p style={{ margin: '0 0 8px', color: '#555', fontSize: 14 }}>{item.detailEn}</p>
          <p style={{ margin: 0, fontSize: 14 }}>
            কোথায় করবেন: <span lang="en">{item.whereBn}</span> / Where: {item.whereEn}
          </p>
        </div>
      ))}

      <h2 style={{ fontSize: 18, marginTop: 24 }}>
        ব্যবহারের হিসাব (আনুমানিক) / Usage estimate
      </h2>
      <p style={{ color: '#555', fontSize: 14 }}>
        এই সংখ্যাগুলো শুধু এই ব্রাউজারের আনুমানিক হিসাব — আসল কোটা নয়। আসল সংখ্যা Firebase
        console-এ দেখুন। / These numbers are this browser&apos;s estimate only — not the real
        quota. See the real numbers in the Firebase console.
      </p>
      <p style={{ fontSize: 15 }}>
        আজকের পড়া (Reads): {formatBnNumber(usage.firestoreReads)} /{' '}
        {formatBnNumber(QUOTAS.firestoreReadsPerDay)} ({perc.firestoreReads.toFixed(1)}%) · লেখা
        (Writes): {formatBnNumber(usage.firestoreWrites)} /{' '}
        {formatBnNumber(QUOTAS.firestoreWritesPerDay)} ({perc.firestoreWrites.toFixed(1)}%)
      </p>
      <p style={{ color: '#555', fontSize: 14 }}>
        Firebase console → Firestore Database → Usage tab-এ আসল সংখ্যা দেখুন। / See the real
        numbers in Firebase console → Firestore Database → Usage tab.
      </p>
      <p style={{ marginTop: 24 }}>
        <Link to="/admin/audit">অডিট লগ দেখুন / View audit log →</Link>
      </p>
    </PageShell>
  );
}
