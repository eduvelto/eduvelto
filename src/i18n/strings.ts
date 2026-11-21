// Eduvelto UI strings — Bangla first (bn), English second (en).
// All UI copy lives here, never hard-coded in components, so the bn/en
// toggle is one lookup. Content (lessons, quizzes) is data, not strings.

export type Lang = 'bn' | 'en';

export const strings = {
  appName: { bn: 'Eduvelto', en: 'Eduvelto' },
  tagline: { bn: 'শেখো, এগিয়ে যাও, স্বপ্ন গড়ো', en: 'Learn, Grow, Achieve' },
  nav: {
    home: { bn: 'হোম', en: 'Home' },
    directory: { bn: 'শিক্ষা নির্দেশিকা', en: 'Education Directory' },
    library: { bn: 'লাইব্রেরি', en: 'Library' },
    exam: { bn: 'পরীক্ষা', en: 'Exam' },
    routine: { bn: 'রুটিন', en: 'Study Routine' },
    progress: { bn: 'অগ্রগতি', en: 'Progress' },
    social: { bn: 'সোশ্যাল', en: 'Social' },
    health: { bn: 'স্বাস্থ্য', en: 'Health' },
    about: { bn: 'আমাদের সম্পর্কে', en: 'About' },
    contact: { bn: 'যোগাযোগ', en: 'Contact' },
    aiTeacher: { bn: 'এআই শিক্ষক (প্রদর্শনী)', en: 'AI Teacher (Demo)' },
    aiChat: { bn: 'এআই চ্যাট', en: 'AI Chat' },
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
    educationType: { bn: 'শিক্ষার ধারা', en: 'Stream' },
    board: { bn: 'বোর্ড', en: 'Board' },
    institution: { bn: 'প্রতিষ্ঠান', en: 'Institution' },
    academicYear: { bn: 'শিক্ষাবর্ষ', en: 'Academic year' },
    program: { bn: 'প্রোগ্রাম', en: 'Program' },
    department: { bn: 'বিভাগ', en: 'Department' },
    classLevel: { bn: 'শ্রেণি / লেভেল', en: 'Class / level' },
    memberSince: { bn: 'সদস্য হওয়ার তারিখ', en: 'Member since' },
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
    title: { bn: 'এডুভেল্টো এআই শিক্ষক', en: 'Eduvelto AI Teacher' },
    demoBadge: { bn: 'প্রদর্শনী · DEMO — আসল এআই নয়', en: 'DEMONSTRATION · DEMO — not live AI' },
    scriptedNote: {
      bn: 'এটি একটি স্ক্রিপ্ট করা প্রদর্শনী, আসল এআই নয়। বিনামূল্যে প্রোডাকশন-মানের এআই শিক্ষক সম্ভব নয় — বিস্তারিত ব্লুপ্রিন্ট §5 দেখুন।',
      en: 'This is a scripted demonstration, not live AI. A free production-quality AI teacher is not feasible — see blueprint §5.',
    },
    freeHelpers: {
      bn: 'বিনামূল্যের সহায়ক: শব্দকোষ, সূত্রপত্র, পুনরাবৃত্তি-ভিত্তিক রিভিশন।',
      en: 'Free helpers: glossary, formula sheets, spaced-repetition revision.',
    },
  },
  aiChat: {
    title: { bn: 'এআই চ্যাট', en: 'AI Chat' },
    subtitle: { bn: 'Eduvelto AI — আপনার ব্যক্তিগত AI শিক্ষক', en: 'Eduvelto AI — your personal AI teacher' },
    notConnectedBanner: {
      bn: 'AI পরিষেবা এখনো যুক্ত হয়নি — মালিকের অনুমোদনের অপেক্ষায় আছে। এখানে কোনো AI উত্তর দেওয়া হয় না; আপনার প্রশ্ন সংরক্ষিত থাকে।',
      en: 'The AI service is not connected yet — awaiting the owner’s approval. No AI answers are given here; your questions are saved.',
    },
    notConnectedNotice: {
      bn: 'দুঃখিত — AI শিক্ষক এখনো চালু হয়নি। আপনার প্রশ্নটি সংরক্ষিত হয়েছে; AI চালু হলে এখানেই উত্তর পাবেন। ততক্ষণে লাইব্রেরি থেকে বই পড়ুন বা রুটিন দেখুন।',
      en: 'Sorry — the AI teacher is not live yet. Your question has been saved; you will get the answer here once AI is live. Until then, read a book from the library or check your routine.',
    },
    aiIsNotHuman: {
      bn: 'এটি AI শিক্ষক — মানুষ নয়। AI ভুল করতে পারে; পরীক্ষার উত্তর বা গুরুত্বপূর্ণ তথ্য সবসময় বইয়ের সাথে মিলিয়ে নিন।',
      en: 'This is an AI teacher — not a human. AI can make mistakes; always check exam answers and important facts against your book.',
    },
    safetyNote: {
      bn: 'AI কখনো আপনার ঠিকানা, ফোন নম্বর, ছবি বা ব্যক্তিগত তথ্য চাইবে না। কেউ এমন কিছু চাইলে রিপোর্ট করুন।',
      en: 'The AI will never ask for your address, phone number, photo or personal information. If anyone asks for those, report it.',
    },
    signInPrompt: {
      bn: 'AI চ্যাট ব্যবহার করতে লগইন করুন। আপনার কথোপকথন শুধু আপনিই দেখতে পারবেন।',
      en: 'Log in to use AI Chat. Only you can see your conversations.',
    },
    newConversation: { bn: 'নতুন কথোপকথন', en: 'New conversation' },
    conversations: { bn: 'আমার কথোপকথন', en: 'My conversations' },
    noConversations: {
      bn: 'এখনো কোনো কথোপকথন নেই। নিচে আপনার প্রথম প্রশ্নটি লিখুন।',
      en: 'No conversations yet. Write your first question below.',
    },
    askPlaceholder: { bn: 'আপনার প্রশ্নটি লিখুন…', en: 'Write your question…' },
    send: { bn: 'পাঠান', en: 'Send' },
    voiceSoon: { bn: 'ভয়েস ইনপুট — শীঘ্রই আসছে', en: 'Voice input — coming soon' },
    imageSoon: { bn: 'ছবি দিয়ে প্রশ্ন — শীঘ্রই আসছে', en: 'Image question — coming soon' },
    copy: { bn: 'কপি', en: 'Copy' },
    copied: { bn: 'কপি হয়েছে', en: 'Copied' },
    share: { bn: 'শেয়ার', en: 'Share' },
    shareFallback: { bn: 'শেয়ার করা যায়নি — কপি করা হয়েছে।', en: 'Sharing is not available — copied instead.' },
    report: { bn: 'রিপোর্ট', en: 'Report' },
    reportReason: { bn: 'কারণ', en: 'Reason' },
    reportDetails: { bn: 'বিস্তারিত (ঐচ্ছিক)', en: 'Details (optional)' },
    reportSubmit: { bn: 'রিপোর্ট পাঠান', en: 'Submit report' },
    reportSent: { bn: 'রিপোর্ট পাঠানো হয়েছে। ধন্যবাদ।', en: 'Report sent. Thank you.' },
    deleteConversation: { bn: 'কথোপকথন মুছুন', en: 'Delete conversation' },
    deleteConfirm: { bn: 'এই কথোপকথন ও এর সব বার্তা মুছে যাবে। নিশ্চিত?', en: 'This conversation and all its messages will be deleted. Are you sure?' },
    loadMore: { bn: 'আরও দেখুন', en: 'Load more' },
    olderMessages: { bn: 'আরও পুরনো বার্তা', en: 'Older messages' },
    dailyLimitInfo: {
      bn: 'দৈনিক সীমা (AI চালু হলে প্রযোজ্য): শিক্ষার্থী ১০টি, শিক্ষক ১৫টি, অভিভাবক ৫টি প্রশ্ন।',
      en: 'Daily limit (applies once AI is live): student 10, teacher 15, guardian 5 questions.',
    },
    usedToday: { bn: 'আজ ব্যবহৃত', en: 'Used today' },
    remainingToday: { bn: 'আজ বাকি', en: 'Remaining today' },
    sendFailed: { bn: 'পাঠানো যায়নি — আবার চেষ্টা করুন।', en: 'Could not send — please try again.' },
    quickLibrary: { bn: 'লাইব্রেরি দেখুন', en: 'See the library' },
    quickRoutine: { bn: 'রুটিন দেখুন', en: 'See your routine' },
    quickProgress: { bn: 'অগ্রগতি দেখুন', en: 'See your progress' },
    you: { bn: 'আপনি', en: 'You' },
    aiTeacherName: { bn: 'Eduvelto AI', en: 'Eduvelto AI' },
  },
  social: {
    title: { bn: 'EduSocial', en: 'EduSocial' },
    designOnlyNote: {
      bn: 'সোশ্যাল ফিচার শুধুমাত্র ডিজাইন প্রস্তাব। প্রাইভেট মেসেজিং, গ্রুপ চ্যাট ও ভয়েস মেসেজ তৈরি করা হবে না — নিরাপত্তা ও মডারেশন প্রস্তুত না হওয়া পর্যন্ত।',
      en: 'Social features are a design proposal only. No private messaging, group chat or voice messages will be built until safety and moderation are ready.',
    },
  },
  health: {
    title: { bn: 'স্বাস্থ্য', en: 'Health' },
    hubIntro: {
      bn: 'স্বাস্থ্য বিষয়ক সাধারণ তথ্য — ঔষধ, রোগ, ডাক্তার, হাসপাতাল ও রিপোর্ট বোঝার সহায়তা।',
      en: 'General health information — medicines, diseases, doctors, hospitals and help understanding reports.',
    },
    // Binding disclaimer (Blueprint v4): on EVERY health page.
    disclaimer: {
      bn: 'এই তথ্য শুধুমাত্র শিক্ষামূলক — এটি চিকিৎসা পরামর্শ নয়। যেকোনো স্বাস্থ্য সিদ্ধান্তের আগে একজন যোগ্য ডাক্তারের পরামর্শ নিন।',
      en: 'This information is educational only, not medical advice — consult a qualified doctor before any health decision.',
    },
    // Owner order 20 Nov 23:58 — exact wording, shown directly UNDER every
    // health content block (medicine info, disease info, report
    // explanations, AI Doctor answers), not only in a footer or a
    // separate disclaimer page.
    accuracyNote: {
      bn: 'এই তথ্য ১০০% সঠিক নাও হতে পারে, আমার ভুল হতে পারে — তাই যাচাই করে নিন',
      en: 'This information may not be 100% correct — I could be wrong, so please verify it',
    },
    emergency: {
      bn: 'জরুরি অবস্থা মনে হলে এখনই ডাক্তারের কাছে যান বা হাসপাতালে যান — অপেক্ষা করবেন না। জরুরি নম্বর: ৯৯৯।',
      en: 'If you think it is an emergency, see a doctor or go to a hospital immediately — do not wait. Emergency number: 999.',
    },
    medicinesTitle: { bn: 'ঔষধ নির্দেশিকা', en: 'Medicine Directory' },
    medicinesIntro: {
      bn: 'সাধারণ ঔষধের ব্যবহার, ধরন, পার্শ্বপ্রতিক্রিয়া ও সতর্কতা — শুধুমাত্র যাচাইকৃত উৎস থেকে। এখানে কোনো ডোজ দেওয়া হয় না; ডোজ শুধুমাত্র ডাক্তারের পরামর্শ অনুযায়ী।',
      en: 'Uses, forms, common side effects and warnings for common medicines — from verified sources only. No dosage is given here; dosage is only as a qualified doctor prescribes.',
    },
    diseasesTitle: { bn: 'রোগের তথ্য', en: 'Disease Library' },
    diseasesIntro: {
      bn: 'সাধারণ রোগের লক্ষণ, প্রতিরোধ ও কখন ডাক্তার দেখাবেন — সাধারণ তথ্য, রোগ নির্ণয় নয়।',
      en: 'Symptoms, prevention and when to see a doctor for common diseases — general information, not a diagnosis.',
    },
    doctorsTitle: { bn: 'ডাক্তার নির্দেশিকা', en: 'Doctor Directory' },
    doctorsIntro: {
      bn: 'শুধুমাত্র যাচাইকৃত ডাক্তারদের তালিকা। যাচাই ছাড়া কেউ "ভেরিফায়েড" হিসেবে দেখানো হয় না।',
      en: 'Only verified doctors are listed. Nobody is shown as "verified" without proof.',
    },
    doctorsEmpty: {
      bn: 'এখনো কোনো যাচাইকৃত ডাক্তার তালিকাভুক্ত হয়নি। ডাক্তার যাচাই হলে এখানে দেখা যাবে।',
      en: 'No verified doctor is listed yet. Verified doctors will appear here once checked.',
    },
    doctorsApply: {
      bn: 'ডাক্তার হিসেবে তালিকাভুক্ত হতে চাইলে: আপনার পরিচয় ও যোগ্যতার প্রমাণসহ সাপোর্টে যোগাযোগ করুন। মানুষের মাধ্যমে যাচাইয়ের পরেই "ভেরিফায়েড" ব্যাজ দেওয়া হয়।',
      en: 'To be listed as a doctor: contact support with proof of your identity and qualifications. The "verified" badge is given only after a human check.',
    },
    hospitalsTitle: { bn: 'হাসপাতাল ও ফার্মেসি', en: 'Hospitals & Pharmacies' },
    hospitalsIntro: {
      bn: 'এলাকা অনুযায়ী হাসপাতাল, ক্লিনিক ও ফার্মেসি খুঁজুন। তালিকাটি এখনো ছোট — যাচাই করে বাড়ানো হচ্ছে।',
      en: 'Find hospitals, clinics and pharmacies by area. The list is still small — it is growing as entries are verified.',
    },
    reportTitle: { bn: 'রিপোর্ট বোঝার সহায়তা', en: 'Understanding Your Report' },
    reportIntro: {
      bn: 'আপনার রিপোর্টের মানগুলো সহজ ভাষায় বোঝানো হয় — এটি রোগ নির্ণয় নয়। রিপোর্টের নিজের রেফারেন্স রেঞ্জই আসল; এখানে দেওয়া রেঞ্জ শুধুমাত্র সাধারণ ধারণা।',
      en: 'Your report values explained in simple language — this is not a diagnosis. Your own report’s reference range is what matters; the ranges here are only a general guide.',
    },
    reportPickTest: { bn: 'পরীক্ষা বেছে নিন', en: 'Choose a test' },
    reportEnterValue: { bn: 'আপনার মানটি লিখুন', en: 'Enter your value' },
    reportExplain: { bn: 'বুঝিয়ে দিন', en: 'Explain it' },
    reportNoStorage: {
      bn: 'আপনার লেখা মান কোথাও সংরক্ষণ করা হয় না — এটি শুধু আপনার ডিভাইসেই দেখা যায়।',
      en: 'The value you enter is not stored anywhere — it is only shown on your device.',
    },
    reportAskDoctor: {
      bn: 'ফলাফল নিয়ে প্রশ্ন থাকলে আপনার ডাক্তারকে জিজ্ঞাসা করুন — তিনিই আপনার পুরো ইতিহাস জানেন।',
      en: 'If you have questions about a result, ask your doctor — they know your full history.',
    },
    searchPlaceholder: { bn: 'নাম লিখে খুঁজুন…', en: 'Type a name to search…' },
    areaPlaceholder: { bn: 'এলাকা লিখুন (যেমন: কক্সবাজার)…', en: 'Type an area (e.g. Cox’s Bazar)…' },
    use: { bn: 'ব্যবহার', en: 'Use' },
    form: { bn: 'ধরন', en: 'Form' },
    sideEffects: { bn: 'সাধারণ পার্শ্বপ্রতিক্রিয়া', en: 'Common side effects' },
    warnings: { bn: 'সতর্কতা', en: 'Warnings' },
    source: { bn: 'উৎস', en: 'Source' },
    symptoms: { bn: 'লক্ষণ', en: 'Symptoms' },
    prevention: { bn: 'প্রতিরোধ', en: 'Prevention' },
    seeDoctorWhen: { bn: 'কখন ডাক্তার দেখাবেন', en: 'When to see a doctor' },
    verified: { bn: 'ভেরিফায়েড', en: 'Verified' },
    hospital: { bn: 'হাসপাতাল', en: 'Hospital' },
    clinic: { bn: 'ক্লিনিক', en: 'Clinic' },
    pharmacy: { bn: 'ফার্মেসি', en: 'Pharmacy' },
    reportPaste: { bn: 'রিপোর্টের লেখা বসান', en: 'Paste your report text' },
    reportPastePlaceholder: { bn: 'রিপোর্টের লেখা এখানে বসান — যেমন পরীক্ষার নাম ও মান…', en: 'Paste your report text here — e.g. test names and values…' },
    reportNoMatch: { bn: 'এই লেখায় চেনা কোনো পরীক্ষার নাম পাওয়া যায়নি — উপরের তালিকা থেকে পরীক্ষা বেছে নিন।', en: 'No known test name was found in this text — choose a test from the list above.' },
    reportAllTests: { bn: 'সব পরীক্ষার সাধারণ ব্যাখ্যা', en: 'General explanations for all tests' },
    reportSource: {
      bn: 'সাধারণ রেঞ্জগুলো মানসম্মত ল্যাবরেটরি রেফারেন্স রেঞ্জ অনুযায়ী দেওয়া — আপনার রিপোর্টের নিজের রেঞ্জই আসল।',
      en: 'General ranges follow standard laboratory reference ranges — your own report’s range is what matters.',
    },
    inRange: { bn: 'আপনার মান সাধারণ রেঞ্জের ভেতরে আছে।', en: 'Your value is within the general range.' },
    underReview: {
      bn: 'এই তথ্যটি এখনো যাচাইয়ের অপেক্ষায় আছে — যোগ্য পেশাদারের পর্যালোচনার পরেই প্রকাশ করা হবে।',
      en: 'This information is still awaiting review — it will be published only after a qualified professional reviews it.',
    },
    whatItMeasures: { bn: 'এই পরীক্ষা কী মাপে', en: 'What this test measures' },
    generalRange: { bn: 'সাধারণ রেফারেন্স রেঞ্জ', en: 'General reference range' },
    yourValue: { bn: 'আপনার মান', en: 'Your value' },
    whatItMayMean: { bn: 'এর সাধারণ অর্থ কী হতে পারে', en: 'What it may generally mean' },
    noDiagnosis: {
      bn: 'এটি রোগ নির্ণয় নয় — একটি মাত্র মান দিয়ে রোগ বলা যায় না।',
      en: 'This is not a diagnosis — one value alone cannot diagnose a disease.',
    },
  },
  admin: {
    accessDenied: {
      bn: 'আপনার এই পাতায় যাওয়ার অনুমতি নেই। এই ড্যাশবোর্ড শুধু মালিকের জন্য।',
      en: 'You do not have permission to view this page. This dashboard is for the owner only.',
    },
    homeTitle: { bn: 'অ্যাডমিন ড্যাশবোর্ড', en: 'Admin dashboard' },
  },
} as const;

export function t(lang: Lang, entry: { bn: string; en: string }): string {
  return entry[lang];
}
