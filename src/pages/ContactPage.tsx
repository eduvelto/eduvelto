// Eduvelto — Contact page (Phase 2, Step 2).
//
// Official contact channels (provided + approved by the owner, 20 Nov
// 2026) as mailto:/tel: links, plus a contact form. The form writes to
// the `contactMessages` collection — readable only by owner/admin (see
// firestore.rules), never updated or deleted from the client. Sending
// needs a signed-in account; signed-out visitors use the email/phone
// links instead. No private-tuition line anywhere (owner rule 22:54).

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginState } from '../lib/loginReturn';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/auth';
import { PageShell } from '../components/PageShell';
import { AlertBox, Button } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';

export default function ContactPage() {
  const { user, profile } = useAuth();
  const location = useLocation();
  // Sections audit (24 Nov 2026): return here after sign-in.
  const back = loginState(location.pathname + location.search);
  const { t } = useLanguage();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit() {
    if (!user || !db) return;
    if (name.trim().length === 0 || message.trim().length === 0) {
      setError(t({ bn: 'নাম ও বার্তা দুটোই লিখুন।', en: 'Please write your name and your message.' }));
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await addDoc(collection(db, 'contactMessages'), {
        userId: user.uid,
        name: name.trim(),
        email: email.trim() || null,
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      setStatus('sent');
      setMessage('');
    } catch {
      setStatus('error');
      setError(t({ bn: 'বার্তা পাঠানো যায়নি — আবার চেষ্টা করুন, অথবা ইমেইল করুন।', en: 'Could not send the message — please try again, or email us.' }));
    }
  }

  return (
    <PageShell titleBn="যোগাযোগ" titleEn="Contact">
      <p style={{ lineHeight: 1.7 }}>
        {t({
          bn: 'Eduvelto-র সঙ্গে যোগাযোগ করুন — প্রশ্ন, পরামর্শ বা সমস্যার কথা জানান।',
          en: 'Get in touch with Eduvelto — questions, suggestions or problems.',
        })}
      </p>
      <p style={{ lineHeight: 1.8 }}>
        {t({ bn: 'অফিসিয়াল ইমেইল', en: 'Official email' })}:{' '}
        <a href="mailto:ahmmizan23@gmail.com">ahmmizan23@gmail.com</a>
        <br />
        {t({ bn: 'অফিসিয়াল নম্বর', en: 'Official number' })}:{' '}
        <a href="tel:+8801538264070">+8801538264070</a>
      </p>

      <h2 style={{ fontSize: 19, margin: '24px 0 8px' }}>{t({ bn: 'বার্তা পাঠান', en: 'Send a message' })}</h2>
      {!user ? (
        <p>
          {t({ bn: 'বার্তা পাঠাতে', en: 'To send a message,' })} <Link to="/login" state={back}>{t({ bn: 'লগইন করুন', en: 'log in' })}</Link>
          {t({ bn: ' — অথবা উপরের ইমেইল/নম্বরে সরাসরি যোগাযোগ করুন।', en: ' — or contact us directly at the email/number above.' })}
        </p>
      ) : status === 'sent' ? (
        <AlertBox tone="ok">
          {t({
            bn: 'ধন্যবাদ! আপনার বার্তা পৌঁছেছে — আমরা উত্তর দেব।',
            en: 'Thank you! Your message was received — we will reply.',
          })}
        </AlertBox>
      ) : (
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
              maxLength={100}
              className="ev-input"
              style={{ marginTop: 4 }}
              required
            />
          </label>
          <label className="ev-label" style={{ display: 'block', marginBottom: 12 }}>
            {t({ bn: 'ইমেইল (ঐচ্ছিক)', en: 'Email (optional)' })}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              className="ev-input"
              style={{ marginTop: 4 }}
            />
          </label>
          <label className="ev-label" style={{ display: 'block', marginBottom: 12 }}>
            {t({ bn: 'বার্তা *', en: 'Message *' })}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={5}
              className="ev-textarea"
              style={{ marginTop: 4 }}
              required
            />
          </label>
          {error ? <AlertBox tone="error">{error}</AlertBox> : null}
          <Button type="submit" loading={status === 'sending'} size="lg">
            {t({ bn: 'বার্তা পাঠান', en: 'Send message' })}
          </Button>
        </form>
      )}
      <p style={{ marginTop: 20, color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.6 }}>
        {t({
          bn: 'আপনার বার্তা শুধুমাত্র Eduvelto-র মালিক ও অ্যাডমিনরা দেখতে পান।',
          en: 'Your message is visible only to Eduvelto’s owner and admins.',
        })}
      </p>
    </PageShell>
  );
}
