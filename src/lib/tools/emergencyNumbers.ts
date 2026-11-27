/**
 * Emergency Numbers Directory — pure logic + static data.
 *
 * STATIC data only, compiled from official public sources. No fetch,
 * no API, no Firestore. The numbers below are Bangladesh government
 * short-code helplines that are widely published by the services
 * themselves (National Emergency Service 999, Fire Service & Civil
 * Defence, the National Helpline 333, the health call centre, the
 * Anti-Corruption Commission and the violence-against-women helpline).
 *
 * DELIBERATE OMISSION: no hospital or thana landline number is listed
 * here. Individual hospital / thana landlines change and could not be
 * verified from a citable source at build time — and a wrong emergency
 * number is worse than a missing one. The rule is: omit rather than
 * guess. Hospital help is reached through the 16263 health call
 * centre; police help is reached through 999. Add a landline only
 * when it has been verified against the institution's own published
 * listing.
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export type EmergencyCategory = 'emergency' | 'hospital' | 'police' | 'fire';

export interface EmergencyEntry {
  /** Display name (Bangla-first pair is handled by the UI via t()). */
  nameBn: string;
  nameEn: string;
  /** Dialable number, digits only (short codes kept as-is). */
  number: string;
  category: EmergencyCategory;
  /** Short note shown under the entry. */
  noteBn: string;
  noteEn: string;
}

/**
 * The full directory, in display order. 999 (National Emergency
 * Service) is FIRST by design — it is the number to call first in
 * any emergency.
 */
export const EMERGENCY_NUMBERS: readonly EmergencyEntry[] = [
  {
    nameBn: 'জাতীয় জরুরি সেবা',
    nameEn: 'National Emergency Service',
    number: '999',
    category: 'emergency',
    noteBn: 'পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স — যেকোনো জরুরি অবস্থায় প্রথমে এই নম্বরে কল করুন।',
    noteEn: 'Police, fire service and ambulance — call this number first in any emergency.',
  },
  {
    nameBn: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স',
    nameEn: 'Fire Service & Civil Defence',
    number: '16163',
    category: 'fire',
    noteBn: 'আগুন, উদ্ধার ও ফায়ার সার্ভিস সংক্রান্ত জরুরি সাহায্য।',
    noteEn: 'Fire, rescue and fire-service emergency help.',
  },
  {
    nameBn: 'জাতীয় হেল্পলাইন',
    nameEn: 'National Helpline',
    number: '333',
    category: 'emergency',
    noteBn: 'সরকারি সেবা ও তথ্য সংক্রান্ত জাতীয় হেল্পলাইন।',
    noteEn: 'National helpline for government services and information.',
  },
  {
    nameBn: 'স্বাস্থ্য কল সেন্টার',
    nameEn: 'Health Call Centre',
    number: '16263',
    category: 'hospital',
    noteBn: 'স্বাস্থ্য পরামর্শ ও হাসপাতালের তথ্যের জন্য স্বাস্থ্য অধিদপ্তরের কল সেন্টার।',
    noteEn: 'Health advice and hospital information from the health directorate call centre.',
  },
  {
    nameBn: 'নারী নির্যাতন প্রতিরোধ হেল্পলাইন',
    nameEn: 'Violence Against Women Helpline',
    number: '109',
    category: 'emergency',
    noteBn: 'নারীর প্রতি সহিংসতা সংক্রান্ত জরুরি সাহায্য ও পরামর্শ।',
    noteEn: 'Emergency help and advice on violence against women.',
  },
  {
    nameBn: 'দুর্নীতি দমন কমিশন হটলাইন',
    nameEn: 'Anti-Corruption Commission Hotline',
    number: '106',
    category: 'emergency',
    noteBn: 'দুর্নীতির অভিযোগ জানানোর হটলাইন।',
    noteEn: 'Hotline for reporting corruption.',
  },
  {
    nameBn: 'বাংলাদেশ পুলিশ (৯৯৯-এর মাধ্যমে)',
    nameEn: 'Bangladesh Police (via 999)',
    number: '999',
    category: 'police',
    noteBn: 'পুলিশের সাহায্য পেতে জাতীয় জরুরি সেবা ৯৯৯-এ কল করুন — তারাই নিকটস্থ থানায় পাঠাবে।',
    noteEn: 'For police help, call the National Emergency Service on 999 — they will reach the nearest thana.',
  },
];

export const EMERGENCY_CATEGORIES: readonly EmergencyCategory[] = [
  'emergency',
  'hospital',
  'police',
  'fire',
];

/** `tel:` link for an entry, e.g. "tel:999". */
export function telLink(entry: EmergencyEntry): string {
  return `tel:${entry.number}`;
}

/**
 * Filter the directory by a free-text query (matched against the
 * Bangla/English name and the number) and/or a category. Empty query
 * and 'all' keep the full list, in its original order (999 first).
 * Pure: hand-check — query "fire" matches only the Fire Service
 * entry; query "999" matches the two 999 entries; category "fire"
 * returns only the Fire Service entry.
 */
export function filterEmergencyNumbers(
  entries: readonly EmergencyEntry[],
  query: string,
  category: EmergencyCategory | 'all',
): EmergencyEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (category !== 'all' && entry.category !== category) return false;
    if (q === '') return true;
    return (
      entry.nameBn.toLowerCase().includes(q) ||
      entry.nameEn.toLowerCase().includes(q) ||
      entry.number.includes(q)
    );
  });
}

/** True when every entry has a non-empty dialable number. */
export function allEntriesHaveNumbers(entries: readonly EmergencyEntry[]): boolean {
  return entries.length > 0 && entries.every((e) => e.number.trim() !== '');
}
