// Eduvelto — Contact page (Phase 2, Step 2).
//
// Official contact channels (provided + approved by the owner, 20 Nov
// 2026) as mailto:/tel: links, plus a contact form. The form writes to
// the `contactMessages` collection — readable only by owner/admin (see
// firestore.rules), never updated or deleted from the client. Sending
// needs a signed-in account; signed-out visitors use the email/phone
// links instead. No private-tuition line anywhere (owner rule 22:54).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../lib/auth';
import { PageShell } from '../components/PageShell';

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  minHeight: 44,
  fontSize: 16,
  border: '1px solid #999',
  borderRadius: 6,
  fontFamily: 'inherit',
};

export default function ContactPage() {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.displayName ?? '');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit() {
    if (!user || !db) return;
    if (name.trim().length === 0 || message.trim().length === 0) {
      setError('নাম ও বার্তা দুটোই লিখুন। / Please write your name and your message.');
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
      setError('বার্তা পাঠানো যায়নি — আবার চেষ্টা করুন, অথবা ইমেইল করুন। / Could not send the message — please try again, or email us.');
    }
  }

  return (
    <PageShell titleBn="যোগাযোগ" titleEn="Contact">
      <p style={{ lineHeight: 1.7 }}>
        Eduvelto-র সঙ্গে যোগাযোগ করুন — প্রশ্ন, পরামর্শ বা সমস্যার কথা জানান। / Get in touch with
        Eduvelto — questions, suggestions or problems.
      </p>
      <p style={{ lineHeight: 1.8 }}>
        অফিসিয়াল ইমেইল / Official email:{' '}
        <a href="mailto:ahmmizan23@gmail.com">ahmmizan23@gmail.com</a>
        <br />
        অফিসিয়াল নম্বর / Official number:{' '}
        <a href="tel:+8801538264070">+8801538264070</a>
      </p>

      <h2 style={{ fontSize: 19, margin: '24px 0 8px' }}>বার্তা পাঠান / Send a message</h2>
      {!user ? (
        <p>
          বার্তা পাঠাতে <Link to="/login">লগইন করুন / Log in</Link> — অথবা উপরের ইমেইল/নম্বরে
          সরাসরি যোগাযোগ করুন। / Log in to send a message — or contact us directly at the
          email/number above.
        </p>
      ) : status === 'sent' ? (
        <p style={{ color: '#0A1F44', fontWeight: 600 }}>
          ধন্যবাদ! আপনার বার্তা পৌঁছেছে — আমরা উত্তর দেব। / Thank you! Your message was received —
          we will reply.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          style={{ maxWidth: 560 }}
        >
          <label style={{ display: 'block', marginBottom: 12 }}>
            নাম / Name *
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              style={{ ...inputStyle, marginTop: 4 }}
              required
            />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            ইমেইল / Email (ঐচ্ছিক / optional)
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              style={{ ...inputStyle, marginTop: 4 }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 12 }}>
            বার্তা / Message *
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={5}
              style={{ ...inputStyle, marginTop: 4, resize: 'vertical' }}
              required
            />
          </label>
          {error ? <p style={{ color: '#b00020' }}>{error}</p> : null}
          <button
            type="submit"
            disabled={status === 'sending'}
            style={{
              padding: '12px 24px',
              minHeight: 48,
              fontSize: 16,
              borderRadius: 6,
              border: 'none',
              background: '#0A1F44',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {status === 'sending' ? 'পাঠানো হচ্ছে… / Sending…' : 'বার্তা পাঠান / Send message'}
          </button>
        </form>
      )}
      <p style={{ marginTop: 20, color: '#555', fontSize: 14, lineHeight: 1.6 }}>
        আপনার বার্তা শুধুমাত্র Eduvelto-র মালিক ও অ্যাডমিনরা দেখতে পান। / Your message is visible
        only to Eduvelto&apos;s owner and admins.
      </p>
    </PageShell>
  );
}
