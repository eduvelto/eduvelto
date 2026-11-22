# Step 8 — ChatGPT consultation (verbatim)

**Date:** 22 Nov 2026 ~14:29–14:32 Asia/Dhaka
**Conversation:** https://chatgpt.com/uc/6b02a803-e834-83ea-80e6-56cb87cef8a7
**Verdict:** APPROVE WITH CHANGES — do not close Step 8 until the security and integrity conditions below are addressed.
**Asked by:** parent (browser task browser-task:bfb4c92b-5811-54f8-8e84-0285036c4915), no sign-in, no private info shared.
**Scope:** Step 8 core as built (jobEngine.ts, jobPractice.ts, jobAttempts + jobSessions rules, create-at-submit + session-gate, Bank −0.25 provisional, bundle-order difficulty, receipt-less practice keys, client-attested results).

---

Eduvelto Step 8 — Independent technical design review
Approve with changes

Overall verdict: APPROVE WITH CHANGES. Do not close Step 8 until the security and integrity conditions below are addressed.

The architecture is fundamentally sound for a ৳0 Firebase Spark deployment. In particular, three decisions are correct:

Separating practice attempts from server-verified recruitment exam results.

Creating attempts only at submission rather than maintaining an attempt document throughout the session.

Treating Firestore Security Rules as the actual security boundary rather than trusting client-side validation.

However, there is an important distinction: a valid Firestore document is not necessarily a valid exam attempt.

Your current architecture can enforce document ownership, field restrictions, state transitions and certain consistency conditions. It cannot independently establish that a submitted score represents the answers a student actually selected while practicing.

That limitation is acceptable for an explicitly unverified practice product. It is not acceptable if the application accidentally presents these results as tamper-resistant.

I would retain the create-at-submit architecture, but require several changes before closure.

## 1. Findings and required fixes

### 1. Session-gate does not establish single-submission integrity
High

Finding

The create-at-submit + session-gate approach is a good replacement for the anchor lifecycle, but it does not automatically prevent all duplicate or forged submissions.

Consider:

A student creates a session.

The student autosaves answers.

The student submits.

The session transitions to submitted.

The student creates an attempt using that session ID.

This is a sensible sequence.

But the security question is whether the rules establish all of the following:

The session belongs to the authenticated user.

The attempt ID is exactly the session ID.

The session is submitted before attempt creation.

Only one attempt can be created for that session.

The submitted session cannot subsequently be modified.

The attempt's identifying fields correspond to the session's identifying fields.

Firestore's create-only semantics prevent overwriting an existing attempt, which is useful. However, they do not automatically guarantee that the attempt's contents correspond to the session's final saved answers.

A malicious client can potentially construct a submitted session and a matching attempt without following the UI workflow.

Required fixes

Require request.auth.uid == uid on every session and attempt operation.

Require attemptId == sessionId, if that is the intended invariant.

During attempt creation, use get() against the corresponding session document.

Check session.status == 'submitted'.

Compare immutable identity fields between the attempt and session:

bundle ID

question count

exam pattern

session ID

relevant timestamps or version identifiers.

Ensure submitted sessions cannot be updated again.

Keep attempts create-only and non-deletable.

Additional recommendation: Make the submission operation idempotent at the application layer. A repeated submit should retrieve the existing attempt rather than attempt to create another.

Do not confuse this with security enforcement: idempotency improves reliability, while the rules enforce the one-document constraint.

### 2. Bank negative marking is not sufficiently safe as a scoring default
High

Finding

Your disclosure is honest, but your scoring policy is not sufficiently conservative.

You currently have:

Bank: −0.25 provisional.

negativeMarkingVerified: false.

A user-facing qualification that the value is circular-dependent.

Client-calculated, unverified results.

The problem is that a disclaimer does not eliminate the effect of an incorrect scoring assumption.

A student could make preparation decisions based on a score calculated using an incorrect marking scheme.

Concrete rule

Adopt this rule:

An unverified marking scheme must never be presented as an authoritative exam-pattern score.

There are two acceptable implementation approaches:

Preferred: Disable negative marking for Bank practice until its circular is verified.

Alternative: Allow a clearly labelled provisional simulation, but separate its score from the verified-pattern score and make the provisional assumption explicit before the session begins.

I recommend the first option.

For example:

Exam / Scoring policy
BCS / −0.50, verified
Primary Teacher / −0.25, verified
NTRCA / −0.25, verified
Bank / No negative marking until verified

Do not silently substitute zero and then label the result as an official Bank-pattern score either.

The UI should explicitly say that the Bank scoring configuration is awaiting verification.

Also, store the marking scheme version with each attempt. Otherwise, changing the bundle's scoring configuration later could make old results difficult to interpret.

### 3. Difficulty denormalization is the correct architectural direction
Medium

Finding

