// Eduvelto — donation record form (Phase 3 Commit 2, 25 Nov 2026,
// feature/ssg-bilingual-support).
//
// After sending money via bKash/Nagad, the donor records Name +
// Amount + TrxID here. NO phone-number field — the rules reject
// any extra field, so a phone number cannot be submitted even by
// hand. Signed-in or not, anyone may submit; the wall shows name
// + amount only, never the TrxID.

import { useState } from 'react';
import { DONATION_AMOUNT_MAX, DONATION_NAME_MAX, DONATION_TRXID_MAX, submitDonation, validateDonationInput, type DonationValidationError } from '../lib/donations';
import { useLanguage } from '../i18n/LanguageContext';
import { AlertBox, Button } from './ui';

const ERROR_TEXT: Record<DonationValidationError, { bn: string; en: string }> = {
  'name-required': { bn: 'আপনার নাম লিখুন।', en: 'Please write your name.' },
  'name-too-long': { bn: 'নাম ১০০ অক্ষরের মধ্যে লিখুন।', en: 'Please keep the name within 100 characters.' },
  'amount-invalid': { bn: 'সঠিক টাকার পরিমাণ লিখুন (০-এর বেশি)।', en: 'Please enter a valid amount (more than 0).' },
  'amount-too-large': { bn: 'পরিমাণ অনেক বেশি — আবার দেখুন।', en: 'The amount looks too large — please check it.' },
  'trxid-required': { bn: 'TrxID লিখুন — বিকাশ/নগদ অ্যাপে পাবেন।', en: 'Please enter the TrxID — you will find it in the bKash/Nagad app.' },
  'trxid-too-long': { bn: 'TrxID ৫০ অক্ষরের মধ্যে লিখুন।', en: 'Please keep the TrxID within 50 characters.' },
};

export default function DonationForm() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [trxId, setTrxId] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit() {
    const parsed = Number(amount);
    const check = validateDonationInput({ name, amount: parsed, trxId });
    if (!check.ok) {
      const first = ERROR_TEXT[check.errors[0]];
      setError(t(first));
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError('');
    const res = await submitDonation({ name: name.trim(), amount: parsed, trxId: trxId.trim() });
    if (res.ok) {
      setStatus('sent');
      setName('');
      setAmount('');
      setTrxId('');
    } else if (res.reason && res.reason in ERROR_TEXT) {
      setError(t(ERROR_TEXT[res.reason as DonationValidationError]));
      setStatus('error');
    } else {
      setError(t({ bn: 'জমা দেওয়া যায়নি — আবার চেষ্টা করুন।', en: 'Could not submit — please try again.' }));
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <AlertBox tone="ok">
        {t({
          bn: 'ধন্যবাদ! আপনার সহায়তা রেকর্ড হয়েছে — আপনার নাম Supporters Wall-এ দেখা যাবে।',
          en: 'Thank you! Your support has been recorded — your name will appear on the Supporters Wall.',
        })}
      </AlertBox>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      style={{ maxWidth: 560 }}
    >
      <label className="ev-label" style={{ display: 'block', marginBottom: 12 }}>
        {t({ bn: 'নাম *', en: 'Name *' })}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={DONATION_NAME_MAX}
          className="ev-input"
          style={{ marginTop: 4 }}
          required
        />
      </label>
      <label className="ev-label" style={{ display: 'block', marginBottom: 12 }}>
        {t({ bn: 'টাকার পরিমাণ (৳) *', en: 'Amount (৳) *' })}
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={1}
          max={DONATION_AMOUNT_MAX}
          step={1}
          inputMode="numeric"
          className="ev-input"
          style={{ marginTop: 4 }}
          required
        />
      </label>
      <label className="ev-label" style={{ display: 'block', marginBottom: 12 }}>
        {t({ bn: 'TrxID *', en: 'TrxID *' })}
        <input
          type="text"
          value={trxId}
          onChange={(e) => setTrxId(e.target.value)}
          maxLength={DONATION_TRXID_MAX}
          placeholder={t({ bn: 'যেমন: 9HX7K2M4P1', en: 'e.g. 9HX7K2M4P1' })}
          className="ev-input"
          style={{ marginTop: 4 }}
          required
        />
      </label>
      <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
        {t({
          bn: 'ফোন নম্বর চাওয়া হয় না — শুধু নাম, পরিমাণ ও TrxID দরকার। TrxID কখনো প্রকাশ্যে দেখানো হয় না।',
          en: 'No phone number is asked for — only the name, amount and TrxID are needed. The TrxID is never shown publicly.',
        })}
      </p>
      {status === 'error' && error ? (
        <p role="alert" style={{ color: 'var(--danger, #b3261e)', margin: '0 0 12px' }}>
          {error}
        </p>
      ) : null}
      <Button type="submit" loading={status === 'sending'}>
        {t({ bn: 'সহায়তা জানান', en: 'Record my support' })}
      </Button>
    </form>
  );
}
