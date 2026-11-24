// Eduvelto — Job notifications (Step 14).
//
// /jobs/notifications — the in-app notification centre.
// The feed is DERIVED on every visit (deadline reminders,
// new-mock notices, result-ready) from published records +
// the student's own attempts — there is no notifications
// collection on Spark free (no Cloud Functions to send
// pushes, and the compiled-rules margin fits one minimal
// block only). Read/dismissed state is local per device
// (localStorage), never synced. Push is deferred; the
// in-app centre is the delivery mechanism.
//
// HONESTY: deadline reminders only for VERIFIED circulars
// with a confirmed deadline ≤7 days out, only when the
// student has a target exam; never for unverified items;
// the result-ready item never carries a score.

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button, Card, Chip, LinkButton, Skeleton } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { loadThisWeekWeeklyMock, loadTodayDailyMock } from '../lib/jobMock';
import { loadDashboardAttempts } from '../lib/jobDashboardData';
import type { JobAttemptSummary } from '../lib/jobAnalysis';
import { listPublishedCirculars } from '../lib/jobCircularsData';
import type { JobCircular } from '../lib/jobCirculars';
import type { JobMockWithId } from '../lib/jobMocks';
import {
  deriveJobNotifications,
  dismissNotification,
  EMPTY_NOTIFICATION_LOCAL_STATE,
  isNotificationRead,
  markAllNotificationsRead,
  markNotificationRead,
  parseNotificationLocalState,
  unreadNotificationCount,
  visibleNotifications,
  type JobNotificationItem,
  type JobNotificationKind,
  type NotificationLocalState,
} from '../lib/jobNotifications';

const CATEGORY_FILTERS: Array<{ key: JobNotificationKind | null; bn: string; en: string }> = [
  { key: null, bn: 'সব', en: 'All' },
  { key: 'circular-deadline', bn: 'সার্কুলার', en: 'Circulars' },
  { key: 'new-mock', bn: 'মক টেস্ট', en: 'Mock tests' },
  { key: 'result-ready', bn: 'ফলাফল', en: 'Results' },
];

