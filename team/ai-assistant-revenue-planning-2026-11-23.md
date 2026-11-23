# AI Life Assistant — Revenue Planning (research note)

Date: 23 Nov 2026. Branch: `feature/ai-life-assistant`.
Scope: item 6 of the owner's 22:16 update — which features stay free,
which could become premium later, and how to earn while keeping the
user's benefit. **Research only: no paywall is built now, no income
is promised, and no figure below is a forecast.**

## Principles (from the owner's briefs)

- Eduvelto's core education stays **100% free forever**. The AI Life
  Assistant's everyday tools are part of that free core.
- No feature that a student needs for study may be put behind a
  paywall. Premium may only add convenience or volume on top of a
  free version that already works.
- No income claim without real data. Everything below is "could",
  not "will".

## Free forever (MVP — already built, no charge, no login)

- All 10 deterministic tools: EMI / interest / BMI / percentage
  calculators; length / weight / temperature / currency converters
  (user-entered rate); budget planner; day planner; letter /
  application / email / CV builders; 20-sentence Bangla–English
  phrasebook; study-plan outline.
- The AI chat itself, while the free Gemini quota lasts — asking
  everyday questions in Bangla or English costs the user nothing.
- No ads on the AI pages (directive §4) — the chat and tools pages
  never show ads, free or premium.

## Could become premium later (only after real usage exists)

These are ideas to test against real demand, in this order of
plausibility. None is built, priced, or promised.

1. **Higher AI usage** — free: the shared Gemini free quota (about
   1,500 requests/day for the whole site, first-come-first-served).
   Premium (later, if the quota ever binds): a higher personal daily
   limit, or priority when the free quota is exhausted. Price only
   after measuring real daily usage for at least a month.
2. **Saved documents** — free: build a letter/CV/email in the
   browser and copy it out (works now, nothing saved). Premium
   (later): save documents to the account, edit them later, export
   as PDF. Needs login-gated storage + a tested backup story first.
3. **Document packs / templates** — free: the current single
   templates. Premium (later, if teachers ask for it): ready-made
   packs (e.g. 20 job-application formats, CV designs). Only original
   templates, never copied.
4. **Priority / longer answers** — free: short everyday answers.
   Premium (later): longer, structured answers (e.g. full study
   plans, detailed letter drafts) if the model cost justifies it.

Explicitly NOT premium, ever: asking a question; the calculators and
converters; the phrasebook; the study-plan outline; reading any
educational content.

## How income could come without harming users

- **AdSense on public content pages** (the existing mission) — never
  on AI, exam, login, or private pages. This is the main route; the
  assistant's job is to bring users who then read public content.
- **Affiliate links for genuinely useful products** (e.g. books,
  study tools) — only where relevant, clearly disclosed, never inside
  an AI answer, and only products the owner would recommend honestly.
- **Sponsorships / partnerships** with education institutions — only
  with the owner's separate approval per partner.
- **Premium AI features later** (above) — only after free usage is
  proven and the price is set with the owner's approval.

## What must be measured before any price is set

- Daily AI questions (once live) vs the free quota — is the quota
  actually binding, or is premium solving a problem nobody has?
- Which tools get used (calculator? CV builder? letter?) — premium
  follows real demand, not guesses.
- Whether users ask for saved documents at all (no requests = no
  premium feature).
- Cost per 1,000 AI answers on the free tier ($0 while inside the
  quota) vs any paid tier — a price must cover real cost with margin,
  and the owner must approve it.

## Risks / honest limits

- Free-tier quotas can shrink; if Gemini's free tier disappeared,
  the chat would stop and only the tools would remain. The fallback
  (Groq) and the tools-first design exist for exactly this case.
- AI answers cost the site owner nothing while inside the free quota
  — but "free" is the provider's decision, not Eduvelto's, and it can
  change. Never promise users unlimited free AI.
- Any premium feature needs payment collection (bKash/Nagad/bank or
  an international gateway) — Bangladesh payout/billing for small
  digital products is itself an unsolved step and must be verified
  before any price is announced.
