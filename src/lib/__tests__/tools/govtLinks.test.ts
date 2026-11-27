// Govt Service Links + Results Hub — unit tests.
// Every link must be a bare official URL (https + domain, no path
// beyond "/"), and the directories must filter correctly.
import { describe, it, expect } from 'vitest';
import { GOVT_SERVICE_LINKS, filterGovtServiceLinks } from '../../tools/govtServiceLinks';
import { RESULT_LINKS, filterResultLinks } from '../../tools/resultsHub';

describe('GOVT_SERVICE_LINKS', () => {
  it('every URL is an official bare domain (https, no guessed path)', () => {
    for (const link of GOVT_SERVICE_LINKS) {
      expect(link.url).toMatch(/^https:\/\/[a-z0-9.-]+$/);
      expect(link.url.endsWith('.gov.bd') || link.url === 'https://mygov.bd').toBe(true);
    }
  });

  it('includes the national portal, NID, e-passport and land services', () => {
    const urls = GOVT_SERVICE_LINKS.map((l) => l.url);
    expect(urls).toContain('https://bangladesh.gov.bd');
    expect(urls).toContain('https://services.nidw.gov.bd');
    expect(urls).toContain('https://epassport.gov.bd');
    expect(urls).toContain('https://mutation.land.gov.bd');
    expect(urls).toContain('https://eticket.railway.gov.bd');
  });

  it('search "পাসপোর্ট" finds the passport entries', () => {
    const out = filterGovtServiceLinks(GOVT_SERVICE_LINKS, 'পাসপোর্ট', 'all');
    expect(out.length).toBeGreaterThanOrEqual(2);
  });

  it('category filter returns only land links', () => {
    const out = filterGovtServiceLinks(GOVT_SERVICE_LINKS, '', 'land');
    expect(out.length).toBe(2);
    expect(out.every((l) => l.category === 'land')).toBe(true);
  });
});

describe('RESULT_LINKS', () => {
  it('every URL is an official bare domain (.gov.bd, or .ac.bd for the universities)', () => {
    for (const link of RESULT_LINKS) {
      expect(link.url).toMatch(/^https:\/\/[a-z0-9.-]+$/);
      expect(link.url.includes('.gov.bd') || link.url.includes('.ac.bd')).toBe(true);
    }
  });

  it('includes the board results, NU, BTEB, BPSC and NTRCA portals', () => {
    const urls = RESULT_LINKS.map((l) => l.url);
    expect(urls).toContain('https://educationboardresults.gov.bd');
    expect(urls).toContain('https://eduboardresults.gov.bd');
    expect(urls).toContain('https://results.nu.ac.bd');
    expect(urls).toContain('https://result.bteb.gov.bd');
    expect(urls).toContain('https://bpsc.gov.bd');
    expect(urls).toContain('https://ntrca.gov.bd');
  });

  it('category filter returns only job results', () => {
    const out = filterResultLinks(RESULT_LINKS, '', 'job');
    expect(out).toHaveLength(2);
    expect(out.every((l) => l.category === 'job')).toBe(true);
  });
});
