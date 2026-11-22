// Eduvelto — Step 15 official-domain checks unit tests.
//
// The check is an exact-hostname-or-subdomain-boundary match on a
// lowercased hostname with https required — never a substring
// match (hostname.includes("gov.bd") is unsafe: a look-alike
// domain like bpsc.gov.bd.evil.com must never pass).

import { describe, expect, it } from 'vitest';
import { checkOfficialDomain, domainCheckLabelBn, normaliseHostname } from '../jobOfficialDomains';

describe('normaliseHostname', () => {
  it('lowercases and strips www.', () => {
    expect(normaliseHostname('HTTPS://WWW.BPSC.GOV.BD/notice/47')).toBe('bpsc.gov.bd');
  });

  it('returns null for a malformed URL', () => {
    expect(normaliseHostname('not a url')).toBeNull();
    expect(normaliseHostname('')).toBeNull();
  });
});

describe('checkOfficialDomain', () => {
  it('exact match on an approved domain passes', () => {
    const r = checkOfficialDomain('https://bpsc.gov.bd/notice/47');
    expect(r.kind).toBe('approved');
    if (r.kind === 'approved') expect(r.entry.domain).toBe('bpsc.gov.bd');
    expect(domainCheckLabelBn(r)).toMatch(/অনুমোদিত ডোমেইন/);
  });

  it('a real subdomain of an approved domain passes', () => {
    expect(checkOfficialDomain('https://erecruitment.bb.org.bd/apply').kind).toBe('approved');
  });

  it('a look-alike suffix domain does NOT pass (no substring matching)', () => {
    expect(checkOfficialDomain('https://bpsc.gov.bd.evil.com/notice').kind).toBe('unknown');
    expect(checkOfficialDomain('https://fakebpsc.gov.bd/notice').kind).toBe('unknown');
    expect(checkOfficialDomain('https://bpsc-gov-bd.com/notice').kind).toBe('unknown');
  });

  it('http (non-https) never passes, even on an approved host', () => {
    expect(checkOfficialDomain('http://bpsc.gov.bd/notice/47').kind).toBe('unknown');
  });

  it('an unknown domain is unlisted, not approved', () => {
    const r = checkOfficialDomain('https://jobs.example.com/notice');
    expect(r.kind).toBe('unknown');
    expect(domainCheckLabelBn(r)).toMatch(/তালিকায় নেই/);
  });

  it('a watch-listed domain warns (teletalk.com.bd is watch, not approved)', () => {
    const r = checkOfficialDomain('https://teletalk.com.bd/apply');
    expect(r.kind).toBe('watch');
    expect(domainCheckLabelBn(r)).toMatch(/সতর্কতা/);
  });

  it('a managed-list entry overrides the code list', () => {
    const r = checkOfficialDomain('https://bpsc.gov.bd/notice/47', [
      {
        domain: 'bpsc.gov.bd',
        organizationBn: 'বিপিএসসি',
        organizationEn: 'BPSC',
        category: 'bcs',
        status: 'deprecated',
        notesBn: null,
      },
    ]);
    expect(r.kind).toBe('deprecated');
  });

  it('an invalid URL is invalid', () => {
    expect(checkOfficialDomain('not a url').kind).toBe('invalid');
  });
});
