// Eduvelto — Daily quotes & wishes data (27 Nov 2026).
// Only quotes whose wording and author are well established are listed.
// Each entry: text, author, language ('bn' | 'en').

export interface QuoteItem {
  text: string;
  author: string;
  lang: 'bn' | 'en';
}

export const QUOTES: QuoteItem[] = [
  { text: 'যদি তোর ডাক শুনে কেউ না আসে তবে একলা চলো রে।', author: 'রবীন্দ্রনাথ ঠাকুর', lang: 'bn' },
  { text: 'বল বীর বল উন্নত মম শির।', author: 'কাজী নজরুল ইসলাম', lang: 'bn' },
  { text: 'মানুষের উপর বিশ্বাস হারানো পাপ।', author: 'রবীন্দ্রনাথ ঠাকুর', lang: 'bn' },
  { text: 'যেখানে দেখিবে ছাই, উড়াইয়া দেখো তাই, পাইলেও পাইতে পারো অমূল্য রতন।', author: 'রবীন্দ্রনাথ ঠাকুর', lang: 'bn' },
  { text: 'সকালে উঠিয়া আমি মনে মনে বলি, সারাদিন আমি যেন ভালো হয়ে চলি।', author: 'মদনমোহন তর্কালঙ্কার', lang: 'bn' },
  { text: 'আমার সোনার বাংলা, আমি তোমায় ভালোবাসি।', author: 'রবীন্দ্রনাথ ঠাকুর', lang: 'bn' },
  { text: 'চল চল চল, ঊর্ধ্ব গগনে বাজে মাদল।', author: 'কাজী নজরুল ইসলাম', lang: 'bn' },
  { text: 'মোরা ঝঞ্ঝার মতো উদ্দাম, মোরা ঝর্ণার মতো চঞ্চল।', author: 'কাজী নজরুল ইসলাম', lang: 'bn' },
  { text: 'জ্ঞানই শক্তি।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'পরিশ্রমই সৌভাগ্যের চাবিকাঠি।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'সময় ও স্রোত কারো জন্য অপেক্ষা করে না।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'অধ্যবসায় সাফল্যের মূলমন্ত্র।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'স্বাস্থ্যই সম্পদ।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'শিক্ষা জাতির মেরুদণ্ড।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'মিথ্যা সব পাপের জননী।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'সততাই সর্বোৎকৃষ্ট পন্থা।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'বিদ্যা অমূল্য ধন।', author: 'প্রবাদ', lang: 'bn' },
  { text: 'আজকের দিনটি আপনার জন্য শুভ হোক।', author: 'Eduvelto শুভেচ্ছা', lang: 'bn' },
  { text: 'নতুন সকাল, নতুন আশা — শুভ সকাল।', author: 'Eduvelto শুভেচ্ছা', lang: 'bn' },
  { text: 'আপনার স্বপ্ন পূরণ হোক — শুভ কামনা রইল।', author: 'Eduvelto শুভেচ্ছা', lang: 'bn' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', lang: 'en' },
  { text: 'Imagination is more important than knowledge.', author: 'Albert Einstein', lang: 'en' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', lang: 'en' },
  { text: 'The best way to predict the future is to invent it.', author: 'Alan Kay', lang: 'en' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', lang: 'en' },
  { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein', lang: 'en' },
  { text: 'Life is what happens when you are busy making other plans.', author: 'John Lennon', lang: 'en' },
  { text: 'The journey of a thousand miles begins with one step.', author: 'Lao Tzu', lang: 'en' },
  { text: 'Knowledge is power.', author: 'Francis Bacon', lang: 'en' },
  { text: 'Time is money.', author: 'Benjamin Franklin', lang: 'en' },
  { text: 'Well begun is half done.', author: 'Aristotle', lang: 'en' },
  { text: 'Practice makes a man perfect.', author: 'Proverb', lang: 'en' },
  { text: 'Honesty is the best policy.', author: 'Proverb', lang: 'en' },
  { text: 'Health is wealth.', author: 'Proverb', lang: 'en' },
  { text: 'A friend in need is a friend indeed.', author: 'Proverb', lang: 'en' },
  { text: 'Where there is a will, there is a way.', author: 'Proverb', lang: 'en' },
  { text: 'Actions speak louder than words.', author: 'Proverb', lang: 'en' },
  { text: 'Do not put off till tomorrow what you can do today.', author: 'Proverb', lang: 'en' },
  { text: 'The pen is mightier than the sword.', author: 'Edward Bulwer-Lytton', lang: 'en' },
  { text: 'Be the change that you wish to see in the world.', author: 'Mahatma Gandhi', lang: 'en' },
  { text: 'An eye for an eye will only make the whole world blind.', author: 'Mahatma Gandhi', lang: 'en' },
  { text: 'I have a dream.', author: 'Martin Luther King Jr.', lang: 'en' },
  { text: 'Stay hungry, stay foolish.', author: 'Steve Jobs', lang: 'en' },
  { text: 'Whether you think you can or you think you cannot, you are right.', author: 'Henry Ford', lang: 'en' },
  { text: 'The only thing we have to fear is fear itself.', author: 'Franklin D. Roosevelt', lang: 'en' },
  { text: 'Ask not what your country can do for you — ask what you can do for your country.', author: 'John F. Kennedy', lang: 'en' },
  { text: 'Education is the most powerful weapon which you can use to change the world.', author: 'Nelson Mandela', lang: 'en' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela', lang: 'en' },
  { text: 'If you can dream it, you can do it.', author: 'Walt Disney', lang: 'en' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', lang: 'en' },
  { text: 'No one can make you feel inferior without your consent.', author: 'Eleanor Roosevelt', lang: 'en' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt', lang: 'en' },
  { text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt', lang: 'en' },
  { text: 'Everything you have ever wanted is on the other side of fear.', author: 'George Addair', lang: 'en' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain', lang: 'en' },
  { text: 'Kindness is a language which the deaf can hear and the blind can see.', author: 'Mark Twain', lang: 'en' },
  { text: 'It is never too late to be what you might have been.', author: 'George Eliot', lang: 'en' },
  { text: 'What we think, we become.', author: 'Buddha', lang: 'en' },
  { text: 'Peace comes from within. Do not seek it without.', author: 'Buddha', lang: 'en' },
  { text: 'The best time to plant a tree was twenty years ago. The second best time is now.', author: 'Proverb', lang: 'en' },
  { text: 'A little progress each day adds up to big results.', author: 'Proverb', lang: 'en' },
  { text: 'Good morning! Have a wonderful day.', author: 'Eduvelto wish', lang: 'en' },
  { text: 'May your dreams come true. Best wishes!', author: 'Eduvelto wish', lang: 'en' },
  { text: 'Wishing you a day full of smiles and success.', author: 'Eduvelto wish', lang: 'en' },
];

export function quoteOfTheDay(date: Date): QuoteItem {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return QUOTES[((day % QUOTES.length) + QUOTES.length) % QUOTES.length];
}

export function randomQuote(excludeIndex?: number): { quote: QuoteItem; index: number } {
  let index = Math.floor(Math.random() * QUOTES.length);
  if (QUOTES.length > 1 && index === excludeIndex) index = (index + 1) % QUOTES.length;
  return { quote: QUOTES[index], index };
}
