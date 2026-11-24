/**
 * Eduvelto — FounderPage JSON-LD guardrail (22 Nov 2026,
 * feature/privacy-policy).
 *
 * The Organization block must never present the founder's personal
 * profiles as the organization's profiles: its sameAs lists the
 * Eduvelto organization's own profiles ONLY — the YouTube channel
 * @EduveltoBD (created 22 Nov 2026), the LinkedIn Company Page
 * linkedin.com/company/eduvelto (created by the owner 22 Nov 2026),
 * and the Facebook page facebook.com/EduveltoBD (verified to exist
 * 22 Nov 2026) — exactly like the site-wide ORGANIZATION_JSON_LD
 * in src/lib/seo.ts. The founder's personal profiles live on the
 * Person block, where they belong.
 *
 * Runs under plain node: the JSON-LD consts are pure module-level data.
 * Run with `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { ORGANIZATION_JSON_LD, PERSON_JSON_LD } from '../../pages/FounderPage';
import { ORGANIZATION_JSON_LD as SITE_ORG } from '../seo';

describe('FounderPage JSON-LD — Organization vs Person', () => {
  it('Organization sameAs lists the three Eduvelto profiles (YouTube, LinkedIn, Facebook)', () => {
    expect(ORGANIZATION_JSON_LD.sameAs).toEqual([
      'https://www.youtube.com/@EduveltoBD',
      'https://www.linkedin.com/company/eduvelto',
      'https://www.facebook.com/EduveltoBD',
    ]);
  });

  it('Organization block matches the site-wide block', () => {
    expect(ORGANIZATION_JSON_LD['@id']).toBe(SITE_ORG['@id']);
    expect(ORGANIZATION_JSON_LD.sameAs).toEqual(SITE_ORG.sameAs);
  });

  it('Person sameAs lists the founder personal profiles', () => {
    // Website audit, 24 Nov 2026: Instagram @ahmmmizan is SUSPENDED
    // (appeal exhausted 23 Nov 2026), so it is NOT listed as a live
    // profile — restore it only if the account is ever reinstated.
    expect(PERSON_JSON_LD.sameAs).toEqual([
      'https://www.facebook.com/ahmmmizan',
      'https://www.youtube.com/@alihasanmdmizan',
      'https://www.tiktok.com/@ahmmizan',
    ]);
    expect(PERSON_JSON_LD.sameAs).not.toContain('https://www.instagram.com/ahmmmizan');
  });

  it('Organization description matches the site-wide block — no Class 1–8 promise', () => {
    // Brand-SEO wave 1, F-02 (24 Nov 2026): both Organization
    // blocks were promising "Class 1 to Honours" while Classes 1–8
    // have no books. Both now state the true range (Class 9 to
    // Honours) and must stay in sync — the trust worker's claim that
    // a block linked personal accounts was WRONG: the Person block
    // correctly carries the personal profiles, the Organization
    // block carries only the three EduveltoBD brand profiles.
    expect(ORGANIZATION_JSON_LD.description).toBe(SITE_ORG.description);
    expect(ORGANIZATION_JSON_LD.description).not.toContain('Class 1');
    expect(ORGANIZATION_JSON_LD.description).toContain('Class 9');
    expect(ORGANIZATION_JSON_LD.description).toContain('Madrasa');
  });
});
