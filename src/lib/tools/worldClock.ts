// exists there) + a small src/lib/tools/worldClock.ts re-export, or keep this
// whole file as worldClock.ts importing COMMON_TIME_ZONES. Intl only, no network.
// Live ticking: the UI recomputes from Date.now() every second (never accumulates
// ticks) and pauses when the tab is hidden.

export interface LiveClockZone {
  zone: string;
  nameBn: string;
  nameEn: string;
}

/** Preset grid: Dhaka first (home), then the zones Bangladeshi users call most. */
export const WORLD_CLOCK_PRESETS: LiveClockZone[] = [
  { zone: 'Asia/Dhaka', nameBn: 'ঢাকা', nameEn: 'Dhaka' },
  { zone: 'Asia/Kolkata', nameBn: 'কলকাতা', nameEn: 'Kolkata' },
  { zone: 'Asia/Kathmandu', nameBn: 'কাঠমান্ডু', nameEn: 'Kathmandu' },
  { zone: 'Asia/Dubai', nameBn: 'দুবাই', nameEn: 'Dubai' },
  { zone: 'Asia/Riyadh', nameBn: 'রিয়াদ', nameEn: 'Riyadh' },
  { zone: 'Asia/Doha', nameBn: 'দোহা', nameEn: 'Doha' },
  { zone: 'Asia/Kuala_Lumpur', nameBn: 'কুয়ালালামপুর', nameEn: 'Kuala Lumpur' },
  { zone: 'Asia/Singapore', nameBn: 'সিঙ্গাপুর', nameEn: 'Singapore' },
  { zone: 'Asia/Tokyo', nameBn: 'টোকিও', nameEn: 'Tokyo' },
  { zone: 'Asia/Seoul', nameBn: 'সিউল', nameEn: 'Seoul' },
  { zone: 'Australia/Sydney', nameBn: 'সিডনি', nameEn: 'Sydney' },
  { zone: 'Europe/London', nameBn: 'লন্ডন', nameEn: 'London' },
  { zone: 'Europe/Paris', nameBn: 'প্যারিস', nameEn: 'Paris' },
  { zone: 'Europe/Berlin', nameBn: 'বার্লিন', nameEn: 'Berlin' },
  { zone: 'America/New_York', nameBn: 'নিউ ইয়র্ক', nameEn: 'New York' },
  { zone: 'America/Chicago', nameBn: 'শিকাগো', nameEn: 'Chicago' },
  { zone: 'America/Los_Angeles', nameBn: 'লস অ্যাঞ্জেলেস', nameEn: 'Los Angeles' },
  { zone: 'America/Toronto', nameBn: 'টরন্টো', nameEn: 'Toronto' },
  { zone: 'UTC', nameBn: 'ইউটিসি', nameEn: 'UTC' },
];

export interface LiveClockReading {
  time: string; // HH:MM:SS
  date: string; // e.g. 27 Nov 2026
  offset: string; // e.g. UTC+06:00
  isDaytime: boolean; // 06:00-18:00 local, for the day/night dot
}

/** Format "now" in a zone. hour12=false keeps 24 h; pass hour12=true for 12 h mode. */
export function formatLiveClock(now: Date, zone: string, hour12 = false): LiveClockReading {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
  }).format(now);
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: zone, hour: 'numeric', hour12: false }).format(now),
  );
  // UTC offset via formatToParts on a GMT-offset format.
  const offsetParts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    timeZoneName: 'longOffset',
  }).formatToParts(now);
  const offsetName = offsetParts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  const offset = offsetName.replace('GMT', 'UTC');
  return { time, date, offset, isDaytime: hour >= 6 && hour < 18 };
}
