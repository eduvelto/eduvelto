# চাকরির প্রস্তুতি — MCQ Practice Engine: নিয়ম (Step 8, CORE)

**তারিখ:** ২২ নভেম্বর ২০২৬ ~১৩:৩০–১৪:০০ Asia/Dhaka · **ধরন:** বাস্তবায়ন রিপোর্ট — নিয়ম + পরীক্ষা
**পরিসর:** Job Preparation সেকশন ONLY · **ব্রাঞ্চ:** `jobs/section-structure`
**ভিত্তি:** `team/job-architecture-schema-step3.md` §২.১১, §২.১২, §৩.৮, §৪, §৫ · Step 7 রিপোর্ট (`team/job-question-bank-step7.md`, CLOSED) · Step 7 ফোল্ড-ইন (রসিদ = ১০-মিনিটের attempt-বাঁধা উইন্ডো, "জমা দেওয়া" = client-attested)
**বাজেট:** ৳০ — কোনো পেইড সার্ভিস নয় · **মার্জ/প্রোডাকশন ডেপ্লয়:** হয়নি · **লাইভ ডাটাবেস:** ছোঁয়া হয়নি (শুধু এমুলেটর)
**অবস্থা:** **Step 8 নিয়ম সম্পূর্ণ** — পূর্ণ নিয়ম-স্যুট ৬৭৬/৬৭৬ PASS (নিচে §যাচাই-প্রমাণ)

---

## সারসংক্ষেপ

Step 7-এর সর্বনিম্ন attempt-নোঙরকে **পূর্ণ attempt**-এ বদলানো হয়েছে (Step 3 §২.১১) আর **নতুন `users/{uid}/jobSessions`** সাবকালেকশন যোগ করা হয়েছে (Step 3 §২.১২) — অনুশীলন + মক, এক ইঞ্জিন, এক নিয়ম-সেট। attempt ডক তৈরি হয় **জমার মুহূর্তে একবার**, `status: 'submitted'` + পূর্ণ ক্ষেত্রসহ; চলমান অবস্থা (অটোসেভ/পুনরুদ্ধার) থাকে সেশনে। রসিদ/চাবির নিয়ম (Step 7) আচরণে **অপরিবর্তিত** — রসিদ এখনো ১০-মিনিটের attempt-বাঁধা উইন্ডো, নোঙর এখনো জমা-দেওয়া attempt; শুধু নোঙরের আকৃতি বদলেছে (নিচে §Step 7 থেকে যা বদলেছে)। **ব্যাংক এখনো খালি — ০টি প্রশ্ন, ০টি বান্ডল, ০টি চাবি, ০ যাচাইকৃত শিক্ষক।** এই ধাপে কোনো lib/UI লেখা হয়নি — `src/lib/jobEngine.ts` + UI অন্য এজেন্টের (এই রিপোর্ট শুধু নিয়ম + পরীক্ষা)।

**যা করা হয়েছে:** `firestore.rules` (+~২২৪ লাইন নিট): `jobAttempts` ম্যাচ সম্পূর্ণ পুনর্লিখন + `jobSessions` ম্যাচ নতুন + ৬টি হেল্পার (`jobBundleData`, `jobSessionData`, `jobBundleKindFitsAttemptKind`, `validJobAttemptCreate`, `validJobSessionCreate`, `validJobSessionUpdate`)। পরীক্ষা: নতুন ফাইল `emulator-tests/rules-step8-practice-engine.test.ts` (**৬৪টি কেস s1–s64**) + Step 7-এর দুটি পরীক্ষা-ফাইল নতুন মডেলে পুনর্লিখন (q66, q75, q80–q92; a5)।

---

## সিদ্ধান্ত (Step 7 / Step 3 খসড়া থেকে বিচ্যুতি — সব রেকর্ড করা)

### ১. Create-at-submit — Step 7-এর নোঙর-জীবনচক্র বাতিল, প্রতিস্থাপন নয়

Step 7-এ attempt তৈরি হতো `in-progress` অবস্থায়, তারপর ঠিক একবার হালনাগাদ হয়ে `submitted` হতো। Step 8 সেই জীবনচক্র **বাতিল** করেছে: attempt ডক তৈরি হয় **জমার মুহূর্তে একবার**, `status: 'submitted'` + পূর্ণ ক্ষেত্রসহ; চলমান অবস্থা থাকে `jobSessions`-এ। কারণ:

- **অনাথ in-progress attempt থাকে না।** মোছা সবার জন্য নিষিদ্ধ (Admin-সহ) — Step 7-মডেলে কোনো ছাত্র পরীক্ষা শুরু করে শেষ না করলে একটি `in-progress` attempt-ডক চিরকাল পড়ে থাকত, যা কেউ মুছতে পারত না। নতুন মডেলে অসমাপ্ত প্রচেষ্টার চিহ্ন থাকে শুধু সেশনে (`abandoned`), আর attempt তৈরি হয় শুধু জমা দিলেই।
- **Step 3 §২.১১-এর সঙ্গে সঙ্গতি:** "doc-ID = session ID = idempotency key: একই ID-তে দ্বিতীয় জমা নিয়মে `update` হিসেবে গণ্য হয় ও নিষিদ্ধ" — নতুন মডেলে এটাই আক্ষরিক সত্য (create-মাত্র, update কখনো নয়)।
- **রসিদ-গেট অপরিবর্তিত:** রসিদ তৈরির নিয়ম এখনো `status == 'submitted'` attempt চায় — শুধু সেই attempt-এর আকৃতি এখন পূর্ণ। q64/q65/q73/q75/q76-এর নিরাপত্তা-অভিপ্রায় একই আছে, পরীক্ষাগুলো নতুন আকৃতিতে পুনর্লিখিত হয়েছে।

