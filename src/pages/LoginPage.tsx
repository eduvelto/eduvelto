// Eduvelto — sign-in (Step 1).
// Email/password sign-in + Google sign-in + password reset. The session
// survives a page reload (Firebase Auth local persistence).
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

export default function LoginPage() {
  const { signIn, signInWithGoogle, resetPassword, user, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const s = strings.auth;

  if (!isFirebaseConfigured) {
    return (
      <PageShell titleBn={s.loginTitle.bn} titleEn={s.loginTitle.en}>
        <p>{s.notConfigured.bn}</p>
        <p style={{ color: '#555' }}>{s.notConfigured.en}</p>
      </PageShell>
    );
  }

  if (user) {
    return (
      <PageShell titleBn={s.loginTitle.bn} titleEn={s.loginTitle.en}>
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
    setBusy(true);
    try {
      await signIn(email, password);
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

  async function onReset(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch {
      // Friendly message is in `error`.
    } finally {
      setBusy(false);
    }
  }

  const shownError = localError ?? error;

  return (
    <PageShell titleBn={s.loginTitle.bn} titleEn={s.loginTitle.en}>
      <form onSubmit={onSubmit}>
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
            autoComplete="current-password"
            required
          />
        </label>
        {shownError ? <p style={{ color: '#b00020' }}>{shownError}</p> : null}
        <button style={buttonStyle} type="submit" disabled={busy || loading}>
          {busy ? strings.common.loading.bn : `${s.loginButton.bn} / ${s.loginButton.en}`}
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
        {s.noAccount.bn} <Link to="/register">{s.registerTitle.bn}</Link>
      </p>
      <p>
        <button
          type="button"
          onClick={() => {
            setShowReset((v) => !v);
            setResetSent(false);
          }}
          style={{ background: 'none', border: 'none', padding: 0, color: '#0A1F44', cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}
        >
          {s.forgotPassword.bn}
        </button>
      </p>
      {showReset ? (
        <form onSubmit={onReset} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fafafa' }}>
          {resetSent ? (
            <p style={{ color: '#0A1F44' }}>{s.resetSent.bn}</p>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>রিসেট লিংক পেতে আপনার ইমেইল দিন।</p>
              <label>
                {s.email.bn}
                <input
                  style={inputStyle}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <button style={buttonStyle} type="submit" disabled={busy || loading}>
                {s.sendResetLink.bn}
              </button>
            </>
          )}
        </form>
      ) : null}
    </PageShell>
  );
}