Your difficulty-ordering limitation is real.

If difficulty exists only in jobQuestions, and students cannot read that collection, the client cannot reliably order questions by difficulty.

Using bundle order as a substitute is technically valid, but it does not implement genuine difficulty-based ordering.

Denormalization is appropriate here.

Recommended design

At bundle publication/build time, copy the necessary metadata into the published bundle:

{
  questionId: "q001",
  order: 1,
  difficulty: "easy",
  topic: "বাংলাদেশ বিষয়াবলি"
}

Keep the actual answer key and explanations separate.

Benefits:

No additional student read permission for the question bank.

Difficulty-based ordering becomes deterministic.

Beginner and Advanced modes can use the same metadata.

Published bundle versions remain reproducible.

No dependency on client access to private question-bank documents.

Important refinement

Do not duplicate unnecessary question-bank content.

The bundle should contain only the metadata needed by the practice and mock engines.

Also introduce:

bundleVersion

questionSetVersion

difficultySchemaVersion, if difficulty classification may evolve.

For Step 9, use a deterministic ordering algorithm with a stored session order. Do not regenerate the ordering during recovery.

### 4. Signed-in access to practice answer keys is an acceptable product decision, but it is a real content leak
Medium

Finding

This is not inherently a security vulnerability if your explicit product policy is that authenticated users can access practice answers.

However, it does expose:

Every published practice answer key to authenticated users.

Correct answers before they attempt questions.

Explanations before completing practice.

Potentially the entire answer bank through automated collection.

A login requirement does not provide meaningful protection against answer extraction.

The distinction between practice and mock keys is nevertheless reasonable:

Property / Practice / Mock
Published bundle readable / Yes / Yes
Answer key readable / Signed-in users / Receipt required
Correct answers available before submission / Yes / No
Result trust / Unverified / Unverified unless independently verified

Required fixes

Keep practice keys separate from question documents.

Ensure draft, rejected and unpublished keys cannot be read.

Make published question sets and keys immutable, or version them explicitly.

Never expose mock answer keys through practice-related read paths.

Do not mistake the receipt requirement for strong anti-cheating protection.

My recommendation: Keep the current split. It is consistent with a free practice-oriented product.

However, document the practice key exposure as an intentional product limitation, not a security guarantee.

One additional concern: if practice keys contain explanations that are commercially or editorially valuable, authenticated access alone may not be sufficient content protection.

### 5. Immutable attempts protect against editing, but not against fabricated initial submissions
High

Finding

Your concern about users modifying answers before result review is justified, but there are two separate integrity questions.

A. Can the student modify an existing attempt?

If Firestore rules correctly prohibit all updates and deletes, then no.

This is good.

B. Can the student submit a fabricated attempt initially?

Yes, potentially.

Consider a malicious client submitting:

{
  correctCount: 30,
  wrongCount: 0,
  unansweredCount: 0,
  answers: [],
  percentage: 100
}

If the rules only verify aggregate consistency and the allowed field set, they cannot establish that those answers correspond to the actual question set.

Even if your client library rejects malformed answer arrays, an attacker can bypass that library.

The result page must therefore not treat a valid attempt document as proof of a valid scoring process.

Required fixes

Keep attempt documents immutable.

Validate answer structure in the client library for application correctness.

Validate all possible structural constraints in rules where practical:

permitted field names;

list/map types;

maximum document size;

bounded counts;

allowed answer values;

question count consistency.

Store the bundle version and question IDs associated with the attempt.

Display results as client-attested practice results.

Never use practice attempt scores for recruitment eligibility, official rankings, scholarships or other high-stakes decisions.

Important: Do not try to solve this with increasingly complicated client-side validation.

Without trusted server-side scoring, there is no reliable way to establish that a submitted answer sequence was genuinely produced by the practice engine.

Your current trustLevel: 'unverified' is the correct architectural response.

One refinement: make sure the result page uses the immutable attempt's answer snapshot for the student's selections, and uses the published key only for correct answers and explanations.

Do not reconstruct the student's submitted answers from the current session.

### 6. Four-field autosave is a good restriction, but concurrency needs explicit handling
Medium

Finding

Restricting autosave to four permitted fields is good security design.

However, field allowlisting alone does not solve concurrency.

Example:

Tab A loads session version 5.

Tab B loads session version 5.

Tab A answers question 4 and saves version 6.

Tab B changes question 2 and saves its stale version.

Depending on how patches are constructed, Tab B may overwrite Tab A's newer state.

This is a data-integrity issue rather than an authorization bypass.

There are also potential abuse cases:

Excessively frequent autosave requests.

Oversized answer maps or marked-question arrays.

Repeated attempts to autosave after submission.

Concurrent submission and autosave operations.

Forged timestamps or progress counters.

Required fixes

I recommend:

