/**
 * Speech to Text — uses the browser's built-in SpeechRecognition API
 * (webkitSpeechRecognition in Chrome/Edge). It works in Chrome and Edge,
 * not in all browsers; the UI states support plainly and fails gracefully
 * where unsupported. Nothing is uploaded: recognition runs in the browser.
 * This file only detects support and lists languages; the live
 * SpeechRecognition object itself is created in the UI.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return typeof w.SpeechRecognition === 'function' || typeof w.webkitSpeechRecognition === 'function';
}

export const SPEECH_LANGUAGES = [
  { code: 'bn-BD', nameBn: 'বাংলা (বাংলাদেশ)', nameEn: 'Bangla (Bangladesh)' },
  { code: 'en-US', nameBn: 'ইংরেজি (যুক্তরাষ্ট্র)', nameEn: 'English (US)' },
  { code: 'en-GB', nameBn: 'ইংরেজি (যুক্তরাজ্য)', nameEn: 'English (UK)' },
  { code: 'hi-IN', nameBn: 'হিন্দি', nameEn: 'Hindi' },
  { code: 'ar-SA', nameBn: 'আরবি', nameEn: 'Arabic' },
];
