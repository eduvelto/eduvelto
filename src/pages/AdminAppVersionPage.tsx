// /admin/app-version — publish a new app version from the dashboard
// (owner brief 22 Nov 2026). NO code/deploy: saving here writes
// config/appVersion, and every app load enforces it.
//
// DANGER, stated plainly on the page: if minVersion is set ABOVE the
// version users have installed, every user sees the full-screen block
// until they update. The escape hatches are /install, /login and
// /admin/* — the owner can always come back here and lower minVersion.
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { PageShell } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';
import {
  AdminBackLink,
  ErrorBox,
  LoadingBox,
  requireDb,
} from '../components/AdminShared';
import { Button } from '../components/ui';
import {
  friendlyAdminError,
  updateAppVersionConfig,
} from '../lib/admin';
import {
  APP_VERSION,
  APP_VERSION_DOC,
  DEFAULT_DOWNLOAD_URL,
  compareVersions,
  isValidVersion,
} from '../lib/appVersion';

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  marginTop: 6,
  fontSize: 16,
  border: '1px solid #ccc',
  borderRadius: 6,
};

export default function AdminAppVersionPage() {
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [minVersion, setMinVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(DEFAULT_DOWNLOAD_URL);
  const [published, setPublished] = useState<{
    latestVersion: string;
    minVersion: string;
    releaseNotes: string;
    downloadUrl: string;
  } | null>(null);

  async function reload(): Promise<void> {
    setLoading(true);
    setError('');
    try {
      const snap = await getDoc(doc(requireDb(), 'config', APP_VERSION_DOC));
      if (snap.exists()) {
        const d = snap.data();
        const pub = {
          latestVersion: typeof d.latestVersion === 'string' ? d.latestVersion : '',
          minVersion: typeof d.minVersion === 'string' ? d.minVersion : '',
          releaseNotes: typeof d.releaseNotes === 'string' ? d.releaseNotes : '',
          downloadUrl: typeof d.downloadUrl === 'string' ? d.downloadUrl : DEFAULT_DOWNLOAD_URL,
        };
        setPublished(pub);
        setLatestVersion(pub.latestVersion);
        setMinVersion(pub.minVersion);
        setReleaseNotes(pub.releaseNotes);
        setDownloadUrl(pub.downloadUrl);
      }
    } catch (e) {
      setError(friendlyAdminError(e, lang));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function onSave(): Promise<void> {
    setError('');
    setNotice('');
    const latest = latestVersion.trim();
    const min = minVersion.trim();
    const url = downloadUrl.trim() || DEFAULT_DOWNLOAD_URL;
    if (!isValidVersion(latest) || !isValidVersion(min)) {
      setError(
        t({
          bn: 'ভার্সন লিখুন সংখ্যায় — যেমন 0.2.0 (x.y.z)। অক্ষর বা v লেখা যাবে না।',
          en: 'Write the version as numbers — e.g. 0.2.0 (x.y.z). No letters or leading v.',
        }),
      );
      return;
    }
    if (compareVersions(min, latest) > 0) {
      setError(
        t({
          bn: 'সর্বনিম্ন ভার্সন (minVersion) সর্বশেষ ভার্সনের (latestVersion) চেয়ে বড় হতে পারবে না।',
          en: 'Minimum version cannot be larger than the latest version.',
        }),
      );
      return;
    }
    if (!(url.startsWith('/') || url.startsWith('https://'))) {
      setError(
        t({
          bn: 'ডাউনলোড লিংক / দিয়ে শুরু হতে হবে (যেমন /install) অথবা https:// লিংক হতে হবে।',
          en: 'Download link must start with / (e.g. /install) or be an https:// link.',
        }),
      );
      return;
    }
    setBusy(true);
    try {
      await updateAppVersionConfig(requireDb(), {
        latestVersion: latest,
        minVersion: min,
        releaseNotes: releaseNotes.slice(0, 2000),
        downloadUrl: url,
      });
      setNotice(
        t({
          bn: `প্রকাশ হয়েছে — সর্বশেষ v${latest}, সর্বনিম্ন v${min}। v${min}-এর নিচের সব ব্যবহারকারী এখন ব্লক স্ক্রিন দেখবে।`,
          en: `Published — latest v${latest}, minimum v${min}. Users below v${min} now see the block screen.`,
        }),
      );
      await reload();
    } catch (e) {
      setError(friendlyAdminError(e, lang));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell titleBn="অ্যাপ আপডেট (ভার্সন)" titleEn="App update (version)">
      <AdminBackLink />
      <p>
        {t({
          bn: 'এখান থেকে নতুন ভার্সন প্রকাশ করুন — কোড বা ডেপ্লয় লাগবে না। প্রকাশের পর সব ব্যবহারকারীর অ্যাপ পরের বার খুললেই নতুন ভার্সন যাচাই করবে।',
          en: 'Publish a new version from here — no code or deploy needed. After publishing, every user’s app checks the new version on its next launch.',
        })}
      </p>
      <p style={{ color: '#b00020', fontWeight: 700 }}>
        {t({
          bn: `সাবধান: সর্বনিম্ন ভার্সন বর্তমানে ইনস্টল করা ভার্সন (${APP_VERSION})-এর চেয়ে বড় হলে সব ব্যবহারকারী ব্লক হয়ে যাবে — শুধু /install, /login ও /admin খোলা থাকবে। ভুল হলে এখানে এসে সর্বনিম্ন ভার্সন কমিয়ে দিন।`,
          en: `Warning: if the minimum version is higher than the currently installed version (${APP_VERSION}), every user is blocked — only /install, /login and /admin stay open. If that was a mistake, come back here and lower the minimum version.`,
        })}
      </p>
      {loading ? (
        <LoadingBox />
      ) : (
        <>
          <p style={{ color: '#555' }}>
            {t({
              bn: `এই মুহূর্তে অ্যাপের বান্ডল করা ভার্সন: v${APP_VERSION}। `,
              en: `Bundled app version right now: v${APP_VERSION}. `,
            })}
            {published
              ? t({
                  bn: `প্রকাশিত: সর্বশেষ v${published.latestVersion}, সর্বনিম্ন v${published.minVersion}।`,
                  en: `Published: latest v${published.latestVersion}, minimum v${published.minVersion}.`,
                })
              : t({ bn: 'এখনো কোনো ভার্সন প্রকাশ হয়নি।', en: 'No version published yet.' })}
          </p>
          <label>
            {t({ bn: 'সর্বশেষ ভার্সন (latestVersion)', en: 'Latest version (latestVersion)' })}
            <input
              style={inputStyle}
              type="text"
              value={latestVersion}
              onChange={(e) => setLatestVersion(e.target.value)}
              placeholder="0.2.0"
              maxLength={20}
              inputMode="decimal"
            />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {t({ bn: 'সর্বনিম্ন ভার্সন (minVersion) — এর নিচে ব্লক', en: 'Minimum version (minVersion) — below this is blocked' })}
            <input
              style={inputStyle}
              type="text"
              value={minVersion}
              onChange={(e) => setMinVersion(e.target.value)}
              placeholder="0.2.0"
              maxLength={20}
              inputMode="decimal"
            />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {t({ bn: 'নতুন কী আছে (release notes)', en: 'What is new (release notes)' })}
            <textarea
              style={{ ...inputStyle, minHeight: 80 }}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              placeholder="নতুন চ্যাপ্টার ও পরীক্ষা যোগ হয়েছে।"
              maxLength={2000}
            />
          </label>
          <label style={{ display: 'block', marginTop: 12 }}>
            {t({ bn: 'ডাউনলোড লিংক (downloadUrl)', en: 'Download link (downloadUrl)' })}
            <input
              style={inputStyle}
              type="text"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="/install"
              maxLength={500}
            />
          </label>
          <p style={{ color: '#555', fontSize: 14 }}>
            {t({
              bn: 'ডিফল্ট লিংক /install — অ্যাপের ভেতরের ডাউনলোড পাতা। Eduvelto-র এখনো কোনো Play Store অ্যাপ নেই, তাই বাইরের স্টোর লিংক বসাবেন না।',
              en: 'Default link /install — the in-app download page. Eduvelto has no Play Store app yet, so do not put a store link here.',
            })}
          </p>
          {error ? <ErrorBox message={error} /> : null}
          {notice ? (
            <p role="status" style={{ color: '#0a7a3d', fontWeight: 700 }}>
              {notice}
            </p>
          ) : null}
          <p style={{ marginTop: 16 }}>
            <Button onClick={() => void onSave()} loading={busy} disabled={busy}>
              {t({ bn: 'ভার্সন প্রকাশ করুন', en: 'Publish version' })}
            </Button>
          </p>
          <p style={{ color: '#555', fontSize: 14 }}>
            {t({
              bn: 'প্রতিটি প্রকাশ অডিট লগে (adminActions) লেখা হয় — কে, কখন, আগের ও নতুন ভার্সন কী ছিল।',
              en: 'Every publish is written to the audit log (adminActions) — who, when, and the old and new versions.',
            })}
          </p>
        </>
      )}
    </PageShell>
  );
}
