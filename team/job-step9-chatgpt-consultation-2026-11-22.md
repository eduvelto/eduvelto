# Step 9 — ChatGPT consultation (verbatim), 22 Nov 2026

- Source: ChatGPT, no sign-in, no personal information shared. Asked at https://chatgpt.com
- Conversation URL (final, completed): https://chatgpt.com/uc/6b02ba8f-ae38-83ea-80b4-10ef8410d44d
- Browser task: f6dd5541-efbf-5b6d-86f5-f698da3e41f9, ran 15:32–15:51 Asia/Dhaka (19 min).
- How obtained: the first generated answer stopped with an on-page "Unable to connect" error near the end of section (h) (first conversation: https://chatgpt.com/uc/6b02b6a9-9d90-83ea-8b64-b15f15a91387). Retry regenerated a new answer (https://chatgpt.com/uc/6b02b853-3d54-83ea-a78f-564a8bd8a213), which also stopped with "Unable to connect" just as section 3 began. A follow-up in the same conversation — "Please continue from where you stopped — finish section 3 (Recommended final Firestore collection structure), then give the final verdict (APPROVE / APPROVE WITH CHANGES / DO NOT CLOSE) and the Step 9 closure checklist. Keep the continuation concise so it completes in one reply." — completed it. The full verbatim below is therefore that regenerated (second) answer plus its continuation.
- IMPORTANT CAVEAT: Section 3 in the continuation is, as ChatGPT delivered it, a generic placeholder collection tree (users / [primaryCollection] / [transactionCollection] / settings / notifications / auditLogs), NOT Step 9-specific collections; ChatGPT itself added the approval condition that placeholder names must be replaced before implementation approval.

## Verdict: APPROVE WITH CHANGES

The architecture is feasible on Firebase Spark with ৳0 backend cost, but Firestore Security Rules cannot provide a fully trusted examination clock, trusted grading authority, or exactly-once transaction processing in the conventional server-enforced sense.

You can build a strong, abuse-resistant practice examination system using:

- Vite + React for the examination interface.
- Cloud Firestore as the only backend.
- Firestore Security Rules for authorization, immutable fields, lifecycle enforcement and cross-document validation.
- Atomic Firestore writes for submission.
- Client-side timer and grading calculations, treated as untrusted.
- Deterministic IDs and immutable records for retry safety.
- Versioned, published question sets.

There is one important architectural distinction:

You can enforce that a student follows a particular submission protocol. You cannot prove that the student's browser actually displayed the questions, measured the time honestly, or calculated the answers honestly.

This distinction should guide the entire Step 9 implementation.

## 1. Recommended architecture

Keep the Step 8 question-security architecture. Do not replace it with a simpler exam collection.

Question and publication layer:

- jobQuestions — Private question source. Never directly readable by students.
- jobQuestionBundles — Published questions, frozen version identifiers, options and explanations. No answer keys.
- jobQuestionKeys — Answer keys with the existing receipt-gated access model.

Examination layer:

- jobExamDefinitions — Immutable exam patterns, marking policies, duration and published versions.
- jobExamSessions — One session per exam launch. Frozen question IDs, deadline, start time and lifecycle.
- jobExamAttempts — Immutable, practice-only submission and result snapshots.
- jobExamReceipts (optional) — Only if additional attempt-bound review or key-access authorization is needed.

Analytics layer:

- jobExamHistory / derived client views — History, weak-topic analysis and performance trends. Derived data is never authoritative.

I recommend keeping full exams in separate collections from practice sessions. Reusing the same underlying question bank and security principles is sensible; reusing the same lifecycle without additional restrictions is not.

### (a) Timer integrity on Spark

A stored deadline is necessary, but it is not sufficient by itself.

The good news is that Firestore provides a trusted server-side timestamp inside Security Rules: request.time. This is different from Date.now() in the browser.

#### A.1 The correct timer design

At exam start, create the session with: uid (session owner), examId, examVersion (immutable pattern version), questionSetId (frozen published question set), status in_progress, startedAt (Firestore server timestamp), deadlineAt (server-time-derived deadline), durationSeconds (fixed duration), answers (initially empty), revision (monotonic autosave revision), createdAt (server timestamp).

Example BCS session: uid, examId "bcs_full", examVersion 1, questionSetId "bcs_2026_v1", status "in_progress", startedAt serverTimestamp(), deadlineAt serverDerivedDeadline, durationSeconds 7200, answers {}, revision 0.

serverDerivedDeadline above is conceptual, not something you should calculate using the browser clock. The initial write should use a server timestamp and have Rules verify the deadline against request.time. Conceptually: request.resource.data.startedAt == request.time; request.resource.data.deadlineAt == request.time + duration. Use a fixed duration from an approved exam definition, not a client-provided duration. BCS: 7,200 seconds. Bank: 3,600 seconds. Primary Teacher: 5,400 seconds. NTRCA: 3,600 seconds. Do not allow the client to select a longer duration.

#### A.2 Rules must enforce four things

1. The deadline cannot be changed. On every subsequent session update: request.resource.data.deadlineAt == resource.data.deadlineAt. Likewise protect: startedAt, durationSeconds, examId, examVersion, questionSetId, uid.
2. Answers cannot be changed after the deadline. For an answer/autosave update: request.time < resource.data.deadlineAt. Also require: resource.data.status == "in_progress". A client cannot keep saving new answers after the actual Firestore server deadline merely by changing its computer clock.
3. The session cannot be reopened. Once submitted (resource.data.status == "submitted") every subsequent session update must fail.
4. Submission must be terminal. The only allowed transition: in_progress → submitted. Never: submitted → in_progress, submitted → submitted with modified answers, submitted → abandoned → in_progress.

#### A.3 What about automatic submission after timeout?

Firestore cannot wake up a browser and submit an exam when the deadline passes. There is no cron, Cloud Function or background server process in this architecture. Therefore: the browser runs a countdown; it observes the deadline; at zero, it triggers submission; if the browser is disconnected, the submission waits until reconnection; the rules still prevent additional answer modifications after the deadline.

Two submission paths: Manual submission before deadline — permit terminal transition and final answer snapshot. Timeout submission after deadline — permit terminal transition, but require answers to remain unchanged from the last valid autosave. This distinction is essential. If you permit answer modifications in a timeout submission after the deadline, a student could continue working after time expires and submit those new answers. Never rely on the React countdown as the security boundary.

#### A.4 Can students cheat by changing their clock?

Change Windows clock — request.time prevents deadline manipulation. Change Android clock — same. Modify React countdown — does not change Firestore deadline. Edit deadline field through SDK — Rules reject. Replay old session update — status and revision checks reject stale updates. Submit after deadline with new answers — Rules reject. Reopen submitted exam — Rules reject.

#### A.5 What cannot be prevented

A student can disconnect from the internet. A student can use another device to research answers. A student can inspect all data already downloaded to their browser. A student can modify their local React application. A student can manipulate their locally displayed countdown. A student can create multiple exam sessions if you do not have a trusted global session-creation quota. A student can delay submitting after timeout while offline. You cannot prove that the browser actually stopped displaying questions at the deadline. Most importantly, Firestore Rules do not provide a trusted grading service.

Timer verdict: A server-time-derived immutable deadline plus server-time-based answer-write restrictions provides meaningful enforcement against ordinary client-side timer manipulation. It does not create a fully proctored examination environment.

### (b) Full-exam session lifecycle

Separate lifecycle for full examinations.

Allowed states: NOT CREATED (no session exists; create session + freeze question set); IN_PROGRESS (autosave answers, increase revision, fixed deadline; manual submit or timeout submit); SUBMITTED (terminal state; immutable attempt, result and review snapshot). Do not introduce unnecessary states such as paused, resumed, extended, reopened, submitted_again. Disconnecting is a client connectivity condition, not a server-side exam state.

Allowed transitions: Create session — allowed once, with valid published exam. Save answers — in progress and before deadline. Increase revision — only by exactly 1. Submit manually — in progress, before deadline. Submit on timeout — in progress, after deadline, without answer changes. Change deadline — never. Change question set — never. Change exam version — never. Change submitted result — never. Delete session — never. Reopen session — never.

Protect the answer document: store the answers inside the session document for Step 9 initially, e.g. answers {q001: "B", q002: "D", q003: "A"}, revision 17. Update rules must enforce: only the session owner can update; only the answers and revision fields can change during autosave; revision increases exactly by one; the session remains in_progress; the server time is before the deadline; answer values are valid option identifiers; answer question IDs belong to the frozen question set. The last condition deserves special attention: Rules cannot conveniently validate hundreds of arbitrary question IDs through hundreds of document lookups. Use a trusted immutable manifest and a constrained schema instead.

Distrust the client: the browser is permitted to propose an answer and request a state transition. It must not be trusted to decide: whether an exam has started; how long an exam lasts; whether the deadline has passed; which question-set version applies; whether a submitted attempt already exists; whether a result is official; whether an answer key is accessible. The rules must enforce the authorization and immutable-field restrictions.

### (c) Duplicate submissions and double-submit races — APPROVE WITH CHANGES

The Step 8 combination of session-gate, getAfter() and deterministic attempt ID is a good foundation. But there is an important distinction between preventing duplicate documents and guaranteeing exactly-once submission.

Recommended submission structure: jobExamSessions/{sessionId} and jobExamAttempts/{sessionId}. The attempt ID is exactly the session ID: one session ID = one possible attempt ID. Submission is one atomic batch: (1) update session from in_progress to submitted; (2) create attempt with ID equal to session ID. Rules should require: the session belongs to the authenticated user; the existing session is in_progress; the new session is submitted; the attempt does not already exist; getAfter() confirms the corresponding session is submitted; the attempt's owner and session ID match; the attempt's answer snapshot matches the submitted session; the attempt cannot be updated or deleted. Firestore's getAfter() is designed for validating related writes within an atomic operation.

Double-submit race: student double-clicks Submit. Request A — session update valid, attempt created. Request B — session already submitted: rejected; attempt already exists: rejected. Because the writes are atomic, a failed batch does not partially apply.

Three remaining scenarios: (1) Both batches arrive simultaneously — both try to create the same attempt document and transition the same session; only a valid transition can succeed; a competing request will fail once the session has become terminal or the attempt exists. (2) The first submission succeeds, but the browser never receives the acknowledgment — the browser thinks submission failed. Correct client behavior: read jobExamAttempts/{sessionId}; if it exists and belongs to the user, return the existing attempt; do not create a new attempt; if it does not exist, inspect the session; if the session is submitted but the attempt is missing, treat it as an integrity error, not permission to create another attempt. (3) A second session is created for the same exam — a deterministic attempt ID does not prevent this because the second session has a different ID. Rules alone cannot reliably enforce a universal limit of one active session per student across arbitrary sessions without a shared lock/index document. You can use a per-user, per-exam coordination document, but this introduces additional atomic-write and access-call complexity.

Final recommendation: use deterministic attempt IDs and atomic submission. Describe the guarantee accurately: exactly one immutable attempt per session ID — enforceable. Idempotent submission retry — implementable. Exactly one attempt per exam per student — not guaranteed by this design. Guaranteed successful submission while offline — impossible.

### (d) Daily and weekly model tests without a server scheduler — APPROVE

You do not need cron or scheduled jobs. The best solution is date-derived published mock sets, not dynamically generated exams.

Daily model test: collection jobDailyMockSets/{dateKey}, e.g. jobDailyMockSets/2026-11-22. Each document: dateKey "2026-11-22", timezone "Asia/Dhaka", published true, version 1, questionSetId "daily_2026_11_22_v1", questionCount 25, durationSeconds 1500, topicRotation ["bangla", "english", "mathematics", "general_knowledge", "science"]. The actual question IDs are stored in an immutable published manifest. Daily tests should use common questions across BCS, Bank, Primary Teacher and NTRCA. Suggested rotation: Sunday Bangla + English; Monday Mathematics; Tuesday General Knowledge; Wednesday Science; Thursday ICT + analytical ability; Friday Mixed questions; Saturday Weak-topic revision. Use a 25-question, 25-minute daily test as your standard. The rotation should be editorially defined, not calculated from a student's local clock.

Weekly full mock: jobWeeklyMockSets/{weekKey}, e.g. jobWeeklyMockSets/2026-W47. Document: weekKey "2026-W47", timezone "Asia/Dhaka", published true, version 1, questionSetId "weekly_2026_w47_v1", questionCount 100, durationSeconds 3600. The weekly test can rotate among the four examination patterns: Week 1 BCS-style full mock; Week 2 Bank-style full mock; Week 3 Primary Teacher-style full mock; Week 4 NTRCA-style full mock. This creates variety without requiring a scheduler.

Who publishes the sets? Because you have no server code: (1) prepare question sets in advance; (2) publish them manually through Firebase Console or a trusted administrative client; (3) set published: true; (4) never allow students to modify these documents; (5) create the next day's and next week's sets in advance. You could prepare 30–90 daily sets in one editorial publishing cycle. A missing scheduled job is no longer a problem because the content already exists.

Date and timezone problems: a browser can lie about its date. A student changes the phone date; changes the timezone; opens yesterday's test tomorrow; attempts to access tomorrow's test early. The Asia/Dhaka timezone in the document is metadata; it does not make the browser's date trustworthy. Firestore Rules provide request.time, but they do not provide a convenient general-purpose timezone/calendar scheduling engine. Recommended approach: define all academic dates in Bangladesh Standard Time; publish daily and weekly sets ahead of time; use the browser's Bangladesh-date calculation only for display and selection; use server-time checks in Rules wherever a date-specific restriction is practical; do not treat daily participation as a verified attendance record; do not award authoritative rewards for completing a test on a particular calendar day.

Failure modes: student misses a day — no test required retroactively. Daily set is missing — display unavailable; never substitute a different date silently. Student changes device date — may manipulate displayed date selection. Student changes timezone — Bangladesh date remains the intended academic reference. Student opens an old set — historical set remains available if you choose. New set is published mid-day — existing sessions keep their original version. Weekly set is delayed — show unavailable rather than inventing a mock. Without a trusted server, you cannot reliably enforce one daily attempt per actual Bangladesh calendar day against a determined user. You can enforce one attempt per deterministic session ID, but that is a different guarantee.

### (e) Result integrity for full exams — Practice-only, always

The Step 8 trust model should carry over unchanged. A full-length exam does not become a verified examination simply because it has a timer and a fixed question set.

Never trust these client fields: correctCount, wrongCount, unansweredCount, score, percentage, passStatus, rank, percentile, topicScores, accuracy, timeTaken, completionStatus, isVerified. The browser can modify all of them. There is no trusted grading engine in your architecture.

Recommended attempt document: uid, sessionId, examId "bcs_full", examVersion 1, questionSetId "bcs_2026_v1", submittedAt serverTimestamp(), resultLabel "practice", trustLevel "unverified", gradingVersion 1, markingScheme {correct: 1, wrong: -0.50, unanswered: 0}, questionCount 200, answers {q001: "A", q002: "C"}, grading {correctCount, wrongCount, unansweredCount, score, percentage}. The numbers are an illustrative schema, not trusted grading values. The client may calculate these values for display, but Rules cannot prove that they were calculated correctly.

How to display results: "BCS Full Mock — Practice result 142 / 200 — Illustrative score — Trust level: Unverified. This is a self-assessment practice score. It is not an official examination result or verified ranking." Use these exact semantic values consistently: resultLabel "practice", trustLevel "unverified". Never introduce labels such as "verified", "official", "government_result", "certified_score" — even if the student gets every question right.

Scoring policies: keep the marking scheme versioned with the exam definition. BCS +1 / −0.50 / no universal pass percentage. Bank +1 / 0 / not specified. Primary Teacher +1 / −0.25 / 50%. NTRCA +1 / −0.25 / 40%. Bank negative marking remains disabled until the relevant official circular is verified. For Primary Teacher and NTRCA, label the threshold as a practice threshold, not a guarantee of official eligibility or selection. Distinguish raw score, percentage of maximum marks, and practice pass-threshold comparison. Unanswered questions must score zero, not a negative value.

Weak-topic analysis: calculate topic-level performance from the answer snapshot and the corresponding question-set metadata, e.g. bangla {correct 12, wrong 5, unanswered 3}, english {correct 8, wrong 4, unanswered 3}. Label it "Practice analytics — calculated from your submitted answers." Do not call it an official competency assessment.

### (f) Question-set freezing and versioning — APPROVE WITH CHANGES

One of the most important requirements. A full exam must not change underneath a student.

Use immutable question-set manifests: jobQuestionSetManifests/ bcs_2026_v1, bank_2026_v1, primary_2026_v1, ntrca_2026_v1. A manifest contains: questionSetId "bcs_2026_v1", examId "bcs_full", version 1, published true, questionCount 200, questionIds ["q001", "q002", "q003", ...] (full list, 200 IDs), markingSchemeVersion 1. When starting an exam: (1) read the published exam definition; (2) read the published manifest; (3) verify its version and expected question count; (4) create the session referencing that exact manifest; (5) never change the manifest; (6) resume by reading the same manifest, not the current exam definition.

Prefer immutable question versions: do not simply overwrite jobQuestionBundles/q001 if that question is used in existing examinations. Instead use jobQuestionBundles/q001_v1, q001_v2. An old exam continues referencing q001_v1; a new exam may reference q001_v2. This avoids the same question ID returning different content after publication.

Freeze the marking scheme too: the exam's frozen data must include question IDs, question order, question count, exam pattern version, duration, correct-answer marks, wrong-answer marks, unanswered marks, pass threshold (if applicable), grading version. Changing the marking scheme after the exam begins should not change the student's existing session.

What breaks if you do not freeze: delete a question — missing question on resume. Change options — student's answer refers to old options. Change correct answer — historical score changes. Change explanation — review no longer matches original question. Change question order — answer-to-question mismatch. Change marking scheme — same answers produce a different score. Publish a replacement bundle — different clients see different exams.

Important security limitation: a manifest is only trustworthy if students cannot modify it. Its publication and immutability must be enforced by Rules. A client-provided list of 200 question IDs is not proof that the student received a valid published exam. Do not attempt 200 separate get() checks in Security Rules — Firestore has strict document-access-call limits. Instead, use immutable manifests and versioned question documents, and validate the session's reference to its published manifest.

### (g) Offline/disconnect recovery for a timed exam — Limited recovery

A timed examination is not the same as an ordinary practice session. The UI must clearly communicate the difference.

What is recoverable: browser refresh — yes, same session. Tab accidentally closed — yes, same session. Device restarts — usually, same session after authentication. Internet disconnects — resume after reconnection. Firestore request fails before acknowledgment — retry with revision checking. Submission succeeds but acknowledgment is lost — retrieve existing attempt. Deadline passes while offline — no extra examination time. Local unsaved answers disappear — not guaranteed recoverable.

Correct resume sequence on opening the examination page: (1) authenticate the user; (2) read the existing session; (3) confirm the session owner; (4) check its status; (5) read the frozen manifest; (6) restore saved answers; (7) restore the original deadline; (8) calculate remaining time using the current server-derived time after reconnection; (9) if expired, disable answer editing and submit the last valid saved answers. Never create a new session simply because the browser refreshed.

Autosave design: keep the Step 8 monotonic revision system, e.g. answers {q001: "B", q002: "A"}, revision 18. A new update must have newRevision === oldRevision + 1. This protects against stale updates and many out-of-order write problems. However, the UI should not assume that an offline write has been committed just because it appears locally. Recommended interface: "Exam connectivity: Offline. Your answers may be stored locally, but the latest changes have not been confirmed by the server. Last confirmed save: Question 42. Deadline: Unchanged."

What the UI must never promise: unlimited pause time; automatic server-side submission at timeout; guaranteed offline submission; recovery of every unsaved answer; extra time because of internet problems; that a local countdown is authoritative; that a successful local write means a successful server write.

One additional recommendation: for timed exams, do not enable offline persistence as though it were an authoritative exam submission mechanism. You can still use Firestore's normal client-side caching, but distinguish cached/local state from server-confirmed state. Best policy: offline = resume permitted, extra time not permitted, unconfirmed answers not guaranteed.

### (h) What Step 8 missed that Step 9 must handle

The most important section for avoiding security regressions when extending your practice engine. Eight additional issues:

H.1 Critical — answer-key exposure during a full examination. The Step 8 system already has jobQuestions / jobQuestionBundles / jobQuestionKeys. The receipt-gated answer-key mechanism must not accidentally become an exam-time answer-key mechanism. Attack: (1) a student starts a full mock; (2) the student obtains a valid question-key receipt through the practice system; (3) the student reads the answers while taking the examination. The exam timer does not protect against this. Required changes: do not issue exam-review receipts while the exam is in progress; do not let a practice receipt authorize access to an exam's answer keys; separate practice-key authorization from full-exam review authorization; require a submitted attempt before exam-specific answer review; bind review authorization to the exact attempt and question-set version; never let a receipt authorize access to unrelated bundles. Use separate authorization purposes: purpose "practice_review" and purpose "exam_review" — the second must require an existing submitted attempt. One further limitation: once a student has legitimately downloaded an answer key, no client-only system can make them forget it. Avoid publishing full-exam keys before the intended review period.

H.2 Critical — practice sessions and full-exam sessions must not be interchangeable. Do not allow a practice session to be submitted as a full exam, e.g. {sessionType: "practice", examId: "bcs_full", resultLabel: "practice"}. A student must not be able to change a practice session into a full-exam session by editing its fields. Use separate collections: jobSessions / jobAttempts and jobExamSessions / jobExamAttempts, and separate Rules. This is a meaningful security boundary, not just organizational preference.

H.3 Critical — client-side grading creates an integrity limitation. Suppose the student submits {correctCount: 200, wrongCount: 0, score: 200} — the student could have answered all 200 questions incorrectly. Firestore Rules cannot independently grade 200 answers against a protected answer key without introducing a trusted grading service or exposing the key. Therefore: the client can calculate a practice score; the client can calculate explanations and weak topics; the client can save an immutable submission snapshot; the client cannot produce a trusted official score. An immutable attempt is not necessarily an accurate attempt. Immutable does not mean truthful. Preserve both concepts separately: resultLabel "practice", trustLevel "unverified", submissionIntegrity "client_calculated". These labels should never be upgraded by a student.

H.4 Attempt creation must be impossible without a valid session. Reuse the Step 8 session-gate principle, but make it stricter. The full-exam attempt should require: existing session uid matches, status was in_progress; after atomic batch status is submitted; new attempt ID equals session ID, uid matches, session ID matches, questionSetId matches, examVersion matches. The attempt must also be created only once. Do not let students directly create attempts without the corresponding session transition.

H.5 Limit question and answer manipulation. Validate: every answer references a question in the frozen manifest; every answer is a permitted option identifier; no unexpected fields are accepted; no answer is accepted for a question outside the exam; no submitted answer snapshot differs from the session's final valid answers; no answer updates occur after the deadline. However, do not confuse answer validation with answer correctness. A valid answer such as "B" can still be wrong.

H.6 Rules access-call budget. Firestore Security Rules have a maximum of 10 document access calls for a single-document operation, and a maximum of 20 across a multi-document transaction or batch, with the per-operation limit still applying. A complicated submission batch can unexpectedly exceed these limits. For example, if every answer is validated using a separate get() call, a 200-question examination is not going to work. Design the rules around a small number of immutable documents: one exam definition, one question-set manifest, one session, one attempt. Also account for caching of rule document accesses rather than assuming every lookup is free.

H.7 Session creation abuse. A determined student can create many sessions (bcs_session_001, 002, 003, 004...). A deterministic attempt ID does not prevent this. Possible mitigation: create a coordination document jobExamUserLocks/{uid_examId} containing uid, examId "bcs_full", activeSessionId, status "in_progress". Require the creation batch to create both the session and lock atomically. Rules must verify that the lock did not already exist or that its previous session is terminal. However, this only provides a lock for the specific user and exam. It does not provide reliable global rate limiting, and stale locks need careful recovery design. For Step 9, recommend one active session per user per exam pattern, unless you have a concrete educational reason to allow concurrent attempts.

H.8 Administrative publishing must be secured. Since there is no backend, question-set publication is another trust boundary. Students must never be able to: publish exam definitions; change marking schemes; change published manifests; change question versions; publish answer keys; change exam duration; modify historical exam versions. If you use a trusted administrator account, use explicit administrator authorization in Rules. One caveat: Firebase custom claims normally require a trusted environment using the Admin SDK to assign them. You cannot securely let a browser assign itself an administrator claim. If you have no server, use a carefully controlled administrative workflow, and never make a client-editable Firestore field such as isAdmin: true the sole authorization mechanism.

## 2. Final verified exam patterns

Stored as immutable, versioned exam definitions. BCS: 200 MCQs, 120 min, +1 / −0.50, no universal threshold. Bank: 100 MCQs, 60 min, +1 / 0, not specified. Primary Teacher: 90 MCQs, 90 min, +1 / −0.25, 50%. NTRCA: 100 MCQs, 60 min, +1 / −0.25, 40%. These are the supplied provisional product specifications. Official exam notices and circulars should be checked before changing any pattern. Bank negative marking remains disabled.

## 3. Recommended final Firestore collection structure

[Continuation reply — this section was interrupted in the main answer and completed by follow-up.]

Use a clear, scalable structure that separates user data, application data, transactional records, and system-level configuration.

Firestore: users/{userId} (profile, email, displayName, role, status, createdAt, updatedAt); [primaryCollection]/{documentId} (userId, title, description, status, createdAt, updatedAt); [transactionCollection]/{transactionId} (userId, referenceId, status, amount, createdAt, updatedAt); settings/{settingId}; notifications/{notificationId}; auditLogs/{logId}.

Structural recommendations: use authenticated user IDs consistently as document ownership references; keep frequently queried fields at the document's top level; use subcollections only when their independent querying, growth, or access patterns justify them; avoid duplicating sensitive information unnecessarily; use server-generated timestamps for important lifecycle events; enforce ownership and role-based permissions through Firestore Security Rules; never rely on frontend validation as the only security control; define required composite indexes based on actual application queries; restrict writes to sensitive fields such as roles, payment status, and administrative settings; keep audit logs protected against unauthorized modification.

Approval condition: The final collection structure must match the application's actual data model, query requirements, and security rules. Placeholder collection names must be replaced before implementation approval.

## 4. Final verdict — APPROVE WITH CHANGES

The Firestore architecture should be approved conditionally, not closed unconditionally. Closure is appropriate only after: (1) the recommended collection structure is finalized; (2) Firestore Security Rules are reviewed and tested; (3) authentication and authorization behavior are verified; (4) required indexes are deployed; (5) data ownership and access boundaries are confirmed; (6) critical read/write operations are tested; (7) no unresolved critical or high-severity issues remain. If any critical security or data-integrity issue remains unresolved, the verdict must change to DO NOT CLOSE.

## 5. Step 9 — Final closure checklist

Step 9 completion 0/14: final Firestore collection structure documented and approved; document IDs and ownership references consistently defined; authentication and authorization verified; Firestore Security Rules reviewed and tested; unauthorized cross-user access successfully blocked; sensitive fields protected from unauthorized writes; required Firestore indexes deployed; CRUD operations tested successfully; data validation and error handling verified; timestamps and document lifecycle behavior verified; audit logging and administrative access reviewed; no unresolved critical or high-severity defects; final implementation evidence and test results documented; stakeholder approval and closure sign-off recorded. Check each item only after verification.

Final closure decision: APPROVE — all checklist items verified. APPROVE WITH CHANGES — remaining non-critical changes are documented, assigned, and tracked. DO NOT CLOSE — critical security, authorization, data-integrity, or functional issues remain unresolved.

Final recommendation: APPROVE WITH CHANGES. Close the review only after the outstanding changes have been implemented, tested, and supported by documented evidence.

No sign-in was used; no personal information, account details, or credentials were shared. The conversation tab was left open at the final URL above.
