# Job Step 7 — ChatGPT Consultation (verbatim)

- **Conversation:** https://chatgpt.com/uc/6b028e9a-2b80-83ea-87e1-6b1230627449
- **Date:** 22 Nov 2026, ~12:41–12:44 Asia/Dhaka (browser task 4ab4cf1b)
- **Verdict: DO NOT CLOSE — Changes required**
- **Note:** a few long code blocks / table cells were truncated in the browser's page view at the points marked in brackets below; substance, headings, verdict and all P0/P1/P2 findings are as shown on the page. ChatGPT reviewed the design brief only — it did NOT inspect the actual firestore.rules file.

---

# Independent security review — Eduvelto Step 7

## Do not close
## Changes required

Overall verdict: Do not close Step 7 yet.

The architecture has several genuinely good security decisions. In particular:

- Separating question content from answer keys.
- Keeping students away from the authoritative question bank.
- Using published-only practice bundles.
- Checking the teacher's current verification status rather than trusting a role field alone.
- Requiring a second reviewer.
- Making submitted attempts immutable.
- Keeping practice scores separate from verified examination results.
- Using an empty production seed and an emulator-only importer.

However, there is one fundamental problem: Firestore Security Rules can enforce document access conditions, but they cannot atomically consume a one-use receipt as a side effect of a read. That distinction matters considerably for your receipt architecture.

I would not reject the overall architecture or require a paid backend. I would require several security changes and additional adversarial tests before this step can be closed.

One important qualification: I am reviewing the design and stated guarantees, not certifying the actual implementation. I have not inspected the complete firestore.rules file, so some findings are conditional: they identify what must be proved in the rules, rather than asserting that a vulnerability is definitely present.

## 1. Executive security assessment

| Security area | Assessment |
|---|---|
| Question-bank separation | Good design |
| Bundle/key separation | Good design |
| Student authoring restrictions | Good design, implementation needs inspection |
| Teacher verification | Good design, depends on user-document protection |
| Second-eye verification | Good design, transition rules need inspection |
| Receipt-based key access | Critical concern |
| One-use receipt enforcement | Not achievable through read rules alone |
| Ten-minute expiration | Feasible with correctly enforced timestamps |
| Attempt immutability | Feasible, subject to create/update validation |
| Duplicate detection | Acceptable as a detection mechanism |
| Importer isolation | Good design |
| Production readiness | Not yet established |

### The most important architectural distinction

There are three separate claims:

1. A student cannot read an answer key before submitting an attempt.
2. A student cannot forge an eligible submitted attempt.
3. A student cannot reuse a receipt.

These are not equivalent.

Firestore Rules can enforce the first under suitable conditions.

They cannot independently prove that the student genuinely performed the practice activity in a browser.

They also cannot atomically consume a receipt during a document read.

This is the central issue I would resolve before approval.

## 2. P0 — Must fix before closing

These are closure blockers.

### P0-01 — Receipt access is not genuinely one-use
Critical

Finding: The stated one-use guarantee cannot be implemented using Firestore read rules alone.

Suppose the following sequence occurs:

1. A student submits an attempt.
2. A receipt is created.
3. The student reads the answer key.
4. The student reads the same answer key again.
5. The student reads it from another browser session.

If the receipt remains valid for ten minutes, all these reads may succeed.

Why?

Firestore Security Rules authorize reads. They do not execute a transaction that changes a receipt from "unused" to "consumed" as a side effect of a successful read.

A read rule cannot safely implement:

```
if receipt is unused:
    allow reading key
    mark receipt consumed
```

That is not a supported security mechanism.

What exactly to change:

Choose one of these approaches:

- Option A — Recommended for the zero-budget architecture: Stop describing receipts as one-use. Explicitly define the [receipt as a ten-minute, attempt-bound authorization window — the page text was truncated in the view at this point, but the recommendation was Option A].
- Option B — If genuine one-use access is mandatory, introduce a trusted server-side operation that atomically validates [and consumes the receipt].

