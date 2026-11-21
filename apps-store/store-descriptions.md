# Eduvelto — Google Play store listing copy (DRAFT for owner review)

**App name (Play, max 30 chars):** Eduvelto
**Package ID (proposed, owner to confirm):** bd.eduvelto.app
**Category:** Education
**Price:** Free (no in-app purchases at launch)

## Correction log — 21 November 2026 (accuracy pass against the live platform)

Every feature and number below was re-checked against the live site and
the code on branch `apps/twa-prep` (main @ f112b5c). Claims that did not
match what works today were removed or corrected. Nothing is invented: no
awards, no user numbers, no partnerships, no certifications.

- **REMOVED — "Health information" section.** The health pages exist, but
  ALL health content (24 medicines, 20 diseases, 4 facilities) is
  "Under Review" and nothing is Published, so a user opening the app
  sees "under review" empty states, not health information. The
  verified-doctors list is also empty (no doctor is Published +
  verified). The section returns to the listing only when published
  health content exists. The medical-report explainer tool works
  (client-side, built-in test data), but it is part of Health v1 and
  stays out of the listing until the health library is published.
- **REMOVED — "Study routine" section.** `/routine` is a placeholder
  page ("No data yet. Content will appear here once it is published.").
  The smart study planner (Phase 2, Step 7) is not built. The section
  returns only when a working routine feature exists.
- **CORRECTED — written-exam marking.** Was "kept for teacher marking".
  Written answers are stored with marking status "pending" and are
  marked by a **moderator/admin** (`markWrittenAttempt` in
  `src/lib/exams.ts`); there is no teacher-marking flow. The listing
  now says so.
- **KEPT — "600+ books", "200+ exams", "5,000+ questions".** Verified
  live 21 Nov 2026: 609 books, 212 exams (8 MCQ quizzes of 30 questions
  + 204 written), 5,326 questions. Re-verify before submission — the
  counts grow.
- **KEPT — progress / weak areas.** Verified in code: bookmarks,
  mark-lesson-complete, and a Progress page showing weak areas
  (below 60% on your own quiz attempts).
- **KEPT — "browsing the library is free without an account".** The
  Firestore rules allow anyone to read Published books
  (`contentRead` / `isPublished` in `firestore.rules`); bookmarks and
  progress require sign-in. NOTE: an app-level logged-out check is
  still owed (a roadmap flag noted an anonymous REST read returning
  403) — re-verify in the app before submission.
- **NOT MENTIONED — AI Teacher.** The live site's AI Teacher is a
  scripted demo, not real AI. It is listed only once a real AI Teacher
  exists. Role dashboards are also not mentioned: they are in
  development (staging), not live.

---

## Short description — English (max 80 characters)

Free learning for Bangladesh — books, lessons & exams. Learn • Grow • Achieve

## Short description — Bangla (max 80 characters)

বাংলাদেশের জন্য বিনামূল্যে শিক্ষা — বই, পাঠ ও পরীক্ষা

---

## Full description — English (max 4,000 characters)

Eduvelto is a free education platform for Bangladesh.
Learn • Grow • Achieve — A Smarter World of Learning.

**Digital library — 600+ books**
Books and lessons for General classes (1–12), Madrasa, Technical and
Higher (Honours) education. Every question comes with a simple, easy
answer — MCQ first, then short answers, then broad questions, plus extra
practice questions.

**Free exams with instant results**
200+ exams with 5,000+ questions. Take an MCQ exam, submit, and see your
score and a question-by-question review right away. Written answers are
saved and marked later by a moderator — written results are not instant.

**Track your progress**
Bookmark lessons, mark lessons complete, and see your progress by subject
— including your weak areas — on your Progress page. Sign in to save your
bookmarks and progress; browsing the library is free without an account.

Eduvelto is free for every student. No payments are taken inside the app.
Founded by Ali Hasan Mohammed Mizan, Founder & CEO, Eduvelto.

Learn, grow, achieve — শেখো, এগিয়ে যাও, স্বপ্ন গড়ো।

---

## Full description — Bangla (max 4,000 characters)

Eduvelto — বাংলাদেশের জন্য একটি বিনামূল্যে শিক্ষা প্ল্যাটফর্ম।
শেখো, এগিয়ে যাও, স্বপ্ন গড়ো — A Smarter World of Learning।

**ডিজিটাল লাইব্রেরি — ৬০০+ বই**
সাধারণ (১ম–১২শ শ্রেণি), মাদ্রাসা, কারিগরি ও উচ্চশিক্ষা (অনার্স) — সব
ধারার বই ও পাঠ। প্রতিটি প্রশ্নের সহজ উত্তর আছে — প্রথমে MCQ, তারপর
সংক্ষিপ্ত, তারপর রচনামূলক প্রশ্ন, সঙ্গে অতিরিক্ত অনুশীলনী।

**বিনামূল্যে পরীক্ষা, সঙ্গে সঙ্গে ফলাফল**
২০০+ পরীক্ষা, ৫,০০০+ প্রশ্ন। MCQ পরীক্ষা দিয়ে জমা দিন — নম্বর আর
প্রতিটি প্রশ্নের পর্যালোচনা সঙ্গে সঙ্গে দেখুন। লিখিত উত্তর সংরক্ষিত
থাকে এবং পরে মডারেটর মূল্যায়ন করেন — লিখিত ফলাফল সঙ্গে সঙ্গে পাওয়া
যায় না।

**অগ্রগতি দেখুন**
পাঠ বুকমার্ক করুন, পড়া শেষ চিহ্নিত করুন, আর বিষয় অনুযায়ী আপনার
অগ্রগতি ও দুর্বল জায়গাগুলো দেখুন। বুকমার্ক ও অগ্রগতি সংরক্ষণ করতে
সাইন ইন করুন; লাইব্রেরি দেখা অ্যাকাউন্ট ছাড়াই বিনামূল্যে।

Eduvelto প্রতিটি শিক্ষার্থীর জন্য বিনামূল্যে। অ্যাপের ভেতরে কোনো
পেমেন্ট নেওয়া হয় না।
প্রতিষ্ঠাতা: আলী হাসান মোহাম্মদ মিজান, Founder & CEO, Eduvelto।

শেখো, এগিয়ে যাও, স্বপ্ন গড়ো — Learn, Grow, Achieve।
