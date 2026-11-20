import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Firestore } from 'firebase/firestore';
import { db } from '../firebase';

// Shared pieces for the Owner Admin Dashboard.
// - ConfirmDialog: the ONE confirmation modal for the whole dashboard.
//   Never use window.confirm (its buttons are in English, it traps no
//   focus, and it is not Bangla — review 20 Nov 2026, a11y S11).
// - StatusPill: brand colours only (navy/gold/grey — NO green).
// - ErrorBox / LoadingBox / EmptyAdminBox: every admin screen shows one
//   of these states, never a bare error code or a silent blank page
//   (review UX S6/S11).

export const NAVY = '#0A1F44';
export const DARK_NAVY = '#041742';
export const BLUE = '#1E7CE8';
export const GOLD = '#F1B308';

/** Firestore instance or a clear error — Firebase is always configured in production. */
export function requireDb(): Firestore {
  if (!db) throw new Error('not-configured');
  return db;
}
export const PILL_ACTIVE = { background: '#E8EFFA', color: '#0A1F44' };
export const PILL_READY = { background: '#FDF3D0', color: '#041742' };
export const PILL_MUTED = { background: '#F1F1F1', color: '#444' };

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
    <div
      role="alert"
      style={{
        border: '1px solid #b00020',
        borderRadius: 8,
        padding: '12px 14px',
        background: '#fdf0f0',
        color: '#5f0a0a',
        margin: '12px 0',
      }}
    >
      {props.message}
    </div>
  );
}

export function LoadingBox(props: { label?: string }) {
  return (
    <p aria-live="polite" style={{ color: '#555' }}>
      {props.label ?? 'লোড হচ্ছে… / Loading…'}
    </p>
  );
}

export function EmptyAdminBox(props: { bn: string; en: string; nextBn?: string }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 8,
        padding: '20px 16px',
        background: '#fafafa',
      }}
    >
      <p style={{ margin: 0 }}>{props.bn}</p>
      <p style={{ margin: '8px 0 0', color: '#555' }}>{props.en}</p>
      {props.nextBn ? (
        <p style={{ margin: '8px 0 0', color: '#555' }}>পরবর্তী পদক্ষেপ: {props.nextBn}</p>
      ) : null}
    </div>
  );
}

/** Sticky back-link every admin sub-page shows at the top (review UX S10). */
export function AdminBackLink() {
  return (
    <p
      style={{
        position: 'sticky',
        top: 0,
        background: '#fff',
        padding: '8px 0',
        margin: '0 0 8px',
        zIndex: 1,
      }}
    >
      <Link to="/admin">← অ্যাডমিন হোম / Admin home</Link>
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
        background: 'rgba(4, 23, 66, 0.55)',
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
          background: '#fff',
          borderRadius: 12,
          padding: '20px 18px',
          maxWidth: 480,
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px', fontSize: 20, color: NAVY }}>{props.titleBn}</h2>
        <p style={{ margin: '0 0 8px', color: '#555' }}>{props.titleEn}</p>
        <p style={{ margin: '0 0 16px' }}>{props.bodyBn}</p>
        <p style={{ margin: '0 0 16px', color: '#555' }}>{props.bodyEn}</p>
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
            {props.confirmBn} / {props.confirmEn}
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
              border: `1px solid ${NAVY}`,
              background: '#fff',
              color: NAVY,
              cursor: 'pointer',
            }}
          >
            বাতিল / Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
