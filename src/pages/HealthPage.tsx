import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { strings } from '../i18n/strings';
import { PageShell } from '../components/PageShell';
import { AccuracyNote, HealthDisclaimer } from '../components/HealthDisclaimer';

// Eduvelto Health hub (Health v1). The 'health' feature flag in
// settings/features (owner-controlled) gates the section: if the owner
// has turned it off, the hub says so instead of showing the cards.
// Missing flag document = enabled (the section is built now; the flag
// note in lib/admin.ts said "turning it on does nothing — the health
// section is not built yet", which is no longer true).

const CARD_STYLE: React.CSSProperties = {
  display: 'block',
  border: '1px solid #1E7CE8',
  borderRadius: 8,
  padding: '16px',
  marginBottom: 12,
  textDecoration: 'none',
  color: '#0A1F44',
  background: '#fff',
};

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
        <p>{strings.common.loading.bn}</p>
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
      <p style={{ color: '#555' }}>{h.hubIntro.en}</p>
      <AccuracyNote />
      <div style={{ marginTop: 20 }}>
        <Link to="/health/medicines" style={CARD_STYLE}>
          <strong>{h.medicinesTitle.bn}</strong>
          <br />
          <span style={{ color: '#555' }}>{h.medicinesTitle.en}</span>
        </Link>
        <Link to="/health/diseases" style={CARD_STYLE}>
          <strong>{h.diseasesTitle.bn}</strong>
          <br />
          <span style={{ color: '#555' }}>{h.diseasesTitle.en}</span>
        </Link>
        <Link to="/health/doctors" style={CARD_STYLE}>
          <strong>{h.doctorsTitle.bn}</strong>
          <br />
          <span style={{ color: '#555' }}>{h.doctorsTitle.en}</span>
        </Link>
        <Link to="/health/hospitals" style={CARD_STYLE}>
          <strong>{h.hospitalsTitle.bn}</strong>
          <br />
          <span style={{ color: '#555' }}>{h.hospitalsTitle.en}</span>
        </Link>
        <Link to="/health/report" style={CARD_STYLE}>
          <strong>{h.reportTitle.bn}</strong>
          <br />
          <span style={{ color: '#555' }}>{h.reportTitle.en}</span>
        </Link>
      </div>
    </PageShell>
  );
}
