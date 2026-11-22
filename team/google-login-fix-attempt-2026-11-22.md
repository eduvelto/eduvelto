# Google লগইন ঠিক করার চেষ্টা — রিপোর্ট (২২ নভেম্বর ২০২৬)

**শাখা:** `fix/google-login-diagnosis` (main 0b9fe0d থেকে)
**কাজের জায়গা:** `~/workspace/eduorbit/phase2-project-google-fix/`
**প্রেক্ষাপট:** মালিক ২২ নভে ১০:২৫ সিদ্ধান্ত বদলেছেন — Google লগইন বাদ দেওয়ার বদলে ঠিক করতে পারলে ঠিক করতে হবে ("jodi google login tik korte paro tyle agola tik korba")। `fix/remove-google-login` শাখা deploy/merge করা হয়নি।
**ভিত্তি:** `team/google-login-investigation-2026-11-22.md` (০০:৪৯–০১:০০ + ০৬:০৩/০৬:০৫ সংশোধনী) — তার যাচাই করা তথ্য আবার যাচাই করা হয়নি, তার ওপর দাঁড়িয়ে নতুন দিকগুলো দেখা হয়েছে।

---

## ১. সারাংশ — ঠিক হয়েছে কি না

**আংশিক — কোডে একটি আসল পরিবর্তন করা হয়েছে, কিন্তু মালিকের ফোনে পরীক্ষা না হওয়া পর্যন্ত "ঠিক হয়েছে" বলা যাবে না।**

| বিষয় | ফলাফল |
|---|---|
| মূল কারণ (সার্ভার না ক্লায়েন্ট) | ❌ এখনো চূড়ান্ত প্রমাণ নেই — দুটি সম্ভাবনা সংকুচিত হয়েছে (নিচে §৩) |
| নতুন ফিক্স (popup-first + redirect fallback) | ✅ শাখায় বানানো, build পাস, staging preview-এ দেওয়া হয়েছে |
| Diagnostic detail (আসল সার্ভার-মেসেজ দেখানো) | ✅ বানানো — পরের ব্যর্থতায় স্ক্রিনশটেই কারণ পড়া যাবে |
| মালিকের ফোনে Google লগইন পরীক্ষা | ⏳ বাকি — মালিকের কাজ (নিচে §৭) |
| Production deploy / merge | ❌ করা হয়নি — অনুমোদন লাগবে |

**সৎ কথা:** আগের তদন্তে যা ছিল — `auth/internal-error`, কনফিগ সঠিক, secret ঠিক আছে বলে মনে হয়, একজন Google ব্যবহারকারী ঢুকেছে — সেগুলো সব ঠিক আছে। এই কাজে SDK-র ভেতরটা পড়ে দুটি নতুন জিনিস বেরিয়েছে: (১) `auth/internal-error` কোডটি শুধু সার্ভারের `INTERNAL_ERROR`-এরই নয়, ক্লায়েন্ট-সাইডের ব্যর্থতারও হতে পারে; (২) link পরীক্ষায় Google সার্ভার-সাইডে জুড়ে যাওয়া সত্ত্বেও অ্যাপে internal-error আসা — এটা redirect-ফলাফল প্রক্রিয়াকরণের দিকে আঙুল তোলে, সার্ভার-বিনিময়ের দিকে নয়। তাই popup-first চেষ্টা করাটা আন্দাজে ফিক্স নয় — এটা প্রমাণ-ভিত্তিক নির্ণায়ক পরীক্ষা + সম্ভাব্য ফিক্স একসঙ্গে।

---

## ২. SDK থেকে যা পড়া হয়েছে (firebase 11.10.0 / @firebase/auth 1.10.8)

`node_modules/firebase/node_modules/@firebase/auth/dist/esm2017/index-35c79a8a.js` পড়া হয়েছে — অনুমান নয়, কোড থেকে।

### ২.১ সার্ভারের ভুল → SDK কোডের ম্যাপ (`_performFetchWithErrorHandling`)