Option B requires a trusted backend or equivalent trusted execution environment. It cannot be achieved with Firestore [rules alone].

My recommendation: Option A.

For a free education platform, a ten-minute, attempt-bound authorization window may be an acceptable trade-off if [the limitation is documented / the scope is made explicit].

Do not claim one-use security when the implementation provides time-limited repeatable access.

### P0-02 — A student may be able to manufacture a submitted attempt
Critical

This is potentially more serious than the receipt replay issue.

Your architecture says:

A receipt opens a key only when anchored to a real SUBMITTED attempt.

But who establishes that the attempt is real?

There is no trusted server.

The browser is controlled by the student.

Consider this sequence:

1. Student reads a published bundle.
2. Student skips the actual practice interface.
3. Student directly writes a submitted attempt document using the Firestore SDK.
4. Student creates an eligible receipt if permitted.
5. Student reads the answer key.

If the security rules only check that:

- The attempt belongs to the authenticated UID.
- The attempt has status == submitted.
- The bundle ID matches.
- The receipt is recent.

Then the student may satisfy every condition without completing the intended practice activity.

This is a classic client-trust problem.

What exactly to change:

First, explicitly distinguish two meanings:

- submitted: a client has submitted an attempt record.
- verified: a trusted authority has validated the result.

Do not treat a client-created submitted document as proof of an independently verified activity.

For the zero-budget version:

1. Allow students to create only their own attempt documents.
2. Validate the bundle ID against an existing published bundle.
3. Require the exact permitted document schema.
4. Bind the attempt to request.auth.uid.
5. Enforce valid creation-time and status conditions.
6. Prevent changes to submitted attempts.
7. Clearly document that this is a client-attested submission, not cryptographic proof of genuine completion.

If the requirement is that students must be unable to manufacture a submitted attempt even when bypassing the browser, [a trusted server / backend is required — the page text was truncated at this point].

Important: Do not pretend that additional client-side validation solves this problem. A student can bypass client-s[ide validation].

### P0-03 — Verify that students cannot create their own receipts

Your description explains when a receipt is valid, but does not specify its creation authorization.

That is a significant missing part of the security design.

I need to know:

- Who can create a receipt?
- Can a student create their own receipt?
- Can a student update an existing receipt?
- Can a student delete and recreate a receipt?
- Can one user create a receipt referencing another user's attempt?
- Can an expired receipt be modified to become fresh?

What exactly to change:

For jobReceipts:

- Deny updates to existing receipts.
- Deny deletes.
- Require authentication.
- Bind the receipt UID to request.auth.uid.
- Bind the receipt to an existing submitted attempt belonging to that UID.
- Bind the receipt's bundle ID to the attempt's bundle ID.
- Require an existing published bundle.
- Require a trusted creation timestamp.
- Reject client-selected arbitrary expiration timestamps.
- Validate every required field and reject unexpected fields.

Use a server-validated timestamp, such as Firestore's request.time comparison with a serverTimestamp() creation field.

For example, conceptually:

```
receipt.createdAt == request.time
```

The exact expression must be checked against your actual write path and timestamp transformation.

Additional warning: If students can create their own receipts, that is not automatically a vulnerability if all the ot[her conditions are enforced — the page text was truncated at this point].

### P0-04 — Verify the complete answer-key authorization path

The answer key is your most sensitive collection.

The rule must protect every possible access path.

I would specifically inspect:

- Direct document reads.
- Collection queries.
- List operations.
- Reads using predictable document IDs.
- Reads by moderators.
- Reads by unverified teachers.
- Reads by users whose teacher verification has been revoked.
- Reads using an expired receipt.
- Reads using a receipt referencing a different bundle.
- Reads using a receipt referencing another UID's attempt.

What exactly to change:

Make the key authorization depend on all of the following:

```
request.auth != null

receipt exists

receipt.uid == request.auth.uid

receipt.bundleId == requested [bundle / key bundle — the code block was truncated in the page view]
```

The exact schema can differ, but all these relationships must be established through trusted rule lookups.

Also ensure there is no alternative rule granting broad access to jobQuestionKeys.