export default function JobNotificationsPage() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<JobNotificationItem[] | null>(null);
  const [dataError, setDataError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [category, setCategory] = useState<JobNotificationKind | null>(null);
  const [localState, setLocalState] = useState<NotificationLocalState>(EMPTY_NOTIFICATION_LOCAL_STATE);

  const examSlugs = useMemo(() => {
    const slugs = new Set<string>();
    if (profile?.targetExam) slugs.add(profile.targetExam);
    for (const s of profile?.enrolledCategories ?? []) slugs.add(s);
    return [...slugs];
  }, [profile?.targetExam, profile?.enrolledCategories]);

  const storageKey = user ? `eduvelto:job-notifications:${user.uid}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      setLocalState(parseNotificationLocalState(localStorage.getItem(storageKey)));
    } catch {
      setLocalState(EMPTY_NOTIFICATION_LOCAL_STATE);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(localState));
    } catch {
      // Private mode / full storage: read state just does not
      // persist. The feed still works; nothing is lost.
    }
  }, [storageKey, localState]);

  useEffect(() => {
    let alive = true;
    setItems(null);
    setDataError(false);
    if (!user) return;
    Promise.all([
      listPublishedCirculars({ pageSize: 15 }),
      loadTodayDailyMock(),
      loadThisWeekWeeklyMock(),
      loadDashboardAttempts(user.uid),
    ])
      .then(([page, daily, weekly, { attempts }]) => {
        if (!alive) return;
        const circulars: JobCircular[] = page.items;
        const dailyMock: JobMockWithId | null = daily;
        const weeklyMock: JobMockWithId | null = weekly;
        const loaded: JobAttemptSummary[] = attempts;
        setItems(
          deriveJobNotifications({
            circulars,
            todayDailyMock: dailyMock,
            thisWeekWeeklyMock: weeklyMock,
            attempts: loaded,
            examSlugs,
          }),
        );
      })
      .catch(() => {
        if (alive) {
          setItems([]);
          setDataError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [user?.uid, retryNonce, examSlugs]);

  const visible = useMemo(() => {
    if (!items) return [];
    const shown = visibleNotifications(items, localState);
    return category ? shown.filter((i) => i.kind === category) : shown;
  }, [items, localState, category]);
  const unread = items ? unreadNotificationCount(items, localState) : 0;

  if (!loading && !user) {
    return (
      <PageShell titleBn="নোটিফিকেশন" titleEn="Notifications" wide>
        <Card>
          <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.7 }}>
            {t({
              bn: 'নোটিফিকেশন দেখতে লগইন করুন — এখানে আপনার পরীক্ষার সার্কুলারের সময়সীমা, নতুন মক ও ফলাফলের খবর আসে।',
              en: 'Sign in to see notifications — deadline reminders for your exams, new mocks and results appear here.',
            })}
          </p>
          <LinkButton to="/login" state={back}>{t({ bn: 'লগইন করুন →', en: 'Sign in →' })}</LinkButton>
        </Card>
        <p style={{ marginTop: 16 }}>
          <LinkButton to="/jobs/circulars" variant="outline">
            {t({ bn: 'সার্কুলার দেখুন →', en: 'See circulars →' })}
          </LinkButton>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="নোটিফিকেশন" titleEn="Notifications" wide>
      {unread > 0 && (
        <p style={{ margin: '0 0 8px' }}>
          <Chip tone="blue">{t({ bn: `${unread}টি নতুন`, en: `${unread} new` })}</Chip>
        </p>
      )}
      <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'সার্কুলারের সময়সীমা, নতুন মক ও ফলাফলের খবর — শুধু যাচাই করা তথ্য থেকে।',
          en: 'Circular deadlines, new mocks and results — only from verified information.',
        })}
      </p>

      {examSlugs.length === 0 && (
        <AlertBox tone="info">
          {t({
            bn: 'আপনার লক্ষ্য পরীক্ষা সেট করা নেই — প্রোফাইলে লক্ষ্য পরীক্ষা সেট করলে সার্কুলারের সময়সীমার রিমাইন্ডার আসবে। নতুন মক ও ফলাফলের খবর এমনিতেই আসে।',
            en: 'No target exam is set — set one in your profile to get circular deadline reminders. New-mock and result notices appear anyway.',
          })}
        </AlertBox>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {CATEGORY_FILTERS.map((c) => (
          <Chip key={c.key ?? 'all'} tone={category === c.key ? 'navy' : 'outline'}>
            <button type="button" onClick={() => setCategory(c.key)} className="ev-chip-btn">
              {lang === 'bn' ? c.bn : c.en}
            </button>
          </Chip>
        ))}
        {items && items.length > 0 && unread > 0 && (
          <Button
            onClick={() => setLocalState((s) => markAllNotificationsRead(s, items.map((i) => i.id)))}
            variant="outline"
          >
            {t({ bn: 'সব পড়া হয়েছে', en: 'Mark all as read' })}
          </Button>
        )}
      </div>

      {dataError && (
        <AlertBox tone="error">
          {t({ bn: 'নোটিফিকেশন লোড করা যায়নি — সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।', en: 'Could not load notifications — check your connection and try again.' })}{' '}
          <button type="button" onClick={() => setRetryNonce((n) => n + 1)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>
            {t({ bn: 'আবার চেষ্টা করুন', en: 'Try again' })}
          </button>
        </AlertBox>
      )}

      {items === null || loading ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <Skeleton height={90} />
          <Skeleton height={90} />
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
            {t({
              bn: 'কোনো নোটিফিকেশন নেই। যাচাই করা সার্কুলারের সময়সীমা এগিয়ে এলে, নতুন মক প্রকাশিত হলে বা ফলাফল তৈরি হলে এখানে আসবে।',
              en: 'No notifications. When a verified circular deadline approaches, a new mock is published, or a result is ready, it will appear here.',
            })}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {visible.map((item) => {
            const read = isNotificationRead(localState, item.id);
            return (
              <Card key={item.id}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                  {!read && <Chip tone="blue">{t({ bn: 'নতুন', en: 'New' })}</Chip>}
                  {item.priority === 'high' && <Chip tone="gold">{t({ bn: 'জরুরি', en: 'Urgent' })}</Chip>}
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                    {item.kind === 'circular-deadline'
                      ? t({ bn: 'সার্কুলার', en: 'Circular' })
                      : item.kind === 'new-mock'
                        ? t({ bn: 'মক টেস্ট', en: 'Mock test' })
                        : t({ bn: 'ফলাফল', en: 'Result' })}
                  </span>
                </div>
                <div style={{ fontWeight: read ? 600 : 800, color: 'var(--heading)', fontSize: 15, lineHeight: 1.5 }}>
                  <Link
                    to={item.link}
                    onClick={() => setLocalState((s) => markNotificationRead(s, item.id))}
                  >
                    {lang === 'bn' ? item.titleBn : item.titleEn}
                  </Link>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
                  {lang === 'bn' ? item.bodyBn : item.bodyEn}
                </p>
                <p style={{ margin: '8px 0 0' }}>
                  <button
                    type="button"
                    onClick={() => setLocalState((s) => dismissNotification(s, item.id))}
                    style={{ all: 'unset', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', textDecoration: 'underline' }}
                  >
                    {t({ bn: 'খারিজ করুন', en: 'Dismiss' })}
                  </button>
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
