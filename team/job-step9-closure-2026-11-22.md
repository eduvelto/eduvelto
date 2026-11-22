# চাকরির প্রস্তুতি — Full Exam + Model Test Engine (Step 9, CLOSURE)

- তারিখ: ২২ নভেম্বর ২০২৬, ~১২:০০–১২:৩০ Asia/Dhaka
- ব্রাঞ্চ: `jobs/section-structure`, HEAD `e5d3dce` (pushed)
- ওয়ার্কট্রি: `~/workspace/eduorbit/phase2-project-jobs`
- স্ট্যাটাস: **স্টেজিংয়ে সম্পূর্ণ — ১৪/১৪ চেকলিস্ট**। মার্জ / প্রোডাকশন ডিপ্লয় হয়নি —
  মালিকের আলাদা অনুমোদন লাগবে (প্যারেন্টের মাধ্যমে)।

## সারসংক্ষেপ

Step 9-এর কোর + ChatGPT ফোল্ড-ইন আগেই সম্পূর্ণ ছিল (৬২ead০৩; USED ১৩ / ADAPTED ৫ /
REJECTED ১)। ক্লোজারে বাকি ছিল দুটি চেকলিস্ট আইটেম — (ক) অডিট লগিং, (খ) ক্লোজার
সাইন-অফ — আর Job+Admission ফ্রন্ট-এন্ড অডিটের (২২ নভে ~১৭:৫৮) Step 9 প্রিভিউতে
পাওয়া ৮টি ডিফেক্ট + ৫টি নিট। এই ক্লোজারে সব ঠিক করা হয়েছে, ৫টি খোলা প্রশ্নের
সিদ্ধান্ত প্রমাণসহ রেকর্ড করা হয়েছে, আর বাস্তব কন্টেন্ট দিয়ে E2E চালানো হয়েছে
(Step 8-এর finding #8)।

## সম্পূর্ণ (Completed) — ক্লোজার কমিট

| কমিট | বিষয় |
|---|---|
| `42102cf` | lib + rules: টপিক লেবেল, সময় ক্ল্যাম্প, মেয়াদোত্তীর্ণ রিজিউম ফিল্টার, definition/manifest ক্রস-চেক, অডিট লগিং, অ্যাঙ্করড রিসিট re-issue |
| `c5bac7c` | UI: অডিটের D1–D8 + N1–N5 ঠিক করা |
| `8e05d64` | টেস্ট: রিসিট re-issue e60–e66, অডিট লগ e67–e72, রিটেক i9, লেবেল/ক্ল্যাম্প/মেয়াদ/অডিট ইউনিট টেস্ট |
| `e5d3dce` | টেস্ট: বাস্তব-কন্টেন্ট E2E i10 |

## চেকলিস্ট — ১৪/১৪

1. ✅ Mock session create + lock (batch, manifest order) — আগেই ছিল
2. ✅ Deadline (stored `startedAt` থেকে exact, nanos-সহ) — আগেই ছিল
3. ✅ Autosave (revision-গার্ড, ২ বার রিট্রাই — D8)
4. ✅ Submit flow Design G (session + lock → receipt → key → score → attempt) — আগেই ছিল
5. ✅ Receipt ১০-মিনিট উইন্ডো + অ্যাঙ্করড re-issue (খোলা প্রশ্ন ১ — নিচে দেখুন)
6. ✅ Negative marking: BCS −০.৫০, Bank DISABLED (provisional −০.২৫ কখনো স্কোর করে না), Primary −০.২৫, NTRCA −০.২৫
7. ✅ ফলাফল লেবেল: সবসময় "অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়", `resultLabel: 'practice'`, `trustLevel: 'unverified'`, `submissionIntegrity: 'client_calculated'` — কখনো "Verified" নয়
8. ✅ Weak topics + ভুল প্রশ্নের তালিকা (স্টোর করা উত্তরের থেকে পুনঃনির্মিত)
9. ✅ Retake + idempotent retry (স্টোর করা attempt ফেরত দেয়, পুনঃগণনা নয়) — i9
10. ✅ Daily/weekly mock (২৫Q/২৫মিনিট, চক্র-লেবেল "পরিকল্পনা:") — D3/D5
11. ✅ **অডিট লগিং (এই ক্লোজারে যোগ)** — `src/lib/jobExamAudit.ts`: `mock_started` /
    `mock_submitted` / `mock_abandoned` / `mock_submit_failed`, best-effort (কখনো throw করে
    না, ফ্লো আটকায় না), কোনো উত্তর/স্কোর/PII নেই; rules: `users/{uid}/jobExamAuditLogs`
    — মালিকের create (আকৃতি + trusted timestamp), মালিক/Moderator read, update নেই,
    Admin-শুধু delete। টেস্ট: ইউনিট ৭টি + rules e67–e72।
12. ✅ ফ্রন্ট-এন্ড অডিটের D1–D8 + N1–N5 ঠিক (নিচে ফোল্ড-ইন দেখুন)
13. ✅ বাস্তব-কন্টেন্ট E2E (নিচে দেখুন)
14. ✅ **ক্লোজার সাইন-অফ — এই রিপোর্ট**

## ফ্রন্ট-এন্ড অডিট ফাইন্ডিং — ফোল্ড-ইন (২২ নভে ~১৭:৫৮, coordinator 21358764)

সব ৮টি ডিফেক্ট + ৫টি নিট ঠিক করা হয়েছে (USED ১৩ / ADAPTED ০ / REJECTED ০ — অডিটের
প্রতিটি ফাইন্ডিং গৃহীত হয়েছে; কোনোটি বাতিল হয়নি):

- **D1 (MEDIUM, প্রথমে ঠিক)** — "নতুন করে শুরু করুন" বোতাম কখনো সফল হতে পারত না
  (চলমান সেশনের লাইভ লক থাকলে `startMockSession` throw করে, অথচ abandon-এর পথ ছিল না)।
  এখন: resume-ই ডিফল্ট; নতুন শুরুর বোতাম "আগেরটি বাতিল করে নতুন শুরু করুন" — confirm
  ("আগের মকটি বাতিল করবেন?")-এর পেছনে abandon, তারপর start।
- **D2** — JobMockTab + /jobs/common daily/weekly কার্ড এখন সাইন-আউট দর্শকের জন্যও
  প্রকাশিত মক লোড করে (rules-এ `jobExamDefinitions` published-read-এ sign-in লাগে না);
  শুধু শুরু করতে sign-in লাগে।
- **D3** — হাব home-tab মক/মডেল-টেস্ট কার্ড + results tab (নতুন `JobHubResultsTab`) এবং
  /jobs/dashboard daily/weekly কার্ড এখন ডেটা-চালিত (প্রকাশিত মক / আসল attempt);
  weekly চক্রের লেবেল "পরিকল্পনা:"।
- **D4** — ড্যাশবোর্ডের results + weak-topics কার্ড ছাত্রের আসল attempt পড়ে।
- **D5** — daily কপিতে Bank দিবসের নাম, negative marking বন্ধ (circular pending),
  ৯ টপিকের ~৯ দিনের rotation।
- **D6** — /jobs/common progress কার্ড আসল mock ইতিহাস + weak topics পড়ে।
- **D7** — ফলাফলের weak topics এখন কাঁচা topic-ID slug নয় — `jobTopicLabelBn`
  (`bcs__english__grammar__tense` → "English — Grammar — Tense")। কোনো jobTopics
  নাম-সোর্স ডিস্কে নেই (Step 6-এ ০টি topic doc সিড করা হয়েছে, শুধু ২৩টি draft
  subject) — তাই এটি স্থানীয় humanizer; Moderator-তৈরি topic doc থাকলে সেটি পড়বে।
- **D8** — autosave ব্যর্থ হলে এখন ২ বার রিট্রাই হয় (৫ সেকেন্ড ব্যবধানে); লেবেল শুধু
  তখনই রিট্রাইয়ের প্রতিশ্রুতি দেয় যখন রিট্রাই বাকি আছে।
- **N1** — ফুটারে Bangla পরীক্ষার নাম, slug নয়। **N2** — resumable লাইনে আসলে সেভ
  হওয়া উত্তরের সংখ্যা। **N3** — intro pattern লাইনে bundle-এর আসল question count
  (override প্যারামিটার)। **N4** — মেয়াদোত্তীর্ণ সেশন আর resume-এর জন্য দেওয়া হয় না
  (`isMockSessionExpired`)। **N5** — weak-topics খালি কপি শূন্য-উত্তরের attempt আর
  সব-সঠিক attempt আলাদা করে।

## খোলা প্রশ্নের সিদ্ধান্ত (প্রমাণসহ)

1. **রিসিট উইন্ডোর পরে retake** — **IMPLEMENTED: অ্যাঙ্করড re-issue**। প্রমাণ:
   `jobReceipts`-এ `allow update: if false` ছিল, তাই retake-এর `setDoc` DENIED হতো আর
   পুরোনো রিসিট প্রথম উইন্ডো বন্ধের পর প্রতিটি retake submit ব্যর্থ করত। এখন update
   rule শুধু অনুমতি দেয় যখন re-issue নতুন করে সাবমিট করা SAME bundle-এর session/attempt-এ
   re-anchor করে, fresh `createdAt`-সহ; `userId`/`bundleId` অপরিবর্তনীয়; নীরব মেয়াদ
   বাড়ানো হয় না। টেস্ট: e60–e66 + i9 (retake submit সফল, রিসিট নতুন সেশনে re-anchor)।
   রিসিট মডেল নীরবে বদলানো হয়নি — এই সিদ্ধান্তই রেকর্ড।
2. **রিসিট-delete নীতি** — **অপরিবর্তিত: Admin-শুধু delete**।
3. **timeSpentSeconds সীমা** — **lib-এ ক্ল্যাম্প, rules-এ শুধু ≥ ০**। প্রতি-উত্তর সময়
   mock duration + ৬০s-এ ক্ল্যাম্প হয়, কখনো throw করে না; মোট সময় wall-clock
   (`submittedAt − startedAt`) থেকে আসে; সময় স্কোরে কোনো প্রভাব ফেলে না — তাই
   প্রতি-উত্তর স্ফীতি শুধু analytics-এর বিষয়। (ইউনিট টেস্টে ধরা পড়েছে: মোট সময়
   প্রতি-উত্তর সময়ের যোগফল নয়, wall-clock।)
4. **definition বনাম manifest questionCount** — **lib-এ start-এ cross-check, fail fast**;
   rules-এ করা যায় না (definition আর manifest Moderator যেকোনো ক্রমে বানাতে পারেন)।
5. **প্রতি-প্রশ্ন versioned doc-ID** — **বানানো হয়নি**; `bundleVersion` + manifest
   version-ই freeze unit থাকে (Step 9 (f) ADAPTED সিদ্ধান্তের সঙ্গে সামঞ্জস্যপূর্ণ);
   ভবিষ্যৎ content-versioning-এ স্থগিত।

## যাচাই-প্রমাণ (Verification evidence)

- **Unit: ৩৫০/৩৫০ PASS** (১১ ফাইল) — নতুন: `jobTopicLabelBn` (২), সময়-ক্ল্যাম্প (১),
  `isMockSessionExpired` (৩), `jobExamAudit` (৭)।
- **Rules: ৭৭৩/৭৭৩ PASS** (১৮ ফাইল) — আগের ৭৫৬ + নতুন ১৭ (e60–e66a/b/c = ৯,
  e67–e72 = ৬, i9 + i10 = ২)। `tsc` clean, build PASS।
- **Preview:** https://eduvelto--step9-closure-2dddy980.web.app (মেয়াদ ২৯ নভে ১২:১৫ UTC) —
  ৭/৭ রুট 200 (`/`, `/jobs`, `/jobs/common`, `/jobs/dashboard`, `/jobs/bcs`,
  `/admissions`, `/library`); লাইভ index bundle md5 dist-এর সঙ্গে হুবহু মিল
  (`index-Do6zD9yo.js`); ৪টি Step 9 পেজ-চাঙ্ক (JobMockPage, JobHubPage,
  JobsCommonPage, JobSeekerDashboardPage) লাইভ md5 dist-এর সঙ্গে হুবহু মিল; D1-এর
  abandon-behind-confirm কপি ("আগেরটি বাতিল করে নতুন শুরু করুন" + "আগের মকটি বাতিল
  করবেন?") লাইভ JobMockPage চাঙ্কে আছে; D3-এর শর্তাধীন "মক টেস্ট দেখুন →" লিঙ্ক
  লাইভ JobHubPage চাঙ্কে আছে; "পরিকল্পনা:" লাইভ index-এ আছে।
- **Stale "coming soon" পরীক্ষা:** ঠিক করা পেজগুলোতে মকের জন্য কোনো stale
  "শীঘ্রই আসছে" নেই। বাকি ব্যাজগুলো শর্তাধীন — শুধু সত্যিকারের খালি অবস্থায়
  (কোনো attempt নেই) বা এখনো না-বানানো ধাপে (ভাইভা — Step 16, প্ল্যানার — Step 12)।

## বাস্তব-কন্টেন্ট E2E (Step 8 finding #8)

- **লাইভ consistency (read-only, ২২ নভে ~১২:১৯): PASS — ০ সমস্যা।** লাইভ Firestore-এ
  `jobQuestions`-এ ৩৫টি BCS English প্রশ্ন Published; ১৩টি topic bundle + ১৩টি key
  Published; প্রতিটি bundle-এর source ID প্রকাশিত প্রশ্নের মধ্যে আছে, প্রতিটি key-এর
  উত্তর bundle-এর প্রশ্নের সঙ্গে মেলে, bundle-এ key-উপাদান লিক নেই।
- **Emulator E2E (i10): PASS।** লাইভ BCS English batch 1 draft থেকে ৩টি VERBATIM প্রশ্ন
  (bcs-eng-001/002/003 — প্রশ্ন, অপশন, সঠিক অক্ষর, ব্যাখ্যা হুবহু কপি, কিছুই বানানো
  নয়) দিয়ে ৩-প্রশ্নের মক fixture: session + lock → deadline → autosave → submit →
  receipt → key read → score → attempt create → read-back। উত্তর C/A/B (Q1 সঠিক,
  Q2 সঠিক, Q3 ভুল) → **score ১.৫, correct ২, wrong ১, deduction ০.৫**, weak topic
  `bcs__english__grammar__tense` ১/৩, লেবেল practice/unverified, স্টোর করা attempt
  থেকে ফলাফল পুনঃনির্মিত হয়।

## সৎ ফাঁক / করা হয়নি (Honest gaps)

- **লাইভে কোনো প্রকাশিত mock definition/manifest নেই** (`jobExamDefinitions` ০টি,
  `jobQuestionSetManifests` ০টি — লাইভ চেকে নিশ্চিত)। তাই লাইভে আসল ছাত্র এখনো মক
  দিতে পারে না — এটি Moderator-এর ডেটা-কাজ, কোডের ফাঁক নয়। E2E emulator-এ বাস্তব
  প্রশ্নের fixture দিয়ে হয়েছে; প্রোডাকশনে প্রথম আসল মক চালাতে definition +
  manifest প্রকাশ করতে হবে।
- **Rendered চেক হয়নি** — sandbox proxy ২২ নভে ~১৪:২৬ থেকে ডাউন; Playwright রেন্ডার
  যাচাই সম্ভব হয়নি। সাইন-ইন ক্লিক-থ্রু-ও হয়নি — ব্রাউজার টাস্ক প্যারেন্টের
  ব্যবস্থা করতে হবে।
- **Merge overlap সতর্কতা:** main এখন `8b7e4b0` (front-ends অডিটের JobsCommonPage,
  JobHubPage, JobSeekerDashboardPage ঠিক করা)। এই ব্রাঞ্চের একই ফাইলের ঠিক করা
  merge-এ conflict করবে — প্যারেন্টকে সমাধান করতে হবে।
- **Preview চ্যানেল কোটা:** ~৫০টি চ্যানেল আছে; পরের preview-ভারী দিনের আগে
  পুরোনো চ্যানেল পরিষ্কারের পাস বাকি।
- Scores এখনো client-calculated (সার্ভার-সাইড পুনঃগণনায় Blaze লাগে — Step 7-এর
  সীমা, অপরিবর্তিত); তাই ফলাফল কখনো "Verified" নয়।

## Step 10-এর হস্তান্তর (Handover)

- Step 9 স্টেজিংয়ে বন্ধযোগ্য — মার্জ + প্রোডাকশন ডিপ্লয়ের জন্য মালিকের আলাদা
  অনুমোদন লাগবে (প্রতিটি নিজের আলাদা অনুরোধে)।
- মার্জের আগে main `8b7e4b0`-র সঙ্গে rebase + conflict সমাধান (উপরে দেখুন) + পুনঃযাচাই।
- ডিপ্লয়ের পর Moderator-কাজ: প্রথম mock definition + manifest প্রকাশ (BCS English
  ব্যাংক থেকে), তারপর লাইভে আসল ছাত্রের মক পরীক্ষা।
- এই রিপোর্ট: `team/job-step9-closure-2026-11-22.md`।

## ফাইল-তালিকা (Files)

- `src/lib/jobEngine.ts` — `jobTopicLabelBn`, `scoreMockAttempt` ক্ল্যাম্প
- `src/lib/jobMock.ts` — `isMockSessionExpired`, `startMockSession` ক্রস-চেক
- `src/lib/jobExamAudit.ts` — নতুন (অডিট লগ builder/validator)
- `firestore.rules` — `validJobReceiptAnchor` (শেয়ার করা), re-issue update rule,
  `jobExamAuditLogs` match
- `src/pages/JobMockPage.tsx`, `src/pages/JobHubPage.tsx`,
  `src/pages/JobsCommonPage.tsx`, `src/pages/JobSeekerDashboardPage.tsx`,
  `src/components/JobHubResultsTab.tsx` (নতুন) — D1–D8 + N1–N5
- `emulator-tests/rules-step9-full-exam.test.ts` — e60–e72
- `emulator-tests/rules-step9-full-exam-integration.test.ts` — i9, i10
- `src/lib/__tests__/jobEngine.test.ts`, `jobMockEngine.test.ts`, `jobExamAudit.test.ts`
  (নতুন)
