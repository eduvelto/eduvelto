# Job Step 6 — ChatGPT Consultation (verbatim)

- Date: 22 Nov 2026 ~11:20 Asia/Dhaka
- Browser task: 6b4122c0-ac54-5298-9d7b-12cc73eb47f3 (ran 11:17–11:20)
- Conversation link: NOT returned by the browser task (no chatgpt.com/uc/... URL in the handoff)
- Verdict: **APPROVE WITH CHANGES REQUIRED — Do not close yet.**
- Scope: Step 6 core (commit f2ceaf4) + auth-gating commit (d106e5a), jobs branch `jobs/section-structure`
- Note: ChatGPT reviewed from the implementation summary only — it did NOT see the actual Firestore rules, schemas, test source, or importer code. Its findings are architectural requirements to verify against the real code, not a certification of the current rules.

---

Eduvelto Step 6 — Independent Security & Architecture Review
APPROVE WITH CHANGES REQUIRED

Overall assessment: The architecture is directionally sound, the separation between canonical exam metadata and learning content is sensible, and the authentication restriction is a good security decision.

However, I would not give Step 6 an unconditional security approval based on the implementation summary alone.

There are three important architectural boundaries to protect:

Students must never gain write or publication authority through client-controlled fields.

The Firestore rules must enforce the complete content hierarchy, not merely document ownership and publication status.

Step 6 must not establish assumptions that prevent Step 7 from implementing a genuinely secure, receipt-gated Question Bank.

Important audit limitation: I have the implementation description and reported test results, but not the actual Firestore rules, schemas, test source, or importer code. Therefore, I can identify architectural requirements and potential defects, but cannot honestly certify that the current rules are exploit-proof.

## 1. Severity-ranked findings

### P0 — Must fix before closing Step 6

These are release-blocking requirements, not optional improvements.

**P0-01 — Role and verification escalation must be conclusively prevented.**
Required fix: Only the Owner or explicitly authorized administrator may change role, isVerified, verifiedAt, or equivalent authorization fields. Students must never write these fields.

**P0-02 — Teacher authorization must be based on trusted database state.**
Required fix: Check the teacher's current verification and account status from a protected user document in Firestore Rules. Never trust client state, local storage, React context, or submitted role fields.

**P0-03 — Second-eye verification needs author independence.**
Required fix: Require the reviewer UID to differ from the author UID. Prevent authors from approving or publishing their own material, including through a different role or account workflow.

**P0-04 — Hierarchical references need integrity enforcement.**
Required fix: Validate that every chapter references a valid subject, every topic references a valid chapter, and every lesson references a valid topic. Prevent unauthorized cross-exam or cross-subject references.

**P0-05 — Question material must have a separate security boundary.**
Required fix: Do not store answer keys, explanations, or restricted question material in publicly readable or generally readable subject/topic/lesson documents. Step 7 must use separately protected documents.

**P0-06 — Step 7 receipt verification cannot rely on client assertions.**
Required fix: Establish a trusted receipt-issuance mechanism before implementing paid or transaction-based answer-key access. Firestore Rules cannot independently verify an external payment transaction.

**P0-07 — The actual deployed ruleset must be audited for overlapping permissions.**
Required fix: Check every matching path, including wildcard matches and nested subcollections. An additional permissive allow statement can defeat an otherwise restrictive rule.

#### Why P0-06 matters particularly for Eduvelto

You have explicitly ruled out Cloud Functions and all server-side code.

That creates an architectural constraint for Step 7.

Suppose the intended flow is:

Student purchases or earns access.

A receipt is generated.

The student submits the receipt.

Firestore Rules check the receipt.

The answer key becomes readable.

The security problem is step 2.

If the student can create their own receipt document, they can potentially assert that they have paid without actually paying.

Firestore Rules can verify that a receipt document exists and has appropriate properties. They cannot establish that an external payment provider genuinely processed a transaction simply because a client submitted a document.

Required decision: Either use a trusted receipt issuer, have an authorized human verify receipts and issue access, or explicitly redesign the receipt system around a verifiable mechanism supported by the available infrastructure.

Do not build Step 7 assuming that a client-created receipt is proof of payment.

### P1 — Should fix before proceeding to Step 7

