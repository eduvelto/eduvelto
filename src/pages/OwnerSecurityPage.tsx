// /admin/security — Owner two-factor authentication (23 Nov 2026,
// staging — owner 2FA preparation).
//
// What this page does:
// - Enroll TOTP (authenticator app) as the owner's second factor,
//   including a SECOND authenticator as the real recovery path.
// - Generate backup codes ONCE for the owner to store himself.
// - List enrolled factors + remove a lost one (removing the LAST
//   factor requires consuming one backup code).
// - Show recent sign-ins (login alerts: new-device flags).
// - Explain recovery honestly: backup codes do NOT sign anyone in
//   (Firebase TOTP has no backup-code sign-in); if the owner has NO
//   signed-in session anywhere, recovery is the Firebase console.
//
// What this page NEVER does (hard limits): it never stores, copies or
// logs a TOTP secret, password, backup code or recovery code. Backup
// codes are stored in Firestore ONLY as salted SHA-256 hashes
// (lib/ownerMfa.ts). The TOTP secret is shown once for the
// authenticator app and never written anywhere.
//
// Prerequisite (VERIFIED 23 Nov 2026 via the Identity Toolkit API):
// the project's MFA state is DISABLED. Enrollment fails with
// auth/operation-not-allowed until the owner enables TOTP in the
// Firebase console himself (Authentication → Settings → Multi-factor
// authentication → TOTP). The page states this up front.
import { useCallback, useEffect, useState } from 'react';
import type { MultiFactorInfo } from 'firebase/auth';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../lib/auth';
import { db } from '../firebase';
import {
  AdminBackLink,
  ErrorBox,
  LoadingBox,
} from '../components/AdminShared';
import { authErrorCode, friendlyErrorMessage } from '../lib/profile';
import {
  consumeBackupCode,
  countBackupCodes,
  finishTotpEnrollment,
  generateBackupCodes,
  getEnrolledFactors,
  getOwnerSecurity,
  hashBackupCodes,
  hasTotpFactor,
  isSessionMfaVerified,
  isValidBackupCodeFormat,
  listOwnerLoginHistory,
  markMfaEnrolled,
  markMfaEnrolledThisSession,
  saveBackupCodeHashes,
  startTotpEnrollment,
  unenrollFactor,
  type LoginHistoryEntry,
  type OwnerSecurityDoc,
  type TotpEnrollmentStart,
} from '../lib/ownerMfa';

const boxStyle: React.CSSProperties = {
  border: '1px solid var(--line-strong)',
  borderRadius: 8,
  padding: 16,
  background: 'var(--card)',
  marginTop: 16,
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: 340,
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

const dangerButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: '#8b1e1e',
};

