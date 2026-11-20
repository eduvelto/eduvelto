# Eduvelto — Deployment guide (Phase 2)

## The no-billing rule (read first)

- **Never activate billing / Blaze, never add a payment method, never buy
  credits, a domain, or an API key without the owner's explicit approval.**
- The Firebase project stays on the **Spark (free) plan**.
- No public launch without the owner's approval. The pilot is a small group
  (one class / one institution, hundreds of users max).

## 1. Prerequisites (owner actions A1 + A2 — sign in once, watch ~5 min)

- **A1 — Firebase project:** the owner signs in once in the takeover
  browser; Muse does every click (console.firebase.google.com → Add project
  → name `Eduvelto` → Analytics off → Create → enable Email/Google sign-in
  → Firestore in production mode → Hosting setup). Spark plan, no billing,
  no payment method. Full click-by-click flow: implementation plan §3.
  Copy the web-app config into `src/firebase-config.ts` (Muse does this).
  `.firebaserc` already uses the real project id (`eduvelto`).
- **A2 — GitHub repo:** the owner signs in once in the takeover browser;
  Muse creates the empty repo (`eduvelto`, no README/.gitignore/license)
  and pushes the code. Push:
  ```bash
  git init
  git add .
  git commit -m "Eduvelto Phase 2 skeleton"
  git branch -M main
  git remote add origin https://github.com/<owner>/<repo>.git
  git push -u origin main
  ```
  (Replace `<owner>/<repo>` with the real repo the owner created. Never
  create a GitHub account or repository in the owner's name.)

## 2. First deploy

```bash
npm install
npm run build
npx firebase login        # maintainer's own login, in the owner's project
npx firebase use <project-id>
npx firebase deploy --only firestore   # rules + indexes first
npx firebase deploy --only hosting     # then the app
```

Deploy rules **before** hosting, so the app never serves against open rules.
Verify afterwards in the console: Firestore → Rules shows the deployed
`firestore.rules`, and Hosting shows the live URL (`*.web.app`).

## 3. PWA notes

- Manifest: `public/manifest.webmanifest` (name Eduvelto, standalone,
  theme `#0b5e3f`). Icons `public/icons/icon-192.png` and
  `public/icons/icon-512.png` are **to be added — original artwork only**,
  no copied logos. Until they exist, install prompts may show a generic icon.
- The service worker caches the app shell only. Firestore data is never
  cached for offline use beyond the current session's in-progress attempt.
- Offline: previously-viewed lessons may load; quizzes, login and posting do
  **not** work offline and must say so clearly.
- Never silently force-reload during a quiz for a service-worker update.

## 4. Quotas — what to do when one is hit

Spark quotas (verified 20 Nov 2026):

| Quota | Limit | When hit |
|---|---|---|
| Firestore reads | 50,000/day | Reads stop until daily reset |
| Firestore writes | 20,000/day | Writes stop until reset |
| Firestore deletes | 20,000/day | Deletes stop until reset |
| Firestore stored data | 1 GiB | Writes stop; data not deleted |
| Firestore egress | 10 GiB/month | Egress stops |
| Hosting transfer | 360 MB/day | Site stops serving until reset |
| Hosting storage | 10 GB | Cannot deploy more |
| Auth | 50,000 MAU | Sign-ins beyond allowance not free |

**Hosting transfer and Firestore egress are separate quotas, separate
counters.** Check them separately in the console (Hosting → Usage;
Firestore → Usage / Usage and billing).

When a quota is hit:
1. Do NOT upgrade to Blaze on the spot. Confirm in the console which quota
   was hit and what caused it (a popular page? a loop? an export?).
2. Wait for the reset (daily quotas reset at midnight Pacific) and tell the
   owner what happened and why.
3. Reduce load: paginate 20/page, no realtime listeners on public
   collections, no per-view writes, export backups off-peak.
4. Only the owner may approve a funded upgrade (action A5), with a budget
   alert set before any upgrade. Blaze has no spending cap — only alerts.

## 5. Backup before every deploy that touches rules or data

Export a JSON backup from the admin dashboard (see `src/lib/backup.ts`)
before deploying rule changes or content migrations, and test restore on
disposable test data first (export → delete test data → restore → verify
counts + content match). Export reads count against the 50,000 reads/day
quota; restore writes count against the 20,000 writes/day quota.

## 6. Rollback

- Hosting: `npx firebase hosting:rollback` (or redeploy the previous build).
- Rules: redeploy the previous `firestore.rules` from git history.
- Never roll back by deleting data. Removed content is retained for audit
  (`reviewStatus: "Removed"`), not deleted.