**P1-01 — Canonical subjects and Firestore data can drift apart.**
Required fix: Add automated consistency validation between rulesConfig, generated subjects, seed JSON, and the expected marks totals.

**P1-02 — Rules should validate the canonical subject identity.**
Required fix: Maintain an authoritative allowlist of valid exam/subject combinations in rules or protected Firestore configuration. Do not trust submitted client metadata.

**P1-03 — Content lifecycle fields need strict transitions.**
Required fix: Restrict changes to status and reviewStatus according to explicit transition rules. Do not allow arbitrary state changes by authors.

**P1-04 — Ownership must be immutable.**
Required fix: Once created, prevent changes to authorUid, createdBy, createdAt, and equivalent ownership/audit fields.

**P1-05 — Publication metadata needs protection.**
Required fix: Only authorized reviewers may change publishedAt, publishedBy, approval fields, and publication state.

**P1-06 — Seed importer safety needs stronger deployment controls.**
Required fix: Require an explicit emulator connection check, fail closed if the target is not the emulator, and prevent accidental production credentials or project selection.

**P1-07 — Tests need explicit adversarial coverage.**
Required fix: Test student writes, forged authorship, role changes, demoted teachers, reviewer self-approval, cross-parent references, and unauthorized reads.

**P1-08 — Future subcollections need default-deny protection.**
Required fix: Explicitly deny unrecognized paths and review collection-group access whenever new nested collections are introduced.

### P2 — Nice to have

**P2-01 — Audit history could be stronger.**
Recommended improvement: Maintain immutable approval and publication history, including reviewer UID and timestamps.

**P2-02 — Subject generation should be reproducible.**
Recommended improvement: Version the exam-pattern configuration and record its version in generated subject documents.

**P2-03 — Operational visibility is limited.**
Recommended improvement: Add monitoring for repeated permission denials and unexpected publication attempts.

**P2-04 — Seed provenance could be improved.**
Recommended improvement: Record seed version, source configuration version, document count, and content hash in a deployment manifest.

**P2-05 — Documentation could distinguish draft content from canonical metadata.**
Recommended improvement: Document which fields are authoritative, generated, manually editable, or immutable.

## 2. Detailed review of the requested security questions

### (a) Firestore Rules correctness

The intended authorization model should look like this:

Signed-out visitor: Read published content — No; Read drafts — No; Create — No; Edit own draft — No; Publish — No

Signed-in student: Read published content — Yes; Read drafts — No; Create — No; Edit own draft — No; Publish — No

Unverified teacher: Read published content — Yes; Read drafts — No; Create — No; Edit own draft — No; Publish — No

Verified teacher: Read published content — Yes; Read drafts — No; Create — Yes; Edit own draft — Yes; Publish — No

Moderator: Read published content — Yes; Read drafts — No; Create — According to policy; Edit own draft — According to policy; Publish — With second-eye approval

Owner: Read published content — Yes; Read drafts — Yes; Create — Yes; Edit own draft — Yes; Publish — Yes

This is the intended policy, not a certification of the implemented rules.

Important checks:

authorUid must equal request.auth.uid on creation.

The submitted author role must never determine authorization.

Teacher verification must be checked against authoritative Firestore data.

A teacher who loses verification must immediately lose authoring privileges.

Students must not be able to change document ownership.

Students must not be able to change publication or review fields.

Moderators must not approve their own work.

The Owner's authority must have a secure bootstrap mechanism.

The two hardening details you mentioned are good:

Checking the live teacher flag during updates.

Pinning seed-document shape through create rules.

However, neither alone establishes complete authorization safety.

One particularly important issue: Firestore Rules are additive across matching allow expressions. A restrictive rule does not override another permissive matching rule. Review the complete deployed ruleset, not just the four new collection blocks.

Also, Firestore document reads are document-level. Rules cannot hide selected fields in a document while allowing the rest to be read. This is another reason to separate restricted answer keys from ordinary lesson metadata.

### (b) Signed-in-only access

Correct architectural decision

Your rule:

signedIn() && status == 'published'

is consistent with the stated owner instruction.

If applied correctly to all four collections, it prevents anonymous users from reading even published content.

A few distinctions matter:

1. List queries

