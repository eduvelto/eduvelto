/**
 * Eduvelto — FounderPage JSON-LD guardrail (22 Nov 2026,
 * feature/privacy-policy).
 *
 * The Organization block must never present the founder's personal
 * profiles as the organization's profiles: no Eduvelto organization
 * profiles exist yet, so its sameAs is EMPTY by design — exactly like
 * the site-wide ORGANIZATION_JSON_LD in src/lib/seo.ts. The founder's
 * personal profiles live on the Person block, where they belong.
 *
 * Runs under plain node: the JSON-LD consts are pure module-level data.
 * Run with `npm run test:unit`.
 */
import { describe, it, expect } from 'vitest';
import { ORGANIZATION_JSON_LD, PERSON_JSON_LD } from '../../pages/FounderPage';
import { ORGANIZATION_JSON_LD as SITE_ORG } from '../seo';

describe('FounderPage JSON-LD — Organization vs Person', () => {
  it('Organization sameAs is empty (no Eduvelto org profiles yet)', () => {
    expect(ORGANIZATION_JSON_LD.sameAs).toEqual([]);
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
