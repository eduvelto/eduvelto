/**
 * Tasbih Counter — dhikr presets + counting logic.
 *
 * The dhikr list uses well-known short dhikr phrases (Arabic +
 * Bengali transliteration + meaning) that are certain. Counting
 * state lives in the UI (localStorage ONLY, on the user's own
 * device — nothing is ever sent to a server). The logic here never
 * touches storage or the DOM, so it is fully testable.
 *
 * Pure data + pure functions only.
 */

export interface Dhikr {
  key: string;
  arabic: string;
  transliterationBn: string;
  transliterationEn: string;
  meaningBn: string;
  meaningEn: string;
}

export const DHIKRS: readonly Dhikr[] = [
  {
    key: 'subhanallah',
    arabic: 'سُبْحَانَ اللَّهِ',
    transliterationBn: 'সুবহানাল্লাহ',
    transliterationEn: 'SubhanAllah',
    meaningBn: 'আল্লাহ পবিত্র।',
    meaningEn: 'Glory be to Allah.',
  },
  {
    key: 'alhamdulillah',
    arabic: 'الْحَمْدُ لِلَّهِ',
    transliterationBn: 'আলহামদুলিল্লাহ',
    transliterationEn: 'Alhamdulillah',
    meaningBn: 'সমস্ত প্রশংসা আল্লাহর।',
    meaningEn: 'All praise belongs to Allah.',
  },
  {
    key: 'allahu-akbar',
    arabic: 'اللَّهُ أَكْبَرُ',
    transliterationBn: 'আল্লাহু আকবার',
    transliterationEn: 'Allahu Akbar',
    meaningBn: 'আল্লাহ সর্বশ্রেষ্ঠ।',
    meaningEn: 'Allah is the Greatest.',
  },
  {
    key: 'la-ilaha-illallah',
    arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ',
    transliterationBn: 'লা ইলাহা ইল্লাল্লাহ',
    transliterationEn: 'La ilaha illallah',
    meaningBn: 'আল্লাহ ছাড়া কোনো উপাস্য নেই।',
    meaningEn: 'There is no god but Allah.',
  },
  {
    key: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    transliterationBn: 'আস্তাগফিরুল্লাহ',
    transliterationEn: 'Astaghfirullah',
    meaningBn: 'আমি আল্লাহর কাছে ক্ষমা চাই।',
    meaningEn: 'I seek Allah’s forgiveness.',
  },
  {
    key: 'subhanallahi-wa-bihamdihi',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    transliterationBn: 'সুবহানাল্লাহি ওয়া বিহামদিহি',
    transliterationEn: 'SubhanAllahi wa bihamdihi',
    meaningBn: 'আল্লাহ পবিত্র এবং সমস্ত প্রশংসা তাঁরই।',
    meaningEn: 'Glory be to Allah, and praise be to Him.',
  },
  {
    key: 'la-hawla',
    arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    transliterationBn: 'লা হাওলা ওয়ালা কুওয়াতা ইল্লা বিল্লাহ',
    transliterationEn: 'La hawla wa la quwwata illa billah',
    meaningBn: 'আল্লাহর সাহায্য ছাড়া কোনো শক্তি ও ক্ষমতা নেই।',
    meaningEn: 'There is no power and no strength except with Allah.',
  },
  {
    key: 'salawat',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    transliterationBn: 'আল্লাহুম্মা সাল্লি আলা মুহাম্মাদ',
    transliterationEn: 'Allahumma salli ala Muhammad',
    meaningBn: 'হে আল্লাহ! মুহাম্মদ (সা.)-এর ওপর রহমত বর্ষণ করুন।',
    meaningEn: 'O Allah, send blessings upon Muhammad.',
  },
];

/** Target-count presets. */
export const TASBIH_TARGETS: readonly number[] = [33, 99, 100, 500];

export function dhikrByKey(key: string): Dhikr | undefined {
  return DHIKRS.find((d) => d.key === key);
}

/** Completed full rounds of `target` inside `count`, and the remainder. */
export function tasbihProgress(
  count: number,
  target: number,
): { rounds: number; inRound: number; percent: number } {
  if (target <= 0) return { rounds: 0, inRound: count, percent: 0 };
  const safe = Math.max(0, Math.floor(count));
  return {
    rounds: Math.floor(safe / target),
    inRound: safe % target,
    percent: Math.min(100, Math.round((safe / target) * 100)),
  };
}

/** Parse a stored count defensively: anything invalid becomes 0. */
export function parseStoredCount(raw: string | null): number {
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}