Firestore Security Rules are not filters.

An anonymous query cannot retrieve a collection and receive only permitted documents. If the query's potential results violate the rule, the entire query is denied.

Signed-in students should query published documents explicitly:

status == published

Appropriate parent ID constraints.

Appropriate ordering and pagination.

Draft documents should never be returned to students.

2. Collection coverage

Verify these four paths individually:

/jobSubjects/{subjectId}

/jobChapters/{chapterId}

/jobTopics/{topicId}

/jobLessons/{lessonId}

Also verify every nested collection and collection-group query.

A rule protecting /jobLessons/{lessonId} does not automatically protect a different collection containing lesson-related information.

3. Other collections

Your distinction between:

jobExams and jobCategories: anonymous-readable.

Four learning-content collections: signed-in-only.

is reasonable.

However, inspect whether any existing collection contains duplicated lesson descriptions, question previews, answer explanations, or other content that defeats the intended access restrictions.

Conclusion: I see no inherent flaw in the signed-in-only design. The remaining concern is complete path coverage and overlapping permissions.

### (c) Canonical subjects and exam-pattern configuration

This is one of the strongest parts of the design.

The approach:

verified exam configuration → canonical subjects → generated documents

is preferable to manually maintaining multiple competing subject lists.

The reported marks totals are:

BCS — 10 subjects — Expected total 200

Bank — 5 subjects — Expected total 100

Primary — 4 subjects — Expected total 90

NTRCA — 4 subjects — Expected total 100

Total — 23 subjects — 490

The important architectural distinction is that the configuration is the source of truth, while the subject documents are derived representations.

Should Firestore Rules validate the derivation?

Yes, they should validate the security-relevant identity and relationships, but they should not attempt to reproduce the entire application-side generation algorithm.

I recommend three layers:

Build-time validation: Compare the generated 23 subjects against the verified configuration.

Seed-time validation: Reject documents with unknown exams, incorrect subject IDs, incorrect marks, or invalid parent references.

Firestore Rules: Restrict document creation to canonical exam/subject combinations and enforce immutable identity fields.

Rules cannot automatically know whether a JavaScript configuration file has changed. Therefore, a CI consistency check is essential.

Also, pin the configuration version used to generate the subject documents. If an official exam pattern changes, you want to know which version produced the existing records.

My recommendation: Do not make Firestore Rules responsible for recomputing all marks totals. Make them enforce trusted identity and immutable fields; let automated validation enforce arithmetic and generation consistency.

### (d) Seed importer safety

Good design, subject to implementation verification

The following decisions are good:

JSON seed stored on disk.

Emulator-only import.

No automatic live deployment.

Idempotent behavior.

Read-back verification.

Separate approval before switching the application read path.

I would add these safeguards:

Fail-closed emulator detection. Refuse to run unless the emulator endpoint and expected project configuration are positively verified.

Production guard. Explicitly reject production project IDs and production Firestore endpoints.

Deterministic IDs. Use stable subject document IDs rather than randomly generated IDs.

Non-destructive writes. Never delete or overwrite existing content merely because it is absent from the seed.

Drift detection. If an existing document differs from the expected seed, report the difference rather than silently overwriting it.

Dry-run mode. Show intended creates, updates, and skipped documents before writing.

Audit manifest. Include the seed version, configuration version, timestamp, project ID, and document counts.

Independent read-back. Verify every document's fields and relationships, not just the number of successful writes.

One nuance: audit logs stored only in a client-accessible Firestore collection are not inherently trustworthy. Protect audit records from modification and deletion by ordinary users.

Your reported 23 created, zero errors, and zero mismatches is encouraging. It proves the reported emulator run behaved as expected, not that the importer cannot accidentally target production.

### (e) Should subject and topic names be visible to signed-out visitors?

My recommendation: YES. Keep the hardcoded metadata publicly visible.

I would not put subject names and marks behind a login wall.

There is an important distinction between educational catalogue metadata and restricted learning material.

Public catalogue metadata — Allow: Exam names; Subject names; Subject marks; Chapter/topic names, if intentionally public; Empty-state messages

Protected educational content — Restrict: Draft lessons; Lesson bodies; Questions and answer keys; Restricted explanations; Teacher drafts and reviewer comments

