// Eduvelto — Job approved official domains (Step 15).
//
// The check a verifier runs before approving a circular: does the
// official notice / apply URL belong to an APPROVED official
// domain? ChatGPT: never hardcode one permanent domain per org —
// maintain an admin-managed list. Gemini: store it in
// config/officialDomains (one doc) or approvedDomains/{domainId}.
//
// v1 HONEST LIMIT: the persisted admin-managed `approvedDomains`
// collection + its rules are written and emulator-verified in this
// step, but DEPLOY-BLOCKED on the compiled-rules margin (~209
// bytes; the block alone measures 256,328 — see firestore.rules).
// Until the public-ID refactor frees ~4,992 bytes and the
// collection's rules deploy, the list below is the CODE list the
// UI checks against — it is shown as such on the domains page
// ("কোডে সংরক্ষিত তালিকা"), never presented as admin-managed.
// The shape here mirrors the Firestore doc shape exactly, so the
// admin UI can switch its source to the collection without
// changing callers (listApprovedDomains in jobAdminCirculars.ts
// merges the two: collection rows win when the rules are live).

export interface ApprovedDomainEntry {
  /** Normalised hostname, no scheme/path, no leading www. */
  domain: string;
  organizationBn: string;
  organizationEn: string;
  category: 'bcs' | 'bank' | 'primary' | 'ntrca' | 'other_govt';
  status: 'active' | 'watch' | 'deprecated';
  notesBn: string | null;
}

/** The v1 code list — official recruitment domains only. A domain
 * gets on this list ONLY because the recruiting organisation
 * itself publishes from it. Job blogs, coaching centres and
 * aggregators are never on it. */
export const KNOWN_OFFICIAL_DOMAINS: ApprovedDomainEntry[] = [
  {
    domain: 'bpsc.gov.bd',
    organizationBn: 'বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)',
    organizationEn: 'Bangladesh Public Service Commission (BPSC)',
    category: 'bcs',
    status: 'active',
    notesBn: 'BCS বিজ্ঞপ্তি ও আবেদনের মূল উৎস।',
  },
  {
    domain: 'bpsc.teletalk.com.bd',
    organizationBn: 'বাংলাদেশ পাবলিক সার্ভিস কমিশন (BPSC)',
    organizationEn: 'Bangladesh Public Service Commission (BPSC)',
    category: 'bcs',
    status: 'active',
    notesBn: 'BPSC আবেদন পোর্টাল (Teletalk)।',
  },
  {
    domain: 'erecruitment.bb.org.bd',
    organizationBn: 'বাংলাদেশ ব্যাংক — ব্যাংকার্স সিলেকশন কমিটি',
    organizationEn: 'Bangladesh Bank — Bankers Selection Committee',
    category: 'bank',
    status: 'active',
    notesBn: 'সরকারি ব্যাংক নিয়োগের আবেদন পোর্টাল।',
  },
  {
    domain: 'bb.org.bd',
    organizationBn: 'বাংলাদেশ ব্যাংক',
    organizationEn: 'Bangladesh Bank',
    category: 'bank',
    status: 'active',
    notesBn: 'বাংলাদেশ ব্যাংকের অফিসিয়াল সাইট।',
  },
  {
    domain: 'dpe.gov.bd',
    organizationBn: 'প্রাথমিক শিক্ষা অধিদপ্তর (DPE)',
    organizationEn: 'Directorate of Primary Education (DPE)',
    category: 'primary',
    status: 'active',
    notesBn: 'প্রাথমিক শিক্ষক নিয়োগের মূল উৎস।',
  },
  {
    domain: 'dpe.teletalk.com.bd',
    organizationBn: 'প্রাথমিক শিক্ষা অধিদপ্তর (DPE)',
    organizationEn: 'Directorate of Primary Education (DPE)',
    category: 'primary',
    status: 'active',
    notesBn: 'প্রাথমিক শিক্ষক আবেদন পোর্টাল (Teletalk)।',
  },
  {
    domain: 'ntrca.gov.bd',
    organizationBn: 'বেসরকারি শিক্ষক নিবন্ধন ও প্রত্যয়ন কর্তৃপক্ষ (NTRCA)',
    organizationEn: 'Non-Government Teachers Registration & Certification Authority (NTRCA)',
    category: 'ntrca',
    status: 'active',
    notesBn: 'শিক্ষক নিবন্ধন পরীক্ষার মূল উৎস।',
  },
  {
    domain: 'ntrca.teletalk.com.bd',
    organizationBn: 'বেসরকারি শিক্ষক নিবন্ধন ও প্রত্যয়ন কর্তৃপক্ষ (NTRCA)',
    organizationEn: 'Non-Government Teachers Registration & Certification Authority (NTRCA)',
    category: 'ntrca',
    status: 'active',
    notesBn: 'NTRCA আবেদন পোর্টাল (Teletalk)।',
  },
  {
    domain: 'teletalk.com.bd',
    organizationBn: 'টেলিটক (সরকারি নিয়োগ আবেদন পোর্টাল)',
    organizationEn: 'Teletalk (government recruitment application portal)',
    category: 'other_govt',
    status: 'watch',
    notesBn: 'সাধারণ Teletalk ডোমেইন — কোন সংস্থার আবেদন তা আলাদাভাবে যাচাই করতে হবে।',
  },
];

