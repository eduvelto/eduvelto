# চাকরির প্রস্তুতি — MCQ Practice Engine: নিয়ম (Step 8, CORE)

**তারিখ:** ২২ নভেম্বর ২০২৬ ~১৩:৩০–১৪:০০ Asia/Dhaka · **ধরন:** বাস্তবায়ন রিপোর্ট — নিয়ম + পরীক্ষা
**পরিসর:** Job Preparation সেকশন ONLY · **ব্রাঞ্চ:** `jobs/section-structure`
**ভিত্তি:** `team/job-architecture-schema-step3.md` §২.১১, §২.১২, §৩.৮, §৪, §৫ · Step 7 রিপোর্ট (`team/job-question-bank-step7.md`, CLOSED) · Step 7 ফোল্ড-ইন (রসিদ = ১০-মিনিটের attempt-বাঁধা উইন্ডো, "জমা দেওয়া" = client-attested)
**বাজেট:** ৳০ — কোনো পেইড সার্ভিস নয় · **মার্জ/প্রোডাকশন ডেপ্লয়:** হয়নি · **লাইভ ডাটাবেস:** ছোঁয়া হয়নি (শুধু এমুলেটর)
**অবস্থা:** **Step 8 নিয়ম সম্পূর্ণ + ChatGPT ফোল্ড-ইন সম্পূর্ণ** — পূর্ণ নিয়ম-স্যুট ৬৯৬/৬৯৬ PASS (নিচে §যাচাই-প্রমাণ) · ফোল্ড-ইন: USED ৮ / ADAPTED ২ / REJECTED ১ (finding #৮ খোলা কনটেন্ট-ব্লকার — Step 8 বন্ধ হয়নি)

---

## সারসংক্ষেপ

Step 7-এর সর্বনিম্ন attempt-নোঙরকে **পূর্ণ attempt**-এ বদলানো হয়েছে (Step 3 §২.১১) আর **নতুন `users/{uid}/jobSessions`** সাবকালেকশন যোগ করা হয়েছে (Step 3 §২.১২) — অনুশীলন + মক, এক ইঞ্জিন, এক নিয়ম-সেট। attempt ডক তৈরি হয় **জমার মুহূর্তে একবার**, `status: 'submitted'` + পূর্ণ ক্ষেত্রসহ; চলমান অবস্থা (অটোসেভ/পুনরুদ্ধার) থাকে সেশনে। রসিদ/চাবির নিয়ম (Step 7) আচরণে **অপরিবর্তিত** — রসিদ এখনো ১০-মিনিটের attempt-বাঁধা উইন্ডো, নোঙর এখনো জমা-দেওয়া attempt; শুধু নোঙরের আকৃতি বদলেছে (নিচে §Step 7 থেকে যা বদলেছে)। **ব্যাংক এখনো খালি — ০টি প্রশ্ন, ০টি বান্ডল, ০টি চাবি, ০ যাচাইকৃত শিক্ষক।** এই ধাপে কোনো lib/UI লেখা হয়নি — `src/lib/jobEngine.ts` + UI অন্য এজেন্টের (এই রিপোর্ট শুধু নিয়ম + পরীক্ষা)।

**যা করা হয়েছে:** `firestore.rules` (+~২২৪ লাইন নিট core + ফোল্ড-ইন ~৬৫ লাইন): `jobAttempts` ম্যাচ সম্পূর্ণ পুনর্লিখন + `jobSessions` ম্যাচ নতুন + ৬টি হেল্পার (`jobBundleData`, `jobSessionDataAfter`, `jobBundleKindFitsAttemptKind`, `validJobAttemptCreate`, `validJobSessionCreate`, `validJobSessionUpdate`)। পরীক্ষা: নতুন ফাইল `emulator-tests/rules-step8-practice-engine.test.ts` (**৭৮টি কেস s1–s78** — core ৬৪ + ফোল্ড-ইন ১৪) + Step 7-এর দুটি পরীক্ষা-ফাইল নতুন মডেলে পুনর্লিখন (q66, q75, q80–q92; a5)।

---

## সিদ্ধান্ত (Step 7 / Step 3 খসড়া থেকে বিচ্যুতি — সব রেকর্ড করা)

### ১. Create-at-submit — Step 7-এর নোঙর-জীবনচক্র বাতিল, প্রতিস্থাপন নয়

Step 7-এ attempt তৈরি হতো `in-progress` অবস্থায়, তারপর ঠিক একবার হালনাগাদ হয়ে `submitted` হতো। Step 8 সেই জীবনচক্র **বাতিল** করেছে: attempt ডক তৈরি হয় **জমার মুহূর্তে একবার**, `status: 'submitted'` + পূর্ণ ক্ষেত্রসহ; চলমান অবস্থা থাকে `jobSessions`-এ। কারণ:

- **অনাথ in-progress attempt থাকে না।** মোছা সবার জন্য নিষিদ্ধ (Admin-সহ) — Step 7-মডেলে কোনো ছাত্র পরীক্ষা শুরু করে শেষ না করলে একটি `in-progress` attempt-ডক চিরকাল পড়ে থাকত, যা কেউ মুছতে পারত না। নতুন মডেলে অসমাপ্ত প্রচেষ্টার চিহ্ন থাকে শুধু সেশনে (`abandoned`), আর attempt তৈরি হয় শুধু জমা দিলেই।
- **Step 3 §২.১১-এর সঙ্গে সঙ্গতি:** "doc-ID = session ID = idempotency key: একই ID-তে দ্বিতীয় জমা নিয়মে `update` হিসেবে গণ্য হয় ও নিষিদ্ধ" — নতুন মডেলে এটাই আক্ষরিক সত্য (create-মাত্র, update কখনো নয়)।
- **রসিদ-গেট অপরিবর্তিত:** রসিদ তৈরির নিয়ম এখনো `status == 'submitted'` attempt চায় — শুধু সেই attempt-এর আকৃতি এখন পূর্ণ। q64/q65/q73/q75/q76-এর নিরাপত্তা-অভিপ্রায় একই আছে, পরীক্ষাগুলো নতুন আকৃতিতে পুনর্লিখিত হয়েছে।

### ২. সেশন-গেট — attempt তৈরিতে সেশন `submitted` হতেই হবে (ফোল্ড-ইন M2: `getAfter()` + identity-বাঁধা)

Step 3 §৩.৮-এর খসড়া attempt তৈরিতে সেশন `in-progress` + সময়সীমা-গ্রেস চেয়েছিল। Step 8 তার **উল্টো** সিদ্ধান্ত নিয়েছে: attempt তৈরি হতে হলে **একই doc-ID-র সেশনটি ইতিমধ্যে `submitted`** হতে হবে, একই bundle-এর জন্য। ফোল্ড-ইন M2-এ গেটটি আরও কঠোর হয়েছে: attempt-নিয়ম `getAfter()` দিয়ে সেশনের **জমা-পরবর্তী** অবস্থা পড়ে — অর্থাৎ একই batched write-এ সেশন submitted + attempt তৈরি একসঙ্গে যাচাই হয় (ক্রমিক প্রবাহও চলে: `getAfter()` ব্যাচে না-থাকা সেশনে সংরক্ষিত ডকই পড়ে)। গেট বাঁধে: `status == 'submitted'` + `bundleId` + `kind` + `examSlug` + `mockId` + `questionRefs.size() == answers.size()` — attempt সেশনের চেয়ে বেশি/কম প্রশ্নের উত্তর বয়ে আনতে পারে না (পরীক্ষা s76)। কারণ:

- **জমার ক্রম একটাই:** ক্লায়েন্ট জমার প্রবাহে এক batched write-এ সেশন `submitted` করে (`submittedAt` + `revision` +১ সহ) আর attempt তৈরি করে, তারপর রসিদ তৈরি করে। সেশন-গেট সেই ক্রমকে নিয়মে বাঁধে — সেশন ছাড়া, চলমান সেশনে, বা বাতিল সেশনে attempt তৈরি হয় না (পরীক্ষা s30/s31/s32)।
- **kind/examSlug/mockId আর transitive নয়** — M2-এর আগে তা transitively আসত (একই বান্ডলের সঙ্গে বাঁধা বলে); এখন নিয়ম সরাসরি সেশনের সঙ্গে মেলায় (পরীক্ষা s77/s78 — batched জমা SUCCEEDS, stale revision-সহ batched জমা atomically DENIED, কোনো attempt তৈরি হয় না)।
- **মক-দেরির গ্রেস নেই:** খসড়ার ১৫-মিনিটের endsAt-গ্রেস বাদ দেওয়া হয়েছে — গ্রেস যাচাই করতে সেশনের `endsAt` পড়তে হতো, আর সেশন `submitted` হওয়ার মুহূর্তটাই ক্লায়েন্ট ঠিক করে। দেরিতে জমা দেওয়া মক (গ্রেস পেরিয়ে) ক্লায়েন্ট `abandoned` হিসেবে চিহ্নিত করে, আর বাতিল সেশনে attempt তৈরি হয় না। এটি client-trust সীমারই অংশ (§সৎ ফাঁক)।

### ৩. examSlug — প্রামাণিক ১৪টি হাব-স্লাগ; `'common'` নেই

`examSlug` allowlist হলো `jobExamSlugs()`-এর **১৪টি প্রামাণিক হাব-স্লাগ** (`bcs`, `bank`, `primary-teacher`, `ntrca`, `dgfood`, `bpsc-non-cadre`, `cag`, `bfsa`, `others`, `ministries`, `defence`, `autonomous`, `private-ngo`, `it-professional` — `src/lib/jobProfile.ts`-এর `TARGET_EXAM_SLUGS`-এর সঙ্গে একই)। হস্তান্তরে উদাহরণ হিসেবে লেখা `'common'` **অন্তর্ভুক্ত করা হয়নি**: `/jobs/common` একটি ক্রস-পরীক্ষা হাব/রুট, পরীক্ষা নয় — `TARGET_EXAM_SLUGS`/`JOB_EXAMS`-এ `'common'` নেই, তাই তা যোগ করা হতো স্লাগ বানানো ("do NOT invent slugs" নির্দেশের বিরুদ্ধে)। কমন-টপিক অনুশীলনেও attempt-এ থাকে অন্তর্নিহিত পরীক্ষার স্লাগ (যেমন `bcs`)। পরীক্ষা s28 এই সিদ্ধান্তকে পিন করে।

### ৪. বান্ডল-kind সঙ্গতি — অনুশীলন ↔ টপিক/বিগত, মক ↔ মক/দৈনিক/সাপ্তাহিক

attempt ও সেশন — দুটোতেই: `kind: 'practice'` হলে বান্ডলের `kind` হতে হবে `'topic'` বা `'previous'` (বিগত-বছরের সেট টপিক-ধাঁচে অনুশীলন করা হয়); `kind: 'mock'` হলে `'mock'`/`'daily'`/`'weekly'` (দৈনিক/সাপ্তাহিক বান্ডল মক-ধরনের — ID `daily__{mockId}`/`weekly__{mockId}`)। মকে বান্ডলের `mockId` == attempt/session-এর `mockId` বাধ্য। এটি Step 3-এ স্পষ্ট লেখা ছিল না — Step 8-এর নতুন সিদ্ধান্ত; পরীক্ষা s34/s35/s49 পিন করে।

### ৫. নেগেটিভ-ডিডাকশন — exact সূত্র (ফোল্ড-ইন M1: `negativeMarkingUsed`-এর বিরুদ্ধে)

`score == correctCount*marksPerQuestion − wrongCount*negativeMarking` — এই exact formula নিয়মে যাচাই করা **যায় না**: `marksPerQuestion`/`negativeMarking` attempt-এ সংরক্ষিত নয়, আর নিয়ম `jobExams`-এর `rulesConfig` পড়ে না (get()-বাজেটের কারণে — নিচে #৮)। ফোল্ড-ইন M1-এ যা বলবৎ হয়:

- `negativeMarkingUsed ∈ {0, 0.25, 0.5}` (attempt-এ সংরক্ষিত, যে হার প্রয়োগ হয়েছে) + `markingSchemeVersion` non-empty (≤১০০ অক্ষর) + `bundleVersion` int ≥ ১।
- **`negativeDeduction == wrongCount * negativeMarkingUsed`** — exact, আর আসন্ন মান নয় (আগের `wrongCount*0.25 বা *0.5` বাতিল)। ব্যাংকে `negativeMarkingUsed == 0` বলে deduction ০-ই হতে হবে — ব্যাংক ০.২৫ দাবি করলে নিয়ম প্রত্যাখ্যান করে (পরীক্ষা s65–s70)।
- `score == clientCalculatedScore` + আলগা সীমা `−totalMarks ≤ score ≤ totalMarks` (marksPerQuestion ≥ ১ ও negative ≤ ০.৫ ধরে — সব যাচাইকৃত ধরনে সত্য)।
- per-answer marks-চিহ্নের exact যাচাই lib-স্তরে (`jobEngine.ts` — ভ্যালিডেটর v9–v12: সঠিক == ১, ভুল == −negativeMarkingUsed) — নিয়মে নয়।

### ৬. Float সীমা — accuracy/percentage শুধু পরিসর-যাচাই

নিয়ম float ভাগ নির্ভরযোগ্যভাবে যাচাই করতে পারে না — তাই `accuracy` (০–১০০) ও `percentage` (−১০০–১০০) শুধু **পরিসর** বাধ্য; মানগুলো client-computed + range-checked। `accuracy = correct ÷ answered × 100`, `percentage = score ÷ totalMarks × 100` — এই সূত্রের যাচাই lib-স্তরে।

### ৭. Per-answer আকৃতি — নিয়মে যাচাই অসম্ভব (Step 7 সিদ্ধান্ত #৭ বহাল)

Firestore নিয়মে তালিকার ইনডেক্সিং নেই — প্রতি উত্তরের `{topicId, subjectId, correct, marks, ...}` আকৃতি নিয়ম যাচাই **করতে পারে না**। প্রতি উত্তরে `topicId` + `correct` বাধ্যতামূলক — এই Step 3 চুক্তি তাই **lib-ভ্যালিডেটরে** (`jobEngine.ts`) বলবৎ হবে, নিয়মে নয়। নিয়ম বলবৎ করে aggregate-গুলো: `answers` non-empty ও `≤ bundle.questionCount`; `correctCount+wrongCount+unansweredCount == answers.size()`; marks-সঙ্গতি (সঠিক ⇒ marks ≥ ০, ভুল-উত্তর ⇒ marks ≤ ০, অনুত্তরিত ⇒ marks == ০) — **এই শেষটি বাস্তবায়িত হয়নি**: marks-চিহ্ন যাচাইয়ের জন্য প্রতিটি উত্তরে পৌঁছতে হয়, যা নিয়মে অসম্ভব (একই কারণ)। সৎভাবে রেকর্ড করা হলো: marks-চিহ্ন যাচাই lib-স্তরেই থাকবে; নিয়মে শুধু aggregate + negativeDeduction-আসন্ন মান। (হস্তান্তরের "correct==true ⇒ marks>=0 ..." শর্তটি নিয়মে লেখা যায়নি — per-answer অ্যাক্সেস নেই বলেই।)

### ৮. get()-বাজেট — attempt create ৩টি ভিন্ন ডক পড়ে (ফোল্ড-ইন M2-এ সংশোধিত গণনা)

Firestore-এর নথিভুক্ত সীমা (প্রতি অনুরোধে ১০টি get()/exists() কল) — একই ডকে বারবার get() ক্যাশ হয় ও একবার গণনা করা হয়, তাই গণনা **ভিন্ন ডক** দিয়ে: attempt create পড়ে **৩টি** ডক — কলারের `users/{uid}` (ভূমিকা + সক্রিয়তা), বান্ডল `jobQuestionBundles/{bundleId}` (exists + status/examSlug/kind/mockId/questionCount/bundleVersion), সেশন `users/{uid}/jobSessions/{attemptId}` (exists + `getAfter()`-এ জমা-পরবর্তী অবস্থা)। সেশন create ৬টি কলের ভেতরে, সেশন update ১টি। পুরনো "ঠিক ১০টি" গণনাটি প্রতিটি get()-এক্সপ্রেশনকে আলাদা কল ধরে ভুল ছিল — একই ডকের ৬টি `jobBundleData()` এক্সপ্রেশন ৬টি কল নয়; স্যুট পাস করাই (৬৯৬/৬৯৬, batched জমা s77/s78-সহ) এর প্রমাণ। সেশন-kind/examSlug/mockId আর transitive নয় — M2-এ সরাসরি মেলানো হয় (#২ দেখুন)। লক্ষণীয়: Step 7-এর চাবি-পড়ার পথে ইতিমধ্যে ~১২টি কল-এক্সপ্রেশন আছে (একই ৩টি ডকে বারবার get) আর এমুলেটরে তা চলে — তাই বারবার get একই পাথে সমস্যা নয় বলেই মনে হয়; তবু Step 8 নতুন পথটিকে ৩টি ভিন্ন ডকের ভেতরে রেখেছে।

### ৯. সেশন-মোছা — এই নিয়ম-সেটে কোনো `allow` নেই (ফোল্ড-ইন M4, ChatGPT finding #১১ — সঠিক বক্তব্য)

`jobSessions` মোছার **এই নিয়ম-সেটে কোনো `allow` নেই** — কোনো ক্লায়েন্ট (Owner/Admin/Moderator/ছাত্র) তা করতে পারে না। আগের বক্তব্য ("মোছা কখনো নয় — Admin-ও নয়") ভুল ছিল: নিয়ম-পরিবর্তন বা Admin SDK (যা নিয়ম এড়িয়ে চলে) ডক বদলাতে/মুছতে পারে — নিয়ম শুধু ক্লায়েন্ট-পথ বন্ধ করে। বাতিল সেশন মুছে ফেললে "পরীক্ষা শুরু করে শেষ করেনি" — এই তথ্যই হারিয়ে যেত; attempt তৈরি না-হওয়াই বাতিলের পরিণতি, সেশন-ডক রেখে দেওয়াই অডিট-ট্রেইল। (attempt-এর update/delete-তেও এই নিয়ম-সেটে কোনো `allow` নেই — একই সীমা।)

### ১০. PAUSED সেশন-ডকে নেই

Step 2 §৪.৫-এর `PAUSED` শুধু অনুশীলনে **ক্লায়েন্ট-সাইড** অবস্থা (`IN_PROGRESS → PAUSED → IN_PROGRESS`) — সেশন-ডকের `status` কখনো `'paused'` হয় না; সার্ভারে সেশন `in-progress`-ই থাকে। নিয়মে `paused` যোগ করা হয়নি (পরীক্ষায় সরাসরি পিন করা হয়নি — সেশন create-এ `status == 'in-progress'` বাধ্য বলেই অন্য মান প্রত্যাখ্যাত হয়; s52 `'submitted'`-দিয়ে-তৈরি নিষেধের পরীক্ষা একই পথের প্রমাণ)।

### ১১. Revision-ভিত্তিক অটোসেভ concurrency (ফোল্ড-ইন M2, ChatGPT finding #৬)

সেশনে `revision` — তৈরি ১, প্রতি লেখায় ঠিক +১। নিয়ম বাঁধে: তৈরি `revision == 1`; হালনাগাদ `revision == old.revision + 1` (stale বা skip — দুটোই DENIED, পরীক্ষা s72/s73); জমা-দেওয়া/বাতিল সেশনে আর কোনো লেখাই হয় না (terminal-পরিবর্তনের পর update-নিয়মের `old.status == 'in-progress'` শর্তই ব্যর্থ হয় — জমা-দেওয়া সেশনে অটোসেভ নিষেধ, s61)। অটোসেভ-ক্ষেত্রে আকার/ধরন-সীমা: `answers.size() <= old.questionRefs.size()`, `currentQuestion <= old.questionRefs.size()`; কাউন্টার উত্তর থেকে হিসাব হয় (সেশনে আলাদা কাউন্টার-ক্ষেত্র নেই)। **নিয়ম rate-limit করতে পারে না** — Step 2 §৪.৬-এর throttling (৩০ সেকেন্ড / ৫ পরিবর্তন / পাতা-লুকানো) ক্লায়েন্ট-মাত্র; একটানা লেখা নিয়মে আটকানো যায় না — নথিভুক্ত সীমা।

### ১২. অনুশীলন-চাবির সাইন-ইন পাঠ = ইচ্ছাকৃত সীমা (ফোল্ড-ইন M4, ChatGPT finding #৪)

Published অনুশীলন-বান্ডলের চাবি সাইন-ইন থাকা ছাত্র সরাসরি পড়তে পারে (তাৎক্ষণিক ফিডব্যাক) — এটি নকশার সিদ্ধান্ত, ভুল নয়। চাবি প্রশ্ন-ডক থেকে আলাদা ডকে থাকে; খসড়া/বাতিল/অপ্রকাশিত চাবি অপাঠ্য (নিয়মে বাঁধা); প্রকাশিত সেট সংস্করণ-বাঁধা (`configVersion` মিলতে হবে — Step 7 P1-06); মক-চাবি অনুশীলন-পথে কখনো খোলে না — মক-চাবি রসিদ-পথেই (Step 9)। সীমা: একজন দৃঢ়প্রতিজ্ঞ ছাত্র সুগঠিত জাল attempt + রসিদ দিয়ে চাবি পড়তে পারে (a5 বহাল) — তাই ফলাফল কখনো Verified নয়।

### ১৩. Step 9 টাইমার-নকশার নোট (ফোল্ড-ইন M4, ChatGPT finding #১০ — নোট মাত্র)

মক-টাইমার সংরক্ষিত deadline (`endsAt` / `clientEndsAtMillis`) থেকে চলবে — reload-এ কখনো reset নয়; deadline client-attested (Spark-এ সার্ভার নেই বলে নিয়ম তা যাচাই করতে পারে না)। এই ধাপে মক টাইমার বানানো হয়নি — Step 9-এর হস্তান্তরে নথিভুক্ত।

---

## নিয়ম-সারসংক্ষেপ (firestore.rules)

### `users/{uid}/jobAttempts` — পূর্ণ attempt (Step 3 §২.১১)

| বিষয় | নিয়ম |
|---|---|
| পড়া | শুধু মালিক বা Moderator (`isOwner \|\| isModerator`) |
| তৈরি | শুধু মালিক + সক্রিয় (`isOwner && callerActive()`); `validJobAttemptCreate()` |
| হালনাগাদ / মোছা | এই নিয়ম-সেটে কোনো `allow` নেই (`if false`) — কোনো ক্লায়েন্ট (Owner/Admin-সহ) তা করতে পারে না (নিয়ম-পরিবর্তন বা Admin SDK আলাদা পথ — §সিদ্ধান্ত #৯) |

**Create-যাচাই (`validJobAttemptCreate`, `d = request.resource.data`):**

- কী-সেট: ঠিক অনুমোদিত ৩৩টি কী-র ভেতরে (`hasOnly`) + ২৯টি বাধ্য কী উপস্থিত (`hasAll` — `serverVerifiedScore`/`audit`/`answerHashes`/`anomalyFlags` ঐচ্ছিক)।
- `userId == <path uid>`; `kind ∈ ['practice','mock']`; `mockId` — mock হলে non-empty string, practice হলে `null`।
- `bundleId` string; `examSlug ∈ jobExamSlugs()` (১৪টি); `subjectId`/`topicId` string-বা-null (≤২০০ অক্ষর)।
- `answers` list, `size ≥ 1`, `size ≤ bundle.questionCount`।
- `score` number; `totalMarks` number > ০; `−totalMarks ≤ score ≤ totalMarks`; `clientCalculatedScore == score`।
- `negativeDeduction ≥ ০` এবং `== wrongCount * negativeMarkingUsed` (exact — ফোল্ড-ইন M1)।
- `negativeMarkingUsed ∈ {0, 0.25, 0.5}`; `markingSchemeVersion` non-empty (≤১০০); `bundleVersion` int ≥ ১, বান্ডলের `bundleVersion`-এর সঙ্গে মিলতে হবে।
- `correctCount`/`wrongCount`/`unansweredCount` int ≥ ০; তিনটির যোগ `== answers.size()`।
- `accuracy` ০–১০০; `percentage` −১০০–১০০; `timeSpentSeconds ≥ ০`।
- `startedAt`/`submittedAt` timestamp; `startedAt ≤ submittedAt ≤ request.time` (ভবিষ্যতে জমা নয়)।
- `status == 'submitted'`; `markingStatus == 'auto'`; `resultLabel == 'practice'`; `trustLevel == 'unverified'`; `resultType == 'practice'`।
- `serverVerifiedScore` অনুপস্থিত বা `null` (ছাত্র কখনো লিখতে পারে না — ভবিষ্যৎ সার্ভার-স্কোরারের জন্য)।
- ঐচ্ছিক অডিট-ক্ষেত্র (উপস্থিত থাকলে ধরন-যাচাই মাত্র, প্রমাণ নয়): `audit` map, `answerHashes` list, `anomalyFlags` list।
- `sessionId == <doc-ID>`।
- বান্ডল: exists + `status == 'published'` + `examSlug` মেলে + kind-সঙ্গতি (#৪) + mock হলে `bundle.mockId == mockId` + `bundle.bundleVersion == attempt.bundleVersion`।
- **সেশন-গেট (`getAfter()` — ফোল্ড-ইন M2):** `users/{uid}/jobSessions/{attemptId}` exists + জমা-পরবর্তী `status == 'submitted'` + `bundleId`/`kind`/`examSlug`/`mockId` মেলে + `questionRefs.size() == answers.size()`।

### `users/{uid}/jobSessions` — চলমান সেশন (Step 3 §২.১২)

| বিষয় | নিয়ম |
|---|---|
| পড়া | শুধু মালিক বা Moderator |
| তৈরি | শুধু মালিক + সক্রিয়; `validJobSessionCreate()` |
| হালনাগাদ | শুধু মালিক + সক্রিয়, শুধু `status == 'in-progress'` থেকে, শুধু autosave/transition কী (`answers`, `currentQuestion`, `lastSyncedAt`, `updatedAt`, `endsAt`, `clientEndsAtMillis`, `status`, `submittedAt`, `revision`); `validJobSessionUpdate()` |
| মোছা | এই নিয়ম-সেটে কোনো `allow` নেই — কোনো ক্লায়েন্ট তা করতে পারে না (§সিদ্ধান্ত #৯) |

**Create-যাচাই:** ১৬টি কী-ই বাধ্য (`hasOnly` + `hasAll`); `kind ∈ ['practice','mock']`; `mockId` — mock হলে string, practice হলে `null`; `bundleId` string; `examSlug ∈ jobExamSlugs()`; `status == 'in-progress'`; `startedAt` timestamp; **`endsAt == null`** (mock-এও — read-back-এর পর একবার বসে); `questionRefs` list, `size ≥ 1` (সংরক্ষিত ক্রম মোড-অনুযায়ী — lib-এ সাজানো হয়, নিয়ম ক্রম যাচাই করে না); `answers` map, `size == questionRefs.size()`; `currentQuestion` int ≥ ১, `≤ questionRefs.size()`; `revision == 1`; `lastSyncedAt` timestamp; `clientEndsAtMillis` — practice হলে `null`, mock হলে `null` বা number; `submittedAt == null`; `createdAt`/`updatedAt` timestamp; বান্ডল exists + Published + examSlug মেলে + kind-সঙ্গতি + mock হলে mockId মেলে।

**Update-যাচাই:** নতুন `status ∈ ['in-progress','submitted','abandoned']`; `submitted` হলে `submittedAt` timestamp বাধ্য, অন্য অবস্থায় `submittedAt == null`; `answers` map, `size ≤ old.questionRefs.size()`; `currentQuestion` int ≥ ১, `≤ old.questionRefs.size()`; `revision == old.revision + 1`; `lastSyncedAt`/`updatedAt` timestamp; `endsAt` — `null` থেকে **একবার** timestamp-এ বসানো যায়, তারপর আর বদলানো যায় না; practice-এ `endsAt` চিরকাল `null`; `clientEndsAtMillis` — practice-এ চিরকাল `null`, mock-এ `null` বা number। `kind`/`mockId`/`bundleId`/`examSlug`/`questionRefs`/`startedAt`/`createdAt` — `affectedKeys` থেকে বাদ থাকায় কখনো বদলায় না।

### অপরিবর্তিত (Step 7 — ফোল্ড-ইন M1-এর একটিমাত্র ব্যতিক্রমসহ)

`jobQuestions` / `jobQuestionKeys` / `jobReceipts`-এর নিয়মে **একটি অক্ষরও বদলানো হয়নি** — রসিদ = ১০-মিনিটের attempt-বাঁধা উইন্ডো (Option A, একবার-ব্যবহার নয়); "জমা দেওয়া" = client-attested; ফলাফল কখনো Verified নয়। শুধু রসিদ-নোঙরের attempt-ডকের **আকৃতি** বদলেছে (পূর্ণ attempt) — গেটের যুক্তি একই। **ব্যতিক্রম (ফোল্ড-ইন M1):** `jobQuestionBundles`-এর নিয়মে `bundleVersion` যোগ হয়েছে — উপস্থিত থাকলে int ≥ ১ হতে হবে (পুরনো বান্ডলে নাও থাকতে পারে); attempt-নিয়ম বান্ডলের `bundleVersion` attempt-এর সঙ্গে মেলায়।

---

## Step 7 থেকে যা বদলেছে (পরীক্ষা-ফাইল)

- **`rules-step7-job-questions.test.ts` (৯৫টি কেস, সংখ্যা একই):** `validSubmittedAttempt()` + `validSession()` হেল্পার যোগ; সিডের attempt-গুলো পূর্ণ জমা-দেওয়া আকৃতিতে; in-progress attempt-সিড **মুছে** in-progress **সেশন**-সিড বসানো হয়েছে; পুনর্লিখন — q66 (রসিদ এখন in-progress **সেশন**-ID-তে নোঙর করা — জমা দেওয়া attempt নেই বলে চাবি বন্ধ), q75 (রসিদ-তৈরি in-progress সেশন-ID-তে নোঙর করা — নিষেধ), q80 (in-progress তৈরি → **জমা-দেওয়া attempt তৈরি SUCCEEDS**), q81 (খসড়া বান্ডল — নিষেধ), q82 (আগে-জমা-দেওয়া doc-ID-তে setDoc → নিষেধ — দ্বিতীয় জমা update), q85 (সেশন-bundle অমিল — নিষেধ), q88 (in-progress সেশনে attempt-তৈরি — নিষেধ); q83/q84/q86/q87/q89–q92 অভিপ্রায় একই, আকৃতি নতুন।
- **`rules-step7-adversarial.test.ts` (৩৮টি কেস, সংখ্যা একই):** সিড পূর্ণ আকৃতিতে; in-progress attempt-সিড মুছে সেশন-সিড; **a5 পুনর্লিখন — DOCUMENTED LIMITATION বহাল, কিন্তু বার বেড়েছে:** Step 7-এ খালি জমা (in-progress তৈরি → উত্তর ছাড়া submit) দিয়েই জাল attempt হতো; Step 8-এ খালি জমা **নিয়মে নিষেধ** (answers non-empty + counts-সঙ্গতি + submitted সেশন বাধ্য) — জালিয়াতকে এখন **সুগঠিত** attempt বানাতে হয় (সেশন তৈরি → submitted → পূর্ণ ক্ষেত্র + সঙ্গতিপূর্ণ counts → রসিদ → চাবি)। নিয়ম সুগঠিত জালিয়াতি আর আসল প্রচেষ্টার পার্থক্য করতে পারে না (Spark-এ সার্ভার নেই) — সীমা একই, আক্রমণের খরচ বেড়েছে। a6/a6b/a7/a10/a10b/a11/a12/a13/a28/a29 অভিপ্রায় একই (সিডের attempt-ID-গুলো এখন পূর্ণ আকৃতি; in-progress নোঙর এখন সেশন-ID)।
- **q77/a11-এর `attemptId: 'attempt-inprogress'` মানটি অপরিবর্তিত রাখা হয়েছে** — রসিদ update কখনো হয় না (`if false`), তাই মানটি পড়াই হয় না; শুধু "update নিষেধ" পরীক্ষা করে।

---

## নতুন পরীক্ষা — Step 8 (s1–s78, ৭৮টি কেস)

`emulator-tests/rules-step8-practice-engine.test.ts` — নতুন ফাইল:

| গোষ্ঠী | কেস | বিষয় |
|---|---|---|
| attempt create — বৈধ জমা | s1–s7 (৭) | অনুশীলন জমা; মক জমা; ঐচ্ছিক audit-ক্ষেত্রসহ; `serverVerifiedScore` অনুপস্থিত; ৩-উত্তর (১ সঠিক/১ ভুল −০.২৫/১ অনুত্তরিত); সব-ভুল + ঋণাত্মক percentage; BCS −০.৫ হারে মক জমা |
| attempt create — ক্ষেত্র/লেবেল | s8–s24 (১৭) | ভুল kind; `resultLabel`/`trustLevel`/`resultType` verified; create-এ `in-progress`; `markingStatus` pending; ছাত্র-লেখা `serverVerifiedScore`; counts-অমিল; খালি answers; বান্ডলের চেয়ে বেশি উত্তর; ভুল negativeDeduction (০.৩০); score ≠ clientCalculatedScore; accuracy ১০১; percentage −১০১; mock-এ mockId নেই; practice-এ mockId আছে; অপ্রত্যাশিত ক্ষেত্র |
| attempt create — বান্ডল/পরীক্ষা/সেশন-গেট | s25–s37 (১৩) | খসড়া বান্ডল; অস্তিত্বহীন বান্ডল; অজানা examSlug; examSlug `'common'`; doc-ID ≠ sessionId; in-progress সেশন; বাতিল সেশন; সেশন নেই; সেশন-bundle অমিল; practice-মক-বান্ডল অমিল; mockId-অমিল; অন্যের পাথে তৈরি; সাইন-আউট |
| attempt — পড়া/হালনাগাদ/মোছা | s38–s41 (৪) | দ্বিতীয় জমা (update) নিষেধ; মোছা নিষেধ (ছাত্র + Admin); Moderator-পড়া; অন্য ছাত্রের পড়া নিষেধ |
| session create | s42–s53 (১২) | বৈধ অনুশীলন; বৈধ মক (endsAt null); খসড়া বান্ডল; mockId ছাড়া মক; practice-এ endsAt; practice-এ clientEndsAtMillis; create-এ endsAt বসানো; mockId-অমিল; examSlug-অমিল; খালি questionRefs; `'submitted'`-দিয়ে তৈরি; অন্যের পাথে তৈরি |
| session update | s54–s64 (১১) | অটোসেভ SUCCEEDS; অপরিবর্তনীয় ক্ষেত্র (bundleId) নিষেধ; endsAt একবার-সেট SUCCEEDS তারপর বদল নিষেধ; submit-পরিবর্তন SUCCEEDS তারপর frozen; abandoned-পরিবর্তন SUCCEEDS তারপর frozen; submittedAt ছাড়া submit নিষেধ; submittedAt-সহ abandoned নিষেধ; জমা-দেওয়া সেশনে অটোসেভ নিষেধ; অন্য ছাত্রের হালনাগাদ নিষেধ; মোছা নিষেধ (ছাত্র + Admin); Moderator-পড়া / অন্য ছাত্রের পড়া নিষেধ |
| ফোল্ড-ইন M1 — ব্যাংক + bundle বাঁধা | s65–s70 (৬) | ব্যাংক `negativeMarkingUsed: 0`-তে জমা SUCCEEDS; `bundleVersion` অমিল DENIED; `negativeMarkingUsed: 0.3` DENIED; খালি `markingSchemeVersion` DENIED; `bundleVersion` ছাড়া DENIED; ব্যাংক ০.২৫ deduction দাবি + used ০ DENIED |
| ফোল্ড-ইন M2 — revision + getAfter + atomic ব্যাচ | s71–s78 (৮) | অটোসেভ stored+১-এ SUCCEEDS; stale একই-revision দুবার DENIED; revision skip DENIED; সেশনের প্রশ্নের চেয়ে বেশি উত্তর DENIED; `currentQuestion` ক্রমের বাইরে DENIED; সেশনের ১ ref-এর বিপরীতে ৩ উত্তরের attempt DENIED (getAfter সংখ্যা-বাঁধা); batched জমা (সেশন submitted + attempt একসঙ্গে) SUCCEEDS + attempt পড়া যায়; stale revision-সহ batched জমা atomically DENIED, কোনো attempt তৈরি হয় না |

---

## যাচাই-প্রমাণ (Verification evidence)

| পরীক্ষা | ফলাফল |
|---|---|
| পূর্ণ নিয়ম-স্যুট (sequential, `--fileParallelism=false`, JDK 17, IPv4) | **৬৯৬/৬৯৬ PASS** (১৬ ফাইল; core-এর ৬৮২ + ফোল্ড-ইন s65–s78 = ১৪টি নতুন কেস) — প্রথম রানে ২টি Step 2 teacher-draft ব্যর্থতা দেখা গিয়েছিল (এমুলেটর-ফ্লেক — একা চালালে ২৫/২৫ PASS, পূর্ণ পুনঃচালনায় ৬৯৬/৬৯৬) |
| Step 8 নিয়ম-ফাইল একা | **৭৮/৭৮ PASS** (s1–s78) |
| Step 7 q-ফাইল একা (পুনর্লিখিত) | **৯৫/৯৫ PASS** (q1–q92 + q62a/b, q71a/b, q78b) |
| আক্রমণাত্মক ফাইল একা (পুনর্লিখিত a5-সহ) | **৩৮/৩৮ PASS** (a1–a33 + বিভক্ত কেস) |
| ইঞ্জিন↔নিয়ম ইন্টিগ্রেশন একা | **৬/৬ PASS** (i1–i6 — batched জমা-প্রবাহে পুনর্লিখিত) |
| কমিট | M1 `79296d1` + `0d11d01` · M2 `f4e6e0d` · M3 `a5d0597` · M4 এই রিপোর্ট-আপডেটসহ কমিট — ব্রাঞ্চ `jobs/section-structure` (main ছোঁয়া হয়নি; প্রোডাকশন ডেপ্লয় হয়নি; লাইভ Firestore ছোঁয়া হয়নি) |

**চালানো কমান্ড (সবগুলো একই ধাঁচে):** `FIRESTORE_EMULATOR_PORT=8081 JAVA_TOOL_OPTIONS="-Djava.net.preferIPv4Stack=true" ./node_modules/.bin/firebase emulators:exec --config firebase.alt-ports.json --only firestore,auth "./node_modules/.bin/vitest run <file|emulator-tests/> --fileParallelism=false"` — JDK `~/workspace/eduorbit/tools/jdk-17.0.21.1+2-jre/bin` PATH-এ। আউটপুট `/tmp/step8-test1.log` (Step 8 একা), `/tmp/step7-test1.log` (q-ফাইল), `/tmp/step7adv-test1.log` (আক্রমণাত্মক), `/tmp/step8-full.log` (পূর্ণ স্যুট)।

**এমুলেটর-নয়েজ নোট:** get()-যুক্ত নিয়মের প্রথম মূল্যায়নে এমুলেটর মাঝে মাঝে `evaluation error at L2833:24` (বা L2847/L2849) লেখে, তারপর রিট্রাইয়ে পরিষ্কার `false` ফেরে — **এটি Step 7-এও ছিল** (q-ফাইলে ২৭ বার, তবু ৯৫/৯৫ PASS)। বৈধ পথগুলো (s1–s7) পরিষ্কারভাবে পাস করে; নিষেধ-পরীক্ষাগুলোতে error-বনাম-false ফলাফল বদলায় না (দুটোই deny)। এটি নিয়মের ত্রুটি নয় — এমুলেটরের মূল্যায়ন-লগের বৈশিষ্ট্য; প্রোডাকশনে error-ও deny-ই হয়।

**সাইন-ইন ব্রাউজার click-through সৎভাবে করা হয়নি** (এই সেশনে লাইভ ব্রাউজার নেই) — দাবি করা হয় না। Step 8-এ কোনো নতুন পাতা/UI নেই (শুধু নিয়ম + পরীক্ষা), তাই click-through-এর সুযোগ ইঞ্জিন-UI-তে (অন্য এজেন্টের কাজ)।

---

## সৎ ফাঁক (Honest gaps — Step 8-এ যা হয়নি)

1. **Per-answer আকৃতি নিয়মে নেই** (§সিদ্ধান্ত #৭): প্রতি উত্তরের topicId/correct/marks-যাচাই lib-ভ্যালিডেটরের উপর নির্ভরশীল — lib-এ বাগ থাকলে ভুল-আকৃতির উত্তর ঢুকতে পারে (aggregate-গুলো তবু নিয়মে ধরা পড়বে)।
2. **Exact স্কোর-সূত্র নিয়মে নেই** (#৫): স্কোরের exact যাচাই lib-স্তরে; নিয়ম শুধু `negativeDeduction == wrongCount * negativeMarkingUsed` + সীমা ধরে।
3. **"জমা দেওয়া" এখনো client-attested** (Step 7 P0-02 বহাল): সুগঠিত জাল attempt + রসিদ দিয়ে চাবি পড়া যায় — a5 প্রমাণ করে। ফলাফল কখনো Verified নয়; সার্ভার-সাইড স্কোরিংয়ে Blaze দরকার (অনুমোদন নেই, ৳০ বাজেট)।
4. **মক-দেরির গ্রেস নেই** (#২): সময় পেরিয়ে জমা দেওয়া মক ক্লায়েন্টের `abandoned` চিহ্নের উপর নির্ভরশীল — নিয়ম তা যাচাই করে না।
5. **App Check স্থগিত** (Step 7 P2-03 বহাল): Step 17 নিরাপত্তা-পরীক্ষার প্রার্থী।
6. **অগ্রগতি-প্রসার Steps 10–11-এর; ভুল-উত্তর নোটবুক UI Step 13-এর** — এই ধাপে attempt/session-ডক শুধু সংরক্ষিত হয়, অগ্রগতিতে যোগ হয় না।
7. **সাবকালেকশন ব্যাকআপ সীমা বহাল** (Step 3 §৯.৩): `jobAttempts`/`jobSessions` ক্লায়েন্ট-এক্সপোর্টে আসে না — সম্পূর্ণ এক্সপোর্টে Firebase কনসোল বা Admin-SDK লাগে।
8. **`previous` বান্ডলের practice-সঙ্গতি (#৪) একটি সিদ্ধান্ত, যাচাইকৃত ব্যবহার নয়** — বিগত-বছরের সেট practice-ধাঁচে চলবে ধরে নেওয়া হয়েছে; মক-ধাঁচে চালাতে চাইলে নিয়ম বদলাতে হবে।
9. **নিয়ম rate-limit করতে পারে না** (#১১): অটোসেভ-throttling ক্লায়েন্ট-মাত্র — একটানা লেখা নিয়মে আটকানো যায় না।
10. **বান্ডল-প্রশ্নের ভেতরের ক্ষেত্র (difficulty সহ) নিয়মে যাচাই হয় না** — তালিকার ইনডেক্সিং নেই বলে per-item যাচাই অসম্ভব; `buildJobBundle` + lib-ভ্যালিডেটরই বলবৎ করে (চাবি-ফাঁস নিষেধের মতো একই সীমা)।

---

## UI/ইঞ্জিন এজেন্টের জন্য — বৈধ attempt-এর আকৃতি (চুক্তি)

জমার প্রবাহ (ক্রম বাধ্য — নিয়মে বলবৎ):

1. **সেশন তৈরি** — `users/{uid}/jobSessions/{newId}` (`status: 'in-progress'`, `endsAt: null`, `revision: 1`; মকে `endsAt` পরে read-back করে **একবার** বসাতে হয়)। `questionRefs` ক্রম মোড-অনুযায়ী সংরক্ষিত হয় (Beginner easy-first, Advanced medium-first) — lib সাজায়, নিয়ম ক্রম যাচাই করে না।
2. **অটোসেভ** (ঐচ্ছিক, চলাকালীন) — শুধু `answers`/`currentQuestion`/`lastSyncedAt`/`updatedAt`/`revision` (+ মকে `endsAt` একবার); প্রতি লেখায় `revision` ঠিক stored+১, নইলে DENIED।
3. **এক batched write-এ জমা** — সেশন → `'submitted'` (`submittedAt` + `revision` +১) **+** attempt তৈরি (একই doc-ID) একসঙ্গে। ক্রমিক প্রবাহও চলে (সেশন submitted, তারপর attempt) — নিয়ম `getAfter()` দিয়ে জমা-পরবর্তী সেশন যাচাই করে। **Idempotent:** থাকা attempt থাকলে তা ফিরিয়ে দাও, আবার লিখো না।
4. **রসিদ তৈরি করো** — `jobReceipts/{uid}_{bundleId}` (`attemptId` = attempt-ডকের ID) — তারপর ১০ মিনিটের ভেতরে চাবি পড়া যায়।

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
  negativeDeduction: number, // == wrongCount * negativeMarkingUsed (exact)
  negativeMarkingUsed: number, // 0 | 0.25 | 0.5 — যে হার প্রয়োগ হয়েছে (ব্যাংকে 0 — বিজ্ঞপ্তি যাচাই বাকি)
  markingSchemeVersion: string, // non-empty, <= 100 — যেমন 'v1', ব্যাংকে 'v0-provisional'
  bundleVersion: number,     // int >= 1 — বান্ডলের bundleVersion-এর সঙ্গে মিলতে হবে
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
  questionRefs: [{ bundleId: string, n: number, questionId: string }],  // non-empty; সংরক্ষিত ক্রম মোড-অনুযায়ী (n অপরিবর্তিত)
  answers: { [n: string]: { selected: 'A'|'B'|'C'|'D'|null, markedForReview: boolean, timeSpentSeconds: number } },
  currentQuestion: number,   // >= 1, <= questionRefs.size(); প্রথম প্রশ্ন = প্রথম ref-এর n
  lastSyncedAt: Timestamp,
  revision: number,          // তৈরি 1, প্রতি লেখায় ঠিক +1 (stale/skip DENIED)
  clientEndsAtMillis: number | null,  // practice: সবসময় null; mock: অফলাইন-টাইমারের জন্য
  submittedAt: Timestamp | null,      // 'submitted' হলেই বসে
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

**ইঞ্জিন-এজেন্টের জন্য সতর্কতা:** (ক) জমা **এক batched write-এ** করো (সেশন submitted + attempt তৈরি একসঙ্গে) — ক্রমিক প্রবাহও চলে, কিন্তু ব্যাচই প্রামাণিক; থাকা attempt থাকলে তা ফিরিয়ে দাও, আবার লিখো না; (খ) `serverVerifiedScore` কখনো লিখো না; (গ) প্রতি উত্তরে `topicId` + `correct` + marks-চিহ্ন lib-ভ্যালিডেটরে বলবৎ করো — নিয়ম তা দেখতে পায় না; (ঘ) ফলাফল-পাতায় সবসময় "অনুশীলন ফলাফল — নিয়োগ পরীক্ষার ফল নয়" লেবেল বাধ্য, আর প্রশ্নের লেখা attempt-এর নিজের `questionId` দিয়ে খুঁজো (বান্ডল-অবস্থান দিয়ে নয়); (ঙ) বাতিল (`abandoned`) সেশনে attempt তৈরি করো না — নিয়ম তা প্রত্যাখ্যান করে, ছাত্রকে "আবার দিন" (নতুন সেশন) দিতে হয়; (চ) ব্যাংকে `negativeMarkingUsed: 0` লিখো — ০.২৫ দাবি করলে নিয়ম প্রত্যাখ্যান করে, আর UI-তে "নেগেটিভ মার্কিং: বন্ধ — বিজ্ঞপ্তি যাচাই বাকি" দেখাও।

---

## ফাইল-তালিকা (এই ধাপে বদলেছে / নতুন)

| ফাইল | পরিবর্তন |
|---|---|
| `firestore.rules` | `jobAttempts` ম্যাচ পুনর্লিখন + `jobSessions` ম্যাচ নতুন + ৬টি হেল্পার (net +~২২৪ লাইন; ২৬৪০ → ২৮৬৪ লাইন) |
| `emulator-tests/rules-step8-practice-engine.test.ts` | **নতুন** — ৭৮টি কেস (s1–s78: core ৬৪ + ফোল্ড-ইন s65–s78) |
| `emulator-tests/rules-step7-job-questions.test.ts` | পুনর্লিখন — নতুন মডেলের হেল্পার/সিড + q66/q75/q80–q92 (৯৫টি কেস, সংখ্যা একই) |
| `emulator-tests/rules-step7-adversarial.test.ts` | পুনর্লিখন — নতুন মডেলের হেল্পার/সিড + a5 (৩৮টি কেস, সংখ্যা একই) |
| `team/job-rules-step8.md` | **নতুন** — এই রিপোর্ট |

**ছোঁয়া হয়নি:** `src/lib/*`, `src/pages/*`, `src/App.tsx` (অন্য এজেন্টের); `jobQuestions`/`jobQuestionBundles`/`jobQuestionKeys`/`jobReceipts` নিয়ম; main ব্রাঞ্চ; প্রোডাকশন; লাইভ Firestore। **কমিট/পুশ হয়নি** — কাজ uncommitted আছে (সমন্বয়কারী যাচাইয়ের পর কমিট করবেন)। নোট: `src/lib/jobEngine.ts` + `src/lib/__tests__/jobEngine.test.ts` এই worktree-তে untracked আছে — অন্য এজেন্টের সমান্তরাল কাজ; এই ধাপে ছোঁয়া হয়নি।