function formatWhen(millis: number | null | undefined): string {
  if (!millis) return '—';
  try {
    return new Date(millis).toLocaleString('bn-BD', {
      timeZone: 'Asia/Dhaka',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date(millis).toLocaleString();
  }
}

export default function OwnerSecurityPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [factors, setFactors] = useState<MultiFactorInfo[]>([]);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [securityDoc, setSecurityDoc] = useState<OwnerSecurityDoc | null>(null);
  const [history, setHistory] = useState<LoginHistoryEntry[]>([]);
  const [backupCount, setBackupCount] = useState(0);

  // Enrollment wizard state.
  const [enrollSecret, setEnrollSecret] = useState<TotpEnrollmentStart | null>(null);
  const [enrollCode, setEnrollCode] = useState('');
  const [enrollBusy, setEnrollBusy] = useState(false);
  const [enrollDisplayName, setEnrollDisplayName] = useState('Authenticator');
  // Backup codes shown ONCE after generation (plaintext lives only here).
  const [shownBackupCodes, setShownBackupCodes] = useState<string[] | null>(null);
  const [savedAck, setSavedAck] = useState(false);
  const [regenBusy, setRegenBusy] = useState(false);
  // Removing the last factor requires consuming one backup code.
  const [removeTarget, setRemoveTarget] = useState<MultiFactorInfo | null>(null);
  const [removeCode, setRemoveCode] = useState('');
  const [removeBusy, setRemoveBusy] = useState(false);

  function fail(e: unknown): void {
    if (authErrorCode(e) === 'auth/operation-not-allowed') {
      setError(
        t({
          bn: 'Firebase console-এ TOTP এখনো চালু হয়নি। Authentication → Settings → Multi-factor authentication → TOTP চালু করুন, তারপর আবার চেষ্টা করুন।',
          en: 'TOTP is not enabled in the Firebase console yet. Turn it on under Authentication → Settings → Multi-factor authentication → TOTP, then try again.',
        }),
      );
    } else {
      setError(friendlyErrorMessage(e));
    }
    setErrorCode(authErrorCode(e));
  }

  const refresh = useCallback(async () => {
    if (!user || !db) return;
    try {
      await user.reload();
    } catch {
      // Reload failure is non-fatal; the factors below may be stale.
    }
    setFactors(getEnrolledFactors(user));
    setSessionVerified(await isSessionMfaVerified(user));
    setSecurityDoc(await getOwnerSecurity(db, user.uid));
    setHistory(await listOwnerLoginHistory(db, user.uid, 10));
    setBackupCount(await countBackupCodes(db, user.uid));
  }, [user]);

  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const enrolled = hasTotpFactor(factors);
  const totpFactors = factors.filter((f) => f.factorId === 'totp');

  async function onStartEnrollment(displayName: string): Promise<void> {
    if (!user) return;
    setError('');
    setErrorCode(null);
    setNotice('');
    setEnrollDisplayName(displayName);
    setEnrollBusy(true);
    try {
      const started = await startTotpEnrollment(user);
      setEnrollSecret(started);
      setEnrollCode('');
    } catch (e) {
      fail(e);
    } finally {
      setEnrollBusy(false);
    }
  }

  async function onVerifyEnrollment(): Promise<void> {
    if (!user || !db || !enrollSecret) return;
    if (!/^\d{6}$/.test(enrollCode.trim())) {
      setError(t({ bn: '৬ সংখ্যার কোড দিন।', en: 'Enter the 6-digit code.' }));
      return;
    }
    setError('');
    setErrorCode(null);
    setEnrollBusy(true);
    try {
      await finishTotpEnrollment(user, enrollSecret.secret, enrollCode.trim(), enrollDisplayName);
      await markMfaEnrolled(db, user.uid);
      // Backup codes: generate, store ONLY their salted hashes, show
      // the plaintext ONCE for the owner to store himself.
      const codes = generateBackupCodes(10);
      await saveBackupCodeHashes(db, user.uid, await hashBackupCodes(codes));
      setShownBackupCodes(codes);
      setSavedAck(false);
      setEnrollSecret(null);
      markMfaEnrolledThisSession();
      await refresh();
      setNotice(
        t({
          bn: 'অথেনটিকেটর যুক্ত হয়েছে। নিচের ব্যাকআপ কোডগুলো এখনই নিরাপদ জায়গায় সংরক্ষণ করুন — এগুলো আর কখনো দেখানো হবে না।',
          en: 'Authenticator linked. Save the backup codes below in a safe place now — they will never be shown again.',
        }),
      );
    } catch (e) {
      fail(e);
    } finally {
      setEnrollBusy(false);
    }
  }

  async function onRegenerateBackupCodes(): Promise<void> {
    if (!user || !db) return;
    setError('');
    setErrorCode(null);
    setRegenBusy(true);
    try {
      const codes = generateBackupCodes(10);
      await saveBackupCodeHashes(db, user.uid, await hashBackupCodes(codes));
      setShownBackupCodes(codes);
      setSavedAck(false);
      setBackupCount(10);
      setNotice(
        t({
          bn: 'নতুন ব্যাকআপ কোড তৈরি হয়েছে — পুরোনো কোডগুলো আর কাজ করবে না। নতুনগুলো এখনই সংরক্ষণ করুন।',
          en: 'New backup codes created — the old ones no longer work. Save the new ones now.',
        }),
      );
    } catch (e) {
      fail(e);
    } finally {
      setRegenBusy(false);
    }
  }

  async function onRemoveFactor(factor: MultiFactorInfo): Promise<void> {
    if (!user || !db) return;
    // Removing the LAST TOTP factor requires consuming one backup
    // code first (the confirm panel collects it).
    if (totpFactors.length <= 1 && removeTarget?.uid !== factor.uid) {
      setRemoveTarget(factor);
      setRemoveCode('');
      setError('');
      return;
    }
    setError('');
    setErrorCode(null);
    setRemoveBusy(true);
    try {
      if (totpFactors.length <= 1) {
        if (!isValidBackupCodeFormat(removeCode)) {
          setError(
            t({
              bn: 'শেষ অথেনটিকেটরটি সরাতে একটি বৈধ ব্যাকআপ কোড দিন (XXXX-XXXX-XXXX)।',
              en: 'To remove the last authenticator, enter one valid backup code (XXXX-XXXX-XXXX).',
            }),
          );
          return;
        }
        const consumed = await consumeBackupCode(db, user.uid, removeCode.trim());
        if (!consumed.ok) {
          setError(
            t({
              bn: 'ব্যাকআপ কোডটি মেলেনি — হয় ভুল কোড, নয়তো আগেই ব্যবহৃত হয়েছে।',
              en: 'That backup code did not match — it may be wrong or already used.',
            }),
          );
          return;
        }
        setBackupCount(consumed.remaining);
      }
      await unenrollFactor(user, factor.uid);
      setRemoveTarget(null);
      setRemoveCode('');
      await refresh();
      setNotice(
        t({
          bn: 'অথেনটিকেটরটি সরানো হয়েছে।',
          en: 'The authenticator was removed.',
        }),
      );
    } catch (e) {
      fail(e);
    } finally {
      setRemoveBusy(false);
    }
  }

  function copyText(text: string, done: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text).then(() => setNotice(done));
    }
  }

  if (!user) {
    return (
      <PageShell titleBn="নিরাপত্তা" titleEn="Security">
        <p>{t({ bn: 'এই পাতা দেখতে সাইন ইন করুন।', en: 'Sign in to view this page.' })}</p>
      </PageShell>
    );
  }

  return (
    <div>
      <AdminBackLink />
      <h1>{t({ bn: 'নিরাপত্তা — দ্বিতীয় ধাপ (2FA)', en: 'Security — Two-Step Verification (2FA)' })}</h1>
      <p>
        {t({
          bn: 'মালিকের অ্যাকাউন্টের জন্য অথেনটিকেটর অ্যাপ (TOTP) দ্বিতীয় ধাপ। Firebase Auth-এ TOTP Spark প্ল্যানে বিনামূল্যে। কোনো পাসওয়ার্ড, গোপন কী বা ব্যাকআপ কোড এখানে সংরক্ষণ করা হয় না।',
          en: 'Authenticator-app (TOTP) second step for the owner account. TOTP on Firebase Auth is free on the Spark plan. No password, secret key or backup code is stored here.',
        })}
      </p>
      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {errorCode ? (
        <p style={{ color: 'var(--error)', fontSize: 13, marginTop: -8 }}>{t({ bn: 'ত্রুটি কোড:', en: 'Error code:' })} {errorCode}</p>
      ) : null}
      {notice ? <p style={{ color: 'var(--heading)' }}>{notice}</p> : null}

      {/* Status */}
      <section style={boxStyle} aria-label={t({ bn: 'বর্তমান অবস্থা', en: 'Current status' })}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: 'বর্তমান অবস্থা', en: 'Current status' })}</h2>
        <p>
          {t({ bn: 'অথেনটিকেটর: ', en: 'Authenticator: ' })}
          <strong>
            {enrolled
              ? t({ bn: `চালু আছে (${totpFactors.length}টি)`, en: `Enabled (${totpFactors.length})` })
              : t({ bn: 'চালু নেই', en: 'Not enabled' })}
          </strong>
        </p>
        <p>
          {t({ bn: 'এই সেশন: ', en: 'This session: ' })}
          <strong>
            {sessionVerified
              ? t({ bn: 'দ্বিতীয় ধাপ যাচাই করা হয়েছে', en: 'Second step verified' })
              : enrolled
                ? t({ bn: 'দ্বিতীয় ধাপ যাচাই হয়নি — অ্যাডমিন খুলতে আবার সাইন ইন করুন', en: 'Second step not verified — sign in again to open the admin' })
                : t({ bn: 'দ্বিতীয় ধাপ ছাড়াই চলছে', en: 'Running without a second step' })}
          </strong>
        </p>
        <p>
          {t({ bn: 'ব্যাকআপ কোড বাকি: ', en: 'Backup codes left: ' })}
          <strong>{backupCount}</strong>
        </p>
        <p>
          {t({ bn: 'সর্বশেষ সাইন ইন: ', en: 'Last sign-in: ' })}
          <strong>{formatWhen(securityDoc?.lastLoginAt?.toMillis())}</strong>
        </p>
      </section>

      {/* Console prerequisite — always visible until enrolled */}
      {!enrolled ? (
        <section style={boxStyle} aria-label={t({ bn: 'প্রথম ধাপ — Firebase console', en: 'First step — Firebase console' })}>
          <h2 style={{ marginTop: 0 }}>{t({ bn: 'প্রথম ধাপ — Firebase console-এ TOTP চালু করুন', en: 'First step — enable TOTP in the Firebase console' })}</h2>
          <p>
            {t({
              bn: 'যাচাই করা হয়েছে (২৩ নভেম্বর ২০২৬): এই প্রজেক্টের Multi-factor authentication এখন DISABLED। নিচের ধাপটি মালিককেই নিজে করতে হবে — Muse console-এর সেটিং বদলায় না।',
              en: 'Verified (23 Nov 2026): multi-factor authentication on this project is currently DISABLED. The owner must do this step himself — Muse does not change console settings.',
            })}
          </p>
          <ol>
            <li>
              {t({
                bn: 'Firebase console খুলুন → প্রজেক্ট eduvelto → Authentication → Settings → Multi-factor authentication।',
                en: 'Open the Firebase console → project eduvelto → Authentication → Settings → Multi-factor authentication.',
              })}
            </li>
            <li>
              {t({
                bn: 'TOTP চালু করুন (Enable)। Phone নয় — TOTP-ই বিনামূল্যে ও অথেনটিকেটর অ্যাপের সঙ্গে কাজ করে।',
                en: 'Enable TOTP (not Phone — TOTP is the free one that works with an authenticator app).',
              })}
            </li>
            <li>
              {t({
                bn: 'তারপর এই পাতায় ফিরে নিচের "অথেনটিকেটর যুক্ত করুন" ধাপটি করুন।',
                en: 'Then come back to this page and follow "Link an authenticator" below.',
              })}
            </li>
          </ol>
        </section>
      ) : null}

      {/* Enrollment wizard */}
      {!enrolled || enrollSecret ? (
        <section style={boxStyle} aria-label={t({ bn: 'অথেনটিকেটর যুক্ত করুন', en: 'Link an authenticator' })}>
          <h2 style={{ marginTop: 0 }}>{t({ bn: 'অথেনটিকেটর যুক্ত করুন', en: 'Link an authenticator' })}</h2>
          {!enrollSecret ? (
            <>
              <p>
                {t({
                  bn: 'Google Authenticator, Microsoft Authenticator বা 1Password-এর মতো যেকোনো TOTP অ্যাপ ব্যবহার করতে পারেন।',
                  en: 'Use any TOTP app, such as Google Authenticator, Microsoft Authenticator or 1Password.',
                })}
              </p>
              <button
                style={buttonStyle}
                type="button"
                disabled={enrollBusy}
                onClick={() => void onStartEnrollment(enrolled ? 'Authenticator 2' : 'Authenticator')}
              >
                {enrolled
                  ? t({ bn: 'দ্বিতীয় অথেনটিকেটর যুক্ত করুন', en: 'Link a second authenticator' })
                  : t({ bn: 'অথেনটিকেটর যুক্ত করুন', en: 'Link an authenticator' })}
              </button>
            </>
          ) : (
            <>
              <p>
                <strong>
                  {t({
                    bn: '১. অথেনটিকেটর অ্যাপে নিচের গোপন কীটি হাতে লিখে যোগ করুন (QR কোড নেই — এই অ্যাপে QR লাইব্রেরি নেই):',
                    en: '1. Add the secret key below manually in your authenticator app (no QR code — this app has no QR library):',
                  })}
                </strong>
              </p>
              <p>
                <code style={{ fontSize: 18, wordBreak: 'break-all' }}>{enrollSecret.secretKey}</code>{' '}
                <button
                  type="button"
                  onClick={() => copyText(enrollSecret.secretKey, t({ bn: 'কপি হয়েছে।', en: 'Copied.' }))}
                  style={{ background: 'none', border: 'none', padding: 0, color: 'var(--heading)', cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}
                >
                  {t({ bn: 'কপি করুন', en: 'Copy' })}
                </button>
              </p>
              <p style={{ fontSize: 14 }}>
                {t({ bn: 'অ্যাকাউন্ট: ', en: 'Account: ' })}
                <code style={{ wordBreak: 'break-all' }}>{enrollSecret.qrCodeUrl}</code>
              </p>
              <p>
                {t({
                  bn: 'এই গোপন কীটি কাউকে পাঠাবেন না — যার কাছে এটি আছে, সে আপনার কোড বানাতে পারবে।',
                  en: 'Never send this secret key to anyone — whoever has it can generate your codes.',
                })}
              </p>
              <label>
                {t({ bn: '২. অ্যাপের ৬ সংখ্যার কোড দিন', en: '2. Enter the 6-digit code from the app' })}
                <input
                  style={inputStyle}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={enrollCode}
                  onChange={(e) => setEnrollCode(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
              </label>
              <button style={buttonStyle} type="button" disabled={enrollBusy} onClick={() => void onVerifyEnrollment()}>
                {t({ bn: 'যাচাই করে চালু করুন', en: 'Verify and enable' })}
              </button>{' '}
              <button
                type="button"
                onClick={() => setEnrollSecret(null)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--heading)', cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}
              >
                {t({ bn: 'বাতিল', en: 'Cancel' })}
              </button>
            </>
          )}
        </section>
      ) : null}

      {/* Backup codes shown once */}
      {shownBackupCodes ? (
        <section style={boxStyle} aria-label={t({ bn: 'ব্যাকআপ কোড', en: 'Backup codes' })}>
          <h2 style={{ marginTop: 0 }}>{t({ bn: 'ব্যাকআপ কোড — এখনই সংরক্ষণ করুন', en: 'Backup codes — save them now' })}</h2>
          <p>
            {t({
              bn: 'এই কোডগুলো শুধু এই একবারই দেখানো হচ্ছে। প্রতিটি কোড একবারই ব্যবহার করা যায়। এগুলো দিয়ে সাইন ইন করা যায় না — সাইন ইন অবস্থায় হারানো অথেনটিকেটর সরাতে কাজে লাগে।',
              en: 'These codes are shown this once only. Each code works one time. They cannot sign you in — they are for removing a lost authenticator while you are signed in.',
            })}
          </p>
          <ul style={{ fontFamily: 'monospace', fontSize: 17, listStyle: 'none', padding: 0 }}>
            {shownBackupCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
          <button
            style={buttonStyle}
            type="button"
            onClick={() =>
              copyText(shownBackupCodes.join('\n'), t({ bn: 'সব কোড কপি হয়েছে।', en: 'All codes copied.' }))
            }
          >
            {t({ bn: 'সব কপি করুন', en: 'Copy all' })}
          </button>{' '}
          <button style={buttonStyle} type="button" onClick={() => window.print()}>
            {t({ bn: 'প্রিন্ট করুন', en: 'Print' })}
          </button>
          <label style={{ display: 'block', marginTop: 14 }}>
            <input
              type="checkbox"
              checked={savedAck}
              onChange={(e) => setSavedAck(e.target.checked)}
            />{' '}
            {t({
              bn: 'আমি কোডগুলো নিরাপদ জায়গায় (পাসওয়ার্ড ম্যানেজার / ছাপানো কাগজ) সংরক্ষণ করেছি।',
              en: 'I have saved the codes in a safe place (password manager / printed paper).',
            })}
          </label>
          <button
            style={buttonStyle}
            type="button"
            disabled={!savedAck}
            onClick={() => {
              setShownBackupCodes(null);
              setNotice(
                t({
                  bn: 'সংরক্ষিত হয়েছে। পরের সাইন ইন থেকে অথেনটিকেটর কোড চাওয়া হবে।',
                  en: 'Saved. From the next sign-in, the authenticator code will be asked.',
                }),
              );
            }}
          >
            {t({ bn: 'শেষ করুন', en: 'Done' })}
          </button>
        </section>
      ) : null}

      {/* Enrolled factors + backup code management */}
      {enrolled ? (
        <section style={boxStyle} aria-label={t({ bn: 'যুক্ত অথেনটিকেটর', en: 'Linked authenticators' })}>
          <h2 style={{ marginTop: 0 }}>{t({ bn: 'যুক্ত অথেনটিকেটর', en: 'Linked authenticators' })}</h2>
          <p>
            {t({
              bn: 'দ্বিতীয় অথেনটিকেটর (দ্বিতীয় ফোন বা পাসওয়ার্ড ম্যানেজারের TOTP) রাখাই আসল পুনরুদ্ধারের পথ — একটি হারালেও অন্যটি দিয়ে সাইন ইন করা যায়।',
              en: 'A second authenticator (second phone or password-manager TOTP) is the real recovery path — if one is lost, the other still signs you in.',
            })}
          </p>
          <ul>
            {totpFactors.map((f) => (
              <li key={f.uid} style={{ marginBottom: 10 }}>
                <strong>{f.displayName ?? 'Authenticator'}</strong>{' '}
                <span style={{ fontSize: 14 }}>
                  ({t({ bn: 'যুক্ত: ', en: 'Enrolled: ' })}
                  {formatWhen(f.enrollmentTime ? Date.parse(f.enrollmentTime) : null)})
                </span>{' '}
                <button
                  style={{ ...dangerButtonStyle, padding: '6px 12px', fontSize: 14 }}
                  type="button"
                  disabled={removeBusy}
                  onClick={() => void onRemoveFactor(f)}
                >
                  {t({ bn: 'সরান', en: 'Remove' })}
                </button>
              </li>
            ))}
          </ul>
          {removeTarget ? (
            <div style={{ border: '1px solid #8b1e1e', borderRadius: 8, padding: 12, marginTop: 8 }}>
              <p style={{ marginTop: 0 }}>
                <strong>
                  {t({
                    bn: 'এটিই শেষ অথেনটিকেটর। সরাতে একটি ব্যাকআপ কোড ব্যবহার করতে হবে (কোডটি ব্যবহার হয়ে যাবে)। ব্যাকআপ কোড না থাকলে Firebase console থেকে পুনরুদ্ধার করতে হবে।',
                    en: 'This is the last authenticator. Removing it consumes one backup code. Without a backup code, recovery must happen from the Firebase console.',
                  })}
                </strong>
              </p>
              <label>
                {t({ bn: 'ব্যাকআপ কোড (XXXX-XXXX-XXXX)', en: 'Backup code (XXXX-XXXX-XXXX)' })}
                <input
                  style={inputStyle}
                  type="text"
                  autoComplete="off"
                  value={removeCode}
                  onChange={(e) => setRemoveCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX"
                />
              </label>
              <button style={dangerButtonStyle} type="button" disabled={removeBusy} onClick={() => void onRemoveFactor(removeTarget)}>
                {t({ bn: 'ব্যাকআপ কোড দিয়ে সরান', en: 'Remove with backup code' })}
              </button>{' '}
              <button
                type="button"
                onClick={() => {
                  setRemoveTarget(null);
                  setRemoveCode('');
                }}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--heading)', cursor: 'pointer', fontSize: 16, textDecoration: 'underline' }}
              >
                {t({ bn: 'বাতিল', en: 'Cancel' })}
              </button>
            </div>
          ) : null}
          <h3>{t({ bn: 'ব্যাকআপ কোড', en: 'Backup codes' })}</h3>
          <p>
            {t({ bn: 'বাকি আছে: ', en: 'Remaining: ' })}
            <strong>{backupCount}</strong>
          </p>
          <button style={buttonStyle} type="button" disabled={regenBusy} onClick={() => void onRegenerateBackupCodes()}>
            {t({ bn: 'নতুন ব্যাকআপ কোড তৈরি করুন', en: 'Generate new backup codes' })}
          </button>
          <p style={{ fontSize: 14 }}>
            {t({
              bn: 'নতুন কোড তৈরি করলে পুরোনো সব কোড বাতিল হয়ে যায়। কোডগুলো শুধু লবণযুক্ত হ্যাশ হিসেবে সংরক্ষিত হয় — আসল কোড কোথাও লেখা থাকে না।',
              en: 'Generating new codes invalidates all old ones. Codes are stored only as salted hashes — the actual codes are never written anywhere.',
            })}
          </p>
        </section>
      ) : null}

      {/* Login history */}
      <section style={boxStyle} aria-label={t({ bn: 'সাম্প্রতিক সাইন ইন', en: 'Recent sign-ins' })}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: 'সাম্প্রতিক সাইন ইন', en: 'Recent sign-ins' })}</h2>
        <p>
          {t({
            bn: 'মালিকের অ্যাকাউন্টে প্রতিটি সাইন ইন এখানে লেখা থাকে। "নতুন ডিভাইস" দেখলে এবং সেটা আপনি না হলে সঙ্গে সঙ্গে পাসওয়ার্ড বদলান।',
            en: 'Every sign-in to the owner account is recorded here. If you see a "new device" you do not recognise, change the password at once.',
          })}
        </p>
        {history.length === 0 ? (
          <p>{t({ bn: 'এখনো কোনো রেকর্ড নেই।', en: 'No records yet.' })}</p>
        ) : (
          <ul>
            {history.map((h) => (
              <li key={h.id} style={{ marginBottom: 8 }}>
                <strong>{formatWhen(h.createdAt?.toMillis())}</strong>
                {h.isNewDevice ? (
                  <>
                    {' — '}
                    <strong style={{ color: '#8b1e1e' }}>
                      {t({ bn: 'নতুন ডিভাইস', en: 'New device' })}
                    </strong>
                  </>
                ) : null}
                <br />
                <span style={{ fontSize: 14 }}>
                  {t({ bn: 'ডিভাইস: ', en: 'Device: ' })}
                  {h.deviceId ? h.deviceId.slice(0, 12) : '—'}
                  {h.userAgent ? ` · ${h.userAgent.slice(0, 60)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recovery */}
      <section style={boxStyle} aria-label={t({ bn: 'অথেনটিকেটর হারিয়ে গেলে', en: 'If the authenticator is lost' })}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: 'অথেনটিকেটর হারিয়ে গেলে', en: 'If the authenticator is lost' })}</h2>
        <ol>
          <li>
            {t({
              bn: 'দ্বিতীয় অথেনটিকেটর থাকলে সেটি দিয়ে সাইন ইন করুন, তারপর এই পাতায় এসে হারানোটা সরিয়ে দিন।',
              en: 'If you have a second authenticator, sign in with it, then remove the lost one on this page.',
            })}
          </li>
          <li>
            {t({
              bn: 'কোথাও সাইন ইন অবস্থায় থাকলে (ফোনের ব্রাউজার/অ্যাপ) এই পাতায় এসে ব্যাকআপ কোড দিয়ে হারানো অথেনটিকেটরটি সরান।',
              en: 'If you are still signed in somewhere (phone browser/app), come to this page and remove the lost authenticator with a backup code.',
            })}
          </li>
          <li>
            {t({
              bn: 'কোথাও সাইন ইন না থাকলে: Firebase console → Authentication → Users → আপনার অ্যাকাউন্ট → Multi-factor authentication বন্ধ করুন (প্রজেক্টের মালিক হিসেবে আপনিই করতে পারেন)। তারপর আবার চালু করুন।',
              en: 'If you are signed in nowhere: Firebase console → Authentication → Users → your account → turn off multi-factor authentication (you can do this as the project owner). Then enable it again.',
            })}
          </li>
        </ol>
        <p style={{ fontSize: 14 }}>
          {t({
            bn: 'Muse আপনার পাসওয়ার্ড, গোপন কী বা ব্যাকআপ কোড কখনো সংরক্ষণ করে না — তাই Muse সেগুলো উদ্ধার করে দিতে পারবে না। এগুলো আপনার পাসওয়ার্ড ম্যানেজারে রাখুন।',
            en: 'Muse never stores your password, secret key or backup codes — so Muse cannot recover them for you. Keep them in your password manager.',
          })}
        </p>
      </section>
    </div>
  );
}
