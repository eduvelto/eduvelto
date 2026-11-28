// Eduvelto — Study Guides hub (Phase 2, 25 Nov 2026).
//
// /guides — the list page for the 25 long-form bilingual Study
// Guides in src/lib/publicGuides.ts (PHASE2_GUIDES). Same static
// data, same detail component (PublicGuidePage) as the 41 /learn
// guides — this hub is only a filtered view, not a parallel system.
// Static data only — zero Firestore reads, no login. Present tense
// only (28 Nov 2026 AdSense cleanup): no draft label on the hub.

import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/ui';
import { useLanguage } from '../i18n/LanguageContext';
import { PHASE2_GUIDES, type PublicGuideCategory } from '../lib/publicGuides';

const CATEGORY_ORDER: PublicGuideCategory[] = ['bcs', 'primary', 'bank', 'ntrca', 'admission', 'nctb', 'tools', 'finance', 'health'];

const CATEGORY_BN: Record<PublicGuideCategory, string> = {
  bcs: 'বিসিএস',
  primary: 'প্রাথমিক শিক্ষক',
  bank: 'ব্যাংক চাকরি',
  ntrca: 'NTRCA',
  admission: 'ভর্তি প্রস্তুতি',
  nctb: 'NCTB পড়ার পদ্ধতি',
  tools: 'টুল ব্যবহারের গাইড',
  finance: 'অর্থ ও হিসাব',
  health: 'স্বাস্থ্য',
};

const CATEGORY_EN: Record<PublicGuideCategory, string> = {
  bcs: 'BCS',
  primary: 'Primary Teacher',
  bank: 'Bank Jobs',
  ntrca: 'NTRCA',
  admission: 'Admission Preparation',
  nctb: 'NCTB Study Methods',
  tools: 'Tool Guides',
  finance: 'Money & Calculation',
  health: 'Health',
};

export default function GuidesHubPage() {
  const { lang, t } = useLanguage();
  return (
    <PageShell titleBn="স্টাডি গাইড" titleEn="Study Guides" wide maxWidth={1240}>
      <p style={{ color: 'var(--muted-ivory)', margin: '0 0 20px', fontSize: 15, lineHeight: 1.7 }}>
        {t({
          bn: 'বিসিএস, প্রাথমিক শিক্ষক, ব্যাংক, NTRCA, ভর্তি পরীক্ষা ও NCTB বই দিয়ে পড়ার বিস্তারিত গাইড — বাংলায় ও ইংরেজিতে, সম্পূর্ণ বিনামূল্যে। প্রতিটি গাইড ৭০০+ শব্দের বিস্তারিত লেখা। পরীক্ষার তারিখ, ফি ও নিয়মের ক্ষেত্রে সবসময় সংশ্লিষ্ট কর্তৃপক্ষের অফিসিয়াল বিজ্ঞপ্তি যাচাই করুন।',
          en: 'In-depth guides for BCS, primary teacher, bank, NTRCA, admission tests and studying with NCTB books — in Bangla and in English, completely free. Every guide is a detailed 700+ word article. Always verify exam dates, fees and rules against the official circular.',
        })}
      </p>

      {CATEGORY_ORDER.map((category) => {
        const guides = PHASE2_GUIDES.filter((g) => g.category === category);
        if (guides.length === 0) return null;
        return (
          <div key={category} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 19, margin: '0 0 12px', color: 'var(--heading)' }}>
              {lang === 'bn' ? CATEGORY_BN[category] : CATEGORY_EN[category]}
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {guides.map((guide) => (
                <Card key={guide.slug}>
                  <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 17 }}>
                    <Link to={guide.path} style={{ fontWeight: 700 }}>
                      {lang === 'bn' ? guide.titleBn : guide.titleEn}
                    </Link>
                  </div>
                  <p style={{ margin: '8px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.7 }}>
                    {lang === 'bn' ? guide.descriptionBn : guide.descriptionEn}
                  </p>
                  {guide.readTimeMinutes ? (
                    <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: 13 }}>
                      {t({
                        bn: `পড়ার সময়: প্রায় ${guide.readTimeMinutes} মিনিট`,
                        en: `Reading time: about ${guide.readTimeMinutes} minutes`,
                      })}
                    </p>
                  ) : null}
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
        {t({
          bn: 'আরও সাধারণ গাইড ও পাঠ দেখুন: ',
          en: 'See more general guides and lessons: ',
        })}
        <Link to="/learn">{t({ bn: 'পাঠ ও গাইড', en: 'Lessons and guides' })}</Link>
      </p>
    </PageShell>
  );
}