### ২. সেশন-গেট — attempt তৈরিতে সেশন `submitted` হতেই হবে

Step 3 §৩.৮-এর খসড়া attempt তৈরিতে সেশন `in-progress` + সময়সীমা-গ্রেস চেয়েছিল। Step 8 তার **উল্টো** সিদ্ধান্ত নিয়েছে: attempt তৈরি হতে হলে **একই doc-ID-র সেশনটি ইতিমধ্যে `submitted`** হতে হবে, একই bundle-এর জন্য। কারণ:

- **জমার ক্রম একটাই:** ক্লায়েন্ট জমার প্রবাহে প্রথমে সেশন `submitted` করে (`submittedAt` সহ), তারপর attempt তৈরি করে, তারপর রসিদ তৈরি করে। সেশন-গেট সেই ক্রমকে নিয়মে বাঁধে — সেশন ছাড়া, চলমান সেশনে, বা বাতিল সেশনে attempt তৈরি হয় না (পরীক্ষা s30/s31/s32)।
- **kind/examSlug/mockId সেশনের সঙ্গে আলাদা করে মেলানো হয়নি** — তা transitively আসে: সেশন-তৈরি আর attempt-তৈরি দুটোই kind + examSlug + mockId-কে **একই বান্ডলের** সঙ্গে বাঁধে (বান্ডলের `kind`/`examSlug`/`mockId`-র বিরুদ্ধে যাচাই)। মক-সেশন টপিক-বান্ডলে থাকতে পারে না, অনুশীলন-সেশন মক-বান্ডলে থাকতে পারে না — তাই একই bundle-এর `submitted` সেশন মানেই সঙ্গতিপূর্ণ সেশন (নিয়মে লেখা যুক্তি; `validJobAttemptCreate`-এর মন্তব্য দেখুন)।
- **মক-দেরির গ্রেস নেই:** খসড়ার ১৫-মিনিটের endsAt-গ্রেস বাদ দেওয়া হয়েছে — গ্রেস যাচাই করতে সেশনের `endsAt` পড়তে হতো, আর সেশন `submitted` হওয়ার মুহূর্তটাই ক্লায়েন্ট ঠিক করে। দেরিতে জমা দেওয়া মক (গ্রেস পেরিয়ে) ক্লায়েন্ট `abandoned` হিসেবে চিহ্নিত করে, আর বাতিল সেশনে attempt তৈরি হয় না। এটি client-trust সীমারই অংশ (§সৎ ফাঁক)।

### ৩. examSlug — প্রামাণিক ১৪টি হাব-স্লাগ; `'common'` নেই

`examSlug` allowlist হলো `jobExamSlugs()`-এর **১৪টি প্রামাণিক হাব-স্লাগ** (`bcs`, `bank`, `primary-teacher`, `ntrca`, `dgfood`, `bpsc-non-cadre`, `cag`, `bfsa`, `others`, `ministries`, `defence`, `autonomous`, `private-ngo`, `it-professional` — `src/lib/jobProfile.ts`-এর `TARGET_EXAM_SLUGS`-এর সঙ্গে একই)। হস্তান্তরে উদাহরণ হিসেবে লেখা `'common'` **অন্তর্ভুক্ত করা হয়নি**: `/jobs/common` একটি ক্রস-পরীক্ষা হাব/রুট, পরীক্ষা নয় — `TARGET_EXAM_SLUGS`/`JOB_EXAMS`-এ `'common'` নেই, তাই তা যোগ করা হতো স্লাগ বানানো ("do NOT invent slugs" নির্দেশের বিরুদ্ধে)। কমন-টপিক অনুশীলনেও attempt-এ থাকে অন্তর্নিহিত পরীক্ষার স্লাগ (যেমন `bcs`)। পরীক্ষা s28 এই সিদ্ধান্তকে পিন করে।

### ৪. বান্ডল-kind সঙ্গতি — অনুশীলন ↔ টপিক/বিগত, মক ↔ মক/দৈনিক/সাপ্তাহিক

attempt ও সেশন — দুটোতেই: `kind: 'practice'` হলে বান্ডলের `kind` হতে হবে `'topic'` বা `'previous'` (বিগত-বছরের সেট টপিক-ধাঁচে অনুশীলন করা হয়); `kind: 'mock'` হলে `'mock'`/`'daily'`/`'weekly'` (দৈনিক/সাপ্তাহিক বান্ডল মক-ধরনের — ID `daily__{mockId}`/`weekly__{mockId}`)। মকে বান্ডলের `mockId` == attempt/session-এর `mockId` বাধ্য। এটি Step 3-এ স্পষ্ট লেখা ছিল না — Step 8-এর নতুন সিদ্ধান্ত; পরীক্ষা s34/s35/s49 পিন করে।

### ৫. নেগেটিভ-ডিডাকশন — প্রয়োগযোগ্য আসন্ন মান (exact formula নয়)

