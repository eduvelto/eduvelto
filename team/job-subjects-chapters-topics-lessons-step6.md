# চাকরির প্রস্তুতি — Subject, Chapter, Topic and Lesson System (Step 6)

**তারিখ:** ২২ নভেম্বর ২০২৬ ~১০:০০–১১:৩০ Asia/Dhaka · **ধরন:** বাস্তবায়ন রিপোর্ট — কোড + নিয়ম + পরীক্ষা + স্টেজিং প্রিভিউ
**পরিসর:** Job Preparation সেকশন ONLY · **ব্রাঞ্চ:** `jobs/section-structure`
**ভিত্তি:** `team/job-ui-ux-design-step2.md` §২.২, §২.৩, §৬.২ #৩–#৬ · `team/job-architecture-schema-step3.md` §২.৩–§২.৬, §৩.৪ (খসড়া — বিচ্যুতি নিচে)
**বাজেট:** ৳০ — কোনো পেইড সার্ভিস নয় · **মার্জ/প্রোডাকশন ডেপ্লয়:** হয়নি (স্টেজিং প্রিভিউ মাত্র) · **লাইভ ডাটাবেস:** ছোঁয়া হয়নি (শুধু এমুলেটর + ডিস্কের সিড)
**অবস্থা:** **Step 6 বন্ধ (CLOSED)** — ChatGPT পরামর্শ এসেছে (২২ নভেম্বর ২০২৬ ~১১:২০, verdict "APPROVE WITH CHANGES REQUIRED") ও ফোল্ড-ইন সম্পূর্ণ (নিচে "ChatGPT পরামর্শের ফোল্ড-ইন" দেখুন)। **মার্জ/প্রোডাকশন ডেপ্লয়:** হয়নি (স্টেজিং প্রিভিউ মাত্র) · **লাইভ ডাটাবেস:** ছোঁয়া হয়নি (শুধু এমুলেটর + ডিস্কের সিড)

---

## সারসংক্ষেপ

৪টি নতুন কালেকশন (`jobSubjects`, `jobChapters`, `jobTopics`, `jobLessons`) — স্কিমা + Firestore নিয়ম + পরীক্ষা; ৪টি যাচাইকৃত পরীক্ষার ২৩টি বিষয়ের প্রামাণিক তালিকা (`src/lib/jobContent.ts` — যাচাইকৃত `rulesConfig`-এর বিষয়-তালিকা থেকে হুবহু, কোনো বানানো বিষয় নয়); Subjects ট্যাব এখন আসল বিষয়ের কার্ড দেখায়; বিষয়-পাতা (`/jobs/:exam/subjects/:subject`) ও টপিক-পাতা (`/jobs/:exam/subjects/:subject/:topic`) তৈরি — দুটোতেই সৎ খালি অবস্থা (কোনো অধ্যায়/টপিক/লেসন এখনো নেই, ০ যাচাইকৃত শিক্ষক); সিড JSON ডিস্কে প্রস্তুত (২৩টি খসড়া বিষয়-ডক; অধ্যায়/টপিক/লেসন খালি) + প্রয়োগকারী — এমুলেটরে প্রয়োগ করে যাচাই করা হয়েছে (২৩টি তৈরি, ০ ভুল, read-back ০ অমিল), লাইভে প্রয়োগ হয়নি।

**প্রিভিউ:** https://eduvelto--step6-job-content-ocf27s2v.web.app (মেয়াদ শেষ ২৯ নভেম্বর ২০২৬ ০৪:৫৮ UTC)

---

## সম্পূর্ণ (Completed)

