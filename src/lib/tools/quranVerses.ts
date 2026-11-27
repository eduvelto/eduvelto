/**
 * Daily Quran Verse — a modest deck of 30 WELL-KNOWN short verses.
 *
 * Every verse here is one whose Arabic text and standard Bengali
 * meaning are certain. The Bengali meaning is an abridged rendering
 * from standard published Bengali translations (the wording follows
 * the widely used translations, e.g. Islamic Foundation Bangladesh);
 * it is labelled as such in the UI and no verse whose meaning was
 * uncertain was included. If a verse is ever in doubt, it must be
 * REMOVED from this deck, never re-worded from memory.
 *
 * The verse of the day is picked deterministically from the
 * day-of-year, so the same day always shows the same verse and the
 * deck cycles every 30 days. Pure data + pure functions only.
 */

export interface QuranVerse {
  /** e.g. "1:1". */
  reference: string;
  surahBn: string;
  surahEn: string;
  arabic: string;
  /** Abridged Bengali meaning from standard published translations. */
  meaningBn: string;
  meaningEn: string;
}

export const QURAN_VERSES: readonly QuranVerse[] = [
  {
    reference: '1:1', surahBn: 'সূরা আল-ফাতিহা', surahEn: 'Surah Al-Fatiha',
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    meaningBn: 'পরম করুণাময় ও অসীম দয়ালু আল্লাহর নামে।',
    meaningEn: 'In the name of Allah, the Most Compassionate, the Most Merciful.',
  },
  {
    reference: '1:2', surahBn: 'সূরা আল-ফাতিহা', surahEn: 'Surah Al-Fatiha',
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    meaningBn: 'সমস্ত প্রশংসা আল্লাহর, যিনি সকল জগতের প্রতিপালক।',
    meaningEn: 'All praise belongs to Allah, Lord of all the worlds.',
  },
  {
    reference: '1:4', surahBn: 'সূরা আল-ফাতিহা', surahEn: 'Surah Al-Fatiha',
    arabic: 'مَالِكِ يَوْمِ الدِّينِ',
    meaningBn: 'যিনি বিচার দিনের মালিক।',
    meaningEn: 'Master of the Day of Judgement.',
  },
  {
    reference: '1:5', surahBn: 'সূরা আল-ফাতিহা', surahEn: 'Surah Al-Fatiha',
    arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    meaningBn: 'আমরা একমাত্র তোমারই ইবাদত করি এবং একমাত্র তোমারই সাহায্য চাই।',
    meaningEn: 'You alone we worship, and You alone we ask for help.',
  },
  {
    reference: '2:152', surahBn: 'সূরা আল-বাকারা', surahEn: 'Surah Al-Baqarah',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    meaningBn: 'অতএব তোমরা আমাকে স্মরণ করো, আমিও তোমাদের স্মরণ করব; আর আমার কৃতজ্ঞতা প্রকাশ করো, অকৃতজ্ঞ হয়ো না।',
    meaningEn: 'So remember Me, I will remember you. Be grateful to Me, and never ungrateful.',
  },
  {
    reference: '2:153', surahBn: 'সূরা আল-বাকারা', surahEn: 'Surah Al-Baqarah',
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    meaningBn: 'হে ঈমানদারগণ! ধৈর্য ও নামাজের মাধ্যমে সাহায্য চাও। নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সঙ্গে আছেন।',
    meaningEn: 'O believers! Seek help through patience and prayer. Surely Allah is with the patient.',
  },
  {
    reference: '2:255', surahBn: 'সূরা আল-বাকারা', surahEn: 'Surah Al-Baqarah',
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    meaningBn: 'আল্লাহ — তিনি ছাড়া কোনো উপাস্য নেই, তিনি চিরঞ্জীব, সবকিছুর ধারক। তাঁকে তন্দ্রা ও নিদ্রা স্পর্শ করে না। আসমান ও জমিনে যা কিছু আছে, সবই তাঁর। তাঁর অনুমতি ছাড়া কে তাঁর কাছে সুপারিশ করবে? তিনি জানেন যা তাদের সামনে ও পেছনে আছে। তাঁর জ্ঞানের কিছুই তারা আয়ত্ত করতে পারে না, তিনি যা চান তা ছাড়া। তাঁর কুরসি আসমান ও জমিনকে পরিব্যাপ্ত করেছে; এ দুটির রক্ষণাবেক্ষণ তাঁকে ক্লান্ত করে না। তিনি সর্বোচ্চ, মহান। (আয়াতুল কুরসি)',
    meaningEn: 'Allah — there is no god but He, the Ever-Living, the Sustainer of all. Neither drowsiness nor sleep overtakes Him. To Him belongs whatever is in the heavens and whatever is on earth. Who can intercede with Him except by His permission? He knows what is before them and what is behind them, and they cannot grasp any of His knowledge except what He wills. His Kursi encompasses the heavens and the earth, and guarding them does not weary Him. He is the Most High, the Greatest. (Ayat al-Kursi)',
  },
  {
    reference: '2:286', surahBn: 'সূরা আল-বাকারা', surahEn: 'Surah Al-Baqarah',
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    meaningBn: 'আল্লাহ কোনো প্রাণকে তার সাধ্যের বাইরে দায়িত্ব দেন না। (আয়াতের অংশ)',
    meaningEn: 'Allah does not burden any soul beyond its capacity. (Part of the verse)',
  },
  {
    reference: '3:139', surahBn: 'সূরা আলে ইমরান', surahEn: 'Surah Aal-e-Imran',
    arabic: 'وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنْتُمُ الْأَعْلَوْنَ إِنْ كُنْتُمْ مُؤْمِنِينَ',
    meaningBn: 'তোমরা হতাশ হয়ো না, দুঃখ করো না; তোমরাই বিজয়ী হবে, যদি তোমরা মুমিন হও।',
    meaningEn: 'Do not lose heart or grieve — you will have the upper hand if you are believers.',
  },
  {
    reference: '13:28', surahBn: 'সূরা আর-রা’দ', surahEn: "Surah Ar-Ra'd",
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    meaningBn: 'জেনে রাখো, আল্লাহর স্মরণেই অন্তর প্রশান্তি লাভ করে। (আয়াতের অংশ)',
    meaningEn: 'Verily, in the remembrance of Allah do hearts find rest. (Part of the verse)',
  },
  {
    reference: '29:45', surahBn: 'সূরা আল-আনকাবূত', surahEn: 'Surah Al-Ankabut',
    arabic: 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ',
    meaningBn: 'নিশ্চয়ই নামাজ অশ্লীলতা ও মন্দ কাজ থেকে বিরত রাখে। (আয়াতের অংশ)',
    meaningEn: 'Indeed, prayer restrains from shameful and evil deeds. (Part of the verse)',
  },
  {
    reference: '55:13', surahBn: 'সূরা আর-রহমান', surahEn: 'Surah Ar-Rahman',
    arabic: 'فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ',
    meaningBn: 'অতএব তোমরা তোমাদের প্রতিপালকের কোন কোন অনুগ্রহ অস্বীকার করবে?',
    meaningEn: 'So which of your Lord’s favours will you deny?',
  },
  {
    reference: '94:5', surahBn: 'সূরা আশ-শারহ', surahEn: 'Surah Ash-Sharh',
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
    meaningBn: 'নিশ্চয়ই কষ্টের সঙ্গে স্বস্তি আছে।',
    meaningEn: 'So, surely with hardship comes ease.',
  },
  {
    reference: '94:6', surahBn: 'সূরা আশ-শারহ', surahEn: 'Surah Ash-Sharh',
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    meaningBn: 'নিশ্চয়ই কষ্টের সঙ্গে স্বস্তি আছে।',
    meaningEn: 'Surely with that hardship comes ease.',
  },
  {
    reference: '99:7', surahBn: 'সূরা আয-যিলযাল', surahEn: 'Surah Az-Zalzalah',
    arabic: 'فَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ',
    meaningBn: 'যে কেউ অণু পরিমাণ ভালো কাজ করবে, সে তা দেখতে পাবে।',
    meaningEn: 'Whoever does an atom’s weight of good will see it.',
  },
  {
    reference: '99:8', surahBn: 'সূরা আয-যিলযাল', surahEn: 'Surah Az-Zalzalah',
    arabic: 'وَمَنْ يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُ',
    meaningBn: 'আর যে কেউ অণু পরিমাণ মন্দ কাজ করবে, সে তাও দেখতে পাবে।',
    meaningEn: 'And whoever does an atom’s weight of evil will see it.',
  },
  {
    reference: '103:1-3', surahBn: 'সূরা আল-আসর', surahEn: 'Surah Al-Asr',
    arabic: 'وَالْعَصْرِ ۝ إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ ۝ إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ',
    meaningBn: 'সময়ের শপথ! নিশ্চয়ই মানুষ ক্ষতির মধ্যে আছে — তবে তারা নয়, যারা ঈমান এনেছে, সৎকাজ করেছে, একে অপরকে সত্যের উপদেশ দিয়েছে এবং ধৈর্যের উপদেশ দিয়েছে। (পুরো সূরা)',
    meaningEn: 'By time! Surely humanity is in loss — except those who believe, do good, and encourage one another to truth and patience. (Whole surah)',
  },
  {
    reference: '108:1', surahBn: 'সূরা আল-কাওসার', surahEn: 'Surah Al-Kawthar',
    arabic: 'إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ',
    meaningBn: 'নিশ্চয়ই আমি তোমাকে কাওসার দান করেছি।',
    meaningEn: 'Indeed, We have given you Al-Kawthar.',
  },
  {
    reference: '112:1', surahBn: 'সূরা আল-ইখলাস', surahEn: 'Surah Al-Ikhlas',
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    meaningBn: 'বলো, তিনি আল্লাহ, এক।',
    meaningEn: 'Say: He is Allah, the One.',
  },
  {
    reference: '112:2', surahBn: 'সূরা আল-ইখলাস', surahEn: 'Surah Al-Ikhlas',
    arabic: 'اللَّهُ الصَّمَدُ',
    meaningBn: 'আল্লাহ অমুখাপেক্ষী।',
    meaningEn: 'Allah, the Eternal Refuge.',
  },
  {
    reference: '112:3', surahBn: 'সূরা আল-ইখলাস', surahEn: 'Surah Al-Ikhlas',
    arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
    meaningBn: 'তিনি কাউকে জন্ম দেননি এবং কেউ তাঁকে জন্ম দেয়নি।',
    meaningEn: 'He neither begets nor is born.',
  },
  {
    reference: '112:4', surahBn: 'সূরা আল-ইখলাস', surahEn: 'Surah Al-Ikhlas',
    arabic: 'وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
    meaningBn: 'আর তাঁর সমতুল্য কেউ নেই।',
    meaningEn: 'And there is none comparable to Him.',
  },
  {
    reference: '113:1', surahBn: 'সূরা আল-ফালাক', surahEn: 'Surah Al-Falaq',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
    meaningBn: 'বলো, আমি আশ্রয় চাই প্রভাতের প্রতিপালকের।',
    meaningEn: 'Say: I seek refuge in the Lord of daybreak.',
  },
  {
    reference: '114:1', surahBn: 'সূরা আন-নাস', surahEn: 'Surah An-Nas',
    arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
    meaningBn: 'বলো, আমি আশ্রয় চাই মানুষের প্রতিপালকের।',
    meaningEn: 'Say: I seek refuge in the Lord of humankind.',
  },
  {
    reference: '65:2', surahBn: 'সূরা আত-তালাক', surahEn: 'Surah At-Talaq',
    arabic: 'وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا',
    meaningBn: 'যে আল্লাহকে ভয় করে, আল্লাহ তার জন্য (সংকট থেকে) বের হওয়ার পথ করে দেন। (আয়াতের অংশ)',
    meaningEn: 'Whoever is mindful of Allah, He will make a way out for them. (Part of the verse)',
  },
  {
    reference: '65:3', surahBn: 'সূরা আত-তালাক', surahEn: 'Surah At-Talaq',
    arabic: 'وَمَنْ يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    meaningBn: 'যে আল্লাহর ওপর ভরসা করে, আল্লাহই তার জন্য যথেষ্ট। (আয়াতের অংশ)',
    meaningEn: 'Whoever puts their trust in Allah, He is sufficient for them. (Part of the verse)',
  },
  {
    reference: '39:53', surahBn: 'সূরা আয-যুমার', surahEn: 'Surah Az-Zumar',
    arabic: 'لَا تَقْنَطُوا مِنْ رَحْمَةِ اللَّهِ',
    meaningBn: 'আল্লাহর রহমত থেকে নিরাশ হয়ো না। (আয়াতের অংশ)',
    meaningEn: 'Do not despair of the mercy of Allah. (Part of the verse)',
  },
  {
    reference: '17:23', surahBn: 'সূরা বনী ইসরাঈল', surahEn: 'Surah Al-Isra',
    arabic: 'وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا',
    meaningBn: 'তোমার প্রতিপালক নির্দেশ দিয়েছেন যে, তোমরা তাঁকে ছাড়া আর কারো ইবাদত করবে না এবং পিতা-মাতার সঙ্গে সদ্ব্যবহার করবে। (আয়াতের অংশ)',
    meaningEn: 'Your Lord has decreed that you worship none but Him, and be kind to your parents. (Part of the verse)',
  },
  {
    reference: '2:43', surahBn: 'সূরা আল-বাকারা', surahEn: 'Surah Al-Baqarah',
    arabic: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ',
    meaningBn: 'তোমরা নামাজ কায়েম করো, জাকাত দাও এবং রুকুকারীদের সঙ্গে রুকু করো।',
    meaningEn: 'Establish prayer, give zakat, and bow with those who bow.',
  },
  {
    reference: '87:1', surahBn: 'সূরা আল-আ’লা', surahEn: "Surah Al-A'la",
    arabic: 'سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى',
    meaningBn: 'তোমার মহান প্রতিপালকের নামের পবিত্রতা বর্ণনা করো।',
    meaningEn: 'Glorify the name of your Lord, the Most High.',
  },
];

/** Day-of-year (1-based) for a date, in local time. */
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

/** The verse for a given date — deterministic, cycles every 30 days. */
export function verseForDate(date: Date): QuranVerse {
  const index = (dayOfYear(date) - 1) % QURAN_VERSES.length;
  return QURAN_VERSES[index];
}

/** Verse by deck index (0-based), or undefined when out of range. */
export function verseByIndex(index: number): QuranVerse | undefined {
  if (!Number.isInteger(index) || index < 0 || index >= QURAN_VERSES.length) return undefined;
  return QURAN_VERSES[index];
}
