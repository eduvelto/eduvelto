import { describe, it, expect } from 'vitest';
import { isSpeechRecognitionSupported, SPEECH_LANGUAGES } from '../../tools/speechToText';

describe('speechToText', () => {
  it('is unsupported in Node (no browser API)', () => {
    expect(isSpeechRecognitionSupported()).toBe(false);
  });
  it('lists Bangla first', () => {
    expect(SPEECH_LANGUAGES[0].code).toBe('bn-BD');
    expect(SPEECH_LANGUAGES.length).toBeGreaterThan(1);
  });
});