- সার্ভারের জবাবে `needConfirmation` থাকলে → `auth/account-exists-with-different-credential`।
- `FEDERATED_USER_ID_ALREADY_LINKED` → `auth/credential-already-in-use`।
- `EMAIL_EXISTS` → `auth/email-already-in-use`।
- `USER_DISABLED` → `auth/user-disabled`।
- এর বাইরে: `errorMap[serverErrorCode]` থাকলে সেটা, না থাকলে `serverErrorCode.toLowerCase().replace(/[_\\s]+/g, '-')` — অর্থাৎ সার্ভার `INTERNAL_ERROR` ফেরত দিলে কোড হয় ঠিক `auth/internal-error`। সার্ভারের বিস্তারিত মেসেজ (যদি ` : `-এর পরে থাকে) SDK-র ভুলের **message-এ** বসে — কোডে নয়।
- নেটওয়ার্ক/JSON ব্যর্থতা (non-FirebaseError) → `auth/network-request-failed`, internal-error নয়।

**মানে:** দেখা কোড `auth/internal-error` দুভাবে আসতে পারে — (ক) Identity Toolkit সত্যিই `INTERNAL_ERROR` (HTTP 500) ফেরত দিয়েছে, অথবা (খ) ক্লায়েন্ট-সাইডের কোনো `_assert(..., "internal-error")` ভেঙেছে। আগের তদন্তে (খ) দেখা হয়নি।

### ২.২ ক্লায়েন্ট-সাইডে internal-error আসার জায়গাগুলো

| জায়গা | কখন ভাঙে | এই কেসে প্রযোজ্য কি না |
|---|---|---|
| `updateFromServerResponse` — `_assert(response.idToken / refreshToken)` | সার্ভার 200 দিল কিন্তু টোকেন ছাড়া | সম্ভব, প্রমাণ নেই |
| `_parseToken` / `_tokenExpiresIn` | টোকেন parse করা যায়নি | সম্ভব, প্রমাণ নেই |
| `_link` / `_reauth` — `_assert(user, ...)` | redirect-user খুঁজে পাওয়া যায়নি | link পথে: eventId থাকলে user না পেলে `resolve(null)` হয় (ভুল নয়) — তাই এটা নয় |
| `UserImpl._fromJSON` | সংরক্ষিত ব্যবহারকারীর তথ্য ভাঙা | ইমেইল লগইনও ভাঙত — ভাঙে না, তাই নয় |
| `_openIframe` — `_assert(gapi, ...)` | gapi লোড হয়নি | না — `loadGapi` ব্যর্থ হলে `network-request-failed` আসে; আর index.html-এ CSP নেই, service worker শুধু navigation ধরে |
| `getIdpTask` default | অচেনা event type | RedirectAction শুধু চেনা type-ই পাঠায় — নয় |

### ২.৩ Redirect-ফলাফল কীভাবে আসে (এটাই গুরুত্বপূর্ণ অংশ)

- `signInWithRedirect` → `_setPendingRedirectStatus` (session persistence-এ flag) → `_originValidation` → Google-এ নেভিগেশন।
- ফেরত আসার পর `getRedirectResult` → `RedirectAction.execute()` → `_getAndClearPendingRedirectStatus` → event manager (`_openIframe` — firebaseapp.com-এ লুকানো iframe, gapi দিয়ে postMessage) → `onAuthEvent` → `_signIn` → `signInWithIdp` (সার্ভার)।
- **Popup পথে এই সবকিছুই নেই:** popup থেকে ফলাফল সরাসরি postMessage-এ আসে, `getRedirectResult`, gapi iframe, pending-redirect flag, redirect-user lookup — কোনোটাই লাগে না। সার্ভার-কল (`signInWithIdp`) দুই পথে একই।

### ২.৪ অ্যাপের কোডে যা যাচাই করা হয়েছে (main 0b9fe0d)

