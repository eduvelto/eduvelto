// Eduvelto — student registration (Step 1).
// Email/password sign-up + Google sign-in. Registering creates a STUDENT
// account only (role 'student'); teacher verification is a separate human
// process in Step 5 — registering never grants a "verified" badge.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { isFirebaseConfigured } from '../firebase';

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  margin: '6px 0 14px',
  fontSize: 16,
  border: '1px solid #aaa',
  borderRadius: 6,
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: 16,
  borderRadius: 6,
  border: 'none',
  background: '#0A1F44',
  color: '#fff',
  cursor: 'pointer',
};

export default function RegisterPage() {
  const { signUp, signInWithGoogle, user, error, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [dob, setDob] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const s = strings.auth;

  if (!isFirebaseConfigured) {
    return (
      <PageShell titleBn={s.registerTitle.bn} titleEn={s.registerTitle.en}>
        <p>{s.notConfigured.bn}</p>
        <p style={{ color: '#555' }}>{s.notConfigured.en}</p>
      </PageShell>
    );
  }

  if (user) {
    return (
      <PageShell titleBn={s.registerTitle.bn} titleEn={s.registerTitle.en}>
        <p>আপনি ইতিমধ্যে লগইন করেছেন।</p>
        <p>
          <Link to="/profile">প্রোফাইল দেখুন →</Link>
        </p>
      </PageShell>
    );
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    if (displayName.trim().length === 0 || displayName.trim().length > 100) {
      setLocalError('নাম ১ থেকে ১০০ অক্ষরের মধ্যে হতে হবে।');
      return;
    }
    if (password.length < 6) {
      setLocalError(s.weakPassword?.bn ?? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }
    if (password !== confirm) {
      setLocalError(s.passwordsDoNotMatch.bn);
      return;
    }
    // Date of birth is optional; when given it must be a real past date
    // after 1900-01-01 (the rules enforce the same).
    let dobDate: Date | null = null;
    if (dob.trim().length > 0) {
      dobDate = new Date(`${dob.trim()}T00:00:00`);
      if (Number.isNaN(dobDate.getTime()) || dobDate >= new Date() || dobDate <= new Date(1900, 0, 1)) {
        setLocalError('জন্মতারিখ সঠিক নয় — অতীতের একটি তারিখ দিন। / Enter a valid past date of birth.');
        return;
      }
    }
    setBusy(true);
    try {
      await signUp(displayName.trim(), email, password, dobDate);
      navigate('/profile');
    } catch {
      // The friendly message is already in `error` from the AuthProvider.
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle(): Promise<void> {
    setLocalError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate('/profile');
    } catch {
      // Friendly message is in `error`.
    } finally {
      setBusy(false);
    }
  }

  const shownError = localError ?? error;

  return (
    <PageShell titleBn={s.registerTitle.bn} titleEn={s.registerTitle.en}>
      <p style={{ color: '#555' }}>{s.studentNote.bn}</p>
      <form onSubmit={onSubmit}>
        <label>
          {s.displayName.bn} / {s.displayName.en}
          <input
            style={inputStyle}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            required
            maxLength={100}
          />
        </label>
        <label>
          {s.email.bn} / {s.email.en}
          <input
            style={inputStyle}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          {s.password.bn} / {s.password.en}
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </label>
        <label>
          {s.confirmPassword.bn} / {s.confirmPassword.en}
          <input
            style={inputStyle}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </label>
        <label>
          {strings.profile.dateOfBirth.bn} / {strings.profile.dateOfBirth.en} (ঐচ্ছিক / optional)
          <input style={inputStyle} type="date" value={dob} onChange={(e) => setDob(e.target.value)} min="1900-01-02" />
        </label>
        <p style={{ color: '#555', fontSize: 14, marginTop: -8 }}>{strings.profile.dobNote.bn}</p>
        {shownError ? <p style={{ color: '#b00020' }}>{shownError}</p> : null}
        <button style={buttonStyle} type="submit" disabled={busy || loading}>
          {busy ? strings.common.loading.bn : `${s.registerButton.bn} / ${s.registerButton.en}`}
        </button>
      </form>
      <p style={{ margin: '16px 0' }}>— অথবা —</p>
      <button
        style={{ ...buttonStyle, background: '#fff', color: '#111', border: '1px solid #aaa' }}
        type="button"
        onClick={() => void onGoogle()}
        disabled={busy || loading}
      >
        {s.loginWithGoogle.bn} / {s.loginWithGoogle.en}
      </button>
      <p style={{ marginTop: 20 }}>
        {s.haveAccount.bn} <Link to="/login">{s.loginTitle.bn}</Link>
      </p>
      <p>
        শিক্ষক হিসেবে রেজিস্টার করতে চান? <Link to="/teacher/register">শিক্ষক রেজিস্ট্রেশন</Link>
      </p>
    </PageShell>
  );
}
