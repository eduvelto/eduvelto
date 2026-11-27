/**
 * Vocabulary Trainer — static deck of common English words with
 * Bangla meanings. 30 words — the deck size is labelled honestly
 * in the UI. NOT exam questions and NOT claimed to be from any
 * exam or book. Pure data + shuffle only.
 */
import { shuffleDeck } from './gkFlashcards';

export { shuffleDeck };

export interface VocabCard {
  word: string;
  meaningBn: string;
  meaningEn: string;
  exampleEn: string;
}

export const VOCAB_DECK: readonly VocabCard[] = [
  { word: 'Abundant', meaningBn: 'প্রচুর', meaningEn: 'plentiful', exampleEn: 'The river has abundant fish.' },
  { word: 'Brave', meaningBn: 'সাহসী', meaningEn: 'courageous', exampleEn: 'The brave boy saved the child.' },
  { word: 'Curious', meaningBn: 'কৌতূহলী', meaningEn: 'eager to learn', exampleEn: 'She is curious about the stars.' },
  { word: 'Diligent', meaningBn: 'পরিশ্রমী', meaningEn: 'hard-working', exampleEn: 'A diligent student studies every day.' },
  { word: 'Generous', meaningBn: 'উদার', meaningEn: 'willing to give', exampleEn: 'He is generous with his time.' },
  { word: 'Honest', meaningBn: 'সৎ', meaningEn: 'truthful', exampleEn: 'An honest person never lies.' },
  { word: 'Humble', meaningBn: 'বিনয়ী', meaningEn: 'modest', exampleEn: 'Stay humble even after success.' },
  { word: 'Patient', meaningBn: 'ধৈর্যশীল', meaningEn: 'able to wait calmly', exampleEn: 'Be patient with young learners.' },
  { word: 'Sincere', meaningBn: 'আন্তরিক', meaningEn: 'genuine', exampleEn: 'She gave a sincere apology.' },
  { word: 'Vivid', meaningBn: 'স্পষ্ট / প্রাণবন্ত', meaningEn: 'bright and clear', exampleEn: 'He gave a vivid description.' },
  { word: 'Ancient', meaningBn: 'প্রাচীন', meaningEn: 'very old', exampleEn: 'Dhaka has many ancient buildings.' },
  { word: 'Brief', meaningBn: 'সংক্ষিপ্ত', meaningEn: 'short', exampleEn: 'Please give a brief answer.' },
  { word: 'Calm', meaningBn: 'শান্ত', meaningEn: 'peaceful', exampleEn: 'Stay calm during the exam.' },
  { word: 'Danger', meaningBn: 'বিপদ', meaningEn: 'risk', exampleEn: 'The sign warns of danger.' },
  { word: 'Eager', meaningBn: 'আগ্রহী', meaningEn: 'keen', exampleEn: 'Students are eager to learn.' },
  { word: 'Faithful', meaningBn: 'বিশ্বস্ত', meaningEn: 'loyal', exampleEn: 'A faithful friend never leaves you.' },
  { word: 'Gentle', meaningBn: 'নম্র', meaningEn: 'kind and soft', exampleEn: 'Speak in a gentle voice.' },
  { word: 'Huge', meaningBn: 'বিশাল', meaningEn: 'very large', exampleEn: 'The Padma Bridge is huge.' },
  { word: 'Idle', meaningBn: 'অলস', meaningEn: 'not working', exampleEn: 'Do not sit idle all day.' },
  { word: 'Joyful', meaningBn: 'আনন্দিত', meaningEn: 'full of joy', exampleEn: 'Eid is a joyful day.' },
  { word: 'Keen', meaningBn: 'তীক্ষ্ণ / আগ্রহী', meaningEn: 'sharp; eager', exampleEn: 'He has a keen eye for detail.' },
  { word: 'Lazy', meaningBn: 'অলস', meaningEn: 'unwilling to work', exampleEn: 'A lazy student fails often.' },
  { word: 'Neat', meaningBn: 'পরিপাটি', meaningEn: 'tidy', exampleEn: 'Keep your notebook neat.' },
  { word: 'Polite', meaningBn: 'ভদ্র', meaningEn: 'well-mannered', exampleEn: 'Be polite to your teachers.' },
  { word: 'Quiet', meaningBn: 'নীরব', meaningEn: 'silent', exampleEn: 'The library is quiet.' },
  { word: 'Rapid', meaningBn: 'দ্রুত', meaningEn: 'very fast', exampleEn: 'The river flows rapid in monsoon.' },
  { word: 'Simple', meaningBn: 'সহজ', meaningEn: 'easy', exampleEn: 'This is a simple question.' },
  { word: 'Timid', meaningBn: 'ভীরু', meaningEn: 'shy; fearful', exampleEn: 'The timid deer ran away.' },
  { word: 'Unique', meaningBn: 'অনন্য', meaningEn: 'one of a kind', exampleEn: 'Every person is unique.' },
  { word: 'Wise', meaningBn: 'জ্ঞানী', meaningEn: 'having good judgement', exampleEn: 'A wise teacher guides well.' },
];
