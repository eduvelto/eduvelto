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
    expect(PERSON_JSON_LD.sameAs).toEqual([
      'https://www.facebook.com/ahmmmizan',
      'https://www.youtube.com/@alihasanmdmizan',
      'https://www.instagram.com/ahmmmizan',
      'https://www.tiktok.com/@ahmmizan',
    ]);
  });
});
