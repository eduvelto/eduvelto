// Eduvelto — Job calendar (Step 14).
//
// /jobs/calendar — the Step 12 countdown, now real: every
// event comes from a VERIFIED published circular (deadline /
// exam date) or a published daily/weekly mock. Nothing is
// estimated, guessed, or student-entered — when no confirmed
// date exists, the page says so instead of showing a
// countdown. All dates are Asia/Dhaka.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button, Card, LinkButton, Skeleton } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { loadThisWeekWeeklyMock, loadTodayDailyMock } from '../lib/jobMock';
import type { JobMockWithId } from '../lib/jobMocks';
import { listPublishedCirculars } from '../lib/jobCircularsData';
import { formatDhakaDate, toBanglaDigits } from '../lib/jobCirculars';
import {
  buildCalendarEvents,
  daysUntilEvent,
  eventsOnDay,
  groupEventsByMonth,
  nextConfirmedEvent,
  type JobCalendarEvent,
} from '../lib/jobCalendar';
import { dhakaDayKey } from '../lib/jobDashboard';

const EVENT_TYPE_BN: Record<JobCalendarEvent['type'], string> = {
  'application-deadline': 'আবেদনের শেষ তারিখ',
  'exam-date': 'পরীক্ষার তারিখ',
  'daily-mock': 'দৈনিক মক',
  'weekly-mock': 'সাপ্তাহিক মক',
};
const EVENT_TYPE_EN: Record<JobCalendarEvent['type'], string> = {
  'application-deadline': 'Application deadline',
  'exam-date': 'Exam date',
  'daily-mock': 'Daily mock',
  'weekly-mock': 'Weekly mock',
};

function monthLabel(monthKey: string, lang: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(Date.UTC(y, m - 1, 15, 6)));
}

function dayLabel(dayKey: string, lang: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(Date.UTC(y, m - 1, d, 6)));
}