- `signInWithPopup` কল ০টি; `getRedirectResult` একটাই জায়গায় (auth.tsx) — ডাবল-হ্যান্ডলিং নেই।
- `authErrorCode` non-FirebaseError-এ `null` দেয় — তাই Firestore-এর ভুল (`permission-denied` / `resource-exhausted`) কখনো `auth/internal-error` কোড হিসেবে দেখাত না। স্ক্রিনশটে দেখা কোডটি সত্যিই Auth SDK-র ভুল — Firestore-ভুল-ভুল-লেবেলের অনুমান **বাদ**।
- `index.html`-এ CSP meta নেই; `src/sw.ts` শুধু navigation request ধরে (network-first) — স্ক্রিপ্ট/iframe আটকায় না। gapi/iframe ব্লকের অনুমান **বাদ**।
- `main.tsx`-এ `React.StrictMode` আছে — production build-এ effect ডাবল-চলে না; এটা কারণ নয়।

---

## ৩. এখন সবচেয়ে জোরালো ব্যাখ্যা (দুটি, প্রমাণ-সহ)

### ব্যাখ্যা A — সার্ভার-সাইড `INTERNAL_ERROR` (Identity Toolkit 500)

- কোডের ম্যাপ (§২.১) থেকে ঠিক এই কোড আসে।
- কিন্তু: ৩ ঘণ্টায় ৪ বার, শুধু এক অ্যাকাউন্টে, আরেক অ্যাকাউন্ট একই সেটিংসে ঢুকেছে — ক্ষণস্থায়ী 500-র সঙ্গে মেলে না। অ্যাকাউন্ট-নির্দিষ্ট সার্ভার-সমস্যা হতে পারে (যেমন: ইমেইল+পাসওয়ার্ড অ্যাকাউন্ট থাকা অবস্থায় Google sign-in — "one account per email = link" সেটিংস বেছে নেওয়া থাকলেও ফ্রি প্ল্যানে ফিচারটি gated/নিষ্ক্রিয় (০৬:০৫ সংশোধনী) — সার্ভার link-পথে গিয়ে ভেতরে ভেঙে `INTERNAL_ERROR` দিতে পারে; এটা অনুমান, প্রমাণ নয়)।
- **বিরোধী প্রমাণ:** link পরীক্ষা (০০:৫৫) — link sign-in-এর অ্যাকাউন্ট-খোঁজা এড়িয়ে যায়, তবুও একই ভুল; আর link সার্ভার-সাইডে সফল হয়েছে।

### ব্যাখ্যা B — redirect-ফলাফল প্রক্রিয়াকরণে ক্লায়েন্ট-সাইড ব্যর্থতা

- Link সার্ভার-সাইডে সফল, অ্যাপে internal-error — এটা শুধু B দিয়েই ব্যাখ্যা হয় (সার্ভার-বিনিময় সফল হলে A-তে ভুল আসার কথা নয়)।
- Sign-in-এও একই: সার্ভার হয়তো সেশন বানিয়েছে, কিন্তু অ্যাপ redirect-ফলাফল পড়তে গিয়ে ভেঙেছে (টোকেন প্রক্রিয়াকরণ / event ডেলিভারি) — অ্যাপে কোনো সেশন নেই, ভুল দেখায়।
- **এই ব্যাখ্যাটাই popup-first ফিক্সের যুক্তি:** popup সার্ভার-কল একই রাখে, কিন্তু redirect-প্রক্রিয়াকরণ পুরো বাদ দেয়।

**কোনোটাই প্রমাণিত নয়** — দুটোকে আলাদা করার পরীক্ষা §৭-এ।

---

## ৪. এই শাখায় যা বদলানো হয়েছে (৩টি ফাইল)

### `src/lib/auth.tsx`
- **Popup-first Google sign-in:** `signInWithPopup` প্রথমে চেষ্টা করে। শুধু popup খুলতেই না পারলে (`auth/popup-blocked`, `auth/operation-not-supported-in-this-environment`, `auth/web-storage-unsupported`) নীরবে `signInWithRedirect`-এ যায় — আগের আচরণ অটুট (WhatsApp in-app browser / PWA-তে popup ব্লক হলে redirect-ই চলবে)। ব্যবহারকারী popup বন্ধ করলে (`popup-closed-by-user`), অন্য popup খোলা থাকলে, বা অ্যাকাউন্ট/সার্ভারের ভুল হলে — সেটাই আসল উত্তর, দেখানো হয়; নীরবে Google-এ পাঠানো হয় না।
- **Diagnostic detail (`errorDetail`):** প্রতিটি auth ব্যর্থতায় `fail()` এখন code + SDK message + customData-র redacted কপি রাখে। `customData._tokenResponse` কখনো রাখা হয় না (তাতে idToken/refreshToken থাকে) — শুধু `[withheld: contains tokens]` চিহ্ন। `console.error('[Eduvelto] auth failure:', detail)`-এও একই redacted কপি যায়। `clearError` / `clearAuthError` detail-ও মোছে।
- Role-setup hold popup-এও ঠিক থাকে (in-memory flag + sessionStorage — popup-এ রিলোড হয় না, redirect-এ hold বেঁচে থাকে)।

