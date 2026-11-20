# Eduvelto — Phase 2 project skeleton

**শেখো, এগিয়ে যাও, স্বপ্ন গড়ো — Learn, Grow, Achieve.**
Free digital education platform for Bangladesh. **Budget: BDT 0** — no purchases,
no billing, no paid API credits, no public launch without the owner's approval.

This is the **Phase 2 implementation skeleton** (Vite + React 18 + TypeScript +
Firebase Spark). It is **push-ready**: the moment the owner creates the empty
GitHub repository (action A2), this code can be pushed. **Step 1 (auth +
profiles) is implemented** — email/password + Google sign-in, profile
creation on first sign-in, profile view/edit — against the real Firebase
project `eduvelto` (Spark, no billing); the web-app config is wired in
`src/firebase-config.ts`. Two console steps remain before a real student
can sign in (not code — needs a console session): enable **Email/Password
+ Google** sign-in (Authentication → Sign-in method) and create the
**Firestore database** (production mode, `asia-south1`). The security-rules
emulator suite must go green on a Java-capable machine before
`firestore.rules` is deployed (see "Emulator" below). Every page renders
an honest "no data yet" empty state until real published content exists.

**Demo-data rule: demo users and demo data are WIPED, never migrated.**
The Phase 1b demo (exported HTML + docs archive, already delivered) used
`localStorage` demo data. None of it moves into this project.

## Source of truth

- Master blueprint: `../eduorbit-complete-blueprint.md` (15 sections — costs,
  quotas, verdicts)
- Firestore schema + rule principles: `../database-schema.md`
- Milestones + gates G1–G13: `../milestones.md`
- This plan: `../phase2-implementation-plan.md`

## Prerequisites

- Node.js 18+ and npm (verified here: Node v24.22.1, npm 10.9.4)
- The Firebase project `eduvelto` (created 20 Nov 2026, Spark, no billing).
  The web-app config ("Eduvelto Web") is already wired in
  `src/firebase-config.ts`. Still to do in the console: enable
  Email/Password + Google sign-in and create the Firestore database
  (production mode, `asia-south1`) — see the note at the top of
  `src/firebase-config.ts`.
- A GitHub repository via action **A2** (same shape: owner signs in once,
  Muse does the clicks; Muse pushes the code).
- Java 17+ (only for running the Firestore emulator + rules tests locally;
  see "Emulator" below)

## Setup

```bash
npm install          # install dependencies (package-lock.json is NOT committed)
```

1. The Firebase config is already wired in `src/firebase-config.ts`
   (project `eduvelto`, web app "Eduvelto Web"). If it ever needs
   re-pasting, copy the values from the Firebase console
   (Project settings → Your apps → Web app) over the placeholders in
   `src/firebase-config.example.ts`.
   These client keys are **public-by-design** (they identify the project in
   the browser); security comes from `firestore.rules`, never from hiding
   them. **Never** commit a service-account key (`firebase-adminsdk-*.json`)
   — see `.gitignore`.
2. `.firebaserc` already points at the real project id `eduvelto`.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Type-check + production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run emulators` | Start Firestore + Auth emulators (needs Java) |
| `npm run test:rules` | Run the security-rules test suite in the emulator |

## Deploy (Firebase Hosting)

```bash
npm run build
npx firebase deploy --only hosting,firestore
```

See `DEPLOY.md` for the full deployment instructions, the no-billing rule,
PWA notes, and what to do when a quota is hit.

## Emulator (security-rules testing)

The Firestore emulator needs a Java runtime (`java` on PATH). Start it with
`npm run emulators`, then run the suite with `npm run test:rules`
(`emulator-tests/rules.test.ts`, using `@firebase/rules-unit-testing`).
Known environment issue (20 Nov 2026, this sandbox): the emulator starts
and Java 21 installs fine, but the Firestore JS SDK v10 gRPC transport
fails against emulator v1.19.8 here (`http2 exception` on rule load,
`RST_STREAM` protocol error on writes) — all 15 tests COULD NOT RUN here.
The suite is written and ready; it is a **pre-Phase-2 gate** and must run
green on a Java-capable machine before rules are deployed (see the
implementation plan §4 for the exact errors and re-verification commands).

## Project layout

```
src/
  main.tsx            entry point
  App.tsx             router (routes mirror page-map.md)
  firebase.ts         Firebase init (null-safe until config is pasted)
  firebase-config.ts  placeholder config (copy from .example, paste real values)
  i18n/strings.ts     Bangla-first UI strings (bn/en)
  lib/usage.ts        client-side usage counters (estimates; console is authoritative)
  lib/backup.ts       JSON export / restore helpers (admin only)
  components/PageShell.tsx   shared page shell + honest empty state
  pages/              one small real file per route (title + empty state, no fake data)
firestore.rules       hardened security rules (database-schema.md §5)
firestore.indexes.json composite indexes (database-schema.md §4)
firebase.json         hosting + firestore config (no Functions / no Storage)
.firebaserc           project id "eduvelto" — the real project (set 20 Nov 2026)
```

## Free-tier quotas (Spark, verified 20 Nov 2026 — do not exceed by design)

Firestore: 1 GiB stored · 50,000 reads/day · 20,000 writes/day ·
20,000 deletes/day · 10 GiB/month egress. Auth: 50,000 MAU.
Hosting: 10 GB storage · 360 MB/day transfer.
**Cloud Storage and Cloud Functions are NOT available on Spark** (Blaze/billing
only) — so there are no file uploads, no voice messages, no server-side code.

**Hosting transfer (360 MB/day) and Firestore egress (10 GiB/month) are
separate quotas with separate counters** — see `src/lib/usage.ts` and the
implementation plan. Do not mix them up.

## What is NOT in this project (by design)

- No private messaging, group chat, or voice messages (blueprint §7 — not
  until safety, age protection and moderation are ready).
- No live AI teacher — `/ai-teacher` is a labelled scripted demonstration.
  Free production-quality AI is not feasible (blueprint §5). Honest free
  helpers only: glossary, formula sheets, spaced repetition.
- No file uploads of any kind (no Storage on Spark).
- No fake data anywhere. Empty states say "no data yet" honestly.

## Audit docs

The Phase 1 / 1b audit documents live in `~/workspace/eduorbit/` alongside
this project (`eduorbit-complete-blueprint.md`, `database-schema.md`,
`milestones.md`, `page-map.md`, `roles-permissions.md`,
`security-child-safety-plan.md`, `hosting-plan.md`, `feasibility-report.md`,
`capability-matrix.md`, `architecture.md`). The demo archive is
`eduorbit-audit-docs.tar.gz`.