Remember that Firestore rules are additive: a permissive matching allow can override the intended restrictions of another matching rule.

Closure requirement: Test direct document access, not just the application interface.

### P0-05 — Protect user role and teacher verification fields

Your isVerifiedTeacher() approach is good.

However, its security depends on who can modify the underlying user document.

For example, if a teacher can update:

```
users/{uid}.verificationStatus
```

to:

```
verified
```

then checking the current verification status achieves very little.

What exactly to change:

For user documents:

- Students must never modify their own role.
- Teachers must never modify their own verification status.
- Moderators must not grant themselves administrator privileges.
- Moderators must not change their own verification status.
- Only explicitly authorized Owner/Admin accounts should modify privileged fields.
- Ordinary profile updates must preserve privileged fields.
- Validate allowed fields on every update.

Pay special attention to updates that use diff().affectedKeys().

A profile update should not accidentally allow modifications to security-sensitive fields simply because the updat[e includes other fields — the page text was truncated at this point].

Also test:

- A verified teacher whose verification is revoked.
- A moderator attempting to change their own role.
- A student attempting to add role: admin.
- A teacher attempting to change verificationStatus from pending to verified.

Important: Your current-database verification check is a strong design choice only if the underlying document is pro[tected].

## 3. P1 — Should fix before production

### P1-01 — Strengthen second-eye verification

The rule:

```
reviewer != authorId
```

is necessary, but not sufficient.

The actual publication transition must ensure:

- The author is the original author.
- The reviewer is the authenticated user performing the transition.
- The reviewer is currently authorized.
- The reviewer is different from the author.
- The question was previously in the correct state.
- The reviewer cannot overwrite author identity.
- The approval timestamp cannot be supplied arbitrarily.

What exactly to change:

For the transition to published, enforce:

```
previous.status == under_review

new.status == published

new.authorId == previous.authorId

new.rev[iewer == request.auth.uid — the code block was truncated in the page view]
```

Also validate the reviewer's current authorization.

If your policy allows only verified teachers and administrators to publish, enforce exactly that.

Do not rely on the browser hiding the Publish button from authors.

#### Important question

Can the original author submit a question, then change the author ID before publication?

If yes, the second-eye mechanism can potentially be bypassed.

Author identity must be immutable.

### P1-02 — Review the two-field state machine for inconsistent states

Using status and reviewStatus is not inherently unsafe.

I do not consider this deviation from the earlier design a blocker by itself.

However, two fields create additional possible combinations.

For example:

| status | reviewStatus | Assessment |
|---|---|---|
| draft | pending | Potentially valid |
| submitted | pending | Potentially valid |
| under_review | under_review | Potentially valid |
| approved | approved | Potentially valid |
| published | approved | Potentially valid |
| published | rejected | Invalid |
| draft | approved | Suspicious |
| archived | under_review | Suspicious |

The exact permitted combinations depend on your intended model.

What exactly to change:

Create an explicit state-transition matrix and enforce both fields together in the rules.

Do not validate the fields independently.

Also test direct transitions such as:

- Draft → Published.
- Submitted → Published.
- Rejected → Published.
- Archived → Published.
- Published → Draft without a version increment.
- Published → Draft with a version increment greater than one.

For returning published questions to draft, compare the old and new version values. Do not merely require that the vers[ion increased — the page text was truncated at this point].

### P1-03 — Explicitly validate missing fields, null values and types

This is a common Firestore Rules vulnerability source.

These are not interchangeable:

```
field does not exist
field == null
field == ""
field == 0
field == false
```

For example, a missing authorId and an explicit null authorId are different data states.

What exactly to change:

For each collection, explicitly validate:

- Required fields.
- Allowed optional fields.
- Field types.
- String length limits.
- Numeric ranges.
- Allowed enum values.
- Exact document keys where practical.

Use keys().hasAll() and keys().hasOnly() where appropriate.

For example, a question should not accept unexpected fields that could later be interpreted as privileged metadata.

Also validate nested maps and lists, not just the top-level document.