1. **Firestore নিয়ম — ৪টি কালেকশন** (`firestore.rules`, +৩৫৫ লাইন): `jobSubjects` / `jobChapters` / `jobTopics` / `jobLessons` — প্রতিটিতে পড়া (`status == 'published'` বা লেখক বা Moderator — Step 5-এর e5-পাঠ: তালিকা-কোয়েরি `status`-এ ফিল্টার করে বলে প্রকাশ-যাচাই `status` দিয়ে), তৈরি (শুধু `isTeacher()` — যাচাইকৃত শিক্ষক/Admin/Moderator/Owner; খসড়া মাত্র — `status: 'draft'` + `reviewStatus: 'Not Started'`; `authorId` লেখকের সঙ্গে পিন করা বা অনুপস্থিত; `verifiedBy`/`verifiedAt` null বাধ্য — নতুন খসড়ায় নিজের যাচাই বসানো যায় না), হালনাগাদ (৩টি নিয়ম — লেখকের নিজের খসড়া-সম্পাদনা, Moderator, Admin; `affectedKeys` allowlist; `authorId`/`createdBy`/`createdAt` অপরিবর্তনীয় — Admin-ও নয়), মোছা (শুধু Admin)। **দ্বিতীয়-চোখের নিয়ম** (`jobContentSecondEye`): যাচাইকারী কখনো লেখক নয়; প্রকাশ করতে হলে আসল যাচাইকারী (লেখক নয়) + যাচাইয়ের timestamp বাধ্য — শিক্ষকের রিভিউ ছাড়া কিছু Published নয়। Moderator Published ডকের কনটেন্ট চুপচাপ বদলাতে পারে না (শুধু অবস্থা/যাচাইকারী ক্ষেত্র); Admin Published ডকের টাইপো ঠিক করতে পারে (আনপাবলিশ না করে)। ডক-ID আকৃতি নিয়মে বাধ্য (`{exam}__{subject}`, `{exam}__{subject}__{chapter}`, `{exam}__{subject}__{topic}`)। `examSlug: 'it-professional'` চারটি যাচাই-ফাংশনেই নিষিদ্ধ (পরিসর অনির্ধারিত — Step 6 হস্তান্তর #৪)।
2. **প্রামাণিক বিষয়-তালিকা** (`src/lib/jobContent.ts` — নতুন): শুধু ৪টি যাচাইকৃত পরীক্ষার ২৩টি বিষয় — BCS ১০টি (নম্বরের যোগফল ২০০), ব্যাংক ৫টি (১০০), প্রাথমিক ৪টি (৯০), NTRCA ৪টি (১০০)। `JOB_SUBJECTS` যাচাইকৃত `JOB_RULES_CONFIGS` থেকে প্রোগ্রাম-দ্বারা তৈরি (শুধু slug-টেবিল এখানে) — নাম/নম্বর/উৎস কখনো যাচাইকৃত কনফিগ থেকে সরতে পারে না; পরীক্ষায় প্রামাণিক তালিকার সঙ্গে deep-match দিয়ে পিন করা। হেল্পার: `jobSubjectsForExam()` (বিষয় না থাকলে খালি অ্যারে — কখনো throw নয়), `jobSubjectById()` (`{exam}__{subject}`), `jobSubjectSyllabusReady()` (শুধু ৪টি যাচাইকৃত পরীক্ষায় true — ব্যাংকসহ: তার বিষয়-তালিকা যাচাইকৃত, `patternStatus: 'not_verified'` স্কোরিং-কর্তৃত্বের কথা, বিষয়ের নয়; IT + ১০টি null-কনফিগ পরীক্ষায় false), `validateJobContentTaxonomy()` / `...Against()` (IT-র অধীনে বিষয়, null-কনফিগ পরীক্ষার অধীনে বিষয়, ডুপ্লিকেট slug, নম্বরের যোগফল ভুল, ক্রমে ফাঁক, উৎস অনুপস্থিত — সব ক্ষেত্রে ব্যর্থ হয়), রিভিউ-অবস্থা হেল্পার (`isDraftJobContentReviewState` — ঠিক ৩টি খসড়া-অবস্থা; `'Published'`, আক্ষরিক `'draft'`, খালি, অনুপস্থিত প্রত্যাখ্যান করে), `JobCommonStatus` (`preliminary` | `verified`), `JobLessonType` (৫টি মান — Step 6-এ শুধু `'lesson'` তৈরি করা যায়: `JOB_STEP6_LESSON_TYPES`)।
3. **সিড + প্রয়োগকারী** (`team/job-content-seed.json`, `scripts/apply-job-content-seed.mjs` + `.d.mts`): ২৩টি `jobSubjects` ডক (সব `status: 'draft'`, `reviewStatus: 'Not Started'`, `authorId` null, `verifiedBy`/`verifiedAt` null, `createdBy: 'seed'`, `configVersion: '2026-11-22.1'`, `applicableCycle` — NTRCA-তে `'18th'`, বাকি null); `jobChapters`/`jobTopics`/`jobLessons` খালি অ্যারে — কোনো বানানো অধ্যায়/টপিক/লেসন নেই (`_meta`-তে কারণ লেখা আছে; `_meta.version = '2026-11-22.1'`)। প্রয়োগকারী **দ্বিতীয় স্ক্রিপ্ট** (Step 5-এর `apply-job-seed.mjs`-এর সম্প্রসারণ নয় — সিদ্ধান্ত নিচে): এমুলেটর-মাত্র (`--live` পথ নেই), dry-run, স্থির ডক-ID, idempotent, `--allow-modify` গেট, `createdAt` একবারই, স্কিমা + রেফারেন্স যাচাই (ডক-ID == `examSlug__slug`, নম্বরের যোগফল বনাম `questionCount`, `syllabusSource` বাধ্য), সব-খসড়া গার্ড, অডিট ফাইল, প্রয়োগ-পরবর্তী read-back; **ফোল্ড-ইন (P1-06/P2-02/P2-04):** loopback-মাত্র গার্ড + live probe, `_meta.version` drift-যাচাই, audit-এ `seedVersion`/`configVersion`/`seedSha256`। **এমুলেটরে প্রয়োগ করে যাচাই করা হয়েছে** (নিচে "পরীক্ষিত" দেখুন — ফোল্ড-ইনের পর পুনঃপ্রয়োগ ২৩/২৩) — লাইভে প্রয়োগ হয়নি, আলাদা অনুমোদন লাগবে।
4. **UI — Subjects ট্যাব + বিষয়/টপিক পাতা** (`src/pages/JobHubPage.tsx`, `src/App.tsx`, নতুন `src/pages/JobSubjectPage.tsx`, `src/pages/JobTopicPage.tsx`): Subjects ট্যাবে প্রামাণিক বিষয়ের কার্ড-গ্রিড (নাম, বাংলায় নম্বর — যেমন "৩৫ নম্বর", টপিক-সংখ্যা ০ → "শীঘ্রই আসছে" চিপ, বিষয়-পাতার লিংক); বিষয়-পাতায় ব্রেডক্রাম্ব (হাব ← বিষয়), শিরোনাম + নম্বর + "উৎস: …" লাইন (lib-এর `syllabusSource` হুবহু — সার্কুলার নম্বর/তারিখ বানানো হয়নি), খালি টপিক-তালিকা + "এই বিষয়ে আমার অগ্রগতি" কার্ড (০/০ — সৎ সংখ্যা)। টপিক-পাতা: কোনো টপিক নেই বলে সৎ খালি অবস্থা + অনুশীলন অনুপলব্ধ ("প্রশ্ন তৈরি হলে এখানে অনুশীলন শুরু করা যাবে" — বোতাম/প্রবাহ নেই; অনুশীলন Step 7/8-এর)। অজানা exam/subject/topic slug → "পাওয়া যায়নি" অবস্থা + ফেরার লিংক; কাঁচা URL-slug কখনো শিরোনাম হিসেবে দেখানো হয় না। IT-তে Subjects ট্যাবে পরিসর-নোট (কোনো বিষয়-তালিকা নয়); অন্য ৯টি null-কনফিগ পরীক্ষায় "বিষয় তালিকা তৈরি হচ্ছে" খালি অবস্থা। সব লেখা বাংলা; পড়ার পথ হার্ডকোড করা lib-ই (Firestore-এ বদলানো হয়নি — সিদ্ধান্ত ১)।
5. **নতুন পরীক্ষা:** নিয়ম-পরীক্ষা ১২৭টি (`emulator-tests/rules-step6-job-content.test.ts` — ৯টি describe: তৈরি-ভূমিকা c1–c20, ক্ষেত্র-যাচাই v1–v17, isCommon/lessonType/body t1–t14, খসড়া-বিচ্ছিন্নতা e1–e20, লেখক-মালিকানা o1–o14, প্রকাশ-গেট p1–p22, Moderator/Admin-হালনাগাদ + ছাত্র/বেনামি-লেখা u1–u6, মোছা d1–d9, status/reviewStatus-সঙ্গতি s1–s5); ইউনিট-পরীক্ষা ৫১টি নতুন (`jobContent` ৩৬ + `jobContentSeedImporter` ১৫)। **c20 ও o14 সমন্বয়কারীর যোগ করা পরীক্ষা** (উপরে দেখুন)। **e3/e7 উল্টানো + e15–e20 নতুন** — বেনামি-অ্যাক্সেস বাতিল (মালিকের নির্দেশ ~১০:৩৩; উপরে "বেনামি অ্যাক্সেস বাতিল" দেখুন)।

## সিদ্ধান্ত (Decisions — Step 3 খসড়া থেকে বিচ্যুতি সহ)

| # | সিদ্ধান্ত | কারণ |
|---|---|---|
| ১ | **পড়ার পথ Firestore-এ বদলানো হয়নি** — UI হার্ডকোড করা প্রামাণিক তালিকা (`jobContent.ts`) থেকেই পড়ে; সিড ডিস্ক-মাত্র | লাইভ Firestore-এ `jobSubjects` ডকুমেন্ট নেই, আর সেগুলো লেখার অ্যাডমিন UI-ও নেই (Step 15) — এখন বদলালে প্রিভিউতে Subjects ট্যাব খালি দেখাত। সিড হলো ভবিষ্যৎ বদলের Firestore-প্রস্তুত রূপ; বদল + প্রয়োগ — আলাদা অনুমোদন লাগবে (Step 5-এর সিদ্ধান্ত ১-এর ধারাবাহিকতা) |
| ২ | `reviewStatus` শব্দভাণ্ডার Step 5-এর enum (`Not Started` / `In Progress` / `Under Review` / `Published`) + আলাদা `status` ক্ষেত্র (`draft` / `published`) — খসড়ার `'draft'` / `'in-review'` / `'verified'` মানগুলো নেই | Step 5-এর P1-1 স্পষ্টকরণ (status = প্রকাশ-অবস্থা, reviewStatus = রিভিউ-কাজ) এই ধাপেও প্রযোজ্য; খসড়ার শব্দভাণ্ডার Step 5-এর enum-এর সঙ্গে মেলে না; খসড়ার `isJobDraftStatus()` / `jobContentRead()` / `jobContentCreate()` / `jobContentUpdate()` হেল্পার পুনঃব্যবহার করা হয়নি (নাম Step 5-এর অর্থের সঙ্গে সংঘাত করত) |
| ৩ | তৈরিতে বিষয়/অধ্যায়/টপিকের `nameBn`, লেসনের `titleBn` — খসড়ার blanket `titleBn` নয় | খসড়ার `jobContentCreate()` সব কালেকশনে `titleBn` চেয়েছিল — বিষয়/অধ্যায়/টপিকের ক্ষেত্রের নাম `nameBn` (§২.৩–§২.৫); প্রতিটি কালেকশনের নিজের যাচাই-ফাংশন আছে |
| ৪ | লেখক নিজের খসড়া সম্পাদনা করতে পারে (খসড়া-অবস্থার ভেতরে) — Step 5-এর jobExams নিয়মে লেখকের লেখা ছিল না | Step 3-এর খসড়া (`jobContentUpdate`) এটাই বলে; কনটেন্ট কালেকশনে খসড়ার ধারা অনুসরণ করা হয়েছে। সীমা: লেখক শুধু নিজের খসড়া, শুধু খসড়া-অবস্থার ভেতরে, প্রকাশ করতে পারে না, Published ডক ছুঁতে পারে না, `verifiedBy` বসাতে পারে না |
| ৫ | প্রকাশ Moderator + Admin দুজনেই করতে পারে (Step 5-এর jobExams-এ শুধু Admin) — দ্বিতীয়-চোখের নিয়মই রক্ষক | jobExams-এর Admin-মাত্র প্রকাশ `rulesConfig` রক্ষার জন্য ছিল — এই কালেকশনে `rulesConfig` নেই। খসড়ার যাচাই-প্রবাহ (Moderator/Admin প্রকাশ/ফেরত/প্রত্যাখ্যান) + দ্বিতীয়-চোখের নিয়ম (যাচাইকারী ≠ লেখক; প্রকাশে আসল যাচাইকারী + timestamp বাধ্য) একসাথে রক্ষা করে। Moderator নিজের লেখা প্রকাশ করতে পারে না (p9 দিয়ে পিন করা) |
| ৬ | Step 6-এ লেসন তৈরি শুধু `lessonType == 'lesson'` — ভাইভা/ক্যারিয়ার/CV গাইড Step 16-এর | Step 3 §২.৬: "ধাপ Step 6 (মূল লেসন), Step 16 (ভাইভা/ক্যারিয়ার/CV কনটেন্ট)"। enum-এ ৫টি মানই আছে; `lessonType` হালনাগাদে পিন করা — `'lesson'` ডককে update দিয়ে Step 16 কনটেন্টে বদলানো যায় না |
| ৭ | দ্বিতীয় সিড-প্রয়োগকারী (`apply-job-content-seed.mjs`), Step 5-এর স্ক্রিপ্টের সম্প্রসারণ নয় | Step 5-এর স্ক্রিপ্ট ঠিক একটি সিডের (ক্যাটাগরি + পরীক্ষা) জন্য লেখা — নিজের স্কিমা, কালেকশন, `rulesConfigHistory`-হ্যান্ডলিংসহ। সম্প্রসারণ করলে দুই-স্কিমা dispatch দিয়ে প্রথম স্ক্রিপ্টটি অস্পষ্ট হতো। এক স্ক্রিপ্ট = এক সিড — দুটোই পাঠযোগ্য থাকে। নতুন স্ক্রিপ্ট Step 5-এর generic pure হেল্পার (`canon`, `compareDoc`, `seedDocFields`) import করে পুনঃব্যবহার করে; শুধু ছোট REST-অংশটি আলাদা |
| ৮ | বিষয়-তালিকা `JOB_RULES_CONFIGS` থেকে প্রোগ্রাম-দ্বারা তৈরি — হাতে লেখা কপি নয় | একটিমাত্র সত্যের উৎস: নাম/নম্বর/উৎস যাচাইকৃত কনফিগ থেকে সরতে পারে না; পরীক্ষায় প্রামাণিক তালিকার সঙ্গে deep-match দিয়ে পিন করা। Bank-এর বিষয়-তালিকা যাচাইকৃত বলে `jobSubjectSyllabusReady('bank')` true — তার `patternStatus: 'not_verified'` স্কোরিং-কর্তৃত্বের কথা, বিষয়ের নয় |
| ৯ | অধ্যায়/টপিক/লেসন সিডে খালি — কোনো বানানো কনটেন্ট নেই | ডিস্কে কোনো যাচাইকৃত অধ্যায়/টপিক-তালিকা নেই; ০ যাচাইকৃত শিক্ষক। কমন-টপিক ম্যাপ প্রাথমিক অনুমানই আছে (Step 2 §২.৪) — কোনো টপিক "নিশ্চিত কমন" বলে দাবি করা হয়নি; শুধু `isCommon`/`commonStatus` টাইপ সংজ্ঞায়িত হয়েছে |
| ১০ | Admin Published ডকের টাইপো ঠিক করতে পারে (আনপাবলিশ না করে); Moderator পারে না | Moderator-এর Published-ডক গার্ড (Step 5 P0-4-এর অভিযোজন: Published কনটেন্ট চুপচাপ বদলানো যাবে না) — Admin-এর ক্ষেত্রে শিথিল, কারণ টাইপো ঠিক করতে আনপাবলিশ-প্রকাশ চক্র অপ্রয়োজনীয়; দ্বিতীয়-চোখের নিয়ম ও `affectedKeys` allowlist তখনো প্রযোজ্য |
| ১১ | লেখকের হালনাগাদ-নিয়মে `isTeacher()` যাচাই (শুধু `signedIn` + active + `authorId` নয়) | Step 3-এর খসড়ার লেখক-নিয়মে ভূমিকা-যাচাই ছিল না — ভূমিকা বদলে ছাত্র হয়ে যাওয়া একজন প্রাক্তন শিক্ষক নিজের খসড়া সম্পাদনা করতে পারত (নিজের খসড়া মাত্র, অদৃশ্য, প্রকাশ করতে পারে না — ঝুঁকি ছোট, কিন্তু "শুধু Owner/Admin/Verified Teacher" নীতির সঙ্গে মেলে না)। সমন্বয়কারীর কঠোরকরণ (২২ নভেম্বর): ৪টি লেখক-নিয়মেই `isTeacher()` বসানো হয়েছে (Step 5-এর live-role-check ধারা); পরীক্ষা o14 দিয়ে পিন করা (Admin লেখককে ছাত্র বানায় → সম্পাদনা DENIED → ভূমিকা ফিরিয়ে দেওয়া হয়) |

## Step 5 হস্তান্তর — ১০টি সীমা কীভাবে মানা হয়েছে

1. **প্রামাণিক ট্যাক্সোনমি মাত্র** — বিষয় শুধু Step 5-এর ১০ ক্যাটাগরি + ১৪ হাবের ভেতরে; নতুন পরীক্ষা/ক্যাটাগরি যোগ করা হয়নি (নিয়মে `examSlug in jobExamSlugs()` বাধ্য)।
2. **বানানো সিলেবাস নয়** — প্রতিটি বিষয়ের `syllabusSource` যাচাইকৃত pattern-উৎস থেকে; অধ্যায়/টপিক/লেসন বানানো হয়নি (সিড খালি)।
3. **null `rulesConfig` অনুপস্থিতই আছে** — null-কনফিগের ১০টি পরীক্ষায় কোনো বিষয় নেই; `patternStatus` দিয়ে অবস্থা দেখানো হয়।
4. **IT সিলেবাস-তৈরির বাইরে** — `it-professional` নিয়মে নিষিদ্ধ + lib-এ কোনো বিষয় নেই + UI-তে পরিসর-নোট মাত্র; `jobSubjectSyllabusReady('it-professional')` false।
5. **MCQ-মাত্র সীমা** — এই ধাপে কোনো প্রশ্ন/পরীক্ষা-কাঠামো বানানো হয়নি; কোনো লিখিত পরীক্ষা/প্রশ্ন-জমা/মার্কিং আর্কিটেকচার নয়।
6. **অগ্রগতি সংরক্ষণ** — বিষয়/অধ্যায় যোগ/বদলালে বিদ্যমান অগ্রগতি ভাঙবে না; স্থির slug-ID মাত্র (`{exam}__{subject}`); প্রদর্শন-নাম কখনো শনাক্তকারী নয়।
7. **ফলাফল পৃথকীকরণ** — এই ধাপে কোনো ফলাফল-প্রবাহ নেই; অনুশীলন/যাচাইকৃত ফলাফল Step 8/9-এর।
8. **অনুমোদনের সীমা** — ছাত্র কখনো কনটেন্ট তৈরি/সম্পাদনা/প্রকাশ করতে পারে না (নিয়ম-পরীক্ষায় পিন করা); শুধু Owner + অনুমোদিত Admin/Verified Teacher; শিক্ষকের রিভিউ ছাড়া কিছু Published নয় (০ যাচাইকৃত শিক্ষক — সব সিড খসড়া, সব UI খালি অবস্থা)।
9. **স্থির ID** — ডক-ID স্থির slug-ভিত্তিক (`{examSlug}__{subjectSlug}` ইত্যাদি); নিয়মে আকৃতি বাধ্য; প্রদর্শন-নাম কখনো শনাক্তকারী নয়।
10. **উৎস/যাচাই মেটাডেটা** — প্রতিটি বিষয়ে `syllabusSource` + যাচাই-অবস্থা; সার্কুলার কখনো বানানো হয়নি — অফিসিয়াল উৎস মাত্র।

## বেনামি অ্যাক্সেস বাতিল — মালিকের নির্দেশ (২২ নভেম্বর ২০২৬ ~১০:৩৩, BINDING)

Step 6 কোর কমিটের পর (কিন্তু বন্ধের আগে) মালিকের নির্দেশ এসেছে — Step 5 রিপোর্টের সংযোজনে লেখা আছে: **লগইন বা রেজিস্ট্রেশন ছাড়া কেউ পরীক্ষা দিতে পারবে না, বেশি কিছু পড়তে পারবে না** — অতিথি শুধু অল্প প্রিভিউ পায়, তারপর লগইন-দেয়াল। এই নির্দেশ Step 5-এর P2-2 (বেনামি-অ্যাক্সেস, USED) **আংশিকভাবে বাতিল করে**। Step 6-এর জন্য বাধ্যতামূলক অংশটি এখানে বাস্তবায়িত হয়েছে:

**বদলানো হয়েছে (নিয়ম):** `jobSubjects` / `jobChapters` / `jobTopics` / `jobLessons`-এর পড়ার নিয়মে `signedIn()` যোগ করা হয়েছে — Published হলেও বেনামি পড়তে পারে না। চারটি read নিয়ম এখন `signedIn() && status == 'published'` দিয়ে শুরু হয় (লেখক-শাখা ও Moderator-শাখা আগেই সাইন-ইন চেয়েছিল; `jobExams`-এর পড়ার নিয়ম ছোঁয়া হয়নি — তার প্রকাশিত মেটাডেটা বেনামি-পাঠযোগ্যই থাকে, নির্দেশ অনুযায়ী)।

**বদলানো হয়েছে (পরীক্ষা):** e3 ও e7 উল্টানো হয়েছে (বেনামি Published-পড়া / Published-কোয়েরি — আগে ALLOWED ছিল, এখন DENIED); নতুন e15–e20 যোগ করা হয়েছে (বেনামি Published-পড়া ও Published-কোয়েরি — অধ্যায়/টপিক/লেসন, সরাসরি + কোয়েরি দুটোই DENIED)। Step 6 নিয়ম-পরীক্ষা এখন ১২৭টি; পূর্ণ স্যুট ৪৫০/৪৫০।

**বহাল থাকে:** `jobCategories` ও `jobExams`-এর প্রকাশিত মেটাডেটা (নাম/ধরন/নিয়ম-কনফিগ) বেনামি পড়তে পারে; বেনামি তৈরি/বদলাতে পারে না (আগেও ছিল)।

**Step 7-এর জন্য (বাধ্যতামূলক, এই নির্দেশ থেকে):** `jobAttempts` ও `jobQuestionBundles`-এর নিয়ম লেখার সময় সাইন-ইন বাধ্যতামূলক করতে হবে; বেনামি-চেষ্টা/বেনামি-বান্ডেল পরীক্ষা DENIED হতে হবে। প্রশ্ন+অপশন কখনো সাইন-আউট ব্রাউজারে যাবে না।

**UI-প্রশ্ন — সিদ্ধান্ত হয়েছে (ChatGPT ফোল্ড-ইন, নিচে "UI সিদ্ধান্ত" দেখুন):** বিষয়ের নাম + নম্বর public catalogue metadata হিসেবে থাকবে — লগইন-দেয়াল বসবে না। এই ধাপের UI হার্ডকোড করা lib থেকে পড়ে (Firestore নয়), তাই Subjects ট্যাব ও বিষয়/টপিক পাতা সাইন-আউট ভিজিটরের কাছেও বিষয়ের নাম + নম্বর (মেটাডেটা) ও খালি অবস্থা দেখায় — পাঠ্য/প্রশ্ন কনটেন্ট নয়। নির্দেশের বাধ্যতামূলক বাক্যটি নিয়ম-স্তরের ("পড়ার নিয়মে signedIn() যোগ করতে হবে") — UI-তে লগইন-দেয়াল বসানোর নির্দেশ এতে নেই, আর "অল্প প্রিভিউ" হিসেবে বিষয়-তালিকা (নাম+নম্বর মাত্র) যুক্তিসঙ্গত।

## পরীক্ষিত (Tested — যাচাই করা হয়েছে)

| যাচাই | ফলাফল |
|---|---|
| `npm run build` | **PASS** (tsc + vite; তিনটি এজেন্টের কাজ একত্রিত করে আবার চালানো) |
| নিয়ম-স্যুট `npm run test:rules` | **৪৫০/৪৫০ PASS** (আগে ৩২৩/৩২৩ → +১২৭টি নতুন Step 6 পরীক্ষা; ১২টি ফাইল)। পূর্ণ-স্যুটের প্রথম চালায় ২টি পরীক্ষা (a1, n1 — `rules.test.ts`) "client is offline" ত্রুটিতে ব্যর্থ হয়েছিল — এমুলেটর-সংযোগের ক্ষণিক ব্যর্থতা, নিয়মের ভুল নয় (১২টি ফাইল সমান্তরালে চলায় এমুলেটর সাড়া দেয়নি); ওই ফাইল আলাদাভাবে আবার চালিয়ে ৬৮/৬৮ PASS — a1/n1-সহ। দ্বিতীয় চালায় ১টি পরীক্ষা (e2 — `guardian-e2e.test.ts`) একই কারণে ব্যর্থ হয়েছিল ("missing audit entry" — এমুলেটর সাড়া না দেওয়ায় অডিট-লেখা হয়নি); আলাদাভাবে আবার চালিয়ে ৮/৮ PASS। কঠোরকরণের (o14) পর চূড়ান্ত পূর্ণ-স্যুট ৪৪৪/৪৪৪ — কোনো ব্যর্থতা নেই। বেনামি-অ্যাক্সেস বাতিলের (e3/e7 উল্টানো + e15–e20) পর চূড়ান্ত পূর্ণ-স্যুট **৪৫০/৪৫০** — কোনো ব্যর্থতা নেই। সমন্বয়কারীর যোগ করা c20-ও প্রথমে ব্যর্থ হয়েছিল (ডক-ID সংঘাত — উপরে #৫ দেখুন); ঠিক করার পর ১২১/১২১, তারপর ১২৭/১২৭। **ফোল্ড-ইনের পর:** Step 6 নিয়ম-ফাইল একা **১৫৬/১৫৬ PASS** (১৫৩ + v18/v19/u7); পূর্ণ স্যুট (sequential, `--fileParallelism=false`) — নিচে "ফোল্ড-ইন যাচাই" সারি দেখুন |
| ইউনিট-স্যুট `npm run test:unit` | **১৩০/১৩০ PASS** (আগে ১২২/১২২ → +৮টি ফোল্ড-ইন: `jobContent` ৩৭ (+১ version-পিন) + সিড-প্রয়োগকারী ২২ (+৩ version-validation + ৪ emulator-guard)) |
| ফোল্ড-ইন যাচাই (এই সেশন) | build PASS (tsc + vite); Step 6 নিয়ম-ফাইল ১৫৬/১৫৬; ইউনিট ১৩০/১৩০; প্রয়োগকারী-গার্ড CLI-যাচাই (production হোস্ট/LAN/মৃত এমুলেটর — তিনটেই REFUSED, exit 2); এমুলেটরে পুনঃপ্রয়োগ **২৩ তৈরি, ০ ভুল, ০ read-back অমিল**, audit-এ `seedVersion`/`configVersion`/`seedSha256` (sha ফাইলের সঙ্গে মিলেছে), প্রয়োগ-ডকে `configVersion: '2026-11-22.1'` read-back-এ মিলেছে। পূর্ণ নিয়ম-স্যুট (sequential, `--fileParallelism=false`): **৪৭৯/৪৭৯ PASS** (১২ ফাইল; ৪৫০ + ২৬ ফোল্ড-ইন c246934 + ৩ নতুন v18/v19/u7)। স্টেজিং প্রিভিউ — নিচে "বন্ধের প্রমাণ" দেখুন |
| স্টেজিং প্রিভিউ রুট (curl) | `/` ২০০, `/jobs` ২০০, `/jobs/dashboard` ২০০, `/profile` ২০০, `/jobs/bcs` ২০০, `/jobs/it-professional` ২০০, `/jobs/bank` ২০০, `/jobs/bcs/subjects/bangla` ২০০, `/jobs/bcs/subjects/bangla/sandhi` ২০০ (৯/৯ — ২টি নতুন রুটসহ)। ফোল্ড-ইন প্রিভিউ: https://eduvelto--step6-foldin2-xtvunnzs.web.app (মেয়াদ শেষ ২৯ নভেম্বর ০৬:১২ UTC) — একই ৯/৯ → ২০০ |
| সিড-প্রয়োগকারী (এমুলেটর) | dry-run: পরিকল্পনা ২৩ নতুন, ০ অপরিবর্তিত, ০ পরিবর্তিত; প্রয়োগ: **তৈরি ২৩, হালনাগাদ ০, ভুল ০, read-back অমিল ০**; অডিট ফাইল `team/job-content-seed-apply-audit-2026-11-22.json`। লাইভে প্রয়োগ হয়নি |
| বান্ডিল প্রমাণ (dist grep) | নতুন চাঙ্ক `JobSubjectPage-*.js` ও `JobTopicPage-*.js` আছে; সৎ-কপির স্ট্রিং ("এই টপিকটি এখনো তৈরি হয়নি", "এই বিষয়ে আমার অগ্রগতি") বান্ডিলে আছে |

## ChatGPT পরামর্শের ফোল্ড-ইন — Step 6 বন্ধের প্রমাণ

**পরামর্শ:** ২২ নভেম্বর ২০২৬ ~১১:২০ Asia/Dhaka, ব্রাউজার টাস্ক `6b4122c0` (১১:১৭–১১:২০); verdict **"APPROVE WITH CHANGES REQUIRED — Do not close yet"**; verbatim: `team/job-step6-chatgpt-consultation-2026-11-22.md` (কমিট `f6f1502`)। **সীমা (সৎভাবে):** ChatGPT বাস্তবায়নের সারাংশ দেখেছে — আসল `firestore.rules`, স্কিমা, পরীক্ষার সোর্স বা প্রয়োগকারী দেখেনি। তাই তার প্রতিটি পয়েন্ট আসল কোড/নিয়ম/পরীক্ষার বিরুদ্ধে যাচাই করে তবেই USED/ADAPTED/REJECTED বলা হয়েছে; কোনো দাবি শুধু কথায় নেওয়া হয়নি।

**ফলাফল: USED ১১ / ADAPTED ১ / REJECTED ৭ / Step 7 গেট ১ = ২০ পয়েন্ট।** ফোল্ড-ইন কমিট `c246934` (প্রথম সমন্বয়কারী, ১১:৩৬) + সংশোধন-কমিট (এই সমন্বয়কারী — নিচে "যাচাই-সংশোধন" দেখুন)।

### USED (১১)

| পয়েন্ট | কী করা হয়েছে | প্রমাণ |
|---|---|---|
| **P0-04** parent-ref integrity | অধ্যায়/টপিক/লেসন তৈরিতে prefix-chain যাচাই (subject এই exam-এর, chapter এই subject-এর, topic এই chapter-এর) + parent-এর `exists()` যাচাই | `firestore.rules` — chapter/topic/lesson create-নিয়ম; পরীক্ষা c27 (cross-exam DENIED), c29 (cross-subject DENIED), c30–c32 (missing parent DENIED) |
| **P0-07** deployed ruleset audit | পুরো `firestore.rules` নিরীক্ষা: ৪টি কালেকশন শুধু নিজেদের ৪টি match-ব্লকেই আছে (লাইন ১৯৮৬/২০৩৭/২০৭৮/২১২৩) + শেষের deny-all `match /{document=**}` (২১৭০, `allow read, write: if false`) — আর কোনো match ব্লক এই পথগুলো ছোঁয় না; academic `lessons`/`questions` আলাদা কালেকশন, overlap নেই | grep-নিরীক্ষা (এই রিপোর্টের লেখক, ২২ নভেম্বর); পরীক্ষা e22 (collection-group query DENIED), e23 (nested subcollection DENIED) |
| **P1-02** canonical allowlist | বিষয় তৈরি শুধু Admin/Owner + শুধু ২৩টি প্রামাণিক ID (`canonicalJobSubjectIds()`) | `firestore.rules` লাইন ১০৮–১২৫, subject create-নিয়ম; পরীক্ষা c24–c26 (শিক্ষক/Moderator-এর বিষয়-তৈরি DENIED, Admin-এর অ-প্রামাণিক ID DENIED) |
| **P1-03** publish-transition guard | Published-থাকা ডকে publication ক্ষেত্র (status/reviewStatus/verifiedBy/verifiedAt) frozen — যাচাইকারী চুপচাপ বদলানো যায় না; unpublish → re-verify → re-publish | `jobContentPublishTransition()`; পরীক্ষা p20–p22 |
| **P1-04** createdBy pinned | তৈরি-সময়ে `createdBy` অনুপস্থিত বা caller-এর — অন্য UID/‘seed’ বসানো যায় না | `jobContentCreateCommon()`; পরীক্ষা o11–o12 |
| **P1-05** publication metadata at create | `publishedAt`/`publishedBy` নতুন খসড়ায় নিষিদ্ধ (স্কিমায় এই ক্ষেত্র নেই-ই) | `jobContentCreateCommon()`; পরীক্ষা v13–v14 |
| **P1-06** seed importer safety | (ক) loopback-মাত্র গার্ড: `--emulator` মান loopback (127.x/localhost/::1) না হলে REFUSED — production হোস্ট (`firestore.googleapis.com`) ও LAN ঠিকানা প্রত্যাখ্যান; (খ) live probe: লেখার আগে লক্ষ্য আসলেই এমুলেটর কি না যাচাই (Bearer 'owner'-এ collection-list ২০০ আশা করে) — probe ব্যর্থ হলে REFUSED | `scripts/apply-job-seed.mjs` — `emulatorTargetProblem()` + `probeEmulator()` (দুই প্রয়োগকারীই ব্যবহার করে); ইউনিট-পরীক্ষা ৪টি (guard) + CLI-যাচাই: production হোস্ট exit 2, LAN exit 2, loopback-এ এমুলেটর না থাকলে exit 2, এমুলেটরে dry-run/apply চলে |
| **P1-07** adversarial tests | cross-exam/subject রেফারেন্স, missing parent, collection-group, nested পথ, অজানা কালেকশন — DENIED পরীক্ষা | c27, c29–c32, e22, e23, a4 (অজানা audit action) |
| **P2-01** audit history | publish/unpublish/verify/return — ৪টি audit action `adminActions` enum-এ (`job-content-published`, `job-content-unpublished`, `job-content-verified`, `job-content-returned`); Step 15 admin UI ও Step 7 প্রবাহে প্রতিটি publish/verify-তে একটি করে এন্ট্রি বাধ্যতামূলক (নিয়ম-মন্তব্যে লেখা) | `firestore.rules` লাইন ১৫৫০–১৫৫১; পরীক্ষা a1–a4 |
| **P2-02** config versioning | `JOB_CONTENT_CONFIG_VERSION = '2026-11-22.1'` (`src/lib/jobContent.ts`); সিডের `_meta.version` + প্রতিটি বিষয়-ডকের `configVersion` একই মান; validator-এ drift-যাচাই (অমিল → প্রয়োগ বন্ধ); নিয়মে `configVersion` optional string, update-allowlist-এর বাইরে বলে তৈরি-পরবর্তীতে অপরিবর্তনীয় | সিড JSON (২৪টি `configVersion`); `validateContentSeed()`; নিয়ম `validJobSubject()`; পরীক্ষা v18 (non-string DENIED), v19 (string ALLOWED), u7 (update-এ বদল DENIED), ইউনিট-পরীক্ষা ৩টি |
| **P2-04** seed provenance | audit manifest-এ `seedVersion` + `configVersion` + `seedSha256` (সিড ফাইলের sha256) | `apply-job-content-seed.mjs` audit-অংশ; এমুলেটর-প্রয়োগের audit (`/tmp/job-content-seed-audit-foldin2.json` — যাচাই: sha ফাইলের সঙ্গে মেলে) |

### ADAPTED (১)

| পয়েন্ট | কী করা হয়েছে | কারণ |
|---|---|---|
| **P2-05** field classes | আলাদা ডকুমেন্ট নয় — এই রিপোর্টের নিচের "ক্ষেত্রের শ্রেণি" টেবিল + নিয়মের মন্তব্যে লেখা (কোন ক্ষেত্র authoritative / generated / editable / immutable) | Step 6-এ আলাদা ডক ফাইল বানানো অতিরিক্ত হতো; রিপোর্টই এ ধাপের প্রামাণিক রেকর্ড |

### REJECTED (৭ — প্রমাণসহ; "আগে থেকেই আছে" বা "প্রযোজ্য নয়")

| পয়েন্ট | কারণ + প্রমাণ |
|---|---|
| **P0-01** role/verification escalation | আগেই বাস্তবায়িত (Step 4/5): নিজের users-ডক হালনাগাদে role/verificationStatus/isActive allowlist-এর বাইরে (`firestore.rules` ~লাইন ৫৮১ — মন্তব্যসহ "role, verificationStatus and isActive are excluded"); তৈরি-সময়ে role শুধু student/teacher/parent, verificationStatus শুধু teacher/parent + 'pending'; `validVerificationTransition()` চারটি transition-মাত্র অনুমোদন করে; role বদল শুধু Admin/Owner-নিয়মে। নতুন কোড লাগেনি — পরীক্ষা n-সিরিজ (Step 5) + o14 পিন করে। |
| **P0-02** teacher auth from trusted DB state | আগেই বাস্তবায়িত: `callerRole()` + `callerActive()` সরাসরি `users/{uid}` ডক থেকে `get()` করে (`firestore.rules` লাইন ৩৪–৪৪); `isTeacher()` সেই মানের উপর নির্ভর করে — client state/localStorage/context কখনো ভূমিকা নির্ধারণ করে না। পরীক্ষা o13/o14 (demoted teacher DENIED) পিন করে। |
| **P0-03** second-eye independence | আগেই বাস্তবায়িত (Step 6 কোর): `jobContentSecondEye()` — verifiedBy কখনো author নয়; প্রকাশে আসল যাচাইকারী + timestamp বাধ্য। পরীক্ষা p1–p22 পিন করে (p9: Moderator নিজের লেখা প্রকাশ করতে পারে না)। |
| **P0-05** question-material boundary | Step 6-এ প্রশ্ন-উপাদান নেই-ই — কোনো subject/chapter/topic/lesson ডকে question/answer-key/explanation ক্ষেত্র নেই (lesson `body` লেসন-পাঠ্য, প্রশ্ন-উপাদান নয়); boundary কাঠামোগতভাবে আছে। Step 7-এ আলাদা কালেকশন (`jobQuestions` ছাত্র-অপঠনীয় + `jobQuestionBundles`/`jobQuestionKeys`) বানানো হবে — এই ধাপে করার কিছু নেই। |
| **P1-01** canonical drift validation | আগেই আছে: `jobContent.test.ts` — "deep-matches the canonical JOB_SUBJECTS" পরীক্ষা (সিড ↔ lib ↔ `JOB_RULES_CONFIGS`, marks-sum সহ) — build-time/CI-স্তরের যাচাই; নিয়মে পুরো derivation পুনঃগণনা করা ChatGPT-ও সুপারিশ করেনি। P2-02-এর version-পিন এখন দ্বিতীয় স্তর হিসেবে যোগ হয়েছে। |
| **P1-08** default-deny subcollections | আগেই আছে: ফাইলের শেষে `match /{document=**} { allow read, write: if false; }`; পরীক্ষা e22/e23 পিন করে (collection-group + nested DENIED)। নতুন subcollection এলে তার নিজের match-ব্লক লাগবে — deny-all-ই default। |
| **P2-03** monitoring | প্রযোজ্য নয় — Spark-এ কোনো সার্ভার নেই (Cloud Functions নেই, trusted writer নেই); client-side denial-log লেখা জাল করা যায় ও অবিশ্বস্ত। প্রত্যাখ্যানের কারণ এই সীমা; monitoring Step 17-এর নিরাপত্তা-পরীক্ষার বিষয়, এ ধাপের কোডের নয়। |

### UI সিদ্ধান্ত — DECIDED (ChatGPT, মালিককে জিজ্ঞাসা নয়)

**বিষয়ের নাম + নম্বর PUBLIC থাকবে (catalogue metadata)** — Subjects ট্যাব ও বিষয়/টপিক পাতায় সাইন-আউট ভিজিটর নাম+নম্বর দেখতে পাবে; এতে লগইন-দেয়াল বসবে না। শর্ত: public metadata-তে কখনো অপ্রকাশিত শিক্ষক-বিবরণ, রিভিউ-নোট বা লেসন-প্রিভিউ যাবে না (আজকের hardcoded lib-এ সেসব নেই-ই)। এই সিদ্ধান্তে "বেনামি অ্যাক্সেস বাতিল" অংশের খোলা UI-প্রশ্নটি বন্ধ হলো — নিয়ম-স্তরে (signedIn-only content) ও UI-স্তরে (public catalogue) সীমা এখন স্পষ্ট।

### Step 7 গেট — P0-06 (BINDING, Step 6-এর ফিক্স নয়)

**Receipt/grant যাচাই client-দাবির উপর নির্ভর করতে পারবে না — Step 7-এর UI বানানোর আগেই trusted-issuer ডিজাইন বাধ্যতামূলক।** Eduvelto ১০০% ফ্রি — কোনো পেমেন্ট নেই; "receipt" এখানে অ্যাক্সেস-গ্রান্ট। গ্রান্ট জারি করতে পারবে শুধু trusted issuer (Owner/Admin/যাচাইকৃত প্রবাহ) — ছাত্র নিজে receipt ডক তৈরি করে দাবি করতে পারবে না। নিয়মে যাচাই করতে হবে: গ্রান্ট requesting UID-এর, সঠিক question/bundle-এর, মেয়াদোত্তীর্ণ/বাতিল নয়। এই গেট Step 7-এর আর্কিটেকচার-অনুমোদনের শর্ত; গেট না মিটলে Step 7 বন্ধ হবে না।

### যাচাই-সংশোধন (এই সমন্বয়কারী, c246934-এর পর)

`c246934`-এর কমিট-বার্তার দাবিগুলো আসল কোডের বিরুদ্ধে যাচাই করা হয়েছে — ৯টি সত্য, ১টি অসম্পূর্ণ, ৩টি অনুপস্থিত:

- **সত্য:** P0-04, P1-02, P1-03, P1-04, P1-05, P1-07, P2-01 (নিয়ম + পরীক্ষায় মিলেছে); P0-01/P0-02/P0-03/P1-01/P1-08/P2-03-এর REJECTED-প্রমাণ (উপরে); topic doc-ID 4-segment সংশোধন (নিয়ম `isJobTopicId` + পরীক্ষা)।
- **অসম্পূর্ণ — P1-06:** কমিট-বার্তায় "(next commit)" লেখা ছিল, কিন্তু সেই কমিট কখনো আসেনি — প্রয়োগকারী যেকোনো `--emulator host:port` নিচ্ছিল, loopback যাচাই ছিল না। **এই সেশনে বাস্তবায়িত** (`emulatorTargetProblem()` + `probeEmulator()` — প্রথম probe-বাস্তবায়নে ভুল ছিল: database-root GET এমুলেটরে 404 দেয়; সংশোধন করে আসল collection-list probe করা হয়েছে, Bearer 'owner'-সহ)।
- **অনুপস্থিত — P2-02/P2-04/P2-05:** `c246934`-এ ছিল না। **এই সেশনে বাস্তবায়িত** (উপরে USED/ADAPTED দেখুন)।

### ক্ষেত্রের শ্রেণি (P2-05)

| ক্ষেত্র | শ্রেণি | নিয়ম |
|---|---|---|
| `examSlug`, `subjectId`, `chapterId`, `topicId`, `slug` | **Authoritative** (প্রামাণিক) | তৈরি-সময়ে prefix-chain + allowlist যাচাই; update-এ allowlist-এর বাইরে — অপরিবর্তনীয় |
| `nameBn`, `nameEn`, `marks`, `order`, `syllabusSource`, `descriptionBn/En`, `body`, `isCommon`, `commonExams`, `commonStatus`, `questionTarget` | **Editable** (খসড়ায় লেখক, সর্বত্র Moderator/Admin) | খসড়া-অবস্থায় লেখক; Published ডকে শুধু Admin (Moderator নয়) |
| `status`, `reviewStatus`, `verifiedBy`, `verifiedAt` | **Publication** (Moderator/Admin, second-eye + transition-guard) | লেখক কখনো ছুঁতে পারে না; Published-থাকা ডকে frozen |
| `authorId`, `createdBy`, `createdAt`, `configVersion` | **Immutable** (তৈরির পর কেউ বদলাতে পারে না — Admin-ও নয়) | সব update-নিয়মের affectedKeys allowlist-এর বাইরে |
| `jobSubjects` (২৩টি) | **Generated** (যাচাইকৃত rulesConfig থেকে তৈরি) | শুধু Admin তৈরি করতে পারে, শুধু ২৩টি প্রামাণিক ID; সিড Admin SDK দিয়ে প্রয়োগ হয় |

## বাকি / যাচাই হয়নি (Remaining — সৎভাবে)

- **বেনামি-অ্যাক্সেস বাতিল — UI-দেয়ালের প্রশ্ন বন্ধ** (উপরে "ChatGPT পরামর্শের ফোল্ড-ইন — UI সিদ্ধান্ত" দেখুন): বিষয়ের নাম+নম্বর public catalogue হিসেবে থাকে; লেসন/অধ্যায় কনটেন্ট signed-in-only (নিয়ম-স্তরে)।
- **সাইন-ইন করা ব্রাউজারে ক্লিক-পরীক্ষা হয়নি** (এই সেশনে লাইভ ব্রাউজার নেই) — Subjects ট্যাবের কার্ড, বিষয়/টপিক পাতার দেখা, মোবাইল-লেআউট — হাতে চালিয়ে দেখা হয়নি। বান্ডিলে কোড আছে বলে প্রমাণিত, চোখে-দেখা রেন্ডার হয়নি।
- **IT হাবের পরিসর এখনো ঠিক হয়নি** (মালিকের সিদ্ধান্ত ১৩.৮) — বিষয়-তালিকা নেই; পরিসর ঠিক হলে তবে কনটেন্ট আসবে।
- **অধ্যায়/টপিক/লেসন কনটেন্ট নেই** — কাঠামো + নিয়ম + UI তৈরি, কনটেন্ট শূন্য (০ যাচাইকৃত শিক্ষক; অফিসিয়াল সিলেবাস-পাঠ্য ডিস্কে নেই)। বিষয়-পাতার টপিক-তালিকা ও টপিক-পাতা খালি অবস্থায় আছে।
- **পড়ার পথ Firestore-এ বদলানো হয়নি** (সিদ্ধান্ত ১) — সিড ডিস্ক-মাত্র (এমুলেটরে প্রয়োগ করে যাচাই করা হয়েছে, লাইভে নয়); লাইভে কিছু লেখা/প্রয়োগ হয়নি।
- **অ্যাডমিন UI বানানো হয়নি** (Step 15) — বিষয়/অধ্যায়/টপিক/লেসন লেখার পর্দা নেই; লেখা শুধু নিয়ম-স্তরে (Firestore) সম্ভব।
- **প্রশ্ন/অনুশীলন বানানো হয়নি** (Step 7/8) — টপিক-পাতার অনুশীলন-প্রবেশপথ অনুপলব্ধ অবস্থায় আছে।
- **জানা সীমা — ঠিক করা হয়েছে:** লেখকের হালনাগাদ-নিয়মে আগে `isTeacher()` যাচাই ছিল না (ভূমিকা বদলে ছাত্র হয়ে যাওয়া প্রাক্তন শিক্ষক নিজের খসড়া সম্পাদনা করতে পারত)। সমন্বয়কারীর যাচাইয়ে ধরা পড়ে কঠোর করা হয়েছে (সিদ্ধান্ত ১১, পরীক্ষা o14) — এখন ভূমিকা-যাচাই আছে।
- **লাইভে কিছু ডেপ্লয়/মার্জ হয়নি** — প্রোডাকশন ডেপ্লয় ও মার্জের জন্য আলাদা অনুমোদন লাগবে।

## বদলানো ফাইল (branch `jobs/section-structure`)

| ফাইল | বদল |
|---|---|
| `firestore.rules` | `jobSubjects` + `jobChapters` + `jobTopics` + `jobLessons` ম্যাচ (নতুন; বিচ্যুতিসহ — উপরে) |
| `src/lib/jobContent.ts` (নতুন) | প্রামাণিক বিষয়-তালিকা (৪ পরীক্ষা, ২৩ বিষয়) + হেল্পার + ট্যাক্সোনমি যাচাই |
| `src/pages/JobHubPage.tsx` | Subjects ট্যাবে আসল বিষয়ের কার্ড-গ্রিড (`JobSubjectsTab` + বাংলা-সংখ্যা হেল্পার); অন্য ৭টি ট্যাব অপরিবর্তিত |
| `src/pages/JobSubjectPage.tsx` (নতুন) | `/jobs/:exam/subjects/:subject` — ব্রেডক্রাম্ব, নম্বর, উৎস-লাইন, খালি টপিক-তালিকা, অগ্রগতি-কার্ড |
| `src/pages/JobTopicPage.tsx` (নতুন) | `/jobs/:exam/subjects/:subject/:topic` — সৎ খালি অবস্থা + অনুশীলন অনুপলব্ধ; `lookupJobTopic()` আজ null ফেরায় (Step 7-এ বদলাবে) |
| `src/App.tsx` | ২টি নতুন রুট (tab-রুটের আগে) |
| `team/job-content-seed.json` (নতুন) | ২৩টি খসড়া বিষয়-ডক (ডিস্ক মাত্র); অধ্যায়/টপিক/লেসন খালি |
| `scripts/apply-job-content-seed.mjs` (নতুন) | সিড প্রয়োগকারী — এমুলেটর-মাত্র, dry-run, idempotent, অডিট + read-back |
| `scripts/apply-job-content-seed.d.mts` (নতুন) | প্রয়োগকারীর টাইপ-ঘোষণা (`tsconfig.json`-এ include যোগ) |
| `team/job-content-seed-apply-audit-2026-11-22.json` (নতুন) | এমুলেটর-প্রয়োগের অডিট রেকর্ড (২৩ তৈরি, ০ ভুল) |
| `emulator-tests/rules-step6-job-content.test.ts` (নতুন, ১,০৯৭ লাইন) | ১৫৬টি নিয়ম-পরীক্ষা (c1–c32, v1–v19, t1–t14, e1–e23, o1–o14, p1–p22, u1–u7, d1–d9, s1–s5) — ফোল্ড-ইনে c24–c32, v18–v19, u7 যোগ |
| `src/lib/__tests__/jobContent.test.ts` (নতুন) | ৩৭টি ইউনিট-পরীক্ষা (+১ version-পিন) |
| `src/lib/__tests__/jobContentSeedImporter.test.ts` (নতুন) | ২২টি ইউনিট-পরীক্ষা (+৩ version-validation + ৪ emulator-guard) |
| `src/lib/jobContent.ts` | `JOB_CONTENT_CONFIG_VERSION = '2026-11-22.1'` যোগ (P2-02) |
| `team/job-content-seed.json` | `_meta.version`/`configVersion` + প্রতিটি বিষয়-ডকে `configVersion: '2026-11-22.1'` (P2-02) |
| `scripts/apply-job-seed.mjs` | `emulatorTargetProblem()` + `probeEmulator()` — loopback-মাত্র গার্ড + live probe (P1-06; দুই প্রয়োগকারীই ব্যবহার করে) |
| `scripts/apply-job-seed.d.mts` | গার্ড ফাংশনদ্বয়ের টাইপ-ঘোষণা |
| `scripts/apply-job-content-seed.mjs` | গার্ড/প্রোব সংযোগ + `_meta.version` drift-যাচাই (P2-02) + audit-এ `seedVersion`/`configVersion`/`seedSha256` (P2-04) |
| `team/job-step6-chatgpt-consultation-2026-11-22.md` (নতুন, কমিট `f6f1502`) | ChatGPT পরামর্শের verbatim (২৬,০৩২ বাইট) |
| `firestore.rules` | fold-in: `canonicalJobSubjectIds()` allowlist (P1-02), `jobContentPublishTransition()` (P1-03), `createdBy` পিন (P1-04), `publishedAt`/`publishedBy` নিষেধ (P1-05), parent `exists()` + prefix-chain (P0-04), `configVersion` optional string (P2-02), `job-content-*` audit action (P2-01) |

---

*— Step 6 রিপোর্ট, ২২ নভেম্বর ২০২৬ ~১২:৩০ Asia/Dhaka। **Step 6 বন্ধ (CLOSED)** — ChatGPT ফোল্ড-ইন: USED ১১ / ADAPTED ১ / REJECTED ৭ / Step 7 গেট ১। প্রমাণ: build PASS; পূর্ণ নিয়ম-স্যুট **৪৭৯/৪৭৯** (sequential); ইউনিট **১৩০/১৩০**; Step 6 নিয়ম-ফাইল **১৫৬/১৫৬**; প্রিভিউ https://eduvelto--step6-foldin2-xtvunnzs.web.app (মেয়াদ শেষ ২৯ নভেম্বর ০৬:১২ UTC), রুট ৯/৯ → ২০০; এমুলেটরে সিড পুনঃপ্রয়োগ ২৩/২৩, ০ অমিল। সাইন-ইন করা ব্রাউজারে ক্লিক-পরীক্ষা হয়নি (সৎভাবে নোট করা)। পরের ধাপ: Step 7 — Question Bank and Verification (P0-06 গেটসহ)।*
