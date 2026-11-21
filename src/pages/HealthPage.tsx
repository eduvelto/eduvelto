import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { strings } from '../i18n/strings';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';

// Eduvelto Health hub (Health v1). The 'health' feature flag in
// settings/features (owner-controlled) gates the section: if the owner
// has turned it off, the hub says so instead of showing the cards.
// Missing flag document = enabled (the section is built now; the flag
// note in lib/admin.ts said "turning it on does nothing — the health
// section is not built yet", which is no longer true).
// (ui/premium-polish: icon cards, skeleton while the flag loads.)

const CARDS = [
  { to: '/health/medicines', key: 'medicinesTitle' as const, icon: '✚', desc: 'ঔষধের ব্যবহার, পার্শ্বপ্রতিক্রিয়া ও সতর্কতা' },
  { to: '/health/diseases', key: 'diseasesTitle' as const, icon: '◉', desc: 'রোগের লক্ষণ, কারণ ও করণীয়' },
  { to: '/health/doctors', key: 'doctorsTitle' as const, icon: '⚕', desc: 'চিকিৎসকদের তথ্য ও যোগাযোগ' },
  { to: '/health/hospitals', key: 'hospitalsTitle' as const, icon: '⌂', desc: 'হাসপাতাল ও স্বাস্থ্যসেবা কেন্দ্র' },
  { to: '/health/report', key: 'reportTitle' as const, icon: '✎', desc: 'স্বাস্থ্য সমস্যা জানান' },
];

export default function HealthPage() {
  const h = strings.health;
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!db) return;
        const snap = await getDoc(doc(db, 'settings', 'features'));
        if (!cancelled && snap.exists()) {
          setEnabled(snap.data()['health'] !== false);
        }
      } catch {
        // Flag read failing must not hide health info: default enabled.
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked) {
    return (
      <PageShell titleBn={h.title.bn} titleEn={h.title.en}>
        <Skeleton lines={4} />
      </PageShell>
    );
  }

  if (!enabled) {
    return (
      <PageShell titleBn={h.title.bn} titleEn={h.title.en}>
        <HealthDisclaimer />
        <p>স্বাস্থ্য বিভাগটি বর্তমানে অ্যাডমিন বন্ধ রেখেছেন। / The Health section is currently turned off by the admin.</p>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn={h.title.bn} titleEn={h.title.en}>
      <HealthDisclaimer />
      <p>{h.hubIntro.bn}</p>
      <p style={{ color: '#5A6478' }}>{h.hubIntro.en}</p>
      <AccuracyNote />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, marginTop: 20 }}>
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="ev-card ev-card-hover"
            style={{ display: 'block', textDecoration: 'none', color: '#0A1F44' }}
          >
            <span
              aria-hidden="true"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#E8EFFA',
                color: '#1E7CE8',
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              {c.icon}
            </span>
            <strong style={{ display: 'block', fontSize: 16 }}>{h[c.key].bn}</strong>
            <span style={{ display: 'block', color: '#5A6478', fontSize: 13, marginTop: 2 }}>{h[c.key].en}</span>
            <span style={{ display: 'block', color: '#5A6478', fontSize: 14, marginTop: 8 }}>{c.desc}</span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