This matters particularly for:

- Question options.
- Answer references.
- Reviewer information.
- Source metadata.
- Verification metadata.
- Receipt references.

### P1-04 — Validate all create, update and delete paths separately

A frequent mistake is thoroughly testing document updates while leaving creation or deletion paths insufficiently p[rotected].

For each collection, inspect all three operations.

| Collection | Create | Update | Delete |
|---|---|---|---|
| jobQuestions | Authorized authors only | State-controlled | Explicit policy |
| jobQuestionBundles | Trusted publishing process only | Explicit policy | Explicit policy |
| jobQuestionKeys | Trusted publishing process only | Explicit policy | Explicit policy |
| jobReceipts | Validated access grant | Deny | Deny |
| jobAttempts | Own valid attempt | Restrict to permitted pre-submit changes | Explicit policy |

Particularly important: If a document is deleted and recreated, its original immutability and audit history may disa[ppear].

I recommend denying student deletion of attempts and denying receipt deletion.

For published questions, bundles and keys, use tightly controlled archival or replacement procedures.

### P1-05 — Confirm subcollection security explicitly

You mentioned:

```
users/{uid}/jobAttempts
```

This is a reasonable data-model choice.

However, Firestore security rules do not automatically inherit restrictions from a parent document.

For example, a rule protecting:

```
users/{uid}
```

does not automatically protect:

```
users/{uid}/jobAttempts/{attemptId}
```

What exactly to change:

Ensure there is an explicit rule matching:

```
/users/{uid}/jobAttempts/{attemptId}
```

and verify:

- The authenticated UID matches {uid}.
- No student can access another student's attempts.
- Only permitted fields can be created.
- Submitted attempts cannot be modified.
- Attempts cannot be deleted to reset security history.
- No broader recursive wildcard grants access.

Also inspect every other subcollection in the project.

Do not assume that a secure parent collection implies secure descendants.

### P1-06 — Check bundle and answer-key consistency

Separating bundles from keys is one of the strongest parts of your design.

However, they must remain synchronized.

Consider:

1. Question version 1 is published.
2. A bundle is generated.
3. The question is corrected.
4. Version 2 is published.
5. The old bundle still exists.
6. The old answer key remains accessible.

This can create incorrect scoring or expose outdated answers.

What exactly to change:

Use immutable versioned references.

For example:

```
questionId
questionVersion
bundleId
keyId
```

Make the bundle and key refer to the same question versions.

Do not overwrite an already published bundle in a way that silently changes the meaning of existing attempts.

Define an explicit policy for withdrawing or replacing published questions.

### P1-07 — Make the importer incapable of becoming an accidental production write tool

Your importer safeguards are excellent:

- Loopback restriction.
- Emulator live probe.
- JS mirror validation.
- Idempotency.
- Audit record.
- Seed hash.

However, an importer that is safe today may become dangerous after future modifications.

What exactly to change:

I recommend:

- Require an explicit emulator-only mode.
- Reject production project IDs.
- Reject non-loopback hosts.
- Never silently fallback to production credentials.
- Validate the target project before every write operation.
- Keep production credentials out of the importer environment.
- Add a CI test proving that production configuration is rejected.
- Keep the empty production seed policy.

One additional point: a JavaScript mirror of Firestore rules is not authoritative. It can drift from the actual deploy[ed rules].

The Firestore emulator tests must remain the authoritative validation.

## 4. P2 — Nice to have

These are worthwhile improvements but do not independently block closure if the P0 and P1 issues are addressed.

### P2-01 — Improve duplicate detection

Your use of cyrb53 is acceptable for duplicate detection.

You have correctly stated that it is not a security hash.

However, it can produce collisions, and it should not be used as proof of document integrity.

Recommendation:

- Keep cyrb53 for quick duplicate detection.
- Normalize question text before hashing.
- Include subject, chapter and relevant answer information in the duplicate comparison.
- Use SHA-256 if you later need a stronger content fingerprint.
- Never use the duplicate hash as an authorization mechanism.

