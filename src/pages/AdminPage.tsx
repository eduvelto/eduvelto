// Eduvelto — Admin Dashboard (desktop + mobile mockups, 21 Nov 2026).
//
// Layout follows the desktop mockup: welcome banner, four stat cards,
// Platform Overview + Top Performing Sections, Recent Activities +
// System Status + Quick Actions, Popular Exams, Admin Tips. The mobile
// mockup's home screen is the same page at phone width (stat tiles
// 2-up, Quick Actions, System Status, bottom nav from AdminLayout).
//
// HONESTY (binding — the mockups are full of fake sample numbers):
// - Stat cards show REAL values only: live users count, live-or-last-
//   verified books (609) and exams (212), and questions (20,970, last
//   verified). "Total Learning Sessions" and "Average Score" have no
//   tracking at all, so those cards are REPLACED by Books and
//   Questions — never faked.
// - Platform Overview has no time-series data: honest empty state.
// - Top Performing Sections has no view tracking: honest empty state.
// - Recent Activities come ONLY from the real audit log
//   (adminActions); empty log = honest empty state, never invented
//   "student123 registered 2 min ago" rows.
// - System Status: Database = the live counts call answered;
//   Hosting = the app is being served; Payment = Not Active (no
//   payments exist). There is NO CDN — no "CDN Healthy" row.
// - Quick Actions link to real pages; the four with no admin UI yet
//   (Add Course, Add Exam, Add Job Circular, Add University) show an
//   honest Coming Soon notice instead of pretending to work.
// - Popular Exams are category shortcuts to /exam — no popularity
//   data exists, and the note says so.
// - Preserved from the old dashboard (real admin functions the mockup
//   did not include): pending teacher verifications, external items
//   (domain / AdSense status), the usage estimate, and the audit-log
//   link.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Card, LinkButton, ProgressBar, SkeletonCards } from '../components/ui';
import { EmptyAdminBox, ErrorBox, requireDb } from '../components/AdminShared';
import {
  auditActionLabel,
  domainDaysLeft,
  formatBnNumber,
  formatTime,
  friendlyAdminError,
  getExternalItems,
  listAdminActions,
  listTeacherVerifications,
  type AuditRow,
  type VerificationRow,
} from '../lib/admin';
import { getCeoCounts, LAST_VERIFIED_INVENTORY, type CeoCounts } from '../lib/ceo';
import { ADSENSE_CLIENT_ID } from '../lib/ads';
import { getTodayUsage, usagePercentages, QUOTAS } from '../lib/usage';
import { CeoEmpty, CeoStatTile, CEO_ICON } from '../components/CeoShared';

const LAST_BACKUP_KEY = 'eduvelto-last-backup-v1';

const QUICK_ACTIONS: Array<{
  id: string;
  to?: string;
  bn: string;
  en: string;
  bg: string;
  fg: string;
  glyph: string;
}> = [
  { id: 'add-course', bn: 'কোর্স যোগ করুন', en: 'Add Course', bg: '#E3F2F0', fg: '#12766E', glyph: '▤' },
  { id: 'add-exam', bn: 'পরীক্ষা যোগ করুন', en: 'Add Exam', bg: '#E7F6E7', fg: '#2E7D32', glyph: '✓' },
  { id: 'add-job', bn: 'চাকরির বিজ্ঞপ্তি যোগ করুন', en: 'Add Job Circular', bg: '#FBF3E2', fg: '#8A6100', glyph: '▣' },
  { id: 'add-university', bn: 'বিশ্ববিদ্যালয় যোগ করুন', en: 'Add University', bg: '#F1EAFB', fg: '#6B4FA1', glyph: '▦' },
  { id: 'manage-users', to: '/admin/users', bn: 'ব্যবহারকারী পরিচালনা', en: 'Manage Users', bg: '#E3F2F0', fg: '#12766E', glyph: '◉' },
  { id: 'view-reports', to: '/admin/audit', bn: 'রিপোর্ট দেখুন', en: 'View Reports', bg: '#E7F6E7', fg: '#2E7D32', glyph: '↗' },
  { id: 'update-content', bn: 'কনটেন্ট হালনাগাদ', en: 'Update Content', bg: '#F1EAFB', fg: '#6B4FA1', glyph: '↻' },
  { id: 'settings', to: '/admin/settings', bn: 'সেটিংস', en: 'Settings', bg: '#FBF3E2', fg: '#8A6100', glyph: '⚙' },
];

