// Eduvelto — Job Preparation first-time mode-choice screen (Step 4,
// Step 2 §1.8).
//
// Shown ONCE to a signed-in user who has not seen it yet
// (`jobOnboarded` false/absent on their profile): two cards, Beginner
// vs Advanced, with the SAME copy as JobModeSwitch (imported, not
// duplicated). Choosing a mode sets jobMode + jobOnboarded=true on the
// profile; "পরে ঠিক করব" sets jobOnboarded=true and leaves the mode
// alone (absent = Beginner). After either, it is never forced again.
//
// It NEVER blocks navigation: it is a card at the top of the page, not
// a modal — everything below it stays usable, and it can be closed
// with the dismiss button. It is reachable again from /jobs and from
// /jobs/dashboard via the "মোড পছন্দ আবার দেখুন" button (forceOpen).
// Signed-out visitors never see it — they keep the existing
// localStorage behaviour from jobMode.ts.

import { useState } from 'react';
import { useAuth } from '../lib/auth';
import type { JobMode } from '../lib/jobMode';
import { MODE_COPY } from './JobModeSwitch';
import { useLanguage, T } from '../i18n/LanguageContext';

export default function JobOnboarding({
  forceOpen = false,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const { user, profile, saveProfile } = useAuth();
  const { t } = useLanguage();
  // Hidden for this session once the student chooses or dismisses
  // (the profile update hides it on the next load too).
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // Signed-out visitors: never forced through onboarding.
  if (!user || !profile) return null;
  const needsOnboarding = profile.jobOnboarded !== true;
  if ((!needsOnboarding && !forceOpen) || done) return null;

  async function choose(mode: JobMode): Promise<void> {
    setBusy(true);
    setFailed(false);
    try {
      await saveProfile({ jobMode: mode, jobOnboarded: true });
    } catch {
      // The choice still applies for this session (the profile keeps
      // its previous value); the screen shows again next visit.
      setFailed(true);
    } finally {
      setBusy(false);
      setDone(true);
      onClose?.();
    }
  }

  async function dismiss(): Promise<void> {
    setBusy(true);
    setFailed(false);
    try {
      await saveProfile({ jobOnboarded: true });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
      setDone(true);
      onClose?.();
    }
  }

  return (
    <section
      aria-label={t({ bn: 'প্রস্তুতির মোড বেছে নিন', en: 'Choose your preparation mode' })}
      style={{
        border: '2px solid var(--teal-text)',
        borderRadius: 12,
        background: 'var(--teal-softer)',
        padding: '20px 16px',
        margin: '0 0 20px',
      }}
    >
      <h2 style={{ margin: '0 0 6px', fontSize: 20, color: 'var(--heading)' }}>
        {t({ bn: 'কীভাবে প্রস্তুতি নিতে চান?', en: 'How do you want to prepare?' })}
      </h2>
      <p style={{ margin: '0 0 16px', color: 'var(--muted-ivory)', fontSize: 15, lineHeight: 1.7 }}>
        {t({
          bn: 'একবার বেছে নিন — পরে যেকোনো সময় বদলানো যায়। এই পছন্দ আপনার প্রোফাইলে সংরক্ষিত হবে।',
          en: 'Pick once — you can change it any time later. This choice is saved on your profile.',
        })}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 12,
        }}
      >
        {(['beginner', 'advanced'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => void choose(m)}
            disabled={busy}
            style={{
              textAlign: 'left',
              padding: '16px',
              borderRadius: 10,
              border: '1px solid var(--teal-text)',
              background: 'var(--card)',
              cursor: busy ? 'wait' : 'pointer',
              fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
            }}
          >
            <span style={{ display: 'block', fontWeight: 700, fontSize: 17, color: 'var(--heading)' }}>
              {t({ bn: MODE_COPY[m].bn, en: MODE_COPY[m].en })}
            </span>
            <span style={{ display: 'block', marginTop: 6, fontSize: 14, lineHeight: 1.7, color: 'var(--muted-ivory)' }}>
              {t({ bn: MODE_COPY[m].descBn, en: MODE_COPY[m].descEn })}
            </span>
          </button>
        ))}
      </div>
      <p style={{ margin: '14px 0 0' }}>
        <button
          type="button"
          onClick={() => void dismiss()}
          disabled={busy}
          style={{
            padding: '10px 18px',
            minHeight: 44,
            borderRadius: 8,
            border: '1px solid var(--teal-text)',
            background: 'var(--card)',
            color: 'var(--teal-text)',
            fontWeight: 600,
            fontSize: 15,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          <T bn="পরে ঠিক করব" en="Decide later" />
        </button>
      </p>
      {failed ? (
        <p style={{ margin: '10px 0 0', color: 'var(--error)', fontSize: 14 }}>
          {t({
            bn: 'সংরক্ষণ করা যায়নি — সংযোগ দেখে আবার চেষ্টা করুন।',
            en: 'Could not save — check your connection and try again.',
          })}
        </p>
      ) : null}
    </section>
  );
}