export type DomainCheckResult =
  | { kind: 'approved'; entry: ApprovedDomainEntry; hostname: string }
  | { kind: 'deprecated'; entry: ApprovedDomainEntry; hostname: string }
  | { kind: 'watch'; entry: ApprovedDomainEntry; hostname: string }
  | { kind: 'unknown'; hostname: string | null }
  | { kind: 'invalid'; hostname: null };

/** Normalise a URL to a hostname: lowercase, strip a leading
 * www. — the same normalisation the admin-managed list will use. */
export function normaliseHostname(rawUrl: string): string | null {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return null;
  }
}

/** Check a candidate URL against a domain list (defaults to the
 * v1 code list). Exact hostname or a subdomain of a listed domain
 * matches. A non-https URL can never be approved. */
export function checkOfficialDomain(
  rawUrl: string,
  list: ApprovedDomainEntry[] = KNOWN_OFFICIAL_DOMAINS,
): DomainCheckResult {
  let protocol = '';
  try {
    protocol = new URL(rawUrl).protocol;
  } catch {
    return { kind: 'invalid', hostname: null };
  }
  const hostname = normaliseHostname(rawUrl);
  if (hostname === null) return { kind: 'invalid', hostname: null };
  const entry = list.find(
    (e) => hostname === e.domain || hostname.endsWith(`.${e.domain}`),
  );
  if (!entry) return { kind: 'unknown', hostname };
  if (protocol !== 'https:') return { kind: 'unknown', hostname };
  if (entry.status === 'deprecated') return { kind: 'deprecated', entry, hostname };
  if (entry.status === 'watch') return { kind: 'watch', entry, hostname };
  return { kind: 'approved', entry, hostname };
}

/** Bangla label for a domain-check result (used by the verifier
 * checklist and the circular editor). */
export function domainCheckLabelBn(result: DomainCheckResult): string {
  switch (result.kind) {
    case 'approved':
      return `অনুমোদিত ডোমেইন — ${result.entry.organizationBn}`;
    case 'deprecated':
      return `পুরোনো ডোমেইন ব্যবহার হচ্ছে — ${result.entry.organizationBn}`;
    case 'watch':
      return `সতর্কতা — ${result.entry.organizationBn} (আলাদাভাবে যাচাই করুন)`;
    case 'unknown':
      return result.hostname === null
        ? 'লিংকটি খোলা যায়নি'
        : 'অনুমোদিত ডোমেইন তালিকায় নেই — যাচাইকারীকে কারণ লিখতে হবে';
    case 'invalid':
      return 'অবৈধ লিংক';
  }
}
