/**
 * GK Flashcard — static deck of well-established, uncontroversial
 * facts only (country capitals, basic science, general knowledge).
 * NOT exam questions and NOT claimed to be from any exam or book.
 * 30 cards — the deck size is labelled honestly in the UI.
 * Pure data + shuffle only: no network, no storage, no DOM.
 */

export interface Flashcard {
  front: string;
  back: string;
}

export const GK_DECK: readonly Flashcard[] = [
  { front: 'বাংলাদেশের রাজধানী কোনটি? / What is the capital of Bangladesh?', back: 'ঢাকা / Dhaka' },
  { front: 'ভারতের রাজধানী কোনটি? / What is the capital of India?', back: 'নয়া দিল্লি / New Delhi' },
  { front: 'নেপালের রাজধানী কোনটি? / What is the capital of Nepal?', back: 'কাঠমান্ডু / Kathmandu' },
  { front: 'পাকিস্তানের রাজধানী কোনটি? / What is the capital of Pakistan?', back: 'ইসলামাবাদ / Islamabad' },
  { front: 'শ্রীলঙ্কার রাজধানী কোনটি? / What is the capital of Sri Lanka?', back: 'কলম্বো / Colombo' },
  { front: 'চীনের রাজধানী কোনটি? / What is the capital of China?', back: 'বেইজিং / Beijing' },
  { front: 'জাপানের রাজধানী কোনটি? / What is the capital of Japan?', back: 'টোকিও / Tokyo' },
  { front: 'যুক্তরাজ্যের রাজধানী কোনটি? / What is the capital of the UK?', back: 'লন্ডন / London' },
  { front: 'ফ্রান্সের রাজধানী কোনটি? / What is the capital of France?', back: 'প্যারিস / Paris' },
  { front: 'যুক্তরাষ্ট্রের রাজধানী কোনটি? / What is the capital of the USA?', back: 'ওয়াশিংটন ডিসি / Washington DC' },
  { front: 'রাশিয়ার রাজধানী কোনটি? / What is the capital of Russia?', back: 'মস্কো / Moscow' },
  { front: 'অস্ট্রেলিয়ার রাজধানী কোনটি? / What is the capital of Australia?', back: 'ক্যানবেরা / Canberra' },
  { front: 'পানির রাসায়নিক সংকেত কী? / What is the chemical formula of water?', back: 'H₂O' },
  { front: 'সূর্যের সবচেয়ে কাছের গ্রহ কোনটি? / Which planet is closest to the Sun?', back: 'বুধ / Mercury' },
  { front: 'সৌরজগতের সবচেয়ে বড় গ্রহ কোনটি? / Which is the largest planet?', back: 'বৃহস্পতি / Jupiter' },
  { front: 'পানি কত ডিগ্রি সেলসিয়াসে ফোটে? / At what temperature does water boil?', back: '১০০° সেলসিয়াস / 100°C' },
  { front: 'মানবদেহে হাড়ের সংখ্যা কত? / How many bones are in the adult human body?', back: '২০৬টি / 206' },
  { front: 'পৃথিবীর সবচেয়ে বড় মহাসাগর কোনটি? / What is the largest ocean on Earth?', back: 'প্রশান্ত মহাসাগর / Pacific Ocean' },
  { front: 'পৃথিবীর দীর্ঘতম নদী কোনটি? / What is the longest river in the world?', back: 'নীল নদ / Nile' },
  { front: 'সূর্যের আলো পৃথিবীতে আসতে কত সময় লাগে? / How long does sunlight take to reach Earth?', back: 'প্রায় ৮ মিনিট / About 8 minutes' },
  { front: 'জাপানের মুদ্রার নাম কী? / What is the currency of Japan?', back: 'ইয়েন / Yen' },
  { front: 'বাংলাদেশের জাতীয় ফল কোনটি? / What is the national fruit of Bangladesh?', back: 'কাঁঠাল / Jackfruit' },
  { front: 'বাংলাদেশের জাতীয় মাছ কোনটি? / What is the national fish of Bangladesh?', back: 'ইলিশ / Hilsa' },
  { front: 'এক বছরে কত দিন থাকে (লিপ ইয়ার ছাড়া)? / How many days are in a year (non-leap)?', back: '৩৬৫ দিন / 365 days' },
  { front: 'বিদ্যুৎ পরিমাপের একক কী? / What is the unit of electric current?', back: 'অ্যাম্পিয়ার / Ampere' },
  { front: 'অক্সিজেনের রাসায়নিক প্রতীক কী? / What is the chemical symbol of oxygen?', back: 'O' },
  { front: 'চাঁদ পৃথিবীর কয়টি উপগ্রহ? / The Moon is how many natural satellites of Earth?', back: '১টি — একমাত্র প্রাকৃতিক উপগ্রহ / 1 — the only natural satellite' },
  { front: 'সবচেয়ে বড় মরুভূমি কোনটি? / What is the largest hot desert in the world?', back: 'সাহারা / Sahara' },
  { front: 'কম্পিউটারের মস্তিষ্ক কোনটি? / Which part is called the brain of a computer?', back: 'সিপিইউ (CPU)' },
  { front: 'বাংলা নববর্ষ কোন মাসে পালিত হয়? / In which month is Pohela Boishakh celebrated?', back: 'বৈশাখ (এপ্রিল) / Boishakh (April)' },
];

/** Fisher-Yates shuffle; pass a seed for a deterministic order (tests). */
export function shuffleDeck<T>(deck: readonly T[], seed?: number): T[] {
  const arr = [...deck];
  let s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rand = (): number => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