### `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`
- ভুলের নিচে collapsible **"ত্রুটির বিস্তারিত (সাপোর্টের জন্য)"** ব্লক — code + message + redacted customData। শুধু provider-ভুলে দেখায় (ফর্ম-ভ্যালিডেশন ভুলে নয়)।
- পুরোনো "redirect-শুধু" মন্তব্য ঠিক করা হয়েছে।

### বদলানো হয়নি (ইচ্ছে করে)
- **OAuth client secret reset করা হয়নি।** কোনো provider disable/enable করা হয়নি। Identity Platform / account-linking সেটিংস ছোঁয়া হয়নি। কোনো Google অ্যাকাউন্ট বানানো হয়নি। `firestore.rules` ছোঁয়া হয়নি। ইমেইল/পাসওয়ার্ড পথ ছোঁয়া হয়নি।
- Profile-এর link বোতাম এই শাখায় নেই — ওটা `fix/link-google-account` শাখায় (unmerged)। Google ফিরলে সেই শাখাতেও popup-first লাগবে (নিচে §৮)।

---

## ৫. যাচাই (এখন পর্যন্ত)

| পরীক্ষা | ফলাফল |
|---|---|
| `npm run build` | ✅ exit 0 (dist বানানো হয়েছে; বিস্তারিত `~/workspace/google-fix-build.log`) |
| `npm run test:rules` (alt ports — 8080/8081 অন্য এজেন্টের emulator-এ ব্যস্ত ছিল) | ✅ **180/180 পাস** (৭ ফাইল), exit 0, ~6.5 মিনিট; alt-ports কনফিগ `firebase.alt-ports.json` (firestore 8082, auth 9097, hub 4403) — টেস্টের পর মুছে ফেলা হয়েছে, কমিটে নেই |
| Staging preview (routes / /login /register) | ✅ https://eduvelto--google-login-fix-sygkjkl4.web.app (মেয়াদ ২৯ নভে ০৪:৪৭ UTC = ১০:৪৭ Dhaka) — /, /login, /register সব 200; served Login/Register chunk-এ "ত্রুটির বিস্তারিত" আছে, index chunk-এ popup কোড আছে — যাচাইকৃত |
| মালিকের ফোনে Google লগইন (popup) | ⏳ বাকি — মালিকের পরীক্ষা (§৭) |
| Desktop popup বনাম redirect (sandbox browser) | ⏳ করা যায়নি — এই সেশনে live browser নেই; মালিকের ফোনের পরীক্ষাই নির্ণায়ক |

**যা দাবি করা হচ্ছে না:** popup ফিক্সটি মালিকের ফোনে পরীক্ষা না হওয়া পর্যন্ত Google লগইন "ঠিক হয়েছে" বলা যাবে না।

---

## ৬. পুরোনো তদন্তের সঙ্গে মিল — কী বদলালো, কী বদলায়নি

