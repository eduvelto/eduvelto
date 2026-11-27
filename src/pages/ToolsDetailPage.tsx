// Eduvelto — Tools detail page (26 Nov 2026, 100-Tools Project, Phase 1).
//
// /:lang/tools/:slug — ONE slug-driven component for all 105 tools
// (NOT 100 page files). The slug is looked up in the single source
// of truth (toolBySlug in src/lib/toolsMeta.ts):
//
// - Unknown slug: soft 404 — PageShell + EmptyState + a link back
//   to /tools (HTTP 200 + noindex from the SEO fallback, same as
//   PublicGuidePage's not-found branch).
// - Aliased slug (meta.aliasPage is set): the existing page is
//   returned DIRECTLY with no wrapping PageShell — it has its own
//   shell, title and breadcrumb (no nested h1/breadcrumb).
// - Any other slug: description + an honest coming-soon box for the
//   interactive tool + (Finance/Health only) the 300-400 word guide
//   + Related Tools. The guide bodies live in toolsGuides.ts and
//   are imported ONLY here — this page is lazy, so the prose
//   downloads only when a tool page is visited, never on first
//   paint (same split as publicGuideMeta / publicGuideBodies).
//
// Phase-2 plug-in point: when a tool's interactive UI is built,
// register it in TOOL_COMPONENTS below (slug -> component) and the
// detail page renders it in place of the coming-soon box. Do NOT
// build Phase-2 tool UIs here; they come in a later step.

import { Link, useParams } from 'react-router-dom';
import type { ComponentType, CSSProperties } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell, EmptyState } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { AlertBox, LinkButton } from '../components/ui';
import { toolBySlug } from '../lib/toolsMeta';
import { toolGuideBySlug } from '../lib/toolsGuides';
import LifePdfToolsPage from './LifePdfToolsPage';
import LifeCalculatorsPage from './LifeCalculatorsPage';
import LifeConvertersPage from './LifeConvertersPage';
import JobTypingPage from './JobTypingPage';
import OpportunityCvBuilderPage from './OpportunityCvBuilderPage';
// Phase-2 tool UIs (Wave 3, 26 Nov 2026): one component per tool, all
// zero-prop, rendered inside this page's PageShell. The logic lives in
// src/lib/tools/; these files are only the interactive UI.
import { SscHscGpaTool } from './tools/SscHscGpaTool';
import { NuCgpaTool } from './tools/NuCgpaTool';
import { BijoyToUnicodeTool, UnicodeToBijoyTool } from './tools/BijoyTool';
import { ZakatTool } from './tools/ZakatTool';
import { LandMeasurementTool } from './tools/LandMeasurementTool';
import { PrayerTimesTool } from './tools/PrayerTimesTool';
import { PdfSplitterTool } from './tools/PdfSplitterTool';
import { PdfCompressorTool } from './tools/PdfCompressorTool';
import { ImageCompressorTool } from './tools/ImageCompressorTool';
import { ImageResizerTool } from './tools/ImageResizerTool';
// Phase-2 batch 2 (27 Nov 2026): Worker B (calculators + text),
// Worker C (directories + certificate + background remover),
// Worker D (video + music). Registry wiring by the coordinator.
import { BkashNagadTool } from './tools/BkashNagadTool';
import { TipCalculatorTool } from './tools/TipCalculatorTool';
import { DictionaryTool } from './tools/DictionaryTool';
import { TextToSpeechTool } from './tools/TextToSpeechTool';
import { InvoiceGeneratorTool } from './tools/InvoiceGeneratorTool';
import { BudgetPlannerTool } from './tools/BudgetPlannerTool';
import { EmergencyNumbersTool } from './tools/EmergencyNumbersTool';
import { CertificateMakerTool } from './tools/CertificateMakerTool';
import { BackgroundRemoverTool } from './tools/BackgroundRemoverTool';
import { VideoCompressorTool } from './tools/VideoCompressorTool';
import { VideoTrimmerTool } from './tools/VideoTrimmerTool';
import { VideoFormatConverterTool } from './tools/VideoFormatConverterTool';
import { VideoToAudioTool } from './tools/VideoToAudioTool';
import { MusicPlayerTool } from './tools/MusicPlayerTool';

