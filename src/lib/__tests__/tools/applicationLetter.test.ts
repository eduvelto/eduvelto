import { describe, it, expect } from 'vitest';
import {
  buildApplicationLetter,
  formatLetterDate,
  type ApplicationLetterInput,
} from '../../tools/applicationLetter';

const fullInput: ApplicationLetterInput = {
  applicantName: 'Rahim Uddin',
  address: '12 Station Road, Cox’s Bazar',
  phone: '01700000000',
  email: 'rahim@example.com',
  date: '2026-11-28',
  recipientTitle: 'Hiring Manager',
  recipientName: 'Karim Ahmed',
  organization: 'Eduvelto',
  post: 'Assistant Teacher',
  reference: 'Daily Star advertisement, 20 November 2026',
  points: ['BBA from Dhaka University', 'Two years of teaching experience'],
  closing: 'sincerely',
};

describe('buildApplicationLetter', () => {
  it('English letter contains name, organization, post and reference', () => {
    const result = buildApplicationLetter('en', fullInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.letter).toContain('Rahim Uddin');
    expect(result.letter).toContain('Eduvelto');
    expect(result.letter).toContain('Assistant Teacher');
    expect(result.letter).toContain('Daily Star advertisement, 20 November 2026');
    expect(result.letter).toContain('Sincerely,');
    expect(result.letter).toContain('BBA from Dhaka University');
    expect(result.letter).toContain('Two years of teaching experience');
  });

  it('Bangla letter contains name, organization, post and reference', () => {
    const bnInput: ApplicationLetterInput = {
      ...fullInput,
      applicantName: 'রহিম উদ্দিন',
      organization: 'এডুভেলটো',
      post: 'সহকারী শিক্ষক',
      reference: 'দৈনিক প্রথম আলো, ২০ নভেম্বর ২০২৬',
      points: ['ঢাকা বিশ্ববিদ্যালয় থেকে বিবিএ', 'দুই বছরের শিক্ষকতার অভিজ্ঞতা'],
      closing: 'binito',
    };
    const result = buildApplicationLetter('bn', bnInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.letter).toContain('রহিম উদ্দিন');
    expect(result.letter).toContain('এডুভেলটো');
    expect(result.letter).toContain('সহকারী শিক্ষক');
    expect(result.letter).toContain('দৈনিক প্রথম আলো, ২০ নভেম্বর ২০২৬');
    expect(result.letter).toContain('বিনীত,');
    expect(result.letter).toContain('ঢাকা বিশ্ববিদ্যালয় থেকে বিবিএ');
  });

  it('missing name, organization or post returns an error listing the missing fields', () => {
    const none = buildApplicationLetter('en', {
      ...fullInput,
      applicantName: '  ',
      organization: '',
      post: '',
    });
    expect(none.ok).toBe(false);
    if (none.ok) return;
    expect(none.missing).toEqual(['name', 'organization', 'post']);

    const onlyName = buildApplicationLetter('en', { ...fullInput, organization: '', post: '' });
    expect(onlyName.ok).toBe(false);
    if (onlyName.ok) return;
    expect(onlyName.missing).toEqual(['organization', 'post']);
  });

  it('letter contains no unfilled placeholder text', () => {
    const result = buildApplicationLetter('en', fullInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.letter).not.toContain('{{');
    expect(result.letter).not.toContain('}}');
    expect(result.letter).not.toContain('[...]');
    expect(result.letter).not.toContain('[Your');
    expect(result.letter).not.toContain('TODO');
  });

  it('optional fields omitted cleanly leave no placeholder behind', () => {
    const minimal: ApplicationLetterInput = {
      ...fullInput,
      address: '',
      phone: '',
      email: '',
      recipientTitle: '',
      recipientName: '',
      reference: '',
      points: ['', '  '],
    };
    const result = buildApplicationLetter('en', minimal);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.letter).toContain('Rahim Uddin');
    expect(result.letter).toContain('Assistant Teacher');
    expect(result.letter).not.toContain('{{');
    expect(result.letter).not.toContain('[...]');
    expect(result.letter).not.toContain('Reference:');
    expect(result.letter).not.toContain('Phone:');
  });

  it('formats the date in each language', () => {
    expect(formatLetterDate('2026-11-28', 'en')).toBe('28 November 2026');
    expect(formatLetterDate('2026-11-28', 'bn')).toContain('২০২৬');
  });
});