Add a monotonically increasing revision field to sessions.

Save against the expected revision.

Reject stale revisions.

Reload the latest session when a revision conflict occurs.

Prevent autosave once status is submitted.

Enforce maximum sizes and types for all four autosaved fields.

Keep progress counters derived from answers rather than trusting client-provided counts.

For example:

{
  revision: 12,
  status: "in_progress",
  answers: {},
  markedQuestionIds: [],
  currentQuestionIndex: 4
}

The client proposes revision 13, but rules must ensure that the previous revision was 12.

Do not implement this as an unrestricted client-controlled revision number.

Important Firebase limitation: Firestore Security Rules do not provide rate limiting. You can debounce autosaves in the client and restrict write shapes, but cannot reliably prevent a determined authenticated user from generating excessive writes under this architecture.

For a ৳0 deployment, that limitation should be documented and monitored through available Firebase usage controls.

### 7. Submission ordering needs a clearly defined atomicity policy
High

Finding

Your session-first submission sequence has an important failure scenario.

Session is successfully changed to submitted.

Attempt creation fails due to network interruption.

Student returns to the result flow.

Session is already terminal.

The application needs to recover without creating another session or losing the submission.

This is not necessarily a security vulnerability, but it is a production reliability issue.

The correct solution is to make the submission process recoverable and preferably atomic.

Required fixes

Use a Firestore batched write or transaction to:

Change the session from in_progress to submitted.

Create the corresponding attempt document.

Security Rules can use getAfter() to validate the post-write session state when the session transition and attempt creation happen in the same atomic operation.

This is preferable to relying on two independent writes.

The intended invariant should be:

A session transition and its corresponding attempt creation either both commit or neither commits.

Also handle retries:

If the atomic submission succeeded but the response was lost, retrieve the existing attempt.

If it failed, retain the recoverable in-progress session.

Never allow an already submitted session to generate another attempt.

Keep the session ID and attempt ID deterministic.

This makes the architecture simpler and avoids introducing a separate submission-anchor collection.

## 2. Additional production blockers

### 8. Empty seed data means the engine is not yet end-to-end verified
High

Finding

Your automated tests are encouraging:

Rules: 682/682.

Unit tests: 273/273.

Engine/rules integration: 6/6.

Route previews: 10/10.

But synthetic fixtures cannot establish that the production data model works correctly with actual educational content.

You have:

Zero questions.

Zero published bundles.

Zero keys.

Zero verified teachers.

Therefore, Step 8 is implementation-tested, not content-production-validated.

Required fixes before public launch

Create a small, real pilot dataset containing:

At least one published practice bundle.

A realistic number of questions.

Correct answers and explanations.

Multiple topics.

Multiple difficulty levels.

A verified content publisher.

A versioned answer key.

Then test the complete student journey:

Sign in.

Open the published bundle.

Start practice.

Answer questions.

Navigate backward and forward.

Mark questions for review.

Close and recover the session.

Submit.

Reopen the result.

Review correct answers and explanations.

Test both normal and malicious-client scenarios.

Do not close Step 8 solely because emulator fixtures pass.

### 9. The Bank exam configuration must not be treated as verified metadata
Medium

This overlaps with finding 2 but has an additional data-model implication.

Do not represent a provisional exam configuration as an ordinary verified exam pattern with a Boolean disclaimer.

Use explicit metadata:

{
  examType: "bank",
  negativeMarking: {
    value: 0.25,
    status: "provisional",
    source: null
  }
}

A verified configuration should include a source reference, verification date and version.

The scoring engine should refuse authoritative scoring when the configuration is not verified.

This prevents a future developer from accidentally removing the UI warning while retaining the provisional calculation.

### 10. Timer helpers need stronger lifecycle separation before Step 9
Medium

You have timer helpers in the engine, but practice is intentionally untimed.

That separation is correct.

For Step 9, do not simply activate the existing timer helpers and assume that this produces a reliable mock exam.

A browser timer is not a trusted clock.

The client can:

Change device time.

Suspend the browser.

Close the tab.

Reload the application.

Modify local state.

Required Step 9 design

Store a session start timestamp, allowed duration, and a fixed deadline.

Use the deadline to calculate remaining time rather than decrementing a local counter indefinitely.

For recovery:

Recalculate remaining time from the deadline.

Never reset the deadline on reload.

Treat the deadline as client-attested, not server-verified.

Prevent further answer changes after local expiry.

Make submission retryable.

Firestore rules can validate allowed state transitions, but they cannot establish a trustworthy current time for high-integrity examination enforcement.

Do not advertise client-timed mocks as tamper-proof exams.

### 11. The statement "never update/delete — not even Admin" needs technical clarification
Medium

Finding

Firestore Security Rules do not constrain Firebase Admin SDK operations or privileged server environments.