const POPULAR_EXAMS = ['BCS', 'Bank', 'DU', 'Medical', 'Engineering', 'NTRCA'];

export default function AdminPage() {
  const { lang, t } = useLanguage();
  const [counts, setCounts] = useState<CeoCounts | null>(null);
  const [pending, setPending] = useState<VerificationRow[]>([]);
  const [activities, setActivities] = useState<AuditRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [soonAction, setSoonAction] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [c, p, a] = await Promise.all([
          getCeoCounts(requireDb()),
          listTeacherVerifications(requireDb(), 'pending'),
          listAdminActions(requireDb()).catch(() => [] as AuditRow[]),
        ]);
        if (cancelled) return;
        setCounts(c);
        setPending(p);
        setActivities(a.slice(0, 5));
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
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const external = getExternalItems(ADSENSE_CLIENT_ID !== '');
  const usage = getTodayUsage();
  const perc = usagePercentages(usage);
  const days = domainDaysLeft();

  // Database answered if at least one live count came back. If every
  // count() failed (Spark quota exhausted), say so — never "Healthy".
  const dbAnswered = counts !== null && (counts.users !== null || counts.booksLive || counts.examsLive);
  const usersValue =
    counts?.users === null || counts?.users === undefined
      ? '—'
      : lang === 'bn'
        ? formatBnNumber(counts.users)
        : String(counts.users);

  return (
    <div>
      {/* Welcome banner — CSS gradient only; the mockup's photo/illustration is not copied. */}
      <section className="ev-admin-banner">
        <div>
          <h1 className="ev-admin-banner-title">
            {t({ bn: '👋 আবার স্বাগতম, অ্যাডমিন!', en: '👋 Welcome Back, Admin!' })}
          </h1>
          <p className="ev-admin-banner-sub">
            {t({ bn: 'আজ Eduvelto-তে যা হচ্ছে, তা এখানে দেখুন।', en: "Here's what's happening with Eduvelto today." })}
          </p>
        </div>
        <p className="ev-admin-banner-motto">
          {t({ bn: 'প্রতিটি শিক্ষার্থীকে ক্ষমতায়িত করা — উজ্জ্বল ভবিষ্যতের জন্য', en: 'Empowering Every Learner for a Brighter Future' })}
        </p>
      </section>

      {loading ? <SkeletonCards count={3} /> : null}
      {error ? <ErrorBox message={error} /> : null}

      {/* Stat cards — real values only (see the header comment). */}
      <div className="ev-ceo-stats ev-admin-stats">
        <CeoStatTile
          icon={<svg {...CEO_ICON}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20v-1a6.5 6.5 0 0 1 13 0v1" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M17.5 13.6a6.5 6.5 0 0 1 4 5.4v1" /></svg>}
          iconBg="#E3F2F0"
          value={usersValue}
          labelBn="মোট ব্যবহারকারী"
          labelEn="Total Users"
          subBn={counts?.users === null ? 'লোড হয়নি (কোটা)' : undefined}
          subEn={counts?.users === null ? 'Not loaded (quota)' : undefined}
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>}
          iconBg="#E7F6E7"
          value={counts ? (lang === 'bn' ? formatBnNumber(counts.books) : String(counts.books)) : '—'}
          labelBn="মোট বই"
          labelEn="Total Books"
          subBn={counts && !counts.booksLive ? LAST_VERIFIED_INVENTORY.checkedBn : undefined}
          subEn={counts && !counts.booksLive ? LAST_VERIFIED_INVENTORY.checkedEn : undefined}
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5" /><path d="M9 11l2 2 4-4" /></svg>}
          iconBg="#F1EAFB"
          value={counts ? (lang === 'bn' ? formatBnNumber(counts.exams) : String(counts.exams)) : '—'}
          labelBn="মোট পরীক্ষা"
          labelEn="Total Exams"
          subBn={counts && !counts.examsLive ? LAST_VERIFIED_INVENTORY.checkedBn : undefined}
          subEn={counts && !counts.examsLive ? LAST_VERIFIED_INVENTORY.checkedEn : undefined}
        />
        <CeoStatTile
          icon={<svg {...CEO_ICON}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M15.5 9.5c-.8-1-2-1.5-3.5-1.5-2 0-3.5 1-3.5 2.5 0 3.5 7 1.5 7 5 0 1.5-1.5 2.5-3.5 2.5-1.5 0-2.7-.5-3.5-1.5" /></svg>}
          iconBg="#FBF3E2"
          value={lang === 'bn' ? formatBnNumber(LAST_VERIFIED_INVENTORY.questions) : String(LAST_VERIFIED_INVENTORY.questions)}
          labelBn="মোট প্রশ্ন"
          labelEn="Total Questions"
          subBn={LAST_VERIFIED_INVENTORY.checkedBn}
          subEn={LAST_VERIFIED_INVENTORY.checkedEn}
        />
      </div>

      {/* Pending teacher verifications — preserved from the old dashboard. */}
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

      <div className="ev-admin-grid-2">
        <section className="ev-ceo-card">
          <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>
            {t({ bn: 'প্ল্যাটফর্মের চিত্র (গত ৩০ দিন)', en: 'Platform Overview (Last 30 Days)' })}
          </h2>
          <CeoEmpty
            bn="সময়ের সাথে ব্যবহার, পরীক্ষা ও দেখার তথ্য এখনো জমা হয়নি।"
            en="No usage, exam or view data over time has been collected yet."
            nextBn="ব্যবহারকারী বাড়লে এখানে আসল মাসিক সংখ্যা দেখা যাবে।"
            nextEn="Real monthly numbers will appear here as users grow."
          />
        </section>
        <section className="ev-ceo-card">
          <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>
            {t({ bn: 'সেরা বিভাগ', en: 'Top Performing Sections' })}
          </h2>
          <EmptyAdminBox
            bn="কোন বিভাগ কত দেখা হয়েছে, তার তথ্য এখনো জমা হয়নি।"
            en="No view data has been collected for any section yet."
            nextBn="দেখার সংখ্যা গোনা শুরু হলে এখানে আসল তালিকা দেখা যাবে।"
            nextEn="The real ranking will appear here once views are tracked."
          />
        </section>
      </div>

      <div className="ev-admin-grid-3">
        <section className="ev-ceo-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>{t({ bn: 'সাম্প্রতিক কার্যক্রম', en: 'Recent Activities' })}</h2>
            <Link to="/admin/audit">{t({ bn: 'সব দেখুন →', en: 'View All →' })}</Link>
          </div>
          {loading ? null : activities.length === 0 ? (
            <p className="ev-muted" style={{ margin: '12px 0 0', fontSize: 14 }}>
              {t({
                bn: 'এখনো কোনো অ্যাডমিন কার্যক্রম লগে নেই।',
                en: 'No admin activity is in the log yet.',
              })}
            </p>
          ) : (
            <ul className="ev-admin-activity">
              {activities.map((row) => {
                const label = auditActionLabel(row.action);
                return (
                  <li key={row.id}>
                    <span className="ev-admin-activity-dot" aria-hidden="true">•</span>
                    <span>
                      <strong>{lang === 'bn' ? label.bn : label.en}</strong>
                      {row.details ? <span className="ev-muted"> — {row.details}</span> : null}
                      <span className="ev-admin-activity-time">{formatTime(row.createdAt, lang)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="ev-ceo-card">
          <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>{t({ bn: 'সিস্টেম অবস্থা', en: 'System Status' })}</h2>
          <p className={dbAnswered ? 'ev-admin-status-ok' : 'ev-admin-status-warn'}>
            {dbAnswered
              ? t({ bn: '✓ সব সিস্টেম ভালোভাবে চলছে', en: '✓ All Systems Running Smoothly' })
              : t({ bn: 'সংখ্যা লোড করা যায়নি (কোটা) — পরে আবার চেষ্টা করুন', en: 'Counts could not be loaded (quota) — please try again later' })}
          </p>
          <dl className="ev-admin-status-list">
            <div>
              <dt>{t({ bn: 'ডেটাবেস', en: 'Database' })}</dt>
              <dd>{dbAnswered ? t({ bn: '✓ সুস্থ', en: '✓ Healthy' }) : t({ bn: 'যাচাই করা যায়নি', en: 'Could not verify' })}</dd>
            </div>
            <div>
              <dt>{t({ bn: 'হোস্টিং', en: 'Hosting' })}</dt>
              <dd>{t({ bn: '✓ সুস্থ', en: '✓ Healthy' })}</dd>
            </div>
            <div>
              <dt>{t({ bn: 'পেমেন্ট', en: 'Payment' })}</dt>
              <dd>{t({ bn: 'সক্রিয় নয়', en: 'Not Active' })}</dd>
            </div>
          </dl>
          <p className="ev-muted" style={{ fontSize: 13, margin: '10px 0 0' }}>
            {t({
              bn: 'CDN নেই বলে এখানে দেখানো হয় না। শেষ ব্যাকআপ: ',
              en: 'No CDN exists, so none is shown. Last backup: ',
            })}
            {lastBackup ? formatTime(lastBackup, lang) : t({ bn: 'এখনো কোনো ব্যাকআপ হয়নি', en: 'No backup yet' })}
          </p>
        </section>

        <section className="ev-ceo-card">
          <h2 style={{ margin: '0 0 10px', fontSize: 17 }}>{t({ bn: 'দ্রুত কাজ', en: 'Quick Actions' })}</h2>
          <div className="ev-admin-quick">
            {QUICK_ACTIONS.map((a) =>
              a.to ? (
                <Link key={a.id} to={a.to} className="ev-admin-quick-item" style={{ background: a.bg }}>
                  <span aria-hidden="true" style={{ color: a.fg, fontSize: 22, lineHeight: 1 }}>{a.glyph}</span>
                  <span>{t({ bn: a.bn, en: a.en })}</span>
                </Link>
              ) : (
                <button
                  key={a.id}
                  type="button"
                  className="ev-admin-quick-item"
                  style={{ background: a.bg }}
                  onClick={() => setSoonAction(a.id)}
                >
                  <span aria-hidden="true" style={{ color: a.fg, fontSize: 22, lineHeight: 1 }}>{a.glyph}</span>
                  <span>{t({ bn: a.bn, en: a.en })}</span>
                  <span className="ev-ceo-soon">{t({ bn: 'শীঘ্রই', en: 'Soon' })}</span>
                </button>
              ),
            )}
          </div>
          {soonAction ? (
            <p className="ev-muted" style={{ fontSize: 14, margin: '12px 0 0' }} role="status">
              {t({
                bn: 'এই কাজটি এখনো তৈরি হয়নি — চাকরি/ভর্তি বিভাগ চালু হলে এখান থেকে করা যাবে।',
                en: 'This action is not built yet — it will work from here once the Job/Admission sections are live.',
              })}
            </p>
          ) : null}
        </section>
      </div>

      <section className="ev-ceo-card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 17 }}>{t({ bn: 'জনপ্রিয় পরীক্ষা', en: 'Popular Exams' })}</h2>
          <Link to="/exam">{t({ bn: 'সব দেখুন →', en: 'View All →' })}</Link>
        </div>
        <div className="ev-admin-exam-chips">
          {POPULAR_EXAMS.map((name) => (
            <Link key={name} to="/exam" className="ev-admin-exam-chip">
              {name}
            </Link>
          ))}
          <Link to="/exam" className="ev-admin-exam-chip">
            {t({ bn: 'অন্যান্য', en: 'Others' })}
          </Link>
        </div>
        <p className="ev-muted" style={{ fontSize: 13, margin: '10px 0 0' }}>
          {t({
            bn: 'কোন পরীক্ষা জনপ্রিয়, তার তথ্য এখনো জমা হয়নি — এগুলো পরীক্ষার বিভাগের শর্টকাট।',
            en: 'No popularity data has been collected yet — these are shortcuts to the exam categories.',
          })}
        </p>
      </section>

      <section className="ev-admin-tips">
        <strong>{t({ bn: 'অ্যাডমিন টিপস', en: 'Admin Tips' })}</strong>
        <p>
          {t({
            bn: 'কনটেন্ট হালনাগাদ রাখুন এবং ব্যবহারকারীর অংশগ্রহণ পর্যবেক্ষণ করুন — শেখার অভিজ্ঞতা আরও ভালো হবে।',
            en: 'Keep the content updated and monitor user engagement for a better learning experience.',
          })}
        </p>
      </section>

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
    </div>
  );
}
