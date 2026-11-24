// Eduvelto — probable-question model tests (design §4.4).
//
// /jobs/model-test — the three test types (never mixed):
// previous-question practice, high-priority topic practice,
// probable-pattern model test. /jobs/model-test/:modelTestId —
// one published test, loaded from the `modelTests` collection.
// Release 1: ZERO model tests are published, so the list shows the
// honest empty state for each type and any id shows not-found.
// Selection reuses the live-exam selection engine (R-12,
// LIVE_EXAM_SELECTION_PATH = 'variant-pool') — no second engine.
//
// Every test carries the practice-not-prediction disclaimer (§4.6),
// and every question carries its provenance tag
// (previously-asked / new-about-tested-topic / syllabus-gap).

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PageShell } from '../components/PageShell';
import { Card, Reveal } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import {
  MODEL_TEST_DISCLAIMER,
  MODEL_TEST_KIND_LABEL,
  MODEL_TEST_KINDS,
  ANALYSIS_NOTICE,
  type ModelTestKind,
} from '../lib/jobTopicAnalytics';
import type { ModelTest } from '../lib/jobHistory';

async function loadModelTest(modelTestId: string): Promise<ModelTest | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'modelTests', modelTestId));
  if (!snap.exists()) return null;
  return snap.data() as ModelTest;
}

function TypeCard({ kind }: { kind: ModelTestKind }) {
  const { t } = useLanguage();
  return (
    <Card>
      <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 16 }}>
        {t({ bn: MODEL_TEST_KIND_LABEL[kind].bn, en: MODEL_TEST_KIND_LABEL[kind].en })}
      </div>
      <p style={{ margin: '6px 0 10px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t({ bn: MODEL_TEST_KIND_LABEL[kind].descBn, en: MODEL_TEST_KIND_LABEL[kind].descEn })}
      </p>
      <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>
        {t({ bn: 'এই ধরনের কোনো টেস্ট এখনো প্রকাশিত হয়নি।', en: 'No test of this type is published yet.' })}
      </p>
    </Card>
  );
}

export default function JobModelTestPage() {
  const { t } = useLanguage();
  const { modelTestId } = useParams<{ modelTestId?: string }>();
  const [test, setTest] = useState<ModelTest | 'not-found' | null>(null);

  useEffect(() => {
    if (!modelTestId) {
      setTest(null);
      return;
    }
    let alive = true;
    setTest(null);
    loadModelTest(modelTestId)
      .then((loaded) => {
        if (alive) setTest(loaded ?? 'not-found');
      })
      .catch(() => {
        if (alive) setTest('not-found');
      });
    return () => {
      alive = false;
    };
  }, [modelTestId]);

  if (modelTestId) {
    if (test === null) {
      return (
        <PageShell titleBn="মডেল টেস্ট" titleEn="Model test" wide>
          <p style={{ marginTop: 16 }}>{t({ bn: 'লোড হচ্ছে…', en: 'Loading…' })}</p>
        </PageShell>
      );
    }
    if (test === 'not-found') {
      return (
        <PageShell titleBn="মডেল টেস্ট পাওয়া যায়নি" titleEn="Model test not found" wide>
          <p style={{ margin: '16px 0' }}>
            {t({
              bn: 'এই মডেল টেস্টটি খুঁজে পাওয়া যায়নি — এখনো কোনো মডেল টেস্ট প্রকাশিত হয়নি।',
              en: 'This model test could not be found — no model test is published yet.',
            })}
          </p>
          <p style={{ margin: 0 }}>
            <Link to="/jobs/model-test" style={{ fontWeight: 600 }}>
              {t({ bn: '← সব মডেল টেস্ট', en: '← All model tests' })}
            </Link>
          </p>
        </PageShell>
      );
    }
    return (
      <PageShell titleBn={test.title} titleEn={test.title} wide>
        <p style={{ margin: '16px 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
          {t({ bn: MODEL_TEST_DISCLAIMER.bn, en: MODEL_TEST_DISCLAIMER.en })}
        </p>
        <p style={{ margin: 0 }}>
          <Link to="/jobs/model-test" style={{ fontWeight: 600 }}>
            {t({ bn: '← সব মডেল টেস্ট', en: '← All model tests' })}
          </Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell titleBn="মডেল টেস্ট" titleEn="Model tests" wide maxWidth={1240}>
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/jobs" style={{ fontWeight: 600 }}>
          {t({ bn: '← চাকরির প্রস্তুতি', en: '← Job Preparation' })}
        </Link>
      </p>
      <Reveal>
        <Card style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
            {t({ bn: 'মডেল টেস্ট — অনুশীলন, পূর্বাভাস নয়', en: 'Model tests — practice, not prediction' })}
          </div>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({ bn: ANALYSIS_NOTICE.bn, en: ANALYSIS_NOTICE.en })}
          </p>
          <p style={{ margin: '8px 0 0', color: 'var(--muted-ivory)', fontSize: 14, lineHeight: 1.8 }}>
            {t({ bn: MODEL_TEST_DISCLAIMER.bn, en: MODEL_TEST_DISCLAIMER.en })}
          </p>
        </Card>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {MODEL_TEST_KINDS.map((kind, i) => (
          <Reveal key={kind} delayMs={Math.min(i, 2) * 60}>
            <TypeCard kind={kind} />
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
