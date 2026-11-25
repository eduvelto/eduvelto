// Eduvelto — ProtectedContentWrapper (Question Paper Generator).
//
// Deterrence ONLY — never prevention. HONEST TECHNICAL LIMIT (also in
// code comments and UI copy, never hidden): no website can fully
// prevent screenshots. OS-level capture (Print Screen, snipping
// tools, OS screenshot shortcuts) and a phone camera pointed at the
// screen cannot be blocked by any web page. Any claim that
// screenshots are fully prevented would be false, so the UI NEVER
// says it (no "proof" wording anywhere in UI or copy).
//
// What this wrapper DOES (deterrence that makes a screenshot useless):
//  1. The paper renders as rasterized pixels (canvas image) — no
//     selectable / copyable text in the preview.
//  2. The FULL paper is shown in the preview (owner 25 Nov 19:03 —
//     "question lukai rakte hobe na sob dekaw"): every question is
//     visible; nothing is hidden behind a lock. The teacher reviews
//     their own paper in full before downloading.
//  3. ONE large centered watermark overlay (`eduvelto.com` + the
//     logged-in user's email/ID) sits in the middle of the preview,
//     so a leaked screenshot is traceable to an account (owner
//     25 Nov 19:03 — the old dense repeating diagonal grid is gone).
//  4. Right-click, text selection, drag/drop and copy are blocked on
//     the preview.
//  5. The preview blurs/blacks out (filter: blur(14px)) the moment the
//     window loses focus (blur / visibilitychange) — screenshot tools
//     that steal focus get a blurred frame.
//  6. PrintScreen / Ctrl+Cmd+P / Ctrl+Cmd+S / Ctrl+Cmd+C and DevTools
//     shortcuts are intercepted where the browser allows it.
//     PrintScreen itself cannot be reliably blocked — the keydown
//     handler blacks the preview out immediately as deterrence, and
//     the honest limit is stated in the UI.
//
// UX caution (owner spec): the blur applies ONLY to the paper preview
// area, never the whole app, so legitimate tab-switching is not
// punished. The full preview never blocks the teacher from reviewing
// their own paper — the PDF download is for printing/sharing.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { QPG_WATERMARK_TEXT } from '../lib/questionPaper';

export function ProtectedContentWrapper(props: {
  /** Logged-in user email/uid, or 'guest' when signed out. Baked into
   *  the watermark so a leaked screenshot is traceable. */
  userLabel: string;
  children: ReactNode;
}) {
  const [obscured, setObscured] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const obscureNow = useCallback(() => setObscured(true), []);
  const reveal = useCallback(() => {
    if (!document.hidden) setObscured(false);
  }, []);

  useEffect(() => {
    const onWindowBlur = () => obscureNow();
    const onWindowFocus = () => reveal();
    const onVisibility = () => {
      if (document.hidden) obscureNow();
      else reveal();
    };
    // PrintScreen / print / save / copy / DevTools shortcuts: intercept
    // where the browser allows. PrintScreen cannot be reliably blocked
    // (OS-level) — blacking out on keydown is deterrence, not prevention.
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const isPrintScreen = e.key === 'PrintScreen';
      const isPrint = mod && (e.key === 'p' || e.key === 'P');
      const isSave = mod && (e.key === 's' || e.key === 'S');
      const isCopy = mod && (e.key === 'c' || e.key === 'C');
      const isCut = mod && (e.key === 'x' || e.key === 'X');
      const isDevTools =
        e.key === 'F12' ||
        (mod && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase()));
      if (isPrintScreen || isPrint || isSave || isCopy || isCut || isDevTools) {
        e.preventDefault();
        e.stopPropagation();
        // Clipboard clear on PrintScreen (best-effort deterrence):
        // if the OS just copied the screen, empty the clipboard so a
        // paste yields nothing. Never breaks the flow — a denied
        // write is swallowed silently.
        if (isPrintScreen) {
          try {
            void navigator.clipboard?.writeText('').catch(() => undefined);
          } catch {
            // Clipboard unavailable/denied — deterrence only.
          }
        }
        obscureNow();
        // Re-reveal shortly after a blocked copy/print attempt only
        // when the window still has focus; a real focus loss keeps
        // the blur until focus returns (handled by the listeners).
        window.setTimeout(() => {
          if (document.hasFocus() && !document.hidden) setObscured(false);
        }, 800);
      }
    };
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [obscureNow, reveal]);

  const watermark = `${QPG_WATERMARK_TEXT} • ${props.userLabel}`;

  return (
    <div
      ref={rootRef}
      className="qpg-protected-root"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overflow: 'hidden',
        border: '1px solid var(--line, #ddd)',
        borderRadius: 8,
        background: '#fff',
      }}
    >
      <div
        className="qpg-protected-content"
        style={{
          filter: obscured ? 'blur(14px)' : 'none',
          transition: 'filter 120ms ease-out',
          pointerEvents: obscured ? 'none' : undefined,
        }}
      >
        {props.children}
      </div>
      {/* ONE large centered watermark (owner 25 Nov 19:03 — "moddokane
          1 ta boro kore takle hobe"). Exactly one element, in the
          middle of the paper. The per-page canvases underneath carry
          the same single mark baked in, so the overlay is hidden in
          print (see question-paper-print.css). */}
      <div
        aria-hidden="true"
        data-qpg-watermark="single"
        className="qpg-watermark-single"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%) rotate(-28deg)',
          fontSize: 'clamp(20px, 5vw, 44px)',
          fontWeight: 700,
          color: 'rgba(0,0,0,0.10)',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {watermark}
      </div>
      {obscured ? (
        <div
          className="qpg-protected-obscured"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            textAlign: 'center',
            padding: 16,
          }}
        >
          প্রিভিউ লুকানো আছে — উইন্ডোতে ফিরে আসলে আবার দেখা যাবে।
        </div>
      ) : null}
      <p className="qpg-protected-note" style={{ fontSize: 12, color: '#666', margin: '8px 10px', userSelect: 'none' }}>
        প্রিভিউ সুরক্ষিত — পুরো পেপার দেখা যায়। স্ক্রিনশট পুরোপুরি আটকানো যায় না
        (অপারেটিং সিস্টেম ও মোবাইল ক্যামেরা কোনো ওয়েবসাইট আটকাতে পারে না); তাই প্রিভিউয়ে জলছাপ দেওয়া থাকে।
      </p>
    </div>
  );
}
