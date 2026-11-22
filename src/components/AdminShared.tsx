import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Firestore } from 'firebase/firestore';
import { db } from '../firebase';
import { useLanguage } from '../i18n/LanguageContext';

// Shared pieces for the Owner Admin Dashboard.
// - ConfirmDialog: the ONE confirmation modal for the whole dashboard.
//   Never use window.confirm (its buttons are in English, it traps no
//   focus, and it is not Bangla — review 20 Nov 2026, a11y S11).
// - StatusPill: design-system v2 colours only (forest/teal/amber — the
//   old navy/gold/grey palette was replaced 21 Nov 2026).
// - ErrorBox / LoadingBox / EmptyAdminBox: every admin screen shows one
//   of these states, never a bare error code or a silent blank page
//   (review UX S6/S11).

export const NAVY = '#142B3B';
export const DARK_NAVY = '#0D1E29';
export const BLUE = '#12766E';
export const GOLD = '#D9A441';

/** Firestore instance or a clear error — Firebase is always configured in production. */
export function requireDb(): Firestore {
  if (!db) throw new Error('not-configured');
  return db;
}
export const PILL_ACTIVE = { background: 'var(--teal-soft)', color: 'var(--teal-text)' };
export const PILL_READY = { background: 'var(--amber-soft)', color: 'var(--amber-deep)' };
export const PILL_MUTED = { background: 'var(--hover)', color: 'var(--ink-soft)' };

export function StatusPill(props: { label: string; tone: 'active' | 'ready' | 'muted' }) {
  const style =
    props.tone === 'active' ? PILL_ACTIVE : props.tone === 'ready' ? PILL_READY : PILL_MUTED;
  return (
    <span
      aria-live="polite"
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: 14,
        background: style.background,
        color: style.color,
      }}
    >
      {props.label}
    </span>
  );
}

export function ErrorBox(props: { message: string }) {
  return (
    <div role="alert" className="ev-alert ev-alert-error" style={{ margin: '12px 0' }}>
      {props.message}
    </div>
  );
}

export function LoadingBox(props: { label?: string }) {
  const { t } = useLanguage();
  return (
    <p aria-live="polite" style={{ color: 'var(--muted-ivory)' }}>
      {props.label ?? t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}
    </p>
  );
}

export function EmptyAdminBox(props: { bn: string; en: string; nextBn?: string; nextEn?: string }) {
  const { lang, t } = useLanguage();
  const next = lang === 'bn' ? props.nextBn : (props.nextEn ?? props.nextBn);
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '20px 16px',
        background: 'var(--teal-soft)',
      }}
    >
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--heading)' }}>{lang === 'bn' ? props.bn : props.en}</p>
      {next ? (
        <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
          {t({ bn: 'পরবর্তী পদক্ষেপ: ', en: 'Next step: ' })}
          {next}
        </p>
      ) : null}
    </div>
  );
}

/** Sticky back-link every admin sub-page shows at the top (review UX S10). */
export function AdminBackLink() {
  const { t } = useLanguage();
  return (
    <p
      style={{
        position: 'sticky',
        top: 0,
        background: 'var(--bg)',
        padding: '8px 0',
        margin: '0 0 8px',
        zIndex: 1,
      }}
    >
      <Link to="/admin">{t({ bn: '← অ্যাডমিন হোম', en: '← Admin home' })}</Link>
    </p>
  );
}

export interface ConfirmDialogProps {
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  confirmBn: string;
  confirmEn: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Bangla confirmation dialog. Focus moves into the dialog on open and
 * returns to the triggering element on close. Escape / "বাতিল" cancels.
 * Destructive actions ALWAYS go through this — never a bare button.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);
  const { lang, t } = useLanguage();
  const title = lang === 'bn' ? props.titleBn : props.titleEn;
  const body = lang === 'bn' ? props.bodyBn : props.bodyEn;
  const confirm = lang === 'bn' ? props.confirmBn : props.confirmEn;

  useEffect(() => {
    previousFocus.current = document.activeElement;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={props.titleBn}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13, 30, 41, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50,
      }}
      onClick={props.onCancel}
    >
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 12,
          padding: '20px 18px',
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20, color: 'var(--heading)' }}>{title}</h2>
        <p style={{ margin: '0 0 16px' }}>{body}</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={props.onConfirm}
            style={{
              padding: '12px 20px',
              minHeight: 48,
              fontSize: 16,
              borderRadius: 8,
              border: 'none',
              background: NAVY,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {confirm}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={props.onCancel}
            style={{
              padding: '12px 20px',
              minHeight: 48,
              fontSize: 16,
              borderRadius: 8,
              border: `1px solid var(--heading)`,
              background: 'var(--card)',
              color: 'var(--heading)',
              cursor: 'pointer',
            }}
          >
            {t({ bn: 'বাতিল', en: 'Cancel' })}
          </button>
        </div>
      </div>
    </div>
  );
}
