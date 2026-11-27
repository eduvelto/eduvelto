/**
 * Daily Hadith — a modest deck of 30 WELL-KNOWN hadiths.
 *
 * Each entry gives the Bengali rendering (ভাবার্থ) and an English
 * rendering of a hadith whose wording and source collection are
 * certain, with the collection + hadith number cited. The Bengali
 * text is a meaning-rendering, not a claim of word-for-word
 * translation from the Arabic. Any hadith whose wording or source
 * was uncertain was LEFT OUT. If one is ever in doubt, REMOVE it
 * from this deck, never re-word it from memory.
 *
 * The hadith of the day is picked deterministically from the
 * day-of-year (offset by 7 from the Quran deck so the two tools do
 * not march in lockstep). Pure data + pure functions only.
 */

import { dayOfYear } from './quranVerses';

export interface Hadith {
  /** Bengali rendering (ভাবার্থ) of the hadith's meaning. */
  textBn: string;
  textEn: string;
  /** Source collection + number, e.g. "Sahih al-Bukhari 1". */
  source: string;
  topicBn: string;
  topicEn: string;
}

export const HADITHS: readonly Hadith[] = [
  {
    textBn: 'কর্মফল নিয়তের ওপর নির্ভরশীল; প্রত্যেক ব্যক্তি তা-ই পাবে, যা সে নিয়ত করেছে।',
    textEn: 'Actions are but by intentions, and every person shall have only that which they intended.',
    source: 'Sahih al-Bukhari 1; Sahih Muslim 1907', topicBn: 'নিয়ত', topicEn: 'Intention',
  },
  {
    textBn: 'তোমাদের কেউ ততক্ষণ পর্যন্ত (পূর্ণ) মুমিন হতে পারবে না, যতক্ষণ না সে নিজের জন্য যা পছন্দ করে, তার ভাইয়ের জন্যও তা পছন্দ করে।',
    textEn: 'None of you truly believes until he loves for his brother what he loves for himself.',
    source: 'Sahih al-Bukhari 13; Sahih Muslim 45', topicBn: 'ভ্রাতৃত্ব', topicEn: 'Brotherhood',
  },
  {
    textBn: 'পবিত্রতা ঈমানের অর্ধেক।',
    textEn: 'Purity is half of faith.',
    source: 'Sahih Muslim 223', topicBn: 'পবিত্রতা', topicEn: 'Purity',
  },
  {
    textBn: 'তোমাদের মধ্যে সর্বোত্তম সে, যে কুরআন শেখে এবং শেখায়।',
    textEn: 'The best of you are those who learn the Quran and teach it.',
    source: 'Sahih al-Bukhari 5027', topicBn: 'কুরআন', topicEn: 'Quran',
  },
  {
    textBn: 'যে আল্লাহ ও পরকালের ওপর ঈমান রাখে, সে যেন ভালো কথা বলে অথবা চুপ থাকে।',
    textEn: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
    source: 'Sahih al-Bukhari 6018; Sahih Muslim 47', topicBn: 'কথা', topicEn: 'Speech',
  },
  {
    textBn: 'নম্রতা যে জিনিসেই থাকে, তাকে তা সুন্দর করে তোলে; আর যে জিনিস থেকে নম্রতা তুলে নেওয়া হয়, তা কুৎসিত হয়ে যায়।',
    textEn: 'Kindness is not found in anything except that it adds beauty to it, and it is not removed from anything except that it makes it ugly.',
    source: 'Sahih Muslim 2594', topicBn: 'নম্রতা', topicEn: 'Gentleness',
  },
  {
    textBn: 'নিশ্চয়ই আল্লাহ নম্র, তিনি নম্রতা পছন্দ করেন।',
    textEn: 'Indeed, Allah is Gentle and loves gentleness.',
    source: 'Sahih Muslim 2593; Sahih al-Bukhari 6927', topicBn: 'নম্রতা', topicEn: 'Gentleness',
  },
  {
    textBn: 'শক্তিশালী সে নয়, যে কুস্তিতে মানুষকে হারায়; বরং শক্তিশালী সে, যে রাগের সময় নিজেকে নিয়ন্ত্রণ করে।',
    textEn: 'The strong is not the one who overcomes people by wrestling, but the one who controls himself in anger.',
    source: 'Sahih al-Bukhari 6114; Sahih Muslim 2609', topicBn: 'রাগ', topicEn: 'Anger',
  },
  {
    textBn: 'সহজ করো, কঠিন করো না; সুসংবাদ দাও, (মানুষকে) দূরে ঠেলে দিও না।',
    textEn: 'Make things easy and do not make them difficult; give glad tidings and do not repel people.',
    source: 'Sahih al-Bukhari 69; Sahih Muslim 1734', topicBn: 'সহজ করা', topicEn: 'Ease',
  },
  {
    textBn: 'যে ঈমানের সঙ্গে ও সওয়াবের আশায় রমজানের রোজা রাখে, তার আগের গুনাহ মাফ করে দেওয়া হয়।',
    textEn: 'Whoever fasts Ramadan out of faith and hope for reward, his previous sins will be forgiven.',
    source: 'Sahih al-Bukhari 38; Sahih Muslim 760', topicBn: 'রোজা', topicEn: 'Fasting',
  },
  {
    textBn: 'জ্ঞান অর্জন করা প্রত্যেক মুসলিমের ওপর ফরজ।',
    textEn: 'Seeking knowledge is obligatory upon every Muslim.',
    source: 'Sunan Ibn Majah 224', topicBn: 'জ্ঞান', topicEn: 'Knowledge',
  },
  {
    textBn: 'তোমাদের মধ্যে সর্বোত্তম সে, যে তার পরিবারের কাছে সর্বোত্তম।',
    textEn: 'The best of you are the best to their families.',
    source: 'Jami at-Tirmidhi 3895', topicBn: 'পরিবার', topicEn: 'Family',
  },
  {
    textBn: 'তোমাদের কেউ (পূর্ণ) মুমিন হতে পারবে না, যতক্ষণ না আমি তার কাছে তার পিতা, তার সন্তান ও সব মানুষের চেয়ে বেশি প্রিয় হই।',
    textEn: 'None of you truly believes until I am more beloved to him than his father, his children and all people.',
    source: 'Sahih al-Bukhari 15; Sahih Muslim 44', topicBn: 'ভালোবাসা', topicEn: 'Love',
  },
  {
    textBn: 'যে আল্লাহর জন্য মসজিদ বানায়, আল্লাহ তার জন্য জান্নাতে একটি ঘর বানান।',
    textEn: 'Whoever builds a mosque for Allah, Allah will build for him a house in Paradise.',
    source: 'Sahih al-Bukhari 450; Sahih Muslim 533', topicBn: 'মসজিদ', topicEn: 'Mosque',
  },
  {
    textBn: 'দান-সদকা সম্পদ কমায় না।',
    textEn: 'Charity does not decrease wealth.',
    source: 'Sahih Muslim 2588', topicBn: 'দান', topicEn: 'Charity',
  },
  {
    textBn: 'আমি ও এতিমের তত্ত্বাবধানকারী জান্নাতে এভাবে থাকব — এই বলে তিনি তাঁর তর্জনী ও মধ্যমা আঙুল একসঙ্গে দেখালেন।',
    textEn: 'I and the one who cares for an orphan will be in Paradise like this — and he held his index and middle fingers together.',
    source: 'Sahih al-Bukhari 5304', topicBn: 'এতিম', topicEn: 'Orphans',
  },
  {
    textBn: 'আল্লাহ তোমাদের চেহারা ও সম্পদের দিকে তাকান না; তিনি তাকান তোমাদের অন্তর ও আমলের দিকে।',
    textEn: 'Allah does not look at your appearance or your wealth, but He looks at your hearts and your deeds.',
    source: 'Sahih Muslim 2564', topicBn: 'অন্তর', topicEn: 'Heart',
  },
  {
    textBn: 'যে আল্লাহ ও পরকালের ওপর ঈমান রাখে, সে যেন তার মেহমানকে সম্মান করে।',
    textEn: 'Whoever believes in Allah and the Last Day should honour his guest.',
    source: 'Sahih al-Bukhari 6018; Sahih Muslim 47', topicBn: 'মেহমান', topicEn: 'Guests',
  },
  {
    textBn: 'আল্লাহর কাছে সবচেয়ে প্রিয় আমল তা-ই, যা নিয়মিত করা হয় — যদিও তা অল্প হয়।',
    textEn: 'The most beloved deeds to Allah are the most consistent, even if they are small.',
    source: 'Sahih al-Bukhari 6464; Sahih Muslim 783', topicBn: 'ধারাবাহিকতা', topicEn: 'Consistency',
  },
  {
    textBn: 'মানুষ মারা গেলে তার আমল বন্ধ হয়ে যায় — তিনটি ছাড়া: চলমান সদকা, উপকারী জ্ঞান, আর নেক সন্তান যে তার জন্য দোয়া করে।',
    textEn: 'When a person dies, his deeds come to an end except for three: ongoing charity, beneficial knowledge, and a righteous child who prays for him.',
    source: 'Sahih Muslim 1631', topicBn: 'সদকায়ে জারিয়া', topicEn: 'Ongoing charity',
  },
  {
    textBn: 'তুমি যেখানেই থাকো, আল্লাহকে ভয় করো; মন্দ কাজের পর ভালো কাজ করো — তা মন্দকে মুছে দেবে; আর মানুষের সঙ্গে ভালো আচরণ করো।',
    textEn: 'Fear Allah wherever you are; follow a bad deed with a good deed and it will wipe it out; and behave well towards people.',
    source: 'Jami at-Tirmidhi 1987', topicBn: 'তাকওয়া', topicEn: 'God-consciousness',
  },
  {
    textBn: 'যে কোনো মুমিনের দুনিয়ার একটি কষ্ট দূর করে দেয়, আল্লাহ কিয়ামতের দিন তার একটি কষ্ট দূর করে দেবেন।',
    textEn: 'Whoever relieves a believer of a hardship in this world, Allah will relieve him of a hardship on the Day of Resurrection.',
    source: 'Sahih Muslim 2699', topicBn: 'সাহায্য', topicEn: 'Helping others',
  },
  {
    textBn: 'ক্ষতিও করা যাবে না, ক্ষতির প্রতিশোধে ক্ষতিও করা যাবে না।',
    textEn: 'There should be neither harm nor reciprocating harm.',
    source: 'Sunan Ibn Majah 2340', topicBn: 'ক্ষতি না করা', topicEn: 'No harm',
  },
  {
    textBn: 'মানুষের ইসলামের সৌন্দর্যের অংশ হলো, যে বিষয় তার কাজের নয়, তা ছেড়ে দেওয়া।',
    textEn: 'Part of a person’s good Islam is leaving alone what does not concern him.',
    source: 'Jami at-Tirmidhi 2317', topicBn: 'অপ্রয়োজনীয় কথা', topicEn: 'Leaving what does not concern you',
  },
  {
    textBn: 'মুসলিম সে-ই, যার জিহ্বা ও হাত থেকে অন্য মুসলিমরা নিরাপদ থাকে।',
    textEn: 'The Muslim is the one from whose tongue and hand other Muslims are safe.',
    source: 'Sahih al-Bukhari 10; Sahih Muslim 40', topicBn: 'মুসলিম', topicEn: 'The Muslim',
  },
  {
    textBn: 'যে দয়া করে না, তার প্রতি দয়া করা হয় না।',
    textEn: 'He who does not show mercy will not be shown mercy.',
    source: 'Sahih al-Bukhari 5997; Sahih Muslim 2318', topicBn: 'দয়া', topicEn: 'Mercy',
  },
  {
    textBn: 'তোমরা যেভাবে আমাকে নামাজ পড়তে দেখেছ, সেভাবে নামাজ পড়ো।',
    textEn: 'Pray as you have seen me praying.',
    source: 'Sahih al-Bukhari 631', topicBn: 'নামাজ', topicEn: 'Prayer',
  },
  {
    textBn: 'যে দিনে একশ বার "সুবহানাল্লাহি ওয়া বিহামদিহি" বলে, তার গুনাহ মাফ করে দেওয়া হয় — যদিও তা সমুদ্রের ফেনার মতো হয়।',
    textEn: 'Whoever says "SubhanAllahi wa bihamdihi" one hundred times a day, his sins will be forgiven even if they are like the foam of the sea.',
    source: 'Sahih al-Bukhari 6405; Sahih Muslim 2691', topicBn: 'জিকির', topicEn: 'Dhikr',
  },
  {
    textBn: 'দুটি কথা জিহ্বায় হালকা, মিজানে ভারী, আর রহমানের কাছে প্রিয়: "সুবহানাল্লাহি ওয়া বিহামদিহি, সুবহানাল্লাহিল আজিম"।',
    textEn: 'Two words are light on the tongue, heavy on the Scale, and beloved to the Most Merciful: "SubhanAllahi wa bihamdihi, SubhanAllahil Azim".',
    source: 'Sahih al-Bukhari 6406; Sahih Muslim 2694', topicBn: 'জিকির', topicEn: 'Dhikr',
  },
  {
    textBn: 'কুরআন পড়ো, কেননা কিয়ামতের দিন তা তার সঙ্গীদের জন্য সুপারিশকারী হয়ে আসবে।',
    textEn: 'Read the Quran, for it will come as an intercessor for its companions on the Day of Resurrection.',
    source: 'Sahih Muslim 804', topicBn: 'কুরআন', topicEn: 'Quran',
  },
];

/** The hadith for a given date — deterministic, cycles every 30 days. */
export function hadithForDate(date: Date): Hadith {
  const index = (dayOfYear(date) - 1 + 7) % HADITHS.length;
  return HADITHS[index];
}

/** Hadith by deck index (0-based), or undefined when out of range. */
export function hadithByIndex(index: number): Hadith | undefined {
  if (!Number.isInteger(index) || index < 0 || index >= HADITHS.length) return undefined;
  return HADITHS[index];
}
