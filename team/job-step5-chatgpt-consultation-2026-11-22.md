# Step 5 — ChatGPT Consultation (22 Nov 2026)

**Source:** ChatGPT, no sign-in (guest/anonymous chat), no personal data / credentials / account details shared. Conversation: https://chatgpt.com/uc/6b0259b2-c29c-83ea-a0de-2b0f143390ec
**Claude / Meta AI:** not attempted this round (ChatGPT answered; Claude still sign-in-blocked, Meta AI still policy-blocked from earlier rounds).
**Verdict: "APPROVE WITH CHANGES REQUIRED — Do not close yet."**
**Qualification (ChatGPT's own):** it reviewed the supplied implementation description, NOT the actual Firestore rules, source code, seed files, or test implementations. It cannot certify that a specific exploit exists. Its security findings identify conditions that must be demonstrated against the actual implementation, not assumed from the test count.

## Full answer (verbatim)

Step 5 — Technical design review and closure verdict
APPROVE WITH CHANGES REQUIRED
Do not close yet

Overall assessment: Step 5 is architecturally sound and demonstrates good restraint around unverified examination information. The decision to retain the hardcoded canonical configuration, avoid inventing the IT examination pattern, separate verified and practice results, and avoid prematurely publishing seed data are all correct.

However, there are several issues that must be resolved before Step 5 can be considered closed.

The most important is a security distinction:

Passing Firestore rules tests does not necessarily mean the intended publishing and ownership model is secure. In particular, the decision to enforce rulesConfigHistory in admin-UI code rather than Firestore rules creates a potential direct-write bypass.

I would not reject the architecture or require a redesign. I would require targeted security, data-integrity, and product-behaviour changes.

### 1. Overall assessment

Area / Verdict / Priority
Firestore access control / Needs security hardening / Critical
Hardcoded read path / Correct decision / Accept
isDraftStatus() deviation / Correct in principle / Verify
is int deviation / Correct / Accept
Seed JSON / Correct staging approach; application safeguards needed / High
IT hub / Honest content, premature target selection / High
10-category UX / Good architecture; taxonomy integrity needs protection / Medium
rulesConfig / Good concept; null semantics need clarification / High
Signed-in UI testing / Incomplete / High
Step 6 integration / Requires explicit data-contract decisions / High

### 2. Firestore security review — Critical, must resolve before closure

Two separate questions: (1) Can an unauthorised user read or write something they should not? (2) Can an otherwise authorised user modify something beyond their assigned permissions? The described rules appear to address the first reasonably well. The second needs more attention.

**(a) Can students read unpublished exams?** The intended design is correct: students can read Published exams only. The security rule must enforce this at the document level, not merely filter results in React. The essential condition is (illustrative, not a replacement for reviewing the actual rules):

```
allow read: if isAdmin()
    || isModerator()
    || (
      isAuthenticated()
      && resource.data.status == 'Published'
    );
```

Requirements: anonymous users must not read drafts; authenticated students must not read drafts; students must not read exams with Pending Review, Under Review, Rejected, or other unpublished statuses; a student must not retrieve a draft through a direct document read; a collection query must not bypass the publication condition; Admin and Moderator access must follow their intended roles. Firestore security rules are not query filters — a query that could return an unpublished document must be rejected rather than silently filtered. Additional concern: verify that the author exception does not allow a student to create an author identity and then read their own drafts. The author-draft exception should only apply to approved content contributors.

**(b) Can students write categories?** Only Admin can write jobCategories — correct, provided the actual rules enforce: Read categories Yes/Yes/Yes (Student/Moderator/Admin); Create No/No/Yes; Update No/No/Yes; Delete No/No/No. The no-delete decision is sensible because categories are structural dependencies for the 14 examination hubs. Also protect category identity: stable category document IDs; immutable category identity fields; explicitly validated category slugs; referential integrity checks before changing or deactivating a category; no category deletion through the ordinary admin interface.

**(c) Can someone escalate privileges?** Not fully established by the supplied description. The most important issue is whether role determination relies on trusted data. The following must be true: students cannot write their own role; students cannot change their own approval status; students cannot make themselves Admin, Moderator, or Verified Teacher; a teacher cannot approve themselves; a Moderator cannot grant themselves Admin permissions; a document's authorId cannot be changed to another user's ID to gain access; role documents cannot be modified by ordinary users. Prefer trusted custom claims or a protected role-management mechanism. If roles are stored in Firestore, their write permissions must be restricted independently of the content rules. Also distinguish: Admin = full administrative authority; Moderator = content review and explicitly permitted draft operations; Verified Teacher = approved question authoring and examination review; Student = consumption and practice only. Do not assume that a Verified Teacher is automatically an Admin or Moderator.

**(d) Can someone tamper with rulesConfig or rulesConfigHistory? — Critical, strongest objection.** This is the biggest weakness in the described architecture. The Step 3 note says: "History enforcement is handled by admin-UI code; Firestore rules only type-check fields." That is insufficient as a security boundary. The admin UI is not the database security boundary. A user can bypass the UI and attempt direct Firestore writes using an SDK or REST interface. Consider: an approved Moderator can update an exam draft; the Moderator is permitted to modify the document; the Moderator directly writes a new rulesConfig; they also replace or clear rulesConfigHistory; the admin UI's validation is never executed; the rules might accept this if they only validate the type of rulesConfig. That would allow an authorised user to exceed their intended authority.

Required change: separate content-editing permissions from examination-rule permissions. Recommended field permissions: Exam description — permitted content editor; Display name — permitted content editor, subject to review; Category reference — Admin; Publication status — Admin/explicitly authorised publisher; rulesConfig — Admin only; rulesConfigHistory — Admin only, with integrity validation; Verification metadata — Admin only; Author identity — immutable after creation. At minimum, Firestore rules should reject changes to protected fields by anyone other than Admin. For history integrity, the design should additionally enforce: existing history cannot be silently deleted; existing entries cannot be modified; new history entries are appended, not substituted; a configuration change must be accompanied by the corresponding history update; the history records the previous and new configurations, actor, and timestamp; history cannot be fabricated by a Moderator. Firestore rules can validate selected properties of a before/after document using diff(), affectedKeys(), and list comparisons. Complex audit-history validation may require a carefully designed data model. One important distinction: Firestore rules do not provide a general-purpose transactional audit-log engine. If robust append-only auditing becomes necessary, use a separately protected history collection and restrict its writes accordingly. Do not treat frontend validation as sufficient protection for examination integrity.

**Additional publishing protection:** explicitly enforce this state-transition policy: creation must start in the intended draft state; a Moderator cannot publish; a Verified Teacher cannot publish unless explicitly granted that authority; a student cannot create, edit, submit, or publish questions; Published examination configurations cannot be silently changed by ordinary editors; any material change to a Published examination must trigger the appropriate review process. Also, because there are currently zero Verified Teachers, the system must not accidentally interpret an empty reviewer list as permission to publish.

### 3. Read-path decision: keeping hardcoded configuration — Approve

This was the correct decision. Switching to Firestore when there are no live category documents, no live examination documents, no admin writer interface, and seed data has not been applied would create an unnecessary availability dependency and could render the Jobs section empty. The hardcoded canonical configuration currently provides a stable, tested source for the UI.

What must happen before switching? All of these: seed approval (explicit approval to apply the 10 category and 14 examination documents); seed validation (every document must pass schema and reference validation); admin writer (a controlled interface must exist for creating and editing categories and exams); security verification (direct Firestore access tests must prove that students cannot read unpublished data or write protected fields); readiness fallback (the UI must handle empty, incomplete, and failed Firestore reads without presenting a blank Jobs section); data parity (Firestore and the canonical configuration must produce identical category groupings and examination structures); migration testing (existing profile selections and progress must survive the transition); rollback (a way to return to the known-good hardcoded source).

Preferred migration strategy — controlled migration, not immediate replacement:

```
Hardcoded canonical configuration
              |
              v
      Seed Firestore data
              |
              v
       Validate parity
              |
              v
     Test Firestore reads
              |
              v
     Controlled cutover
              |
              v
     Monitor and verify
              |
       +------+------+
       |             |
  Success       Failure
       |             |
       v             v
  Firestore      Hardcoded
  read path      fallback
```

Do not maintain two independently editable canonical taxonomies indefinitely. During migration, one source must be authoritative, and the other should be generated or validated against it. The decision to switch read paths should remain a separate approved change, as currently planned.

### 4. The two deviations from Step 3

**(a) isDraftStatus() instead of literal reviewStatus == 'draft' — Approve with verification.** Justified correction: the architecture draft used a value that does not exist in its own §2.2 review-status enum. Keeping the literal comparison would make the create rule inconsistent with the actual schema. Using a helper function is better, provided it checks the correct field and exact permitted states. Important distinction: status describes publication state; reviewStatus describes the review workflow. These must not be treated as interchangeable. Example: { status: "draft", reviewStatus: "Not Started" } is a reasonable representation. Make the distinction explicit in code and documentation. Required verification: isDraftStatus() must check the intended publication-state field; it must not accept Published; it must not accept unknown or missing states; it must not accidentally accept Rejected or Pending Review unless explicitly intended; creation must enforce the initial review state as well as the publication state; the helper must be tested against every value in the documented enum.

**(b) is int instead of is number — Approve.** Sound improvement: questionCount and timeMinutes represent discrete quantities. Accepting arbitrary floating-point values would permit nonsensical configurations such as 100.5 questions or 60.25 minutes. Integers are the correct data types. For negativeMarking, retaining number is appropriate because decimal penalties such as 0.25 and 0.50 are legitimate. Additionally recommend validating semantic constraints, not just types: questionCount = positive integer; timeMinutes = positive integer; marksPerQuestion = positive number; negativeMarking = non-negative number; passMark = null or valid non-negative number; negativeMarkingVerified = boolean; patternVerifiedAt = null or valid timestamp. Also consider validating that a negative penalty does not exceed the maximum possible marks per question. Type checking alone is not sufficient. Verdict: both deviations are improvements over the inconsistent draft, but the first requires confirmation of the correct status field.

### 5. Seed JSON design — Approve with changes required before application

The staging-only approach is correct. Not applying the seed to the live database was particularly important because there is no approved Firestore read-path migration yet. However, several potential application failures exist.

**(a) status: 'draft' and reviewStatus: 'Not Started'** — logically consistent if these values belong to separate state machines. But the seed importer must preserve that distinction. Do not write an importer that assumes status === reviewStatus. Also confirm that the seed values exactly match the accepted enum values in the current Firestore rules. A capitalization mismatch or an outdated enum could cause documents to fail validation.

**(b) ISO timestamp strings — Must change before applying.** A known migration hazard. An ISO string such as 2026-11-22T08:00:00.000Z is not a Firestore Timestamp. If the application code expects a Firestore Timestamp, it may fail when calling timestamp.toDate(). It may also break timestamp comparisons, sorting, date formatting, Firestore queries using timestamp ranges, and audit/review chronology. The _meta instruction to convert timestamps to serverTimestamp() is good, but it must be implemented in the actual importer. Recommend: createdAt = server timestamp on first creation; updatedAt = server timestamp on every successful update; never overwrite an existing createdAt during reseeding; never replace meaningful existing updatedAt values with a fresh timestamp during an unchanged reseed. Also, be careful with batch writes: Firestore batches have a 500-write limit. Fourteen examinations plus ten categories fit comfortably in one batch, but future seed expansion may not.

**(c) Empty rulesConfigHistory** — acceptable for genuinely new documents. However, it must not be used as a reason to clear an existing history. The importer must distinguish: new document = initialise history as []; existing unchanged document = preserve history; existing modified document = require an explicit migration/update policy. A destructive overwrite is unacceptable.

**(d) Seed importer requirements** — required before any live application: dry-run mode (preview changes); stable document IDs (avoid duplicates); idempotency (safe repeated execution); existing-document detection (prevent accidental overwrites); schema validation (catch invalid fields); referential integrity (ensure category IDs exist); timestamp conversion (preserve correct Firestore types); audit record (establish who applied the seed); explicit approval (prevent accidental production changes). Particularly important: the seed should not automatically create Published examinations or assign verified status. The zero-Verified-Teacher condition must remain intact. Also require a post-application read-back comparison against the approved seed.

### 6. IT professional hub — Approve the hub; change target-selection behaviour

I strongly approve the decision not to invent an IT examination pattern. The scope question is genuine: government IT recruitment posts? Private-sector IT jobs? Professional IT certifications? A combination? These are materially different preparation pathways. Combining them into one invented examination structure would be misleading. The honest empty state is preferable to fabricated content.

But should IT be selectable as a target exam? My recommendation is no, not yet. This is an important distinction between two product concepts: a discoverable information hub vs a selectable examination target that drives a student's learning pathway. The IT hub is suitable for the first but is not ready for the second. Allowing students to select it as their target examination implies that Eduvelto knows what they are preparing for and can eventually map subjects, chapters, topics, and lessons to that target. That is not currently established. Potential consequences: Step 6 attempting to construct an IT syllabus; students receiving an empty or meaningless learning path; progress records becoming associated with an undefined examination; future taxonomy changes requiring migration of student profiles; confusion about whether an IT certification and a government IT recruitment examination are equivalent.

Recommended implementation — Keep: /jobs/it-professional accessible; the explanatory scope note; the honest empty state; no invented rules configuration; no invented marks distribution; no invented question counts. Change: exclude it from selectable target examinations for now; display an explicit scope_pending or equivalent readiness state; prevent Step 6 from generating a syllabus for it; preserve the option to enable target selection after the Owner approves the scope. A useful distinction would be:

```
{
  status: "draft",
  availability: "informational_only",
  syllabusReady: false,
  rulesConfig: null
}
```

(illustrative fields; use the actual project schema if equivalent fields already exist). If the product owner insists on keeping it selectable, it must be clearly labelled as an informational target with no available syllabus or preparation pathway. I would still prefer disabling selection. My recommendation: keep the hub, remove its target-selection eligibility until scoped.

### 7. Ten-category grouping UX and canonical taxonomy — Approve with safeguards

The move from tier-based grouping to ten canonical job categories is a good product decision. It makes the Jobs section easier to understand and gives students a familiar classification structure. Reusing one JobCategoryGroups component on /jobs and the homepage is also the correct architectural choice. It reduces the possibility of the two interfaces presenting different groupings.

What could drift or break? Five main risks:
1. Duplicate category definitions — if the category names exist independently in canonical taxonomy configuration, Firestore seed JSON, homepage-specific configuration, exam hub configuration, and profile selection configuration, they can diverge. There should be one authoritative taxonomy definition. Other representations should be generated from it or checked against it.
2. Category ID versus display-name mismatch — use stable IDs, not Bangla category names, as references (e.g. { id: "bcs_bpsc", name: "BCS ও BPSC", order: 1 }). Changing the display name should not break exam references.
3. Exams becoming orphaned — every examination hub should reference an existing canonical category ID. The tests should fail if: an exam references an unknown category; a category is missing; an exam appears in two categories unintentionally; an exam is omitted from the grouping; an exam has an invalid category order.
4. Homepage and /jobs inconsistency — both should use the same component and data source, but test the actual rendered output independently. Shared components do not automatically guarantee shared data.
5. Bangla rendering and responsive behaviour — check Bangla numerals and punctuation, long category names, mobile wrapping, small-screen horizontal overflow, empty categories, large numbers of hubs in one category, keyboard accessibility and screen-reader labels.

About the ten separate category pages: not building ten additional routes is a reasonable scope decision. I would not require separate category pages to close Step 5. The grouped /jobs page is sufficient at this stage. However, avoid encoding assumptions into Step 6 that every category necessarily has its own route.

### 8. rulesConfig design — Approve with changes required

The machine-readable examination configuration is a valuable addition. It is especially important that Eduvelto does not turn disputed examination information into apparently authoritative facts. The four configurations should not be treated as equally verified merely because they are all present in the same map.

**(a) Is null the correct encoding for unverified exams?** It is reasonable, but there is a semantic problem. null can mean several different things: no information exists; information exists but is unverified; the exam does not have a conventional MCQ pattern; verification has not been performed; the examination structure is deliberately undecided. These are different situations. For the current implementation, null is safer than inventing numbers. However, before expanding Step 6, I recommend distinguishing verification and availability states explicitly. For example: { rulesConfig: null, patternStatus: "not_verified" }. Possible statuses: verified, last_verified, not_verified, not_applicable, scope_pending. This avoids using null as the entire explanation for why information is missing.

**(b) Bank negative marking** — needs particular attention. The supplied configuration says: negative marking −0.25; negativeMarkingVerified: false; explanation: usually 0.25; the circular is final. This is more honest than simply presenting −0.25 as verified. However, I would not allow the numerical value to drive an authoritative scored examination mode while verification is false. There is a risk that the student sees a calculated score and assumes that Eduvelto has confirmed the official penalty. I recommend: { negativeMarking: null, negativeMarkingStatus: "unverified" }. If retaining the provisional numerical value is necessary for planning, separate it from the verified scoring configuration: { provisionalNegativeMarking: 0.25, negativeMarkingVerified: false }. Then the interface must clearly label it as provisional and must not represent the resulting score as an official examination score. Important: this is not merely a data-display issue. It affects the correctness of scoring.

**(c) patternVerifiedAt: null** — correct if the verification date genuinely was not recorded. Do not substitute the current date. That would create a false historical claim. But patternLabel: 'verified' combined with a null verification timestamp is not ideal. It says verification happened, but the system cannot establish when. I recommend eventually recording: verification status, verification date, verification source, source document or circular reference, reviewer identity, applicable examination session. For the existing data, leave the timestamp null and explicitly communicate that the date is unavailable.

**(d) patternLabel: 'last-verified-18th'** — a reasonable distinction for NTRCA. It correctly communicates that the 18th examination pattern should not automatically be interpreted as the current pattern for every subsequent recruitment cycle. The same principle should apply to all changing examination structures. A pattern should be associated with a specific applicable examination cycle. For example: { patternLabel: "last-verified-18th", applicableCycle: "18th" }. The exact field names can follow the existing schema.

**(e) BCS viva and NTRCA 19th omissions — Strongly approve.** Not writing disputed BCS viva figures into the configuration is correct. Not writing contradictory NTRCA 19th information is also correct. Additional point: since Eduvelto's examination system is MCQ-only, the platform must never imply that its MCQ score represents the student's complete official examination result when the real recruitment process also includes written or viva stages. The non-affiliation disclaimer is useful, but it does not replace accurate scope labels. For the current platform: MCQ preparation score is acceptable; practice score is acceptable; Verified MCQ result is acceptable when its examination configuration has been reviewed; complete recruitment selection prediction is not acceptable without the relevant stages and verified data.

**(f) Pass marks** — current configurations: BCS null; Bank no verified pass mark; Primary Teacher 45; NTRCA 18th 40. Acceptable only if pass-mark semantics are consistent. A pass mark should distinguish: officially published pass mark; historical pass mark; Eduvelto practice threshold; no verified pass mark. A null must never be interpreted as zero or automatically replaced with an assumed threshold.

### 9. Additional issues that could go wrong before closure

**(a) No signed-in browser click-through — Must complete.** Bundle evidence and automated tests are valuable, but they do not establish that the actual user journey works. I would require a manual browser test using at least: signed-out visitor; signed-in student; approved content contributor; Moderator; Admin. Test: open /jobs signed out (categories and public hubs display); open an individual hub (correct content and disclaimer); select IT hub (correct empty-state behaviour); student opens a draft URL (access denied); student attempts a write (access denied); Moderator opens an authorised draft (allowed); Moderator attempts publication (denied); Admin opens category management (allowed); student selects a permitted target (existing profile behaviour preserved); change Beginner to Advanced (progress preserved). Also test refresh, browser back, direct URLs, and mobile rendering.

**(b) Anonymous draft creation** — the absence of an anonymous draft write test is not necessarily a blocker if anonymous writes are prohibited. In fact, given the stated security model, that is preferable. I would explicitly verify: anonymous users cannot create job exams; anonymous users cannot create categories; anonymous users cannot modify existing documents; anonymous users can still read intended public content. Do not introduce anonymous writes merely to make a test pass.

**(c) Progress preservation** — the project explicitly promises that Beginner/Advanced switching never loses progress. The new category structure must not accidentally change the identifiers used to store: selected examination, subject progress, chapter progress, topic completion, lesson completion, practice history. Display names and category groupings should not become progress identifiers. Use stable IDs.

**(d) Practice and Verified Exam separation** — this boundary must survive future work. A client-side practice result must never become a Verified Exam result just because it is stored in Firestore. The distinction must exist in the data model and permissions, not only in the interface.

**(e) Zero verified teachers** — a critical operational constraint. The system must fail closed. No automated default, empty reviewer list, missing verification metadata, or admin-interface fallback should accidentally result in a Published examination.

**(f) Non-affiliation disclaimer** — good on /jobs and every individual hub. However, verify that it is also present in any future examination-detail or examination-pattern interface where users could mistake Eduvelto's configuration for an official circular.

**(g) Tier 3 IT hub** — the tier value must not accidentally affect the new category grouping or reintroduce tier-based classification into another component. The new taxonomy should remain the source of grouping truth.

**(h) Official URLs and external links** — officialUrl: null for IT is correct. Do not create a fake central authority URL merely to fill a field. For other examination hubs, verify that URLs point to relevant official sources, are not stale, and are clearly labelled as external.

### 10. What Step 6 must be told — Mandatory handover

Step 6 (Subject / Chapter / Topic / Lesson) must not treat Step 5 as permission to invent missing syllabuses. This is where the consequences of the current decisions become particularly important.

Step 6 — mandatory architectural constraints:
1. Preserve the canonical taxonomy — use the existing ten category IDs; do not create a second category list; do not group subjects by the old tier system; preserve the 14 examination hub IDs; category names are display values, not identifiers.
2. Do not invent examination structures — only create subject structures where an approved examination pattern or syllabus supports them. For unverified examinations: do not fabricate subject lists; do not infer marks distribution; do not invent chapter counts; do not generate a fictional syllabus to fill empty screens.
3. Respect rulesConfig: null — a null configuration must not trigger default values such as questionCount = 100; timeMinutes = 60; negativeMarking = 0.25. Missing examination rules must remain missing.
4. Keep IT out of syllabus generation — until the Owner defines the IT professional scope: no subjects, no chapters, no topics, no lessons, no examination-specific question generation, no target-based learning path. Keep the informational hub available.
5. Keep MCQ and non-MCQ boundaries explicit — Eduvelto is MCQ-only. Do not create written-examination or viva preparation structures under the assumption that the platform can assess those stages.
6. Preserve Beginner/Advanced progress — Beginner and Advanced must be presentation or learning-mode choices, not separate incompatible progress systems. Switching modes must not reset completed lessons or practice history.
7. Preserve result separation — Step 6 must not merge practice completion, practice scores, Verified Exam scores, lesson completion. They are different records with different meanings.
8. Preserve authorisation boundaries — students must not be able to create or modify the educational content hierarchy. The same ownership and review requirements must apply to subjects, chapters, topics, lessons, questions, examination patterns.
9. Use stable IDs and references — do not use Bangla titles, subject names, or category display names as database identifiers. Changing a title must not destroy student progress.
10. Keep source and verification metadata — every syllabus-derived structure should eventually carry provenance: source, applicable examination cycle, verification status, verification date, reviewer, last update. An unverified syllabus must not be presented as officially verified.

Recommended Step 6 dependency model:

```
Job Category
    |
    v
Job Examination Hub
    |
    +---- Scope / Readiness
    |
    +---- rulesConfig
    |
    +---- Verified Syllabus Source
                |
                v
             Subject
                |
                v
              Chapter
                |
                v
               Topic
                |
                v
               Lesson
                |
                v
          MCQ Practice
                |
                +---- Practice Result
                |
                +---- Verified Exam Result
```

The important rule is that a missing or unverified upstream structure must not produce fabricated downstream content.

### 11. Prioritised must-change list before Step 5 closes

**P0 — Security blockers (must be resolved before closure):**
- P0-1 / Protect rulesConfig from unauthorised changes / Moderator and student cannot modify protected examination rules through direct Firestore writes
- P0-2 / Protect rulesConfigHistory / Existing history cannot be deleted or modified by unauthorised users
- P0-3 / Verify role escalation protections / Student cannot become author, Moderator, Admin, or Verified Teacher by modifying client-accessible data
- P0-4 / Verify publication-state enforcement / Only explicitly authorised roles can publish; all other roles fail closed
- P0-5 / Verify student draft isolation / Direct document reads and collection queries cannot expose unpublished examinations
- P0-6 / Protect author ownership / Users cannot change authorId to acquire another user's draft access
P0-1 and P0-2 are the most important. The existing 262/262 rules tests are encouraging, but they need explicit adversarial coverage of protected-field modifications and history manipulation.

**P1 — Data integrity and product correctness:**
- P1-1 / Clarify status versus reviewStatus / Enums and helper functions are documented and tested
- P1-2 / Harden seed application / Idempotent, non-destructive importer with timestamp conversion
- P1-3 / Clarify unverified rulesConfig semantics / Null cannot silently become an invented scoring configuration
- P1-4 / Fix Bank provisional penalty behaviour / Unverified −0.25 cannot be presented as an authoritative score calculation
- P1-5 / Remove IT target eligibility temporarily / IT hub remains discoverable but does not generate a syllabus-dependent pathway
- P1-6 / Validate category references / All 14 hubs reference valid canonical category IDs
- P1-7 / Preserve progress IDs / Category and display-name changes cannot break existing progress
- P1-8 / Add examination-cycle metadata / Historical patterns are not presented as automatically current

**P2 — Verification and handover:**
- P2-1 / Complete signed-in browser testing / Student, contributor, Moderator and Admin journeys tested
- P2-2 / Test anonymous access / No anonymous content writes
- P2-3 / Test mobile category layout / No overflow or broken Bangla headings
- P2-4 / Validate disclaimer placement / Present on every relevant public exam interface
- P2-5 / Document Firestore migration prerequisites / No read-path switch without separate approval
- P2-6 / Produce Step 6 handover / Explicitly records all syllabus and verification constraints

### 12. What I would not change

Keep the hardcoded canonical configuration as the current read source. Do not apply the seed JSON yet. Keep the ten-category grouping. Keep one shared JobCategoryGroups component. Do not build ten separate category routes merely to complete Step 5. Keep the IT informational hub and honest empty state. Do not invent an IT examination pattern. Do not invent BCS viva marks. Do not invent the NTRCA 19th pattern. Keep integer validation for question counts and examination durations. Keep decimal support for negative marking. Keep verification dates null when they are genuinely unknown. Preserve the non-affiliation disclaimer. Keep practice results separate from Verified Exam results. These are sound decisions, and reversing them would not improve the architecture.

### 13. Final closure decision

**Step 5 verdict: APPROVE WITH CHANGES REQUIRED.** The overall design is approved in principle. Step closure is conditional on resolving the P0 security issues and the specified P1 product/data-integrity issues.

What is already acceptable: architecture and category grouping; hardcoded read path; staging-only seed; honest examination verification boundaries; IT informational hub; integer validation; shared category component.

What prevents closure: insufficiently enforced rulesConfig and history protection; role and publication transition security needs explicit verification; IT must not imply syllabus readiness; seed application and provisional Bank scoring need safeguards; signed-in browser verification remains incomplete.

### 14. Recommended formal closure statement

Decision: APPROVE WITH CHANGES REQUIRED. Step 5 (Job Categories and Exam Structure) is architecturally approved, subject to completion of the identified security and data-integrity requirements. The ten-category taxonomy, shared grouping component, hardcoded canonical read path, machine-readable examination configurations, and staging-only Firestore seed are accepted. The IT Professional hub is approved as an informational hub with an honest empty state. Its target-examination eligibility must remain disabled until the Owner defines its scope and approves an applicable preparation structure.

Mandatory conditions before closure: strengthen Firestore rules to prevent unauthorised modification of rulesConfig, rulesConfigHistory, ownership, and publication state; verify that students cannot read unpublished examinations or create, edit, submit, or publish educational content; verify that role escalation is impossible through client-accessible data; confirm the correct semantics and tests for isDraftStatus(); implement a safe, idempotent seed-application procedure with proper Firestore timestamps and history preservation; ensure unverified Bank negative marking cannot produce an authoritative-looking scored result; remove IT Professional from target-examination selection until its scope is approved; complete signed-in browser testing and document the security test results; provide Step 6 with the mandatory taxonomy, syllabus-verification, progress-preservation, and result-separation constraints.

Explicitly deferred: applying the seed to production Firestore; switching the UI read path to Firestore; building ten separate category routes; defining the IT Professional examination scope; adding unverified examination patterns; expanding the platform beyond MCQ examination preparation. These require separate approval where applicable.

Step 6 dependency: Step 6 must consume the approved canonical taxonomy and only build syllabus structures supported by an appropriately verified source. Missing examination patterns must remain missing, not be replaced by invented subjects, chapters, topics, or lessons.

Final decision: Step 5 is approved as an architectural implementation, but must not be marked fully closed until the P0 and required P1 acceptance criteria have been demonstrated.

Strongest recommendation: Do not let the team interpret 262/262 Firestore rule tests as sufficient evidence to close the security work. Add explicit tests for direct writes that attempt to change examination rules, erase history, alter ownership, and publish without permission. That is the difference between a design that looks secure in its intended UI and a design that remains secure when someone bypasses the UI entirely.