Why?

Students can explore the platform before registering.

Search engines can discover the educational catalogue.

Visitors can understand what the platform offers.

Empty states are honest rather than misleading.

Public catalogue metadata does not grant access to protected educational material.

There is also a useful distinction in your implementation: the hardcoded metadata is not the same thing as Firestore content.

If the names and marks are intentionally public, there is no reason to introduce an authentication dependency merely to render them.

One condition: Do not accidentally include unpublished teacher-created descriptions, internal review notes, or lesson previews in that public metadata.

My verdict on this UI question: retain public subject names and marks.

### (f) Step 7 compatibility — Question Bank

This is the area where I would be most careful about architectural decisions now.

Step 7 introduces a more complicated security model:

draft → submitted → under_review → approved → published

It also introduces two-tier question storage and receipt-gated answer keys.

Step 6 should establish the foundations without prematurely assuming that all learning content has the same visibility rules.

Recommended separation:

Step 6 — Learning structure: jobSubjects; jobChapters; jobTopics; jobLessons — Structure, educational metadata, lesson publication and ownership.

Step 7 — Question Bank: jobQuestions — Question metadata, exam/subject/topic relationships, lifecycle and ownership.

Question access tiers:
Tier 1 — Student-accessible question material according to publication policy.
Tier 2 — Separately protected answers and explanations.
Access receipts — Trusted access-grant records, separate from question documents.

I recommend the following rules for Step 7.

1. Separate answer keys physically.

Do not put the answer key inside a question document that students can read.

For example:

jobQuestions/{questionId} — question, options, publication metadata.

jobQuestionAnswers/{questionId} — correct answer, explanation, restricted information.

jobQuestionReceipts/{receiptId} — access authorization records.

These are illustrative collection names, not a requirement to adopt those exact names.

Firestore Rules operate at document level, not field level. Separating documents is therefore essential.

2. Do not reuse Step 6 publication permissions blindly.

The Step 7 state machine should have explicit allowed transitions.

draft → submitted — Author
submitted → under_review — Moderator
under_review → approved — Independent reviewer
approved → published — Authorized publisher

The exact assignment can be adjusted to Eduvelto's governance model, but students must never control these transitions.

3. Make question ownership immutable.

Question authorship, submission history, review history and approval identity must be protected.

A question author must not be able to approve their own question.

4. Protect answer access independently of question publication.

A published question does not automatically imply that its answer key is available.

The answer-key rule should independently establish:

The requester is authenticated.

The question is published.

The requester has an eligible access grant.

The grant belongs to the requesting UID.

The grant corresponds to the correct question or permitted question set.

The grant has not expired or been revoked, where applicable.

5. Design receipts before designing the UI.

This is especially important under the Spark-plan constraint.

A React interface that checks whether a receipt exists is not security enforcement.

The actual answer document read must be protected by Firestore Rules.

If a genuine payment is involved, a trusted payment-verification mechanism must issue the authorization. Without that, the system must use a human-approved grant or another genuinely verifiable access mechanism.

6. Avoid putting answer keys into lesson documents.

This is an easy architectural mistake.

Even if Step 7 rules correctly protect question answers, an answer copied into a published lesson document could bypass that protection.

Define one authoritative location for restricted answer material.

Step 7 compatibility verdict: Step 6's hierarchy is a good foundation. However, the Question Bank must have its own security model rather than inheriting all lesson permissions.

## 3. Verification results — what they establish and what they don't

The reported results are positive.

TypeScript — Clean — Good
Production build — Passed — Good
Unit tests — 122/122 — Good
Firestore Rules tests — 450/450 — Good reported coverage
Rules test files — 12 — Good organization
Emulator seed — 23 created — Good
Read-back mismatches — 0 — Good
Staging routes — 9/9 returned 200 — Good

However, these results need to be interpreted correctly.

A successful build does not establish authorization correctness.

Passing rules tests does not establish that all production rules paths were tested.

An emulator seed does not establish production deployment safety.

HTTP 200 responses do not establish that unauthorized Firestore reads are denied.

Unit tests do not establish that the actual deployed rules match the tested rules.

Firebase provides a dedicated Security Rules testing workflow using the Firestore Emulator. I would retain that as a mandatory part of the release process.