// ---------------------------------------------------------------------------
// Phase-2 plug-in point (TOOL_COMPONENTS registry).
//
// Each entry maps a tool slug to its interactive UI component. The
// detail page renders the registered component in place of the
// coming-soon AlertBox; slugs with no entry keep showing the honest
// "still being built" box. Phase-2 workers add entries here (and
// only here) as each tool UI lands — no new routes, no new page
// files, no changes to the dispatch below.
// ---------------------------------------------------------------------------
const TOOL_COMPONENTS: Record<string, ComponentType> = {
  // Phase-2 tools, wired 26 Nov 2026 (Wave 3). The other 87 slugs keep
  // showing the honest "still being built" box until their UI lands.
  'ssc-hsc-gpa-calculator': SscHscGpaTool,
  'nu-cgpa-calculator': NuCgpaTool,
  'bijoy-to-unicode-converter': BijoyToUnicodeTool,
  'unicode-to-bijoy-converter': UnicodeToBijoyTool,
  'zakat-calculator': ZakatTool,
  'land-measurement': LandMeasurementTool,
  'prayer-times': PrayerTimesTool,
  'pdf-splitter': PdfSplitterTool,
  'pdf-compressor': PdfCompressorTool,
  'image-compressor': ImageCompressorTool,
  'image-resizer': ImageResizerTool,
  // Batch 2, wired 27 Nov 2026 (coordinator). The remaining slugs keep
  // showing the honest "still being built" box until their UI lands.
  'bkash-nagad-calculator': BkashNagadTool,
  'tip-calculator': TipCalculatorTool,
  'dictionary': DictionaryTool,
  'text-to-speech': TextToSpeechTool,
  'invoice-generator': InvoiceGeneratorTool,
  'budget-planner': BudgetPlannerTool,
  'emergency-numbers': EmergencyNumbersTool,
  'certificate-maker': CertificateMakerTool,
  'background-remover': BackgroundRemoverTool,
  'video-compressor': VideoCompressorTool,
  'video-trimmer': VideoTrimmerTool,
  'video-format-converter': VideoFormatConverterTool,
  'video-to-audio-converter': VideoToAudioTool,
  'music-player': MusicPlayerTool,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 12,
};

const guideStyle: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.75,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 20,
  margin: '28px 0 12px',
};

export default function ToolsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();
  const meta = slug ? toolBySlug(slug) : undefined;

  if (!meta) {
    return (
      <PageShell titleBn="পাতা পাওয়া যায়নি" titleEn="Page not found">
        <EmptyState
          bn="এই ঠিকানায় কোনো টুল নেই।"
          en="There is no tool at this address."
        />
        <LinkButton to="/tools" variant="primary">
          {lang === 'bn' ? 'সব টুল' : 'All tools'}
        </LinkButton>
      </PageShell>
    );
  }

  // Aliased slugs render their existing page directly — no wrapping
  // PageShell (the alias page has its own shell, title and
  // breadcrumb; wrapping it would nest h1s and breadcrumbs).
  switch (meta.aliasPage) {
    case 'life-pdf-tools':
      return <LifePdfToolsPage />;
    case 'life-calculators':
      return <LifeCalculatorsPage />;
    case 'life-converters':
      return <LifeConvertersPage />;
    case 'job-typing':
      return <JobTypingPage />;
    case 'opportunity-cv-builder':
      return <OpportunityCvBuilderPage />;
    default:
      break;
  }

  const guide = toolGuideBySlug(meta.slug);
  const guideText = guide ? (lang === 'en' ? guide.guideEn : guide.guideBn) : null;
  const related = meta.relatedSlugs
    .map((relatedSlug) => toolBySlug(relatedSlug))
    .filter((relatedMeta): relatedMeta is NonNullable<typeof relatedMeta> => Boolean(relatedMeta));
  const ToolUI = TOOL_COMPONENTS[meta.slug];

  return (
    <PageShell titleBn={meta.titleBn} titleEn={meta.titleEn}>
      <Breadcrumb
        items={[
          { label: t({ bn: 'টুলস', en: 'Tools' }), to: '/tools' },
          { label: lang === 'bn' ? meta.crumbBn : meta.crumbEn },
        ]}
      />
      <p style={{ fontSize: 16, lineHeight: 1.7 }}>
        {t({ bn: meta.descriptionBn, en: meta.descriptionEn })}
      </p>
      {ToolUI ? (
        <ToolUI />
      ) : (
        <AlertBox tone="info">
          {t({
            bn: 'এই টুলটি এখনো তৈরি হচ্ছে — শীঘ্রই আসছে।',
            en: 'This tool is still being built — coming soon.',
          })}
        </AlertBox>
      )}
      {guideText ? (
        <>
          <h2 style={sectionTitleStyle}>
            {t({ bn: 'বিস্তারিত গাইড', en: 'Detailed guide' })}
          </h2>
          <p style={guideStyle}>{guideText}</p>
        </>
      ) : null}
      {related.length > 0 ? (
        <>
          <h2 style={sectionTitleStyle}>{t({ bn: 'সম্পর্কিত টুলস', en: 'Related tools' })}</h2>
          <div style={gridStyle}>
            {related.map((relatedMeta) => (
              <Link
                key={relatedMeta.slug}
                to={`/tools/${relatedMeta.slug}`}
                className="ev-card ev-card-hover"
                style={{ display: 'block', textDecoration: 'none', color: 'var(--heading)', minHeight: 44 }}
              >
                <strong style={{ display: 'block', fontSize: 16 }}>
                  {t({ bn: relatedMeta.titleBn, en: relatedMeta.titleEn })}
                </strong>
                <span style={{ display: 'block', color: 'var(--muted)', fontSize: 14, marginTop: 8 }}>
                  {t({ bn: relatedMeta.descriptionBn, en: relatedMeta.descriptionEn })}
                </span>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