`score == correctCount*marksPerQuestion − wrongCount*negativeMarking` — এই exact formula নিয়মে যাচাই করা **যায় না**: `marksPerQuestion`/`negativeMarking` attempt-এ সংরক্ষিত নয়, আর নিয়ম `jobExams`-এর `rulesConfig` পড়ে না (get()-বাজেটের কারণে — নিচে #৭)। প্রয়োগযোগ্য আসন্ন মান:

- `negativeDeduction == wrongCount*0.25` **অথবা** `wrongCount*0.5` (যাচাইকৃত দুটি মানই: প্রাথমিক/NTRCA/ব্যাংক ০.২৫, BCS ০.৫০; ০.২৫/০.৫ ধাপ double-এ exact)।
- `score == clientCalculatedScore` + আলগা সীমা `−totalMarks ≤ score ≤ totalMarks` (marksPerQuestion ≥ ১ ও negative ≤ ০.৫ ধরে — সব যাচাইকৃত ধরনে সত্য)।
- exact formula lib-স্তরে (`jobEngine.ts` — অন্য এজেন্ট) — নিয়মে নয়।

### ৬. Float সীমা — accuracy/percentage শুধু পরিসর-যাচাই

নিয়ম float ভাগ নির্ভরযোগ্যভাবে যাচাই করতে পারে না — তাই `accuracy` (০–১০০) ও `percentage` (−১০০–১০০) শুধু **পরিসর** বাধ্য; মানগুলো client-computed + range-checked। `accuracy = correct ÷ answered × 100`, `percentage = score ÷ totalMarks × 100` — এই সূত্রের যাচাই lib-স্তরে।

### ৭. Per-answer আকৃতি — নিয়মে যাচাই অসম্ভব (Step 7 সিদ্ধান্ত #৭ বহাল)

Firestore নিয়মে তালিকার ইনডেক্সিং নেই — প্রতি উত্তরের `{topicId, subjectId, correct, marks, ...}` আকৃতি নিয়ম যাচাই **করতে পারে না**। প্রতি উত্তরে `topicId` + `correct` বাধ্যতামূলক — এই Step 3 চুক্তি তাই **lib-ভ্যালিডেটরে** (`jobEngine.ts`) বলবৎ হবে, নিয়মে নয়। নিয়ম বলবৎ করে aggregate-গুলো: `answers` non-empty ও `≤ bundle.questionCount`; `correctCount+wrongCount+unansweredCount == answers.size()`; marks-সঙ্গতি (সঠিক ⇒ marks ≥ ০, ভুল-উত্তর ⇒ marks ≤ ০, অনুত্তরিত ⇒ marks == ০) — **এই শেষটি বাস্তবায়িত হয়নি**: marks-চিহ্ন যাচাইয়ের জন্য প্রতিটি উত্তরে পৌঁছতে হয়, যা নিয়মে অসম্ভব (একই কারণ)। সৎভাবে রেকর্ড করা হলো: marks-চিহ্ন যাচাই lib-স্তরেই থাকবে; নিয়মে শুধু aggregate + negativeDeduction-আসন্ন মান। (হস্তান্তরের "correct==true ⇒ marks>=0 ..." শর্তটি নিয়মে লেখা যায়নি — per-answer অ্যাক্সেস নেই বলেই।)

### ৮. get()-বাজেট — attempt create ঠিক ১০টি get()/exists() কল

Firestore-এর নথিভুক্ত সীমা (প্রতি অনুরোধে ১০টি get()/exists() কল) মাথায় রেখে attempt create-কে **ঠিক ১০টি** কলে সাজানো হয়েছে: `callerActive()` ১টি (users ডক) + বান্ডল ৬টি (exists + status + examSlug + kind + mockId + questionCount) + সেশন ৩টি (exists + status + bundleId) — তিনটি আলাদা ডক। সেশন-kind/examSlug/mockId আলাদা করে না-পড়ার কারণ #২-এ লেখা (transitive)। লক্ষণীয়: Step 7-এর চাবি-পড়ার পথে ইতিমধ্যে ~১২টি কল-এক্সপ্রেশন আছে (একই ৩টি ডকে বারবার get) আর এমুলেটরে তা চলে — তাই বারবার get একই পাথে সমস্যা নয় বলেই মনে হয়; তবু Step 8 নতুন পথটিকে ১০-এর ভেতরে রেখেছে। সেশন create ৬টি কল, সেশন update ১টি।

### ৯. সেশন-মোছা নিষেধ — বাতিল সেশনই অডিট-ট্রেইল

`jobSessions` মোছা **কখনো নয় — Admin-ও নয়**। বাতিল সেশন মুছে ফেললে "পরীক্ষা শুরু করে শেষ করেনি" — এই তথ্যই হারিয়ে যেত; attempt তৈরি না-হওয়াই বাতিলের পরিণতি, সেশন-ডক রেখে দেওয়াই অডিট-ট্রেইল। (attempt-মোছা নিষেধ Step 7 থেকেই বহাল।)

### ১০. PAUSED সেশন-ডকে নেই

Step 2 §৪.৫-এর `PAUSED` শুধু অনুশীলনে **ক্লায়েন্ট-সাইড** অবস্থা (`IN_PROGRESS → PAUSED → IN_PROGRESS`) — সেশন-ডকের `status` কখনো `'paused'` হয় না; সার্ভারে সেশন `in-progress`-ই থাকে। নিয়মে `paused` যোগ করা হয়নি (পরীক্ষায় সরাসরি পিন করা হয়নি — সেশন create-এ `status == 'in-progress'` বাধ্য বলেই অন্য মান প্রত্যাখ্যাত হয়; s52 `'submitted'`-দিয়ে-তৈরি নিষেধের পরীক্ষা একই পথের প্রমাণ)।

---

## নিয়ম-সারসংক্ষেপ (firestore.rules)

### `users/{uid}/jobAttempts` — পূর্ণ attempt (Step 3 §২.১১)

| বিষয় | নিয়ম |
|---|---|
| পড়া | শুধু মালিক বা Moderator (`isOwner \|\| isModerator`) |
| তৈরি | শুধু মালিক + সক্রিয় (`isOwner && callerActive()`); `validJobAttemptCreate()` |
| হালনাগাদ / মোছা | **কখনো নয়** (`if false`) — Admin-ও নয় |

**Create-যাচাই (`validJobAttemptCreate`, `d = request.resource.data`):**

- কী-সেট: ঠিক অনুমোদিত ৩০টি কী-র ভেতরে (`hasOnly`) + ২৬টি বাধ্য কী উপস্থিত (`hasAll` — `serverVerifiedScore`/`audit`/`answerHashes`/`anomalyFlags` ঐচ্ছিক)।
- `userId == <path uid>`; `kind ∈ ['practice','mock']`; `mockId` — mock হলে non-empty string, practice হলে `null`।
- `bundleId` string; `examSlug ∈ jobExamSlugs()` (১৪টি); `subjectId`/`topicId` string-বা-null।
- `answers` list, `size ≥ 1`, `size ≤ bundle.questionCount`।
- `score` number; `totalMarks` number > ০; `−totalMarks ≤ score ≤ totalMarks`; `clientCalculatedScore == score`।
- `negativeDeduction ≥ ০` এবং `== wrongCount*0.25` বা `== wrongCount*0.5`।
- `correctCount`/`wrongCount`/`unansweredCount` int ≥ ০; তিনটির যোগ `== answers.size()`।
- `accuracy` ০–১০০; `percentage` −১০০–১০০; `timeSpentSeconds ≥ ০`।
- `startedAt`/`submittedAt` timestamp; `startedAt ≤ submittedAt ≤ request.time` (ভবিষ্যতে জমা নয়)।
- `status == 'submitted'`; `markingStatus == 'auto'`; `resultLabel == 'practice'`; `trustLevel == 'unverified'`; `resultType == 'practice'`।
- `serverVerifiedScore` অনুপস্থিত বা `null` (ছাত্র কখনো লিখতে পারে না — ভবিষ্যৎ সার্ভার-স্কোরারের জন্য)।
- ঐচ্ছিক অডিট-ক্ষেত্র (উপস্থিত থাকলে ধরন-যাচাই মাত্র, প্রমাণ নয়): `audit` map, `answerHashes` list, `anomalyFlags` list।
- `sessionId == <doc-ID>`।
- বান্ডল: exists + `status == 'published'` + `examSlug` মেলে + kind-সঙ্গতি (#৪) + mock হলে `bundle.mockId == mockId`।
- **সেশন-গেট:** `users/{uid}/jobSessions/{attemptId}` exists + `status == 'submitted'` + `bundleId` মেলে।

### `users/{uid}/jobSessions` — চলমান সেশন (Step 3 §২.১২)

| বিষয় | নিয়ম |
|---|---|
| পড়া | শুধু মালিক বা Moderator |
| তৈরি | শুধু মালিক + সক্রিয়; `validJobSessionCreate()` |
| হালনাগাদ | শুধু মালিক + সক্রিয়, শুধু `status == 'in-progress'` থেকে, শুধু autosave/transition কী (`answers`, `currentQuestion`, `lastSyncedAt`, `updatedAt`, `endsAt`, `clientEndsAtMillis`, `status`, `submittedAt`); `validJobSessionUpdate()` |
| মোছা | **কখনো নয়** — Admin-ও নয় |

**Create-যাচাই:** ১৫টি কী-ই বাধ্য (`hasOnly` + `hasAll`); `kind ∈ ['practice','mock']`; `mockId` — mock হলে string, practice হলে `null`; `bundleId` string; `examSlug ∈ jobExamSlugs()`; `status == 'in-progress'`; `startedAt` timestamp; **`endsAt == null`** (mock-এও — read-back-এর পর একবার বসে); `questionRefs` list, `size ≥ 1`; `answers` map; `currentQuestion` int ≥ ১; `lastSyncedAt` timestamp; `clientEndsAtMillis` — practice হলে `null`, mock হলে `null` বা number; `submittedAt == null`; `createdAt`/`updatedAt` timestamp; বান্ডল exists + Published + examSlug মেলে + kind-সঙ্গতি + mock হলে mockId মেলে।

**Update-যাচাই:** নতুন `status ∈ ['in-progress','submitted','abandoned']`; `submitted` হলে `submittedAt` timestamp বাধ্য, অন্য অবস্থায় `submittedAt == null`; `answers` map; `currentQuestion` int ≥ ১; `lastSyncedAt`/`updatedAt` timestamp; `endsAt` — `null` থেকে **একবার** timestamp-এ বসানো যায়, তারপর আর বদলানো যায় না; practice-এ `endsAt` চিরকাল `null`; `clientEndsAtMillis` — practice-এ চিরকাল `null`, mock-এ `null` বা number। `kind`/`mockId`/`bundleId`/`examSlug`/`questionRefs`/`startedAt`/`createdAt` — `affectedKeys` থেকে বাদ থাকায় কখনো বদলায় না।

### অপরিবর্তিত (Step 7)

`jobQuestions` / `jobQuestionBundles` / `jobQuestionKeys` / `jobReceipts`-এর নিয়মে **একটি অক্ষরও বদলানো হয়নি** — রসিদ = ১০-মিনিটের attempt-বাঁধা উইন্ডো (Option A, একবার-ব্যবহার নয়); "জমা দেওয়া" = client-attested; ফলাফল কখনো Verified নয়। শুধু রসিদ-নোঙরের attempt-ডকের **আকৃতি** বদলেছে (পূর্ণ attempt) — গেটের যুক্তি একই।

---

## Step 7 থেকে যা বদলেছে (পরীক্ষা-ফাইল)

- **`rules-step7-job-questions.test.ts` (৯৫টি কেস, সংখ্যা একই):** `validSubmittedAttempt()` + `validSession()` হেল্পার যোগ; সিডের attempt-গুলো পূর্ণ জমা-দেওয়া আকৃতিতে; in-progress attempt-সিড **মুছে** in-progress **সেশন**-সিড বসানো হয়েছে; পুনর্লিখন — q66 (রসিদ এখন in-progress **সেশন**-ID-তে নোঙর করা — জমা দেওয়া attempt নেই বলে চাবি বন্ধ), q75 (রসিদ-তৈরি in-progress সেশন-ID-তে নোঙর করা — নিষেধ), q80 (in-progress তৈরি → **জমা-দেওয়া attempt তৈরি SUCCEEDS**), q81 (খসড়া বান্ডল — নিষেধ), q82 (আগে-জমা-দেওয়া doc-ID-তে setDoc → নিষেধ — দ্বিতীয় জমা update), q85 (সেশন-bundle অমিল — নিষেধ), q88 (in-progress সেশনে attempt-তৈরি — নিষেধ); q83/q84/q86/q87/q89–q92 অভিপ্রায় একই, আকৃতি নতুন।
- **`rules-step7-adversarial.test.ts` (৩৮টি কেস, সংখ্যা একই):** সিড পূর্ণ আকৃতিতে; in-progress attempt-সিড মুছে সেশন-সিড; **a5 পুনর্লিখন — DOCUMENTED LIMITATION বহাল, কিন্তু বার বেড়েছে:** Step 7-এ খালি জমা (in-progress তৈরি → উত্তর ছাড়া submit) দিয়েই জাল attempt হতো; Step 8-এ খালি জমা **নিয়মে নিষেধ** (answers non-empty + counts-সঙ্গতি + submitted সেশন বাধ্য) — জালিয়াতকে এখন **সুগঠিত** attempt বানাতে হয় (সেশন তৈরি → submitted → পূর্ণ ক্ষেত্র + সঙ্গতিপূর্ণ counts → রসিদ → চাবি)। নিয়ম সুগঠিত জালিয়াতি আর আসল প্রচেষ্টার পার্থক্য করতে পারে না (Spark-এ সার্ভার নেই) — সীমা একই, আক্রমণের খরচ বেড়েছে। a6/a6b/a7/a10/a10b/a11/a12/a13/a28/a29 অভিপ্রায় একই (সিডের attempt-ID-গুলো এখন পূর্ণ আকৃতি; in-progress নোঙর এখন সেশন-ID)।
- **q77/a11-এর `attemptId: 'attempt-inprogress'` মানটি অপরিবর্তিত রাখা হয়েছে** — রসিদ update কখনো হয় না (`if false`), তাই মানটি পড়াই হয় না; শুধু "update নিষেধ" পরীক্ষা করে।

---

## নতুন পরীক্ষা — Step 8 (s1–s64, ৬৪টি কেস)

`emulator-tests/rules-step8-practice-engine.test.ts` — নতুন ফাইল:

| গোষ্ঠী | কেস | বিষয় |
|---|---|---|
| attempt create — বৈধ জমা | s1–s7 (৭) | অনুশীলন জমা; মক জমা; ঐচ্ছিক audit-ক্ষেত্রসহ; `serverVerifiedScore` অনুপস্থিত; ৩-উত্তর (১ সঠিক/১ ভুল −০.২৫/১ অনুত্তরিত); সব-ভুল + ঋণাত্মক percentage; BCS −০.৫ হারে মক জমা |
| attempt create — ক্ষেত্র/লেবেল | s8–s24 (১৭) | ভুল kind; `resultLabel`/`trustLevel`/`resultType` verified; create-এ `in-progress`; `markingStatus` pending; ছাত্র-লেখা `serverVerifiedScore`; counts-অমিল; খালি answers; বান্ডলের চেয়ে বেশি উত্তর; ভুল negativeDeduction (০.৩০); score ≠ clientCalculatedScore; accuracy ১০১; percentage −১০১; mock-এ mockId নেই; practice-এ mockId আছে; অপ্রত্যাশিত ক্ষেত্র |
| attempt create — বান্ডল/পরীক্ষা/সেশন-গেট | s25–s37 (১৩) | খসড়া বান্ডল; অস্তিত্বহীন বান্ডল; অজানা examSlug; examSlug `'common'`; doc-ID ≠ sessionId; in-progress সেশন; বাতিল সেশন; সেশন নেই; সেশন-bundle অমিল; practice-মক-বান্ডল অমিল; mockId-অমিল; অন্যের পাথে তৈরি; সাইন-আউট |
| attempt — পড়া/হালনাগাদ/মোছা | s38–s41 (৪) | দ্বিতীয় জমা (update) নিষেধ; মোছা নিষেধ (ছাত্র + Admin); Moderator-পড়া; অন্য ছাত্রের পড়া নিষেধ |
| session create | s42–s53 (১২) | বৈধ অনুশীলন; বৈধ মক (endsAt null); খসড়া বান্ডল; mockId ছাড়া মক; practice-এ endsAt; practice-এ clientEndsAtMillis; create-এ endsAt বসানো; mockId-অমিল; examSlug-অমিল; খালি questionRefs; `'submitted'`-দিয়ে তৈরি; অন্যের পাথে তৈরি |
| session update | s54–s64 (১১) | অটোসেভ SUCCEEDS; অপরিবর্তনীয় ক্ষেত্র (bundleId) নিষেধ; endsAt একবার-সেট SUCCEEDS তারপর বদল নিষেধ; submit-পরিবর্তন SUCCEEDS তারপর frozen; abandoned-পরিবর্তন SUCCEEDS তারপর frozen; submittedAt ছাড়া submit নিষেধ; submittedAt-সহ abandoned নিষেধ; জমা-দেওয়া সেশনে অটোসেভ নিষেধ; অন্য ছাত্রের হালনাগাদ নিষেধ; মোছা নিষেধ (ছাত্র + Admin); Moderator-পড়া / অন্য ছাত্রের পড়া নিষেধ |

---

## যাচাই-প্রমাণ (Verification evidence)

| পরীক্ষা | ফলাফল |
|---|---|
| পূর্ণ নিয়ম-স্যুট (sequential, `--fileParallelism=false`, alt-পোর্ট 8081/9098, JDK 17, IPv4) | **৬৭৬/৬৭৬ PASS** (১৫ ফাইল; Step 7-এর ৬১২ + Step 8-এর নতুন ৬৪) |
| Step 8 নিয়ম-ফাইল একা | **৬৪/৬৪ PASS** (s1–s64) |
| Step 7 q-ফাইল একা (পুনর্লিখিত) | **৯৫/৯৫ PASS** (q1–q92 + q62a/b, q71a/b, q78b) |
| আক্রমণাত্মক ফাইল একা (পুনর্লিখিত a5-সহ) | **৩৮/৩৮ PASS** (a1–a33 + বিভক্ত কেস) |
| কমিট/পুশ | **হয়নি** — নির্দেশ অনুযায়ী কাজ uncommitted রাখা হয়েছে; সমন্বয়কারী যাচাইয়ের পর কমিট করবেন |
| ব্রাঞ্চ | `jobs/section-structure` (main ছোঁয়া হয়নি; প্রোডাকশন ডেপ্লয় হয়নি; লাইভ Firestore ছোঁয়া হয়নি) |

**চালানো কমান্ড (সবগুলো একই ধাঁচে):** `FIRESTORE_EMULATOR_PORT=8081 JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true" ./node_modules/.bin/firebase emulators:exec --config firebase.alt-ports.json --only firestore,auth "./node_modules/.bin/vitest run <file|emulator-tests/> --fileParallelism=false"` — JDK `~/workspace/eduorbit/tools/jdk-17.0.21.1+2-jre/bin` PATH-এ। আউটপুট `/tmp/step8-test1.log` (Step 8 একা), `/tmp/step7-test1.log` (q-ফাইল), `/tmp/step7adv-test1.log` (আক্রমণাত্মক), `/tmp/step8-full.log` (পূর্ণ স্যুট)।

**এমুলেটর-নয়েজ নোট:** get()-যুক্ত নিয়মের প্রথম মূল্যায়নে এমুলেটর মাঝে মাঝে `evaluation error at L2833:24` (বা L2847/L2849) লেখে, তারপর রিট্রাইয়ে পরিষ্কার `false` ফেরে — **এটি Step 7-এও ছিল** (q-ফাইলে ২৭ বার, তবু ৯৫/৯৫ PASS)। বৈধ পথগুলো (s1–s7) পরিষ্কারভাবে পাস করে; নিষেধ-পরীক্ষাগুলোতে error-বনাম-false ফলাফল বদলায় না (দুটোই deny)। এটি নিয়মের ত্রুটি নয় — এমুলেটরের মূল্যায়ন-লগের বৈশিষ্ট্য; প্রোডাকশনে error-ও deny-ই হয়।

**সাইন-ইন ব্রাউজার click-through সৎভাবে করা হয়নি** (এই সেশনে লাইভ ব্রাউজার নেই) — দাবি করা হয় না। Step 8-এ কোনো নতুন পাতা/UI নেই (শুধু নিয়ম + পরীক্ষা), তাই click-through-এর সুযোগ ইঞ্জিন-UI-তে (অন্য এজেন্টের কাজ)।

---

## সৎ ফাঁক (Honest gaps — Step 8-এ যা হয়নি)

1. **Per-answer আকৃতি নিয়মে নেই** (§সিদ্ধান্ত #৭): প্রতি উত্তরের topicId/correct/marks-যাচাই lib-ভ্যালিডেটরের উপর নির্ভরশীল — lib-এ বাগ থাকলে ভুল-আকৃতির উত্তর ঢুকতে পারে (aggregate-গুলো তবু নিয়মে ধরা পড়বে)।
2. **Exact স্কোর-সূত্র নিয়মে নেই** (#৫): স্কোরের exact যাচাই lib-স্তরে; নিয়ম শুধু আসন্ন মান + সীমা ধরে।
3. **"জমা দেওয়া" এখনো client-attested** (Step 7 P0-02 বহাল): সুগঠিত জাল attempt + রসিদ দিয়ে চাবি পড়া যায় — a5 প্রমাণ করে। ফলাফল কখনো Verified নয়; সার্ভার-সাইড স্কোরিংয়ে Blaze দরকার (অনুমোদন নেই, ৳০ বাজেট)।
4. **মক-দেরির গ্রেস নেই** (#২): সময় পেরিয়ে জমা দেওয়া মক ক্লায়েন্টের `abandoned` চিহ্নের উপর নির্ভরশীল — নিয়ম তা যাচাই করে না।
5. **App Check স্থগিত** (Step 7 P2-03 বহাল): Step 17 নিরাপত্তা-পরীক্ষার প্রার্থী।
6. **অগ্রগতি-প্রসার Steps 10–11-এর; ভুল-উত্তর নোটবুক UI Step 13-এর** — এই ধাপে attempt/session-ডক শুধু সংরক্ষিত হয়, অগ্রগতিতে যোগ হয় না।
7. **সাবকালেকশন ব্যাকআপ সীমা বহাল** (Step 3 §৯.৩): `jobAttempts`/`jobSessions` ক্লায়েন্ট-এক্সপোর্টে আসে না — সম্পূর্ণ এক্সপোর্টে Firebase কনসোল বা Admin-SDK লাগে।
8. **`previous` বান্ডলের practice-সঙ্গতি (#৪) একটি সিদ্ধান্ত, যাচাইকৃত ব্যবহার নয়** — বিগত-বছরের সেট practice-ধাঁচে চলবে ধরে নেওয়া হয়েছে; মক-ধাঁচে চালাতে চাইলে নিয়ম বদলাতে হবে।

---

## UI/ইঞ্জিন এজেন্টের জন্য — বৈধ attempt-এর আকৃতি (চুক্তি)

জমার প্রবাহ (ক্রম বাধ্য — নিয়মে বলবৎ):

1. **সেশন তৈরি** — `users/{uid}/jobSessions/{newId}` (`status: 'in-progress'`, `endsAt: null`; মকে `endsAt` পরে read-back করে **একবার** বসাতে হয়)।
2. **অটোসেভ** (ঐচ্ছিক, চলাকালীন) — শুধু `answers`/`currentQuestion`/`lastSyncedAt`/`updatedAt` (+ মকে `endsAt` একবার)।
3. **সেশন submitted করো** — `update({status: 'submitted', submittedAt: serverTimestamp()})`।
4. **attempt তৈরি করো** — `users/{uid}/jobAttempts/{sameId}` (doc-ID == session-ID), নিচের আকৃতিতে।
5. **রসিদ তৈরি করো** — `jobReceipts/{uid}_{bundleId}` (`attemptId` = attempt-ডকের ID) — তারপর ১০ মিনিটের ভেতরে চাবি পড়া যায়।

```ts
// users/{uid}/jobAttempts/{sessionId} — create-মাত্র, status সবসময় 'submitted'
{
  userId: string,            // == path uid
  kind: 'practice' | 'mock',
  mockId: string | null,     // mock হলে আবশ্যিক; practice হলে null
  bundleId: string,          // Published বান্ডল; examSlug/kind/mockId বান্ডলের সঙ্গে মিলতে হবে
  examSlug: string,          // 14টি প্রামাণিক স্লাগের একটি ('common' নয়)
  subjectId: string | null,  // অনুশীলনের পরিসর; মকে null হতে পারে
  topicId: string | null,    // অনুশীলনের পরিসর; মকে null হতে পারে
  answers: [{                // non-empty; সংখ্যা <= বান্ডলের questionCount
    n: number,
    questionId: string,
    topicId: string,         // বাধ্য (lib-যাচাই)
    subjectId: string,       // বাধ্য (lib-যাচাই)
    selected: 'A' | 'B' | 'C' | 'D' | null,
    correct: boolean,        // বাধ্য (lib-যাচাই)
    marks: number,           // সঠিক >= 0; ভুল-উত্তর <= 0; অনুত্তরিত == 0 (lib-যাচাই)
    correctText: string | null,
    timeSpentSeconds: number,
  }],
  score: number,             // == clientCalculatedScore; -totalMarks <= score <= totalMarks
  totalMarks: number,        // > 0
  negativeDeduction: number, // == wrongCount*0.25 অথবা wrongCount*0.5
  correctCount: number,      // int >= 0
  wrongCount: number,        // int >= 0
  unansweredCount: number,   // int >= 0
  // correctCount + wrongCount + unansweredCount == answers.length
  accuracy: number,          // 0..100 (= correct / answered * 100, lib-হিসাব)
  percentage: number,        // -100..100 (= score / totalMarks * 100, lib-হিসাব; ঋণাত্মক হতে পারে)
  timeSpentSeconds: number,  // >= 0
  startedAt: Timestamp,      // <= submittedAt
  submittedAt: Timestamp,    // <= এখন (serverTimestamp)
  status: 'submitted',       // একমাত্র মান
  markingStatus: 'auto',     // একমাত্র মান
  resultLabel: 'practice',   // UI-তে: "অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়"; কখনো 'verified' নয়
  clientCalculatedScore: number, // == score
  // serverVerifiedScore: লিখো না (অনুপস্থিত বা null) — ছাত্র লিখলে নিয়ম প্রত্যাখ্যান করে
  trustLevel: 'unverified',  // সবসময়
  resultType: 'practice',    // সবসময়
  sessionId: string,         // == doc-ID
  audit: { userAgent: string, ipHash: string } | null,  // ঐচ্ছিক; IP কখনো সরাসরি নয় — হ্যাশ মাত্র
  answerHashes: string[] | null,   // ঐচ্ছিক, অডিট-মাত্র (নিয়ম পুনঃহিসাব করে না)
  anomalyFlags: string[] | null,   // ঐচ্ছিক, যেমন ['too-fast'] — Admin-পর্যালোচনার চিহ্ন মাত্র
}
```

```ts
// users/{uid}/jobSessions/{sessionId} — create + in-progress-এ হালনাগাদ + একবার terminal-পরিবর্তন
{
  kind: 'practice' | 'mock',
  mockId: string | null,     // mock হলে আবশ্যিক; practice হলে null
  bundleId: string,          // Published বান্ডল
  examSlug: string,          // 14টি প্রামাণিক স্লাগের একটি
  status: 'in-progress' | 'submitted' | 'abandoned',  // তৈরি 'in-progress' দিয়ে; PAUSED এখানে নেই
  startedAt: Timestamp,      // serverTimestamp
  endsAt: Timestamp | null,  // practice: সবসময় null; mock: তৈরি null, পরে একবার বসে, আর বদলায় না
  questionRefs: [{ bundleId: string, n: number, questionId: string }],  // non-empty
  answers: { [n: string]: { selected: 'A'|'B'|'C'|'D'|null, markedForReview: boolean, timeSpentSeconds: number } },
  currentQuestion: number,   // >= 1
  lastSyncedAt: Timestamp,
  clientEndsAtMillis: number | null,  // practice: সবসময় null; mock: অফলাইন-টাইমারের জন্য
  submittedAt: Timestamp | null,      // 'submitted' হলেই বসে
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

**ইঞ্জিন-এজেন্টের জন্য সতর্কতা:** (ক) attempt তৈরির আগে সেশন `submitted` করতেই হবে — উল্টো ক্রম নিয়মে ব্যর্থ হয়; (খ) `serverVerifiedScore` কখনো লিখো না; (গ) প্রতি উত্তরে `topicId` + `correct` + marks-চিহ্ন lib-ভ্যালিডেটরে বলবৎ করো — নিয়ম তা দেখতে পায় না; (ঘ) ফলাফল-পাতায় সবসময় "অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়" লেবেল বাধ্য; (ঙ) বাতিল (`abandoned`) সেশনে attempt তৈরি করো না — নিয়ম তা প্রত্যাখ্যান করে, ছাত্রকে "আবার দিন" (নতুন সেশন) দিতে হয়।

---

## ফাইল-তালিকা (এই ধাপে বদলেছে / নতুন)

| ফাইল | পরিবর্তন |
|---|---|
| `firestore.rules` | `jobAttempts` ম্যাচ পুনর্লিখন + `jobSessions` ম্যাচ নতুন + ৬টি হেল্পার (net +~২২৪ লাইন; ২৬৪০ → ২৮৬৪ লাইন) |
| `emulator-tests/rules-step8-practice-engine.test.ts` | **নতুন** — ৬৪টি কেস (s1–s64) |
| `emulator-tests/rules-step7-job-questions.test.ts` | পুনর্লিখন — নতুন মডেলের হেল্পার/সিড + q66/q75/q80–q92 (৯৫টি কেস, সংখ্যা একই) |
| `emulator-tests/rules-step7-adversarial.test.ts` | পুনর্লিখন — নতুন মডেলের হেল্পার/সিড + a5 (৩৮টি কেস, সংখ্যা একই) |
| `team/job-rules-step8.md` | **নতুন** — এই রিপোর্ট |

**ছোঁয়া হয়নি:** `src/lib/*`, `src/pages/*`, `src/App.tsx` (অন্য এজেন্টের); `jobQuestions`/`jobQuestionBundles`/`jobQuestionKeys`/`jobReceipts` নিয়ম; main ব্রাঞ্চ; প্রোডাকশন; লাইভ Firestore। **কমিট/পুশ হয়নি** — কাজ uncommitted আছে (সমন্বয়কারী যাচাইয়ের পর কমিট করবেন)। নোট: `src/lib/jobEngine.ts` + `src/lib/__tests__/jobEngine.test.ts` এই worktree-তে untracked আছে — অন্য এজেন্টের সমান্তরাল কাজ; এই ধাপে ছোঁয়া হয়নি।