Additional tests I would require

These are particularly valuable additions to your existing 450 tests.

Anonymous reads published subject — Denied
Anonymous reads published lesson — Denied
Student reads draft lesson — Denied
Student reads submitted lesson — Denied
Student creates subject — Denied
Student creates lesson — Denied
Student changes author UID — Denied
Student changes verification status — Denied
Student promotes own role — Denied
Unverified teacher creates lesson — Denied
Verified teacher creates own draft — Allowed
Verified teacher edits own draft — Allowed
Verified teacher edits another teacher's draft — Denied
Demoted teacher edits previous draft — Denied
Author approves own submission — Denied
Moderator publishes without second-eye approval — Denied
Moderator approves own work — Denied
Invalid parent reference — Denied
Cross-exam subject reference — Denied
Unauthenticated collection-group query — Denied
Student reads restricted answer document — Denied

Also test the actual production rules file, rather than a separately maintained test-only copy.

## 4. Specific architectural decisions

Here is how I would record the decisions in the Step 6 technical review.

Four separate learning collections — Approve
23 canonical subjects — Approve
No subjects for unverified exams — Approve
Hardcoded catalogue remains active — Approve
Seed importer is emulator-only — Approve with safety checks
No live seed deployment yet — Approve
Signed-in-only content reads — Approve
Public exam/category metadata — Approve
Public subject names and marks — Approve
Honest empty states — Approve
Teacher authorization based on live verification — Approve in principle
Second-eye publication guard — Approve in principle
Step 7 receipt-gated answers — Requires separate architecture approval

Two important conditions

Condition 1: Zero verified teachers

This is a good initial security posture.

Until a teacher has actually been verified, no teacher should be able to create or publish learning content.

Your tests should distinguish between:

A verified teacher test fixture.

An unverified teacher.

A demoted teacher.

A student attempting to impersonate a teacher.

Do not enable teacher authoring merely because the UI contains a teacher dashboard.

Condition 2: No live Firestore read-path switch

Keep the current hardcoded canonical library until the next approval.

That separation is valuable because it means Step 6 can establish the schema and security model without introducing an unnecessary production-data dependency.

I would approve the read-path migration separately, with its own rules and integration tests.

## 5. Final verdict

APPROVE WITH CHANGES REQUIRED
Step 6 is architecturally sound, but not yet security-certified.

The collection design, canonical subject derivation, empty states, emulator-only seed strategy, and signed-in-only access policy are all reasonable decisions.

The remaining approval conditions concern authorization integrity, complete Firestore Rules coverage, and preparation for Step 7.

Before marking Step 6 complete

My required closure checklist:

Verify that students cannot modify roles, verification status, authorship, or publication fields.
Verify Owner and Moderator authorization against trusted records.
Verify second-eye independence.
Verify live teacher demotion immediately removes authoring privileges.
Verify all four collection paths and nested paths are protected.
Verify no overlapping permissive rules weaken the new restrictions.
Verify parent-reference integrity.
Verify no restricted question material exists in generally readable documents.
Add adversarial rules tests for the scenarios above.
Document the Step 7 receipt-verification constraint.
Keep live seed deployment and Firestore read-path migration separately gated.

The single most important fix

Establish and independently verify the complete authorization boundary in the actual deployed Firestore Rules.

In particular, make sure that authorization comes exclusively from trusted Owner/Admin/verified-Teacher records, never from client-submitted role, verification, or authorship fields.

A passing test suite is encouraging, but the actual deployed rules must enforce that boundary.

My recommendation is to resolve the authorization and rules-coverage conditions first, then close Step 6 without waiting for Step 7 implementation. Record receipt verification as a mandatory Step 7 architecture gate.

Final decision: APPROVE WITH CHANGES REQUIRED.

The overall direction is good. I would preserve the architecture rather than redesign it. The priority is to prove that the security boundaries are enforced, not merely represented in the application.

For a definitive line-by-line security sign-off: The four Firestore rule blocks, shared authorization helper functions, user-role rules, and the 12 rules-test files are the minimum artifacts I would need to inspect. Without them, claiming that no student escalation or unauthorized read is possible would be an unjustified security certification.