No need to replace it just to satisfy a security checkbox.

### P2-02 — Add an explicit security audit trail

For authoring and verification, retain:

- Original author.
- Submission timestamp.
- Reviewer.
- Verification timestamp.
- Previous status.
- New status.
- Version number.
- Rejection reason.
- Publication timestamp.

An immutable audit history is preferable to repeatedly overwriting a single reviewer field.

However, remember that an audit record written by an untrusted client is not automatically trustworthy.

Protect its creation and modification rules.

### P2-03 — Consider Firebase App Check

App Check can help reduce unauthorized requests originating outside your legitimate application.

It is useful as an additional layer.

But:

App Check is not a replacement for authentication or Firestore Security Rules.

It also does not stop an authenticated student from using their own valid application credentials to make requests tha[t would otherwise be allowed].

I would treat it as defense in depth, not a closure requirement.

### P2-04 — Add abuse and resource limits

On a zero-budget Firebase Spark project, availability and quota exhaustion are relevant security considerations.

Consider:

- Maximum question length.
- Maximum explanation length.
- Maximum options per question.
- Maximum bundle size.
- Maximum attempt document size.
- Maximum receipt document size.
- Maximum allowed references.
- Strictly bounded list lengths.

Remember that Firestore document size is limited to 1 MiB.

Also avoid unnecessary rule lookups. Firestore Rules have limits on document access calls, and complex authorizatio[n can hit those limits].

## 5. Answers to your seven review questions

| # | Review question | Verdict |
|---|---|---|
| 1 | Can students read answers without a legitimate submitted attempt? | Potentially yes. A fabricated client-side submitted attempt is the key concern. |
| 2 | Can receipts be forged, replayed or reused after ten minutes? | Forgery depends on creation rules. Replay within ten minutes is possible unless access is otherwise restricted. Expi[red receipts should be denied — the table cell was truncated in the page view]. |
| 3 | Can teachers publish their own questions or escalate privileges? | Not determinable without actual rules. Immutable author identity, reviewer authorization and protected user field[s are required]. |
| 4 | Can Moderators or students write to protected collections? | Not determinable without inspecting every matching allow rule and create/update/delete path. |
| 5 | Are there rule-expression or data-model holes? | Potentially. Missing/null handling, state combinations, subcollection rules and document recreation require exp[licit inspection]. |
| 6 | Is anything unsafe in a serverless Spark project? | Yes: relying on browser behavior as proof of genuine submission, and claiming one-use reads. |
| 7 | Anything else before closure? | Yes: prove the entire authorization chain with adversarial tests and inspect the actual rules. |

## 6. Additional adversarial tests I require

Your 573/573 rules tests are encouraging.

However, a passing test count is not proof of security unless the tests actually attempt the attacks.

I recommend adding the following tests.

Adversarial security checklist — 0/33 verified

Check an item only after its test has actually been executed and reviewed.

- Student creates a question directly — Student cannot create jobQuestions.
- Student creates a bundle directly — Student cannot create jobQuestionBundles.
- Student creates an answer key directly — Student cannot create jobQuestionKeys.
- Student creates a receipt without an attempt — Denied.
- Student fabricates a submitted attempt — Document the limitation; verify the rules cannot mistake it for trusted verification.
- Student uses another user's receipt — Denied.
- Student uses another user's attempt — Denied.
- Student reads a key with an expired receipt — Denied.
- Student reuses a valid receipt — Document that repeat reads are possible, or implement trusted consumption.
- Student changes receipt creation timestamp — Denied.
- Student modifies an existing receipt — Denied.
- Student deletes a receipt — Denied.
- Student reads another student's attempts — Denied.
- Teacher publishes their own question — Denied.
- Teacher changes their own verification status — Denied.
- Teacher modifies authorId before publication — Denied.
- Moderator promotes themself to Admin — Denied.
- Moderator creates an answer key — Denied.
- Unverified teacher publishes a question — Denied.
- Revoked teacher publishes a question — Denied.
- Author publishes directly from draft — Denied.
- Rejected question is published directly — Denied.
- Published question returns to draft without version increment — Denied.
- Published question returns to draft with an increment of two — Denied.
- Question contains an unexpected privileged field — Denied.
- Required field is missing — Denied.
- Required field is explicitly null — Denied.
- Attempt is modified after submission — Denied.
- Attempt is deleted after submission — Denied.
- Bundle and key reference different versions — Denied.
- Question is read directly by a student — Denied.
- Question key is queried as a collection by a student — Denied.
- Unmatched collection path is accessed — Denied.

