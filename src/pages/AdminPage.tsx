import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, LinkButton, ProgressBar, SkeletonCards } from '../components/ui';
import { ErrorBox, StatusPill, requireDb } from '../components/AdminShared';
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
  countEn?: string;
}

const LAST_BACKUP_KEY = 'eduvelto-last-backup-v1';

export default function AdminPage() {
  const { lang, t } = useLanguage();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [pending, setPending] = useState<VerificationRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Same decoupling as AdminUsersPage: the pending-verifications list
      // is the page content and must load even when count() fails on live
      // Spark (RESOURCE_EXHAUSTED, audit H1). The count is a nicety.
      try {
        const p = await listTeacherVerifications(requireDb(), 'pending');
        if (cancelled) return;
        setPending(p);
        try {
          setLastBackup(localStorage.getItem(LAST_BACKUP_KEY));
        } catch {
          setLastBackup(null);
        }
      } catch (e) {
        if (!cancelled) setError(friendlyAdminError(e, lang));
      } finally {
        if (!cancelled) setLoading(false);
      }
      try {
        const c = await getDashboardCounts(requireDb());
        if (!cancelled) setCounts(c);
      } catch {
        // Counts stay hidden; the dashboard and pending list are intact.
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
      countEn: counts ? `${counts.users} users` : undefined,
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
      countEn: counts ? `${counts.pendingVerifications} pending` : undefined,
    },
    {
      id: 'guardians',
      titleBn: 'অভিভাবক সংযোগ যাচাই',
      titleEn: 'Guardian link verification',
      descBn: 'অভিভাবক–সন্তান সংযোগের অনুরোধ যাচাই করুন — লিখিত তথ্য + সন্তানের নিশ্চিতকরণ।',
      descEn: 'Verify guardian–child link requests — written information + the child’s confirmation.',
      status: 'working',
      to: '/admin/guardians',
    },
    {
      id: 'nu-admissions',
      titleBn: 'ভর্তি প্রস্তুতি (NU) — কাঠামোর সীড',
      titleEn: 'Admission preparation (NU) — structure seed',
      descBn: 'জাতীয় বিশ্ববিদ্যালয়ের প্রতিষ্ঠান, শাখা, পরীক্ষার কনফিগ ও বিজ্ঞপ্তি-কনফিগ Firestore-এ প্রয়োগ করুন ও মিল যাচাই করুন।',
      descEn: 'Apply and verify National University institution, group, exam-config and circular-config documents in Firestore.',
      status: 'working',
      to: '/admin/admissions/structure',
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
      countEn: ADSENSE_CLIENT_ID === '' ? 'Not connected yet' : 'Connected',
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
      descBn: 'রিপোর্ট পর্যালোচনা, কনটেন্ট অনুমোদন, ব্লক — মডারেশন কিউ তৈরি হলে আসবে।',
      descEn: 'Review reports, approve content, block users — arrives with the moderation queue.',
      status: 'soon',
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
        ? `শেষ ব্যাকআপ: ${formatTime(lastBackup, lang)}`
        : 'এখনো কোনো ব্যাকআপ হয়নি',
      countEn: lastBackup
        ? `Last backup: ${formatTime(lastBackup, lang)}`
        : 'No backup yet',
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
    <PageShell titleBn="অ্যাডমিন ড্যাশবোর্ড" titleEn="Admin dashboard" wide>
      <p>
        {t({
          bn: 'মালিকের নিয়ন্ত্রণ কেন্দ্র — সব কাজ এখান থেকে, কোড ছাড়া।',
          en: 'The owner’s control centre — everything from here, no code.',
        })}
      </p>
      <p className="ev-muted-ivory">
        {t({
          bn: 'প্রতিটি অনুমোদন আলাদা — একটির সিদ্ধান্ত অন্যটিকে প্রভাবিত করে না।',
          en: 'Every approval is separate — one decision never affects another.',
        })}
      </p>

      {loading ? <SkeletonCards count={3} /> : null}
      {error ? <ErrorBox message={error} /> : null}

      <h2 className="ev-section-h2" style={{ marginTop: 24 }}>
        {t({ bn: 'অনুমোদনের অপেক্ষায়', en: 'Waiting for approval' })}
      </h2>
      {loading ? null : pending.length === 0 ? (
        <p className="ev-muted-ivory">
          {t({
            bn: 'কোনো আবেদন অপেক্ষায় নেই — নতুন আবেদন এলে প্রতিটি আলাদা করে এখানে দেখা যাবে।',
            en: 'Nothing waiting — new applications appear here, each separately.',
          })}
        </p>
      ) : (
        <div className="ev-dash-grid">
          {pending.map((row) => (
            <Card key={row.id}>
              <strong style={{ fontSize: 16 }}>{row.fullName}</strong> — {row.institution}
              <p className="ev-muted" style={{ fontSize: 14, margin: '8px 0 12px' }}>
                {t({ bn: 'শিক্ষক আবেদন', en: 'Teacher application' })} · {formatTime(row.createdAt, lang)}
              </p>
              <LinkButton to="/admin/teachers" variant="outline" size="sm">{t({ bn: 'এই আবেদনের সিদ্ধান্ত নিন', en: 'Decide this application' })} →</LinkButton>
            </Card>
          ))}
        </div>
      )}

      <h2 className="ev-section-h2" style={{ marginTop: 24 }}>{t({ bn: 'সব এলাকা', en: 'All areas' })}</h2>
      <div className="ev-dash-grid">
        {areas.map((a) => (
          <Card key={a.id} style={{ opacity: a.status === 'soon' ? 0.75 : 1 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <strong style={{ fontSize: 16 }}>{lang === 'bn' ? a.titleBn : a.titleEn}</strong>
              <StatusPill
                label={a.status === 'working' ? t({ bn: 'চালু', en: 'Working' }) : t({ bn: 'শীঘ্রই আসছে', en: 'Coming soon' })}
                tone={a.status === 'working' ? 'active' : 'muted'}
              />
              {a.countBn ? (
                <span style={{ marginLeft: 'auto', color: '#57616A', fontSize: 14 }}>{lang === 'bn' ? a.countBn : a.countEn}</span>
              ) : null}
            </div>
            <p style={{ margin: '8px 0 12px', color: '#68747B', fontSize: 14 }}>{lang === 'bn' ? a.descBn : a.descEn}</p>
            {a.to ? (
              <LinkButton to={a.to} variant="outline" size="sm">{t({ bn: 'খুলুন', en: 'Open' })} →</LinkButton>
            ) : (
              <span className="ev-muted" style={{ fontSize: 14 }}>
                {t({ bn: 'এখনো তৈরি হয়নি — চালু হলে এখান থেকে খোলা যাবে।', en: 'Not built yet — it will open from here once live.' })}
              </span>
            )}
          </Card>
        ))}
      </div>

      <h2 className="ev-section-h2" style={{ marginTop: 24 }}>
        {t({ bn: 'বাইরের জিনিস — অবস্থা ও করণীয়', en: 'External items — status & what to do' })}
      </h2>
      <p className="ev-muted-ivory" style={{ fontSize: 14 }}>
        {t({
          bn: `এগুলো ড্যাশবোর্ড থেকে করা যায় না — কিন্তু অবস্থা এখানে দেখা যায়, আর কী করতে হবে তা প্রতিটির নিচে লেখা আছে। শেষ যাচাই: ${formatTime(new Date(), lang)}`,
          en: `These cannot be done from the dashboard — but their status is shown here, with what to do under each. Last checked: ${formatTime(new Date(), lang)}`,
        })}
      </p>
      {external.map((item) => (
        <Card
          key={item.id}
          style={{
            marginBottom: 12,
            border: item.id === 'domain' && days <= 30 ? '2px solid #B00020' : undefined,
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <strong>{lang === 'bn' ? item.titleBn : item.titleEn}</strong>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 14,
                color: item.id === 'domain' && days <= 30 ? '#B00020' : '#12766E',
                fontWeight: 700,
              }}
            >
              {lang === 'bn' ? item.statusBn : item.statusEn}
            </span>
          </div>
          <p style={{ margin: '8px 0', fontSize: 15 }}>{lang === 'bn' ? item.detailBn : item.detailEn}</p>
          <p style={{ margin: 0, fontSize: 14 }}>
            {t({ bn: 'কোথায় করবেন:', en: 'Where:' })} {lang === 'bn' ? item.whereBn : item.whereEn}
          </p>
        </Card>
      ))}

      <h2 className="ev-section-h2" style={{ marginTop: 24 }}>
        {t({ bn: 'ব্যবহারের হিসাব (আনুমানিক)', en: 'Usage estimate' })}
      </h2>
      <p className="ev-muted-ivory" style={{ fontSize: 14 }}>
        {t({
          bn: 'এই সংখ্যাগুলো শুধু এই ব্রাউজারের আনুমানিক হিসাব — আসল কোটা নয়। আসল সংখ্যা Firebase console-এ দেখুন।',
          en: 'These numbers are this browser’s estimate only — not the real quota. See the real numbers in the Firebase console.',
        })}
      </p>
      <Card>
        <div className="ev-dash-row">
          <span className="ev-dash-row-label">{t({ bn: 'আজকের পড়া', en: 'Reads today' })}</span>
          <span className="ev-dash-row-bar">
            <ProgressBar value={perc.firestoreReads} label={lang === 'bn' ? `পড়া ${perc.firestoreReads.toFixed(1)}%` : `Reads ${perc.firestoreReads.toFixed(1)}%`} />
          </span>
          <span className="ev-dash-row-pct">
            {lang === 'bn' ? formatBnNumber(usage.firestoreReads) : usage.firestoreReads} / {lang === 'bn' ? formatBnNumber(QUOTAS.firestoreReadsPerDay) : QUOTAS.firestoreReadsPerDay} ({perc.firestoreReads.toFixed(1)}%)
          </span>
        </div>
        <div className="ev-dash-row" style={{ marginBottom: 0 }}>
          <span className="ev-dash-row-label">{t({ bn: 'লেখা', en: 'Writes' })}</span>
          <span className="ev-dash-row-bar">
            <ProgressBar value={perc.firestoreWrites} label={lang === 'bn' ? `লেখা ${perc.firestoreWrites.toFixed(1)}%` : `Writes ${perc.firestoreWrites.toFixed(1)}%`} />
          </span>
          <span className="ev-dash-row-pct">
            {lang === 'bn' ? formatBnNumber(usage.firestoreWrites) : usage.firestoreWrites} / {lang === 'bn' ? formatBnNumber(QUOTAS.firestoreWritesPerDay) : QUOTAS.firestoreWritesPerDay} ({perc.firestoreWrites.toFixed(1)}%)
          </span>
        </div>
        <p className="ev-muted" style={{ fontSize: 14, margin: '12px 0 0' }}>
          {t({
            bn: 'Firebase console → Firestore Database → Usage tab-এ আসল সংখ্যা দেখুন।',
            en: 'See the real numbers in Firebase console → Firestore Database → Usage tab.',
          })}
        </p>
      </Card>
      <p style={{ marginTop: 24 }}>
        <LinkButton to="/admin/audit" variant="outline">{t({ bn: 'অডিট লগ দেখুন', en: 'View audit log' })} →</LinkButton>
      </p>
    </PageShell>
  );
}
