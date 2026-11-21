import { useEffect, useState } from 'react';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AdminBackLink,
  ConfirmDialog,
  ErrorBox,
  LoadingBox,
  StatusPill,
  requireDb,
} from '../components/AdminShared';
import {
  FEATURE_FLAGS,
  friendlyAdminError,
  getFeatureFlags,
  setFeatureFlag,
  type FeatureFlagDef,
} from '../lib/admin';

export default function AdminFeaturesPage() {
  const { lang, t } = useLanguage();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<FeatureFlagDef | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload(): Promise<void> {
    setLoading(true);
    setError('');
    try {
      setFlags(await getFeatureFlags(requireDb()));
    } catch (e) {
      setError(friendlyAdminError(e, lang));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function doToggle(def: FeatureFlagDef): Promise<void> {
    const next = !(flags[def.id] ?? def.defaultOn);
    setBusy(true);
    setError('');
    try {
      await setFeatureFlag(requireDb(), def.id, next);
      setNotice(
        `${lang === 'bn' ? def.labelBn : def.labelEn} ${
          next ? t({ bn: 'চালু হয়েছে।', en: 'is now on.' }) : t({ bn: 'বন্ধ হয়েছে।', en: 'is now off.' })
        }`,
      );
      setConfirm(null);
      await reload();
    } catch (e) {
      setError(friendlyAdminError(e, lang));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell titleBn="ফিচার চালু/বন্ধ" titleEn="Feature toggles">
      <AdminBackLink />
      <p>
        {t({
          bn: 'কোন ফিচার চালু থাকবে — এখান থেকে বদলান। প্রতিটি ফিচারের নিচে লেখা আছে আজ চালু করলে আসলে কী হবে।',
          en: 'Which features are on — change them here. Under each feature it says what actually happens if you turn it on today.',
        })}
      </p>
      <p style={{ color: '#555', fontSize: 14 }}>
        {t({
          bn: 'সীমাবদ্ধ ফিচার (তালাবদ্ধ) কখনো চালু করা যায় না — মালিকের আলাদা অনুমোদন লাগবে।',
          en: 'Restricted features (locked) can never be enabled — they need the owner’s separate approval.',
        })}
      </p>
      {loading ? <LoadingBox /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {notice ? (
        <p role="status" style={{ color: '#0A1F44', fontWeight: 700 }}>
          {notice}
        </p>
      ) : null}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {FEATURE_FLAGS.map((def) => {
          const on = flags[def.id] ?? def.defaultOn;
          const locked = def.category === 'C';
          return (
            <li
              key={def.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 12,
                opacity: locked ? 0.85 : 1,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <strong style={{ fontSize: 16 }}>{lang === 'bn' ? def.labelBn : def.labelEn}</strong>
                {locked ? (
                  <StatusPill label={t({ bn: '🔒 সীমাবদ্ধ', en: '🔒 Restricted' })} tone="ready" />
                ) : (
                  <StatusPill label={on ? t({ bn: 'চালু', en: 'On' }) : t({ bn: 'বন্ধ', en: 'Off' })} tone={on ? 'active' : 'muted'} />
                )}
              </div>
              <p style={{ margin: '6px 0', color: '#555', fontSize: 14 }}>
                {lang === 'bn' ? def.noteBn : def.noteEn}
              </p>
              <p style={{ margin: '0 0 8px', fontSize: 15 }}>
                {t({ bn: 'আজ চালু করলে কী হবে:', en: 'What happens if turned on today:' })}{' '}
                <strong>{lang === 'bn' ? def.effectBn : def.effectEn}</strong>
              </p>
              {locked ? (
                <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
                  {t({
                    bn: 'এই ফিচার চালু করতে মালিকের আলাদা অনুমোদন লাগবে — ড্যাশবোর্ড থেকে চালু করা যায় না।',
                    en: 'Enabling this needs the owner’s separate approval — it cannot be enabled from the dashboard.',
                  })}
                </p>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    minHeight: 44,
                    padding: '10px 0',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={busy}
                    onChange={() => {
                      if (!on) setConfirm(def);
                      else void doToggle(def);
                    }}
                    style={{ width: 24, height: 24, accentColor: '#1E7CE8' }}
                  />
                  {t({ bn: 'চালু', en: 'Enabled' })}
                </label>
              )}
            </li>
          );
        })}
      </ul>
      {confirm ? (
        <ConfirmDialog
          titleBn="আপনি কি নিশ্চিত?"
          titleEn="Are you sure?"
          bodyBn={`${confirm.labelBn} চালু করবেন? মনে রাখবেন: ${confirm.effectBn}`}
          bodyEn={`Turn on ${confirm.labelEn}? Remember: ${confirm.effectEn}`}
          confirmBn="হ্যাঁ, চালু করুন"
          confirmEn="Yes, turn it on"
          onConfirm={() => void doToggle(confirm)}
          onCancel={() => setConfirm(null)}
        />
      ) : null}
    </PageShell>
  );
}
