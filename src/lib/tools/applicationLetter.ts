// Eduvelto — Application Letter Writer template builder (28 Nov 2026).
//
// Pure functions only: no React, no network, no storage, no AI. The
// builder takes the user's form inputs and assembles a formal
// application letter from a fixed template (Bangla or English). Optional
// fields are simply omitted when empty — the output never contains an
// unfilled placeholder.

export type LetterLanguage = 'bn' | 'en';

export type ClosingChoice = 'binito' | 'sincerely';

export interface ApplicationLetterInput {
  applicantName: string;
  address: string;
  phone: string;
  email: string;
  /** YYYY-MM-DD; empty means "today". */
  date: string;
  recipientTitle: string;
  recipientName: string;
  organization: string;
  post: string;
  /** Circular / advertisement source, free text. */
  reference: string;
  /** 2–3 short points about education / experience / fit. */
  points: string[];
  closing: ClosingChoice;
}

export type MissingField = 'name' | 'organization' | 'post';

export type BuildResult =
  | { ok: true; letter: string }
  | { ok: false; missing: MissingField[] };

const CLOSING_TEXT: Record<ClosingChoice, string> = {
  binito: 'বিনীত',
  sincerely: 'Sincerely',
};

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** "2026-11-28" → "28 November 2026" (en) / "২৮ নভেম্বর ২০২৬" (bn). */
export function formatLetterDate(dateIso: string, lang: LetterLanguage): string {
  const parsed = new Date(`${dateIso.trim()}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateIso.trim();
  try {
    return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  } catch {
    return dateIso.trim();
  }
}

function clean(value: string): string {
  return value.trim();
}

function buildEnglish(input: ApplicationLetterInput): string {
  const name = clean(input.applicantName);
  const address = clean(input.address);
  const phone = clean(input.phone);
  const email = clean(input.email);
  const org = clean(input.organization);
  const post = clean(input.post);
  const reference = clean(input.reference);
  const recipient = [clean(input.recipientTitle), clean(input.recipientName)]
    .filter(Boolean)
    .join(' ');
  const points = input.points.map(clean).filter(Boolean);
  const date = formatLetterDate(clean(input.date) || todayIso(), 'en');

  const lines: string[] = [];
  lines.push(name);
  if (address) lines.push(address);
  const contact = [phone ? `Phone: ${phone}` : '', email ? `Email: ${email}` : '']
    .filter(Boolean)
    .join(' | ');
  if (contact) lines.push(contact);
  lines.push('');
  lines.push(date);
  lines.push('');
  if (recipient) lines.push(recipient);
  lines.push(org);
  lines.push('');
  lines.push(`Subject: Application for the post of ${post}${reference ? ` (Reference: ${reference})` : ''}`);
  lines.push('');
  lines.push('Dear Sir/Madam,');
  lines.push('');
  lines.push(
    `I am writing to apply for the post of ${post} at ${org}` +
      (reference ? `, with reference to ${reference}` : '') +
      '.',
  );
  lines.push('');
  if (points.length > 0) {
    lines.push('I would like to highlight a few points about my background:');
    for (const point of points) lines.push(`- ${point}`);
  } else {
    lines.push(
      'My education and experience have prepared me well for this role, and I am keen to contribute to your organization.',
    );
  }
  lines.push('');
  lines.push(
    'I would welcome the chance to discuss my application further at an interview. Thank you for considering my application.',
  );
  lines.push('');
  lines.push(`${CLOSING_TEXT[input.closing]},`);
  lines.push(name);
  if (contact) lines.push(contact);
  return lines.join('\n');
}

function buildBangla(input: ApplicationLetterInput): string {
  const name = clean(input.applicantName);
  const address = clean(input.address);
  const phone = clean(input.phone);
  const email = clean(input.email);
  const org = clean(input.organization);
  const post = clean(input.post);
  const reference = clean(input.reference);
  const recipient = [clean(input.recipientTitle), clean(input.recipientName)]
    .filter(Boolean)
    .join(' ');
  const points = input.points.map(clean).filter(Boolean);
  const date = formatLetterDate(clean(input.date) || todayIso(), 'bn');

  const lines: string[] = [];
  lines.push(name);
  if (address) lines.push(address);
  const contact = [phone ? `ফোন: ${phone}` : '', email ? `ইমেইল: ${email}` : '']
    .filter(Boolean)
    .join(' | ');
  if (contact) lines.push(contact);
  lines.push('');
  lines.push(date);
  lines.push('');
  if (recipient) lines.push(recipient);
  lines.push(org);
  lines.push('');
  lines.push(`বিষয়: ${post} পদের জন্য আবেদন${reference ? ` (সূত্র: ${reference})` : ''}`);
  lines.push('');
  lines.push('মাননীয় মহোদয়,');
  lines.push('');
  lines.push(
    `আমি ${org}-এ ${post} পদের জন্য আবেদন করছি` +
      (reference ? ` (সূত্র: ${reference})` : '') +
      '।',
  );
  lines.push('');
  if (points.length > 0) {
    lines.push('আমার শিক্ষাগত যোগ্যতা ও অভিজ্ঞতা সম্পর্কে কয়েকটি বিষয় নিচে উল্লেখ করছি:');
    for (const point of points) lines.push(`- ${point}`);
  } else {
    lines.push(
      'আমার শিক্ষা ও অভিজ্ঞতা আমাকে এই পদের জন্য উপযুক্ত করে তুলেছে, এবং আমি আপনাদের প্রতিষ্ঠানে অবদান রাখতে আগ্রহী।',
    );
  }
  lines.push('');
  lines.push(
    'সাক্ষাৎকারে আমার আবেদন সম্পর্কে আলোচনার সুযোগ পেলে কৃতজ্ঞ থাকব। আমার আবেদনটি বিবেচনার জন্য ধন্যবাদ।',
  );
  lines.push('');
  lines.push(`${CLOSING_TEXT[input.closing]},`);
  lines.push(name);
  if (contact) lines.push(contact);
  return lines.join('\n');
}

/**
 * Builds the letter, or reports the required fields that are missing.
 * Required: applicant name, organization, post applied for.
 */
export function buildApplicationLetter(
  lang: LetterLanguage,
  input: ApplicationLetterInput,
): BuildResult {
  const missing: MissingField[] = [];
  if (!clean(input.applicantName)) missing.push('name');
  if (!clean(input.organization)) missing.push('organization');
  if (!clean(input.post)) missing.push('post');
  if (missing.length > 0) return { ok: false, missing };
  return {
    ok: true,
    letter: lang === 'bn' ? buildBangla(input) : buildEnglish(input),
  };
}