One important distinction: the fabricated-attempt test should not be marked as a security pass merely because the rul[es allow a client-submitted attempt — the page text was truncated at this point].

## 7. What I would keep unchanged

I would not unnecessarily redesign the entire Step 7 implementation.

These decisions are sound:

| Existing decision | Recommendation |
|---|---|
| Empty seed | Keep |
| No invented questions | Keep |
| Separate question bank | Keep |
| Separate bundles and keys | Keep |
| Published-only bundles | Keep |
| Current verification-status check | Keep |
| Second-eye review | Keep |
| Immutable submitted attempts | Keep |
| Attempt subcollection | Keep |
| cyrb53 duplicate detection | Keep |
| Emulator-only importer | Keep |
| Practice and verified results separation | Absolutely keep |
| No Cloud Functions | Can remain, with documented security limitations |

In particular, I would not recommend abandoning Firebase Spark just because it has no backend.

A serverless, rules-enforced education platform can be a reasonable architecture when its guarantees are carefully [scoped].

But it cannot offer the same trust properties as a system with trusted server-side execution.

## 8. Final closure conditions

Here is what I would require before changing my verdict.

### Step 7 closure requirements

Required before closure — P0 — Security guarantees
- Remove the unsupported one-use receipt claim or introduce trusted receipt consumption.
- Resolve the client-forged submitted-attempt limitation and document the actual trust boundary.
- Validate receipt creation, ownership, immutability and expiration.
- Verify every answer-key access path.
- Prove that students, teachers and moderators cannot escalate privileges.

Required before production — P1 — Rules and data integrity
- Enforce second-eye verification on the actual state transition.
- Enforce the two-field state machine.
- Validate required fields, nulls, types and allowed keys.
- Audit create/update/delete paths.
- Explicitly secure all subcollections.
- Establish bundle/key/question version consistency.
- Verify importer isolation.

Final evidence
- Run the adversarial tests against the actual Firestore emulator.
- Review the complete Firestore rules file.
- Confirm no broader matching rule overrides the intended restrictions.
- Confirm the production deployment configuration remains unchanged.
- Record the accepted client-side trust limitations.

### My final verdict
## DO NOT CLOSE

Reason: Two fundamental security guarantees are not established:

1. A submitted attempt is not necessarily proof of genuine activity when the student controls the client.
2. A receipt cannot be genuinely consumed once using Firestore read rules alone.

Architecture assessment: Fundamentally reasonable. No wholesale redesign required.

Recommended direction: Preserve the zero-budget Firebase Spark architecture, explicitly scope its guarantees, co[rrect the one-use / trust claims — the final line was truncated in the page view].

### What I need for a definitive code-level review

The most useful next step is to inspect the actual Firestore rules rather than infer their behavior from the design description.

Please provide:

1. The complete firestore.rules file.
2. The relevant jobReceipts and jobAttempts document schemas.
3. The tests for q66 and the receipt/key authorization tests.
4. The rules governing users/{uid}, particularly role and verification updates.

With those, I can perform a second-pass review and classify actual exploitable vulnerabilities separ[ately from design-level concerns].

My recommendation is to fix the trust-boundary and receipt issues first, not spend time rewriting th[e architecture].

---

*End of verbatim answer. Transcription note (from the browser task): the answer above is reproduced from the ChatGPT page as displayed. A few long code blocks / table cells were truncated in the browser's page view at the points marked in brackets; the substance, headings, verdict and all P0/P1/P2 findings are as shown on the page. The conversation tab was left open.*
