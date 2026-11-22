// Eduvelto — National University first-time mode-choice card (NU-4,
// 22 Nov 2026; design doc §6.1, §6.3).
//
// Shown once to a signed-in student who has not handled the mode
// choice yet (admissionOnboarded !== true). Two cards — Beginner
// ("শুরু থেকে প্রস্তুতি") / Advanced ("প্রতিযোগিতামূলক প্রস্তুতি") —
// plus "পরে ঠিক করব" (default Beginner). Non-modal, dismissable,
// re-openable (forceOpen). Picking a mode saves admissionMode +
// admissionOnboarded: true on the profile; "পরে ঠিক করব" saves only
// admissionOnboarded: true and keeps the current mode — reopening
// NEVER silently resets the mode (Job Step 4 matrix, NU form).
//
// Mounted on /admissions (Coming Soon) in NU-4; NU-5 moves it to the
// NU hub Home tab. Signed-out visitors never see it. It promises
// nothing about content that does not exist yet — the card is about
// the mode only, and the page around it still says honestly that the
// section is being built.

import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useLanguage } from '../i18n/LanguageContext';
import { shouldShowNuOnboarding } from '../lib/nuProfile';
import { NU_MODE_COPY } from './AdmissionModeSwitch';
import type { AdmissionMode } from '../lib/nuProfile';

const cardStyle: React.CSSProperties = {
  border: '1px solid var(--heading)',
  borderRadius: 10,
  padding: '16px',
  textAlign: 'left',
  background: 'var(--card)',
  cursor: 'pointer',
  fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
};

export default function NuOnboarding(props: { forceOpen?: boolean }) {
  const { t } = useLanguage();
  const { user, profile, saveProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [savedMode, setSavedMode] = useState<AdmissionMode | null>(null);

  if (!shouldShowNuOnboarding(profile, props.forceOpen ?? false)) return null;

  async function pick(mode: AdmissionMode): Promise<void> {
    if (!user || !profile) return;
    setBusy(true);
    try {
      await saveProfile({ admissionMode: mode, admissionOnboarded: true });
      setSavedMode(mode);
    } catch {
      // The friendly message is in `error` from the AuthProvider.
    } finally {
      setBusy(false);
    }
  }

  async function decideLater(): Promise<void> {
    if (!user || !profile) return;
    setBusy(true);
    try {
      await saveProfile({ admissionOnboarded: true });
      setSavedMode('beginner');
    } catch {
      // See above.
    } finally {
      setBusy(false);
    }
  }

  if (savedMode) {
    return (
      <div style={{ border: '1px solid var(--teal-text)', borderRadius: 10, padding: '16px', background: 'var(--teal-soft)', marginTop: 20 }}>
        <p style={{ margin: 0 }}>
          {t({
            bn: `আপনার ভর্তি প্রস্তুতির মোড বেছে নেওয়া হয়েছে: ${NU_MODE_COPY[savedMode].bn}। যেকোনো সময় প্রোফাইল থেকে বদলাতে পারবেন।`,
            en: `Your admission preparation mode is set: ${NU_MODE_COPY[savedMode].en}. You can change it any time from your profile.`,
          })}
        </p>
      </div>
    );
  }

  return (
    <div style={{ border: '2px solid var(--heading)', borderRadius: 12, padding: '20px 16px', background: 'var(--card)', marginTop: 20 }}>
      <h2 style={{ marginTop: 0, fontSize: 19 }}>
        {t({ bn: 'জাতীয় বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি — কীভাবে শুরু করবেন?', en: 'National University admission preparation — how do you want to start?' })}
      </h2>
      <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
        {t({
          bn: 'আপনার প্রস্তুতির ধরন বেছে নিন। মোড যেকোনো সময় বদলানো যায় — অগ্রগতি মুছে যাবে না।',
          en: 'Choose how you want to prepare. You can switch mode any time — your progress is kept.',
        })}
      </p>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {(['beginner', 'advanced'] as const).map((m) => (
          <button key={m} type="button" style={cardStyle} onClick={() => void pick(m)} disabled={busy}>
            <strong style={{ display: 'block', fontSize: 16, color: 'var(--heading)', marginBottom: 6 }}>
              {t({ bn: NU_MODE_COPY[m].bn, en: NU_MODE_COPY[m].en })}
            </strong>
            <span style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.7 }}>
              {t({ bn: NU_MODE_COPY[m].descBn, en: NU_MODE_COPY[m].descEn })}
            </span>
          </button>
        ))}
      </div>
      <p style={{ margin: '16px 0 0' }}>
        <button
          type="button"
          onClick={() => void decideLater()}
          disabled={busy}
          style={{
            padding: '10px 18px',
            minHeight: 44,
            borderRadius: 6,
            border: '1px solid var(--line-strong)',
            background: 'var(--card)',
            cursor: 'pointer',
            fontSize: 15,
            fontFamily: "'Poppins','Hind Siliguri',system-ui,sans-serif",
          }}
        >
          {t({ bn: 'পরে ঠিক করব', en: 'Decide later' })}
        </button>
      </p>
    </div>
  );
}