Therefore, the statement:

Attempts can never be updated or deleted, not even by Admin.

is only true within the client-side Firestore Security Rules enforcement boundary.

A privileged backend identity can bypass those rules.

You currently have no backend, so this does not create an immediate exposure.

Required fix

Document the invariant accurately:

Client-authenticated Firestore operations cannot update or delete submitted attempts. Privileged Firebase administrative access remains outside the Security Rules enforcement boundary.

Also restrict access to Firebase project administration and service-account credentials.

Do not imply that Firestore Rules provide immutable storage against project administrators.

## 3. What belongs in Step 8, Step 9 and later steps?

I would keep the scope disciplined. Do not turn Step 8 into a premature attempt at implementing a secure examination platform.

Feature / Appropriate step / Recommendation
Practice session lifecycle / Step 8 / Complete now
Create-at-submit / Step 8 / Retain
Session/attempt atomic submission / Step 8 / Implement now
Autosave conflict protection / Step 8 / Implement now
Attempt immutability / Step 8 / Retain
Published key access separation / Step 8 / Complete now
Bank scoring verification / Step 8 / Resolve before enabling Bank scoring
Difficulty denormalization / Step 8/9 / Add to bundle schema now
Real-content end-to-end test / Step 8 / Required before closure
Mock exam countdown / Step 9 / Implement
Mock deadline recovery / Step 9 / Implement
Mock answer-key receipt enforcement / Step 9 / Retain and test
Mock submission and result flow / Step 9 / Implement
Server-authoritative scoring / Later, requires infrastructure change / Not possible under current constraints
Anti-cheating and proctoring / Later / Do not promise now
App Check / Step 17 / Retain planned scope
Trusted national rankings / Later / Requires stronger trust architecture

My recommended Step 9 architecture

Keep the same core engine principles:

Pure scoring functions.

Explicit exam-pattern configuration.

Immutable published question bundles.

Separate answer keys.

Session-based recovery.

Immutable submitted attempts.

Explicit trust labels.

But introduce a proper mock-specific lifecycle.

Do not merge practice and mock semantics just because they share question rendering and scoring functions.

In particular, mock exams need deadline handling and answer-key authorization that practice sessions do not need.

## 4. Exact conditions for closing Step 8

I would make these the formal closure requirements.

Step 8 closure checklist

0/10 complete
1. Atomic submission
Session transition and attempt creation are atomic, with getAfter() validation.
2. Single attempt
One session can create only one attempt; repeated submission recovers the existing result.
3. Session identity
Attempt ID, session ID, bundle ID and version are consistently bound.
4. Terminal state
Submitted sessions cannot be autosaved, reopened or modified.
5. Autosave concurrency
Revision-based conflict detection and recovery are tested.
6. Bank scoring
Provisional negative marking cannot silently influence an authoritative score.
7. Bundle metadata
Difficulty and bundle version are available without exposing private question documents.
8. Answer integrity
Result rendering uses the immutable attempt answer snapshot; no false verification claims.
9. Real-content test
At least one real published bundle completes the entire student journey.
10. Security regression
Unauthorized writes, forged sessions, duplicate submissions and malformed attempts are tested.

## 5. Final verdict
APPROVE WITH CHANGES

My assessment:

Area / Assessment
Core engine architecture / Good
Pure-function separation / Good
Attempt lifecycle / Good, needs atomicity
Firestore security model / Reasonable within stated limitations
Practice key exposure / Acceptable intentional trade-off
Result integrity / Correctly unverified, needs careful presentation
Autosave / Good foundation, concurrency needs work
Exam configuration / Bank requires correction
Production readiness / Not yet demonstrated
Step 9 readiness / Conditional

Three decisions I would not compromise on

1. Never describe a client-submitted practice score as server-verified. Your current trust boundary is correct. Preserve it everywhere, including future leaderboards and analytics.

2. Never allow provisional marking schemes to masquerade as verified exam patterns. Bank should remain explicitly provisional until supported by an authoritative circular.

3. Never close Step 8 without atomic submission and real-content end-to-end testing. Passing synthetic tests is necessary but insufficient.

Bottom line

I would not redesign Step 8. The create-at-submit approach is a reasonable architecture for Firebase Spark, and abandoning it for the old anchor lifecycle would introduce complexity without solving the fundamental trust problem.

I would make the targeted changes above, especially atomic submission, revision-based autosave, scoring configuration safeguards and real-content validation.

Once those conditions pass, close Step 8 and proceed to Step 9.

The most important architectural principle to preserve throughout Eduvelto is this:

Eduvelto can provide reliable learning workflows without pretending that a client-controlled Firebase application can provide independently verified examination results.

That is a technically honest and sustainable foundation for a free education platform.

No private information, credentials, account details or personal data were shared in the prompt. No sign-in was required.
