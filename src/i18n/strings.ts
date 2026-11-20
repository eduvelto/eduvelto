// EduOrbit UI strings — Bangla first (bn), English second (en).
// All UI copy lives here, never hard-coded in components, so the bn/en
// toggle is one lookup. Content (lessons, quizzes) is data, not strings.

export type Lang = 'bn' | 'en';

export const strings = {
  appName: { bn: 'EduOrbit', en: 'EduOrbit' },
  tagline: { bn: 'শেখো, এগিয়ে যাও, স্বপ্ন গড়ো', en: 'Learn, Grow, Achieve' },
  nav: {
    home: { bn: 'হোম', en: 'Home' },
    directory: { bn: 'শিক্ষা নির্দেশিকা', en: 'Education Directory' },
    library: { bn: 'লাইব্রেরি', en: 'Library' },
    exam: { bn: 'পরীক্ষা', en: 'Exam' },
    routine: { bn: 'রুটিন', en: 'Study Routine' },
    progress: { bn: 'অগ্রগতি', en: 'Progress' },
    social: { bn: 'সোশ্যাল', en: 'Social' },
    aiTeacher: { bn: 'অরবিট এআই শিক্ষক', en: 'Orbit AI Teacher' },
    profile: { bn: 'প্রোফাইল', en: 'Profile' },
    admin: { bn: 'অ্যাডমিন', en: 'Admin' },
    login: { bn: 'লগইন', en: 'Log in' },
    register: { bn: 'রেজিস্টার', en: 'Register' },
    logout: { bn: 'লগআউট', en: 'Log out' },
  },
  auth: {
    email: { bn: 'ইমেইল', en: 'Email' },
    password: { bn: 'পাসওয়ার্ড', en: 'Password' },
    displayName: { bn: 'নাম', en: 'Full name' },
    loginTitle: { bn: 'লগইন করুন', en: 'Log in' },
    loginButton: { bn: 'লগইন', en: 'Log in' },
    loginWithGoogle: { bn: 'Google দিয়ে লগইন', en: 'Continue with Google' },
    registerTitle: { bn: 'শিক্ষার্থী হিসেবে রেজিস্টার করুন', en: 'Register as a student' },
    registerButton: { bn: 'রেজিস্টার করুন', en: 'Create account' },
    teacherRegisterTitle: { bn: 'শিক্ষক হিসেবে রেজিস্টার করুন', en: 'Register as a teacher' },
    teacherRegisterNote: {
      bn: 'শিক্ষক ভেরিফিকেশন মানুষের মাধ্যমে যাচাই করা হয়। রেজিস্টার করলেই "ভেরিফায়েড" ব্যাজ পাওয়া যায় না।',
      en: 'Teacher verification is a human check. Registering does not grant a "verified" badge.',
    },
    noAccount: { bn: 'অ্যাকাউন্ট নেই?', en: "Don't have an account?" },
    haveAccount: { bn: 'ইতিমধ্যে অ্যাকাউন্ট আছে?', en: 'Already have an account?' },
    forgotPassword: { bn: 'পাসওয়ার্ড ভুলে গেছেন?', en: 'Forgot password?' },
    confirmPassword: { bn: 'পাসওয়ার্ড আবার লিখুন', en: 'Confirm password' },
    weakPassword: { bn: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।', en: 'Password must be at least 6 characters.' },
    passwordsDoNotMatch: { bn: 'দুইবার লেখা পাসওয়ার্ড মিলছে না।', en: 'The two passwords do not match.' },
    sendResetLink: { bn: 'রিসেট লিংক পাঠান', en: 'Send reset link' },
    resetSent: {
      bn: 'পাসওয়ার্ড রিসেটের লিংক আপনার ইমেইলে পাঠানো হয়েছে। ইনবক্স (ও স্প্যাম) দেখুন।',
      en: 'A password-reset link was sent to your email. Check your inbox (and spam).',
    },
    studentNote: {
      bn: 'রেজিস্টার করলে শিক্ষার্থী অ্যাকাউন্ট তৈরি হয়। শিক্ষক ভেরিফিকেশন আলাদা প্রক্রিয়া (Step 5) — রেজিস্টার করলেই "ভেরিফায়েড" ব্যাজ পাওয়া যায় না।',
      en: 'Registering creates a student account. Teacher verification is a separate process (Step 5) — registering does not grant a "verified" badge.',
    },
    notConfigured: {
      bn: 'Firebase এখনো যুক্ত হয়নি। প্রকল্প সেটআপ সম্পূর্ণ হলে লগইন চালু হবে।',
      en: 'Firebase is not connected yet. Sign-in will work once the project setup is complete.',
    },
  },
  profile: {
    editTitle: { bn: 'প্রোফাইল সম্পাদনা', en: 'Edit profile' },
    role: { bn: 'ভূমিকা', en: 'Role' },
    email: { bn: 'ইমেইল', en: 'Email' },
    language: { bn: 'ভাষা', en: 'Language' },
    educationType: { bn: 'ধারা', en: 'Stream' },
    board: { bn: 'বোর্ড', en: 'Board' },
    institution: { bn: 'প্রতিষ্ঠান', en: 'Institution' },
    academicYear: { bn: 'শিক্ষাবর্ষ', en: 'Academic year' },
    program: { bn: 'প্রোগ্রাম', en: 'Program' },
    department: { bn: 'বিভাগ', en: 'Department' },
    classLevel: { bn: 'শ্রেণি / লেভেল', en: 'Class / level' },
    memberSince: { bn: 'সদস্য যেদিন থেকে', en: 'Member since' },
    suspendedTitle: { bn: 'অ্যাকাউন্টটি স্থগিত আছে', en: 'This account is suspended' },
    suspendedBody: {
      bn: 'অ্যাডমিন আপনার অ্যাকাউন্টটি স্থগিত করেছেন। লগইন কাজ করলেও অ্যাপ ব্যবহার করা যাবে না। সাহায্যের জন্য অ্যাডমিনের সঙ্গে যোগাযোগ করুন।',
      en: 'An admin has suspended your account. Sign-in still works, but the app cannot be used. Contact an admin for help.',
    },
    notSignedIn: { bn: 'প্রোফাইল দেখতে লগইন করুন।', en: 'Log in to see your profile.' },
    saved: { bn: 'প্রোফাইল সংরক্ষণ হয়েছে।', en: 'Profile saved.' },
    noChanges: { bn: 'পরিবর্তন কিছু হয়নি।', en: 'Nothing changed.' },
    loadingProfile: { bn: 'প্রোফাইল লোড হচ্ছে…', en: 'Loading profile…' },
  },
  common: {
    loading: { bn: 'লোড হচ্ছে…', en: 'Loading…' },
    noDataYet: {
      bn: 'এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।',
      en: 'No data yet. Content will appear here once it is published.',
    },
    back: { bn: 'ফিরে যান', en: 'Go back' },
    save: { bn: 'সংরক্ষণ', en: 'Save' },
    cancel: { bn: 'বাতিল', en: 'Cancel' },
    search: { bn: 'খুঁজুন', en: 'Search' },
    comingLater: {
      bn: 'এই ফিচারটি এখনো তৈরি হয়নি — এটি একটি ডিজাইন প্রস্তাব মাত্র।',
      en: 'This feature is not built yet — it is a design proposal only.',
    },
    demoWarning: {
      bn: 'এটি ডেমো নয় — আসল তথ্য শুধুমাত্র প্রকাশিত কনটেন্ট থেকেই আসে।',
      en: 'This is not a demo — real data comes only from published content.',
    },
  },
  aiTeacher: {
    title: { bn: 'অরবিট এআই শিক্ষক', en: 'Orbit AI Teacher' },
    scriptedNote: {
      bn: 'এটি একটি স্ক্রিপ্ট করা প্রদর্শনী, আসল এআই নয়। বিনামূল্যে প্রোডাকশন-মানের এআই শিক্ষক সম্ভব নয় — বিস্তারিত ব্লুপ্রিন্ট §5 দেখুন।',
      en: 'This is a scripted demonstration, not live AI. A free production-quality AI teacher is not feasible — see blueprint §5.',
    },
    freeHelpers: {
      bn: 'বিনামূল্যের সহায়ক: শব্দকোষ, সূত্রপত্র, পুনরাবৃত্তি-ভিত্তিক রিভিশন।',
      en: 'Free helpers: glossary, formula sheets, spaced-repetition revision.',
    },
  },
  social: {
    title: { bn: 'EduSocial', en: 'EduSocial' },
    designOnlyNote: {
      bn: 'সোশ্যাল ফিচার শুধুমাত্র ডিজাইন প্রস্তাব। প্রাইভেট মেসেজিং, গ্রুপ চ্যাট ও ভয়েস মেসেজ তৈরি করা হবে না — নিরাপত্তা ও মডারেশন প্রস্তুত না হওয়া পর্যন্ত।',
      en: 'Social features are a design proposal only. No private messaging, group chat or voice messages will be built until safety and moderation are ready.',
    },
  },
} as const;

export function t(lang: Lang, entry: { bn: string; en: string }): string {
  return entry[lang];
}
