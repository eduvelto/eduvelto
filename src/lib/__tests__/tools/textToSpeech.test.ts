// Text to Speech voice helpers — unit tests.
// speechSynthesis itself is NOT tested here (it does not exist in
// node); only the pure voice filtering / sorting helpers are.
import { describe, it, expect } from 'vitest';
import {
  filterVoicesByLang,
  pickDefaultVoice,
  sortVoicesPreferBnEn,
} from '../../tools/textToSpeech';

const VOICES = [
  { name: 'Google US English', lang: 'en-US' },
  { name: 'Bangla Voice', lang: 'bn-BD' },
  { name: 'Google UK English', lang: 'en-GB' },
  { name: 'Hindi Voice', lang: 'hi-IN' },
  { name: 'Bangla India', lang: 'bn-IN' },
];

describe('filterVoicesByLang', () => {
  it('returns only Bangla voices for "bn"', () => {
    expect(filterVoicesByLang(VOICES, 'bn')).toEqual([
      { name: 'Bangla Voice', lang: 'bn-BD' },
      { name: 'Bangla India', lang: 'bn-IN' },
    ]);
  });

  it('returns only English voices for "en"', () => {
    expect(filterVoicesByLang(VOICES, 'en')).toEqual([
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Google UK English', lang: 'en-GB' },
    ]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterVoicesByLang(VOICES, 'fr')).toEqual([]);
  });
});

describe('sortVoicesPreferBnEn', () => {
  it('orders Bangla first, then English, then the rest', () => {
    const sorted = sortVoicesPreferBnEn(VOICES);
    expect(sorted.map((v) => v.name)).toEqual([
      'Bangla India',
      'Bangla Voice',
      'Google UK English',
      'Google US English',
      'Hindi Voice',
    ]);
  });

  it('does not mutate the input array', () => {
    const copy = [...VOICES];
    sortVoicesPreferBnEn(VOICES);
    expect(VOICES).toEqual(copy);
  });
});

describe('pickDefaultVoice', () => {
  it('picks a Bangla voice when one exists', () => {
    expect(pickDefaultVoice(VOICES)?.lang).toMatch(/^bn/);
  });

  it('falls back to English when no Bangla voice exists', () => {
    const enOnly = VOICES.filter((v) => !v.lang.startsWith('bn'));
    expect(pickDefaultVoice(enOnly)?.lang).toMatch(/^en/);
  });

  it('returns null for an empty list', () => {
    expect(pickDefaultVoice([])).toBeNull();
  });
});
