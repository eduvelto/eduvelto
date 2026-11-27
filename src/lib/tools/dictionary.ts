/**
 * Dictionary (Bangla–English) — pure logic.
 *
 * A static built-in word list of common words. NO API, NO fetch:
 * the list lives in this file and every lookup runs on the device.
 * Search matches exact words first, then words starting with the
 * query — in both directions (type English to find Bangla, type
 * Bangla to find English).
 *
 * Pure functions only: no network, no storage, no DOM.
 */

export interface DictionaryEntry {
  en: string;
  bn: string;
}

export const DICTIONARY_ENTRIES: readonly DictionaryEntry[] = [
  { en: 'water', bn: 'পানি' },
  { en: 'food', bn: 'খাবার' },
  { en: 'rice', bn: 'ভাত' },
  { en: 'fish', bn: 'মাছ' },
  { en: 'mango', bn: 'আম' },
  { en: 'book', bn: 'বই' },
  { en: 'school', bn: 'বিদ্যালয়' },
  { en: 'teacher', bn: 'শিক্ষক' },
  { en: 'student', bn: 'ছাত্র' },
  { en: 'friend', bn: 'বন্ধু' },
  { en: 'mother', bn: 'মা' },
  { en: 'father', bn: 'বাবা' },
  { en: 'house', bn: 'বাড়ি' },
  { en: 'home', bn: 'বাড়ি' },
  { en: 'sun', bn: 'সূর্য' },
  { en: 'moon', bn: 'চাঁদ' },
  { en: 'day', bn: 'দিন' },
  { en: 'night', bn: 'রাত' },
  { en: 'morning', bn: 'সকাল' },
  { en: 'evening', bn: 'সন্ধ্যা' },
  { en: 'today', bn: 'আজ' },
  { en: 'tomorrow', bn: 'আগামীকাল' },
  { en: 'yesterday', bn: 'গতকাল' },
  { en: 'week', bn: 'সপ্তাহ' },
  { en: 'month', bn: 'মাস' },
  { en: 'year', bn: 'বছর' },
  { en: 'time', bn: 'সময়' },
  { en: 'money', bn: 'টাকা' },
  { en: 'love', bn: 'ভালোবাসা' },
  { en: 'happy', bn: 'খুশি' },
  { en: 'sad', bn: 'দুঃখিত' },
  { en: 'big', bn: 'বড়' },
  { en: 'small', bn: 'ছোট' },
  { en: 'good', bn: 'ভালো' },
  { en: 'bad', bn: 'খারাপ' },
  { en: 'new', bn: 'নতুন' },
  { en: 'old', bn: 'পুরনো' },
  { en: 'hot', bn: 'গরম' },
  { en: 'cold', bn: 'ঠান্ডা' },
  { en: 'rain', bn: 'বৃষ্টি' },
  { en: 'river', bn: 'নদী' },
  { en: 'sea', bn: 'সাগর' },
  { en: 'tree', bn: 'গাছ' },
  { en: 'flower', bn: 'ফুল' },
  { en: 'bird', bn: 'পাখি' },
  { en: 'dog', bn: 'কুকুর' },
  { en: 'cat', bn: 'বিড়াল' },
  { en: 'road', bn: 'রাস্তা' },
  { en: 'city', bn: 'শহর' },
  { en: 'village', bn: 'গ্রাম' },
  { en: 'market', bn: 'বাজার' },
  { en: 'shop', bn: 'দোকান' },
  { en: 'car', bn: 'গাড়ি' },
  { en: 'train', bn: 'ট্রেন' },
  { en: 'phone', bn: 'ফোন' },
  { en: 'computer', bn: 'কম্পিউটার' },
  { en: 'pen', bn: 'কলম' },
  { en: 'paper', bn: 'কাগজ' },
  { en: 'table', bn: 'টেবিল' },
  { en: 'chair', bn: 'চেয়ার' },
  { en: 'door', bn: 'দরজা' },
  { en: 'window', bn: 'জানালা' },
  { en: 'hand', bn: 'হাত' },
  { en: 'eye', bn: 'চোখ' },
  { en: 'head', bn: 'মাথা' },
  { en: 'heart', bn: 'হৃদয়' },
  { en: 'name', bn: 'নাম' },
  { en: 'work', bn: 'কাজ' },
  { en: 'study', bn: 'পড়াশোনা' },
  { en: 'play', bn: 'খেলা' },
  { en: 'eat', bn: 'খাওয়া' },
  { en: 'drink', bn: 'পান করা' },
  { en: 'go', bn: 'যাওয়া' },
  { en: 'come', bn: 'আসা' },
  { en: 'see', bn: 'দেখা' },
  { en: 'speak', bn: 'বলা' },
  { en: 'write', bn: 'লেখা' },
  { en: 'read', bn: 'পড়া' },
  { en: 'yes', bn: 'হ্যাঁ' },
  { en: 'no', bn: 'না' },
  { en: 'please', bn: 'দয়া করে' },
  { en: 'thank you', bn: 'ধন্যবাদ' },
  { en: 'hello', bn: 'হ্যালো' },
];

/**
 * Search the word list. Empty or blank query returns no results.
 * Exact matches come first, then prefix matches; within each
 * group results keep the list order. Matches both fields, so an
 * English query finds Bangla meanings and a Bangla query finds
 * English meanings.
 */
export function searchDictionary(query: string): DictionaryEntry[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  const exact: DictionaryEntry[] = [];
  const prefix: DictionaryEntry[] = [];
  for (const entry of DICTIONARY_ENTRIES) {
    const en = entry.en.toLowerCase();
    const bn = entry.bn;
    if (en === q || bn === q) {
      exact.push(entry);
    } else if (en.startsWith(q) || bn.startsWith(q)) {
      prefix.push(entry);
    }
  }
  return [...exact, ...prefix];
}