- ✅ কনফিগ সঠিক (২৩:৪৩) — আবার প্রমাণিত নয়, তবে কোড-পাঠে কোনো কনফিগ-ভুল পাওয়া যায়নি।
- ✅ Secret ঠিক আছে বলে মনে হয় (একজন ঢুকেছে) — reset এখনো করা হয়নি, করাও উচিত নয় (§৮)।
- ✅ "Link accounts" সেটিংস gated (০৬:০৫) — এই তথ্যটাই ব্যাখ্যা A-র পেছনে আছে।
- ❌ "অ্যাকাউন্ট-ধাক্কাই (collision) পুরো কারণ" — আগের তদন্তেই দুর্বল প্রমাণিত হয়েছিল (link পরীক্ষা); SDK-পাঠ আরও দুর্বল করেছে: collision হলে কোড হতো `account-exists-with-different-credential`, internal-error নয়।
- ❌ "ভুলটি সার্ভার-সাইডে" — এখন আর নিশ্চিত নয়; link-সফল-তবুও-ভুল দেখায় ক্লায়েন্ট-প্রক্রিয়াকরণও সম্ভব।
- ➕ নতুন: ভুলের **message**-ই আসল তথ্য বহন করে — আগের সব স্ক্রিনশটে শুধু কোড দেখা গেছে, message কখনো ধরা হয়নি। এই শাখার diagnostic ব্লক সেই ফাঁক বন্ধ করে।

---

## ৭. মালিকের পরীক্ষা (নির্ণায়ক — ফোনে, ~২ মিনিট)

Preview: https://eduvelto--google-login-fix-sygkjkl4.web.app (মেয়াদ ২৯ নভে ১০:৪৭ Dhaka)

1. ফোনে **Chrome** খুলে preview-র `/login`-এ যান (লগইন করা থাকলে আগে লগআউট করুন)।
2. **"Google দিয়ে লগইন"** চাপুন → chooser-এ **bindoora23** বাছুন।
3. ফল জানান (স্ক্রিনশটসহ — ভুল হলে "ত্রুটির বিস্তারিত" ব্লকটি খুলে তার স্ক্রিনশটও দিন):
   - **ঢুকল → Google লগইন ঠিক হয়েছে** (redirect-ডেলিভারিই সমস্যা ছিল)। তখন production deploy-এর অনুমোদন চাওয়া হবে।
   - **আবার `auth/internal-error` এলো → সমস্যা সার্ভার-সাইড বিনিময়ে** (popup-ও একই সার্ভার-কল করে)। তখন পরের ধাপ: Firebase support / secret reset (শেষ উপায়, মালিকের স্পষ্ট অনুমোদন নিয়ে) — অথবা ইমেইল-শুধু লগইনে থাকা।
   - **"ব্রাউজার পপ-আপ আটকে দিয়েছে" + redirect-এ গিয়ে আবার internal-error → redirect-পথেই সমস্যা, popup খোলেনি** — তখন Chrome-এ (WhatsApp-এর ভেতরে নয়) আবার চেষ্টা করতে হবে।

---

## ৮. বাকি / পরের ধাপ

- **Secret reset — শেষ উপায়, এখন নয়।** Popup পরীক্ষায়ও internal-error এলে তবেই বিবেচনা; মালিকের স্পষ্ট অনুমোদন ছাড়া কখনো নয় (একজন সচল Google ব্যবহারকারীর লগইন ভাঙার ঝুঁকি আছে)।
- **`fix/link-google-account` শাখা:** Google ফিরলে Profile-এর link বোতামেও popup-first লাগবে (`linkWithPopup` + redirect fallback) — এখনো করা হয়নি।
- **Public-facing name `project-781355434811` → `Eduvelto`:** শুধু দেখতে ভালো হবে; লগইনের কারণ নয় (আগের রিপোর্ট §১৩)।
- **নির্ণায়ক পরীক্ষা (§১২-ক, আগের রিপোর্ট):** অন্য Gmail দিয়ে Google লগইন — এখনো হয়নি; popup পরীক্ষার ফলের সঙ্গে মিলিয়ে দেখতে হবে (অন্য Gmail-এ popup সফল হলে সমস্যা bindoora23-নির্দিষ্ট নিশ্চিত)।
- **`fix/google-login-errors` শাখা (1cd34e2):** এর মেসেজ-উন্নতি এই শাখায় আনা হয়নি — merge-এর সময় একসঙ্গে নিতে হবে (দুটোই Login/Register ছোঁয়; conflict দেখে মেলাতে হবে)।

---

*এই রিপোর্ট staging/branch-এর কাজের ভিত্তিতে লেখা। Production-এ কোনো পরিবর্তন করা হয়নি। পরের সিদ্ধান্ত মালিকের — বিশেষ করে §৭-এর ফোন-পরীক্ষার ফল।*