export default function JobCalendarPage() {
  const { t, lang } = useLanguage();
  const [events, setEvents] = useState<JobCalendarEvent[] | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const nowMs = Date.now();
  const todayKey = dhakaDayKey(nowMs);
  const [viewYear, viewMonth] = todayKey.split('-').map(Number);
  const [viewed, setViewed] = useState<{ y: number; m: number }>({ y: viewYear, m: viewMonth });

  useEffect(() => {
    let alive = true;
    setEvents(null);
    // ROOT CAUSE (23 Nov 2026, AdSense Part 1): the three loads ran
    // in one Promise.all, so ONE rejection poisoned the whole
    // calendar into the error banner. The usual rejection is a guest
    // getDoc on a DRAFT daily/weekly mock doc — jobExamDefinitions
    // rules allow reads only when status == 'published' (or
    // moderator), so a draft doc for today / this week throws
    // permission-denied even though the circulars load fine and
    // there is simply no confirmed event yet. NOT a query/index
    // bug: listPublishedCirculars is one == filter on reviewStatus
    // (no composite index needed) and guest reads of published
    // circulars are allowed by the rules. Each load is now
    // fault-tolerant: a denied/missing mock degrades to "no mock
    // event", never to an error banner. No events or dates are ever
    // fabricated — an empty result is the honest empty state below.
    Promise.all([
      listPublishedCirculars({ pageSize: 50 }).catch(() => ({
        items: [],
        cursor: null,
        hasMore: false,
      })),
      loadTodayDailyMock().catch(() => null),
      loadThisWeekWeeklyMock().catch(() => null),
    ])
      .then(([page, daily, weekly]) => {
        if (!alive) return;
        const mocks: JobMockWithId[] = [daily, weekly].filter((m): m is JobMockWithId => m !== null);
        setEvents(buildCalendarEvents({ circulars: page.items, mocks }));
      })
      .catch(() => {
        // buildCalendarEvents is pure, but never strand the page on
        // the skeleton: fall through to the honest empty state.
        if (alive) setEvents([]);
      });
    return () => {
      alive = false;
    };
  }, [retryNonce]);

  // Upcoming = today or later, by Dhaka calendar day.
  const upcoming = useMemo(
    () => (events ?? []).filter((e) => dhakaDayKey(e.dateMillis) >= todayKey),
    [events, todayKey],
  );
  const next = useMemo(() => (events ? nextConfirmedEvent(events, nowMs) : null), [events, nowMs]);
  const grouped = useMemo(() => groupEventsByMonth(upcoming), [upcoming]);
  const selectedEvents = useMemo(
    () => (selectedDay ? eventsOnDay(upcoming, selectedDay) : []),
    [selectedDay, upcoming],
  );

  // ---- Month grid for the viewed month (Dhaka) ----
  const daysInMonth = new Date(Date.UTC(viewed.y, viewed.m, 0)).getDate();
  const firstWeekday = new Date(Date.UTC(viewed.y, viewed.m - 1, 1, 6)).getUTCDay(); // 0 = Sun
  const cells: Array<string | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewed.y}-${String(viewed.m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  const weekdayNames =
    lang === 'bn'
      ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function shiftMonth(delta: number) {
    setViewed((v) => {
      const total = v.y * 12 + (v.m - 1) + delta;
      return { y: Math.floor(total / 12), m: (total % 12) + 1 };
    });
  }

  return (
    <PageShell titleBn="পরীক্ষার ক্যালেন্ডার" titleEn="Exam calendar" wide>
      <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({
          bn: 'এখানে শুধু বিজ্ঞপ্তি থেকে নিশ্চিত তারিখ দেখানো হয় — কোনো অনুমান করা তারিখ নেই।',
          en: 'Only dates confirmed from official circulars are shown here — no estimated dates.',
        })}
      </p>

      {events === null ? (
        <Skeleton height={320} />
      ) : events.length === 0 ? (
        <Card>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
            {t({
              bn: 'এখনো কোনো নিশ্চিত তারিখ নেই — সরকারি বিজ্ঞপ্তি প্রকাশিত হলে এখানে আসবে।',
              en: 'No confirmed date yet — when an official circular is published, it will appear here.',
            })}
          </p>
          <p style={{ margin: '12px 0 0' }}>
            <Button onClick={() => setRetryNonce((n) => n + 1)}>
              {t({ bn: 'আবার চেষ্টা করুন', en: 'Try again' })}
            </Button>
          </p>
        </Card>
      ) : (
        <>
          {next && (
            <Card>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                {t({ bn: 'পরবর্তী নিশ্চিত তারিখ', en: 'Next confirmed date' })}
              </div>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 18, marginTop: 4, lineHeight: 1.5 }}>
                <Link to={next.link}>{lang === 'bn' ? next.titleBn : next.titleEn}</Link>
              </div>
              <div style={{ marginTop: 4, fontSize: 15 }}>
                {formatDhakaDate(next.dateMillis, lang, next.type === 'application-deadline' || next.type === 'exam-date')}
                {' · '}
                {daysUntilEvent(next, nowMs) === 0
                  ? t({ bn: 'আজ', en: 'Today' })
                  : t({
                      bn: `আর ${toBanglaDigits(daysUntilEvent(next, nowMs))} দিন বাকি`,
                      en: `${daysUntilEvent(next, nowMs)} day${daysUntilEvent(next, nowMs) === 1 ? '' : 's'} left`,
                    })}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>
                {lang === 'bn' ? next.sourceBn : next.sourceEn}
              </div>
            </Card>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 8px' }}>
            <Button onClick={() => shiftMonth(-1)}>‹</Button>
            <strong style={{ flex: 1, textAlign: 'center', fontSize: 16 }}>
              {monthLabel(`${viewed.y}-${String(viewed.m).padStart(2, '0')}`, lang)}
            </strong>
            <Button onClick={() => shiftMonth(1)}>›</Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {weekdayNames.map((w) => (
              <div key={w} style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 700, padding: '4px 0' }}>
                {w}
              </div>
            ))}
            {cells.map((dayKey, i) =>
              dayKey === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <button
                  key={dayKey}
                  type="button"
                  onClick={() => setSelectedDay(dayKey)}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    display: 'block',
                    minHeight: 56,
                    padding: 6,
                    borderRadius: 8,
                    border: selectedDay === dayKey ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: dayKey === todayKey ? 'var(--surface-muted)' : 'var(--surface)',
                    boxSizing: 'border-box',
                  }}
                  aria-label={dayLabel(dayKey, lang)}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--heading)' }}>
                    {Number(dayKey.slice(8))}
                  </div>
                  {eventsOnDay(upcoming, dayKey).slice(0, 2).map((e) => (
                    <div
                      key={e.id}
                      style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--teal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {lang === 'bn' ? EVENT_TYPE_BN[e.type] : EVENT_TYPE_EN[e.type]}
                    </div>
                  ))}
                  {eventsOnDay(upcoming, dayKey).length > 2 && (
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      +{eventsOnDay(upcoming, dayKey).length - 2}
                    </div>
                  )}
                </button>
              ),
            )}
          </div>

          {selectedDay ? (
            <div style={{ marginTop: 16 }}>
              <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>
                {dayLabel(selectedDay, lang)}
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  style={{ all: 'unset', cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontWeight: 400 }}
                >
                  ✕ {t({ bn: 'ফিল্টার সরান', en: 'Clear filter' })}
                </button>
              </p>
              {selectedEvents.length === 0 ? (
                <Card>
                  <p style={{ margin: 0 }}>{t({ bn: 'এই দিনে কোনো নিশ্চিত ঘটনা নেই।', en: 'No confirmed event on this day.' })}</p>
                </Card>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {selectedEvents.map((e) => (
                    <Card key={e.id}>
                      <Link to={e.link} style={{ fontWeight: 700 }}>
                        {lang === 'bn' ? e.titleBn : e.titleEn}
                      </Link>
                      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                        {lang === 'bn' ? EVENT_TYPE_BN[e.type] : EVENT_TYPE_EN[e.type]}
                        {' · '}
                        {formatDhakaDate(e.dateMillis, lang, e.type === 'application-deadline' || e.type === 'exam-date')}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <h2 style={{ fontSize: 17, margin: '0 0 8px', color: 'var(--heading)' }}>
                {t({ bn: 'আগামী ঘটনা', en: 'Upcoming events' })}
              </h2>
              {grouped.length === 0 ? (
                <Card>
                  <p style={{ margin: 0 }}>{t({ bn: 'আগামী দিনে কোনো নিশ্চিত ঘটনা নেই।', en: 'No confirmed event coming up.' })}</p>
                </Card>
              ) : (
                grouped.map((g) => (
                  <div key={g.monthKey} style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, margin: '0 0 8px', color: 'var(--heading)' }}>
                      {monthLabel(g.monthKey, lang)}
                    </h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {g.events.map((e) => (
                        <Card key={e.id}>
                          <Link to={e.link} style={{ fontWeight: 700 }}>
                            {lang === 'bn' ? e.titleBn : e.titleEn}
                          </Link>
                          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
                            {lang === 'bn' ? EVENT_TYPE_BN[e.type] : EVENT_TYPE_EN[e.type]}
                            {' · '}
                            {formatDhakaDate(e.dateMillis, lang, e.type === 'application-deadline' || e.type === 'exam-date')}
                            {' · '}
                            {daysUntilEvent(e, nowMs) === 0
                              ? t({ bn: 'আজ', en: 'Today' })
                              : t({
                                  bn: `আর ${toBanglaDigits(daysUntilEvent(e, nowMs))} দিন বাকি`,
                                  en: `${daysUntilEvent(e, nowMs)} day${daysUntilEvent(e, nowMs) === 1 ? '' : 's'} left`,
                                })}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <p style={{ marginTop: 16 }}>
            <LinkButton to="/jobs/circulars" variant="outline">
              {t({ bn: 'সব বিজ্ঞপ্তি দেখুন →', en: 'See all circulars →' })}
            </LinkButton>
          </p>
        </>
      )}
    </PageShell>
  );
}
