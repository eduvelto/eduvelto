// Eduvelto — sign-in (Step 1).
// Email/password sign-in + password reset. The session
// survives a page reload (Firebase Auth local persistence).
// Google sign-in REMOVED 22 Nov 2026 by owner decision (it kept failing;
// everyone registers with email/password). The button is gone; the
// Google provider stays enabled in the console so the change is
// reversible and existing linked accounts are not destroyed.
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { strings } from '../i18n/strings';
import { useAuth } from '../lib/auth';
import { isFirebaseConfigured } from '../firebase';
import { T, useLanguage } from '../i18n/LanguageContext';

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  margin: '6px 0 14px',
  fontSize: 16,
  border: '1px solid var(--line-strong)',
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
  const { signIn, resetPassword, user, error, errorCode, loading, mfaPending, completeMfaSignIn, clearMfaPending } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  // Second-factor step (owner 2FA, 23 Nov 2026): shown when the
  // password was correct but the account has TOTP enrolled.
  const [mfaCode, setMfaCode] = useState('');
  const [mfaFactorUid, setMfaFactorUid] = useState<string>('');
  const { t } = useLanguage();
  const s = strings.auth;

  // Opening /login while already signed in goes to the profile.
  useEffect(() => {
    if (user) navigate('/profile');
  }, [user, navigate]);

  if (!isFirebaseConfigured) {
    return (
      <PageShell titleBn={s.loginTitle.bn} titleEn={s.loginTitle.en}>
        <p>{t(s.notConfigured)}</p>
      </PageShell>
    );
  }

  if (user) {
    return (
      <PageShell titleBn={s.loginTitle.bn} titleEn={s.loginTitle.en}>
        <p>{t({ bn: 'আপনি ইতিমধ্যে লগইন করেছেন।', en: 'You are already signed in.' })}</p>
        <p>
          <Link to="/profile">{t({ bn: 'প্রোফাইল দেখুন →', en: 'View profile →' })}</Link>
        </p>
      </PageShell>
    );
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    setBusy(true);
    try {
      // No direct navigate here: the effect above navigates once
      // `user` appears. When MFA is pending, `user` stays null and
      // the code step below renders instead.
      await signIn(email, password);
    } catch {
      // The friendly message is already in `error` from the AuthProvider.
    } finally {
      setBusy(false);
    }
  }

  async function onMfaSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setLocalError(null);
    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setLocalError(t({ bn: '৬ সংখ্যার কোড দিন।', en: 'Enter the 6-digit code.' }));
      return;
    }
    setBusy(true);
    try {
      await completeMfaSignIn(mfaCode.trim(), mfaFactorUid || undefined);
      // `user` appears → the effect above navigates to /profile.
    } catch {
      // The friendly message is already in `error` from the AuthProvider.
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
          <T bn={s.email.bn} en={s.email.en} />
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
          <T bn={s.password.bn} en={s.password.en} />
          <input
            style={inputStyle}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {shownError ? <p style={{ color: 'var(--error)' }}>{shownError}</p> : null}
        {shownError && errorCode ? (
          <p style={{ color: 'var(--error)', fontSize: 13, marginTop: -8 }}>{t({ bn: 'ত্রুটি কোড: ', en: 'Error code: ' })}{errorCode}</p>
        ) : null}
        <button style={buttonStyle} type="submit" disabled={busy || loading}>
          {busy ? <T bn={strings.common.loading.bn} en={strings.common.loading.en} /> : <T bn={s.loginButton.bn} en={s.loginButton.en} />}
        </button>
      </form>
      {mfaPending ? (
        <form
          onSubmit={onMfaSubmit}
          style={{ border: '1px solid var(--line-strong)', borderRadius: 8, padding: 16, background: 'var(--card)', marginTop: 20 }}
        >
          <p style={{ marginTop: 0, fontWeight: 700 }}>
            {t({ bn: 'দ্বিতীয় ধাপ — অথেনটিকেটর কোড', en: 'Second step — authenticator code' })}
          </p>
          <p>
            {t({
              bn: 'পাসওয়ার্ড সঠিক। এবার আপনার অথেনটিকেটর অ্যাপের (Google/Microsoft Authenticator) ৬ সংখ্যার কোড দিন।',
              en: 'Your password is correct. Now enter the 6-digit code from your authenticator app (Google/Microsoft Authenticator).',
            })}
          </p>
          {mfaPending.hints.length > 1 ? (
            <label>
              {t({ bn: 'কোন অথেনটিকেটর ব্যবহার করবেন?', en: 'Which authenticator?' })}
              <select
                style={inputStyle}
                value={mfaFactorUid}
                onChange={(e) => setMfaFactorUid(e.target.value)}
              >
                <option value="">
                  {t({ bn: 'প্রথমটি ব্যবহার করুন', en: 'Use the first one' })}
                </option>
                {mfaPending.hints.map((h) => (
                  <option key={h.uid} value={h.uid}>
                    {h.displayName ?? h.factorId}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            {t({ bn: '৬ সংখ্যার কোড', en: '6-digit code' })}
            <input
              style={inputStyle}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
          </label>
          {shownError ? <p style={{ color: 'var(--error)' }}>{shownError}</p> : null}
          <button style={buttonStyle} type="submit" disabled={busy || loading}>
            {t({ bn: 'যাচাই করে সাইন ইন করুন', en: 'Verify and sign in' })}
          </button>{' '}
          <button
            type="button"
            onClick={() => {
              setMfaCode('');
              clearMfaPending();
            }}
            style={{ background: 'none', border: 'none', padding: 0, color: 'var(--heading)', cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}
          >
            {t({ bn: 'বাতিল', en: 'Cancel' })}
          </button>
          <p style={{ fontSize: 14, marginBottom: 0 }}>
            {t({
              bn: 'ব্যাকআপ কোড দিয়ে সাইন ইন করা যায় না — অথেনটিকেটর অ্যাপের কোডই ব্যবহার করতে হবে। অথেনটিকেটর হারিয়ে গেলে Firebase console থেকে পুনরুদ্ধার করতে হয় (নিরাপত্তা পাতায় বিস্তারিত আছে)।',
              en: 'A backup code cannot sign you in — you must use the authenticator app code. If the authenticator is lost, recovery happens from the Firebase console (details are on the Security page).',
            })}
          </p>
        </form>
      ) : null}
      <p style={{ marginTop: 20 }}>
        {t(s.noAccount)} <Link to="/register">{t(s.registerTitle)}</Link>
      </p>
      <p>
        <button
          type="button"
          onClick={() => {
            setShowReset((v) => !v);
            setResetSent(false);
          }}
          style={{ background: 'none', border: 'none', padding: 0, color: 'var(--heading)', cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}
        >
          {t(s.forgotPassword)}
        </button>
      </p>
      {showReset ? (
        <form onSubmit={onReset} style={{ border: '1px solid var(--line-strong)', borderRadius: 8, padding: 16, background: 'var(--card)' }}>
          {resetSent ? (
            <p style={{ color: 'var(--heading)' }}>{t(s.resetSent)}</p>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>{t({ bn: 'রিসেট লিংক পেতে আপনার ইমেইল দিন।', en: 'Enter your email to receive a reset link.' })}</p>
              <label>
                {t(s.email)}
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
                {t(s.sendResetLink)}
              </button>
            </>
          )}
        </form>
      ) : null}
    </PageShell>
  );
}
