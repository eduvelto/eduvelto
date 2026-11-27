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
import { toolGuideBySlug, toolGuideSectionsBySlug } from '../lib/toolsGuides';
import { langUrl } from '../lib/langRouting';
import { ToolIcon } from '../components/ToolIcon';
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
import { LabTestResultCheckerTool } from './tools/LabTestResultCheckerTool';
import { PdfToJpgTool } from './tools/PdfToJpgTool';
import { JpgToPdfTool } from './tools/JpgToPdfTool';
import { PdfPageExtractorTool } from './tools/PdfPageExtractorTool';
import { PdfPageReorderTool } from './tools/PdfPageReorderTool';
import { PdfWatermarkTool } from './tools/PdfWatermarkTool';
import { ImageToPdfTool } from './tools/ImageToPdfTool';
import { TextToPdfTool } from './tools/TextToPdfTool';
import { ImageCropperTool } from './tools/ImageCropperTool';
import { JpgToPngTool } from './tools/JpgToPngTool';
import { PngToJpgTool } from './tools/PngToJpgTool';
import { WebpConverterTool } from './tools/WebpConverterTool';
import { HeicToJpgTool } from './tools/HeicToJpgTool';
import { ImageWatermarkMakerTool } from './tools/ImageWatermarkMakerTool';
import { ImageColorPickerTool } from './tools/ImageColorPickerTool';
import { FaviconGeneratorTool } from './tools/FaviconGeneratorTool';
import { ImageRotateFlipTool } from './tools/ImageRotateFlipTool';
import { ImageToBase64Tool } from './tools/ImageToBase64Tool';
import { ImageFilterTool } from './tools/ImageFilterTool';
import { PdfPasswordProtectorTool } from './tools/PdfPasswordProtectorTool';
import { PdfPageRemoverTool } from './tools/PdfPageRemoverTool';
import { MemeGeneratorTool } from './tools/MemeGeneratorTool';
import { ExifViewerRemoverTool } from './tools/ExifViewerRemoverTool';
import { MortgageTool } from './tools/MortgageTool';
import { CompoundInterestTool } from './tools/CompoundInterestTool';
import { CreditCardPayoffTool } from './tools/CreditCardPayoffTool';
import { SalaryToHourlyTool } from './tools/SalaryToHourlyTool';
import { RetirementSavingsTool } from './tools/RetirementSavingsTool';
import { IncomeTaxTool } from './tools/IncomeTaxTool';
import { BankEmiDpsFdrTool } from './tools/BankEmiDpsFdrTool';
import { DiscountVatProfitTool } from './tools/DiscountVatProfitTool';
import { ExpenseSplitterTool } from './tools/ExpenseSplitterTool';
import { BreakEvenTool } from './tools/BreakEvenTool';
import { BmiTool } from './tools/BmiTool';
import { BmrTool } from './tools/BmrTool';
import { CalorieTdeeTool } from './tools/CalorieTdeeTool';
import { MacroNutrientTool } from './tools/MacroNutrientTool';
import { PregnancyDueDateTool } from './tools/PregnancyDueDateTool';
import { WaterIntakeTool } from './tools/WaterIntakeTool';
import { SleepCycleTool } from './tools/SleepCycleTool';
import { BodyFatTool } from './tools/BodyFatTool';
import { HeartRateZoneTool } from './tools/HeartRateZoneTool';
import { PaceSpeedTool } from './tools/PaceSpeedTool';
import { OvulationTool } from './tools/OvulationTool';
import { InternationalGpaTool } from './tools/InternationalGpaTool';
import { CgpaToPercentageTool } from './tools/CgpaToPercentageTool';
import { ExamCountdownTool } from './tools/ExamCountdownTool';
import { PomodoroTool } from './tools/PomodoroTool';
import { StudyRoutineTool } from './tools/StudyRoutineTool';
import { GradeAnalyzerTool } from './tools/GradeAnalyzerTool';
import { AttendanceTool } from './tools/AttendanceTool';
import { ScientificCalculatorTool } from './tools/ScientificCalculatorTool';
import { GovtJobAgeTool } from './tools/GovtJobAgeTool';
import { BcsMarksTool } from './tools/BcsMarksTool';
import { NegativeMarkingTool } from './tools/NegativeMarkingTool';
import { GkFlashcardTool } from './tools/GkFlashcardTool';
import { VocabularyTrainerTool } from './tools/VocabularyTrainerTool';
import { ApplicationFeeTool } from './tools/ApplicationFeeTool';
import { AdmitCardChecklistTool } from './tools/AdmitCardChecklistTool';
import { ExamSeatPlanTool } from './tools/ExamSeatPlanTool';
import { MeritRankTool } from './tools/MeritRankTool';
import { PassFailTool } from './tools/PassFailTool';
import { PrintablePaperTool } from './tools/PrintablePaperTool';
import { AcademicCalendarTool } from './tools/AcademicCalendarTool';
import { QuizStopwatchTool } from './tools/QuizStopwatchTool';
import { RandomStudentGroupTool } from './tools/RandomStudentGroupTool';
import { AssignmentCoverTool } from './tools/AssignmentCoverTool';
import { WordCounterTool } from './tools/WordCounterTool';
import { TextCaseConverterTool } from './tools/TextCaseConverterTool';
import { DuplicateLineRemoverTool } from './tools/DuplicateLineRemoverTool';
import { TextDiffCheckerTool } from './tools/TextDiffCheckerTool';
import { FindAndReplaceTool } from './tools/FindAndReplaceTool';
import { NumberToWordsConverterTool } from './tools/NumberToWordsConverterTool';
import { LoremIpsumGeneratorTool } from './tools/LoremIpsumGeneratorTool';
import { CitationGeneratorTool } from './tools/CitationGeneratorTool';
import { JsonFormatterTool } from './tools/JsonFormatterTool';
import { CodeMinifierBeautifierTool } from './tools/CodeMinifierBeautifierTool';
import { Base64EncoderDecoderTool } from './tools/Base64EncoderDecoderTool';
import { UrlEncoderDecoderTool } from './tools/UrlEncoderDecoderTool';
import { RegexTesterTool } from './tools/RegexTesterTool';
import { UuidHashGeneratorTool } from './tools/UuidHashGeneratorTool';
import { ColorConverterTool } from './tools/ColorConverterTool';
import { CssGradientGeneratorTool } from './tools/CssGradientGeneratorTool';
import { MetaTagGeneratorTool } from './tools/MetaTagGeneratorTool';
import { RobotsSitemapGeneratorTool } from './tools/RobotsSitemapGeneratorTool';
import { RemoveExtraSpacesTool } from './tools/RemoveExtraSpacesTool';
import { FancyTextGeneratorTool } from './tools/FancyTextGeneratorTool';
import { ReverseTextGeneratorTool } from './tools/ReverseTextGeneratorTool';
import { CreditCardValidatorTool } from './tools/CreditCardValidatorTool';
import { RomanNumeralConverterTool } from './tools/RomanNumeralConverterTool';
import { JwtTokenDecoderTool } from './tools/JwtTokenDecoderTool';
import { HtmlTableGeneratorTool } from './tools/HtmlTableGeneratorTool';
import { YoutubeThumbnailDownloaderTool } from './tools/YoutubeThumbnailDownloaderTool';
import { WhatsappLinkGeneratorTool } from './tools/WhatsappLinkGeneratorTool';
import { ScreenResolutionCheckerTool } from './tools/ScreenResolutionCheckerTool';
import { SpeechToTextTool } from './tools/SpeechToTextTool';
import { HijriDateConverterTool } from './tools/HijriDateConverterTool';
import { DailyQuranVerseTool } from './tools/DailyQuranVerseTool';
import { DailyHadithTool } from './tools/DailyHadithTool';
import { QiblaDirectionTool } from './tools/QiblaDirectionTool';
import { SehriIftarTool } from './tools/SehriIftarTool';
import { ElectricityBillCalculatorTool } from './tools/ElectricityBillCalculatorTool';
import { MeetingTimePlannerTool } from './tools/MeetingTimePlannerTool';
import { WorldDateConverterTool } from './tools/WorldDateConverterTool';
import { GovtServiceLinksTool } from './tools/GovtServiceLinksTool';
import { ResultsHubTool } from './tools/ResultsHubTool';
import { NotesTodoTool } from './tools/NotesTodoTool';
import { TasbihCounterTool } from './tools/TasbihCounterTool';
import { CharacterCounterTool } from './tools/CharacterCounterTool';
import { ReadingTimeTool } from './tools/ReadingTimeTool';
import { StopwatchTool } from './tools/StopwatchTool';
import { WorldClockTool } from './tools/WorldClockTool';
import { IdealWeightTool } from './tools/IdealWeightTool';
import { ProfitMarginTool } from './tools/ProfitMarginTool';
import { SimpleInterestTool } from './tools/SimpleInterestTool';
import { SavingsGoalTool } from './tools/SavingsGoalTool';
import { FuelCostTool } from './tools/FuelCostTool';
import { UnixTimestampTool } from './tools/UnixTimestampTool';
import { DateDifferenceTool } from './tools/DateDifferenceTool';
import { TimeDurationTool } from './tools/TimeDurationTool';
import { TextSorterTool } from './tools/TextSorterTool';
import { CsvToExcelTool } from './tools/CsvToExcelTool';
import { ExcelToCsvTool } from './tools/ExcelToCsvTool';
import { JsonToCsvTool } from './tools/JsonToCsvTool';
import { XmlFormatterTool } from './tools/XmlFormatterTool';
import { MarkdownToHtmlTool } from './tools/MarkdownToHtmlTool';
import { HtmlToMarkdownTool } from './tools/HtmlToMarkdownTool';
import { QrCodeGeneratorTool } from './tools/QrCodeGeneratorTool';
import { QrCodeReaderTool } from './tools/QrCodeReaderTool';
import { BarcodeGeneratorTool } from './tools/BarcodeGeneratorTool';
import { PasswordGeneratorTool } from './tools/PasswordGeneratorTool';
import { PasswordStrengthTool } from './tools/PasswordStrengthTool';
import { RandomNumberTool } from './tools/RandomNumberTool';
import { RandomNamePickerTool } from './tools/RandomNamePickerTool';
import { PdfMergerTool } from './tools/PdfMergerTool';
import { PdfRotateTool } from './tools/PdfRotateTool';
import { PdfPageNumberTool } from './tools/PdfPageNumberTool';
import { FlashcardMakerTool } from './tools/FlashcardMakerTool';
import { AgeCalculatorTool } from './tools/AgeCalculatorTool';
import { PercentageConverterTool } from './tools/PercentageConverterTool';
import { LoanEmiCalculatorTool } from './tools/LoanEmiCalculatorTool';
import ToolGuide from './tools/ToolGuide';

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
  // Lab Test Result Checker, wired 27 Nov 2026 (141st tool).
  'lab-test-result-checker': LabTestResultCheckerTool,
  'pdf-to-jpg': PdfToJpgTool,
  'jpg-to-pdf': JpgToPdfTool,
  'pdf-page-extractor': PdfPageExtractorTool,
  'pdf-page-reorder': PdfPageReorderTool,
  'pdf-watermark': PdfWatermarkTool,
  'image-to-pdf': ImageToPdfTool,
  'text-to-pdf': TextToPdfTool,
  'image-cropper': ImageCropperTool,
  'jpg-to-png': JpgToPngTool,
  'png-to-jpg': PngToJpgTool,
  'webp-converter': WebpConverterTool,
  'heic-to-jpg': HeicToJpgTool,
  'image-watermark-maker': ImageWatermarkMakerTool,
  'image-color-picker': ImageColorPickerTool,
  'favicon-generator': FaviconGeneratorTool,
  'image-rotate-flip': ImageRotateFlipTool,
  'image-to-base64': ImageToBase64Tool,
  'image-filter': ImageFilterTool,
  'pdf-password-protector': PdfPasswordProtectorTool,
  'pdf-page-remover': PdfPageRemoverTool,
  'meme-generator': MemeGeneratorTool,
  'exif-viewer-remover': ExifViewerRemoverTool,
  'mortgage-calculator': MortgageTool,
  'compound-interest-calculator': CompoundInterestTool,
  'credit-card-payoff-calculator': CreditCardPayoffTool,
  'salary-to-hourly-converter': SalaryToHourlyTool,
  'retirement-savings-planner': RetirementSavingsTool,
  'income-tax-calculator': IncomeTaxTool,
  'bank-emi-dps-fdr-calculator': BankEmiDpsFdrTool,
  'discount-vat-profit-calculator': DiscountVatProfitTool,
  'expense-splitter': ExpenseSplitterTool,
  'break-even-calculator': BreakEvenTool,
  'bmi-calculator': BmiTool,
  'bmr-calculator': BmrTool,
  'calorie-tdee-calculator': CalorieTdeeTool,
  'macro-nutrient-calculator': MacroNutrientTool,
  'pregnancy-due-date-calculator': PregnancyDueDateTool,
  'water-intake-calculator': WaterIntakeTool,
  'sleep-cycle-calculator': SleepCycleTool,
  'body-fat-calculator': BodyFatTool,
  'heart-rate-zone-calculator': HeartRateZoneTool,
  'pace-speed-calculator': PaceSpeedTool,
  'ovulation-calculator': OvulationTool,
  'international-gpa-calculator': InternationalGpaTool,
  'cgpa-to-percentage-converter': CgpaToPercentageTool,
  'exam-countdown-timer': ExamCountdownTool,
  'pomodoro-timer': PomodoroTool,
  'study-routine-maker': StudyRoutineTool,
  'grade-analyzer': GradeAnalyzerTool,
  'attendance-calculator': AttendanceTool,
  'scientific-calculator': ScientificCalculatorTool,
  'govt-job-age-calculator': GovtJobAgeTool,
  'bcs-marks-calculator': BcsMarksTool,
  'negative-marking-calculator': NegativeMarkingTool,
  'gk-flashcard': GkFlashcardTool,
  'vocabulary-trainer': VocabularyTrainerTool,
  'application-fee-calculator': ApplicationFeeTool,
  'admit-card-checklist': AdmitCardChecklistTool,
  'exam-seat-plan-generator': ExamSeatPlanTool,
  'merit-rank-result-sheet': MeritRankTool,
  'pass-fail-analyzer': PassFailTool,
  'printable-paper-generator': PrintablePaperTool,
  'academic-calendar-maker': AcademicCalendarTool,
  'quiz-stopwatch-timer': QuizStopwatchTool,
  'random-student-group-maker': RandomStudentGroupTool,
  'assignment-cover-generator': AssignmentCoverTool,
  'word-counter': WordCounterTool,
  'text-case-converter': TextCaseConverterTool,
  'duplicate-line-remover': DuplicateLineRemoverTool,
  'text-diff-checker': TextDiffCheckerTool,
  'find-and-replace': FindAndReplaceTool,
  'number-to-words-converter': NumberToWordsConverterTool,
  'lorem-ipsum-generator': LoremIpsumGeneratorTool,
  'citation-generator': CitationGeneratorTool,
  'json-formatter': JsonFormatterTool,
  'code-minifier-beautifier': CodeMinifierBeautifierTool,
  'base64-encoder-decoder': Base64EncoderDecoderTool,
  'url-encoder-decoder': UrlEncoderDecoderTool,
  'regex-tester': RegexTesterTool,
  'uuid-hash-generator': UuidHashGeneratorTool,
  'color-converter': ColorConverterTool,
  'css-gradient-generator': CssGradientGeneratorTool,
  'meta-tag-generator': MetaTagGeneratorTool,
  'robots-sitemap-generator': RobotsSitemapGeneratorTool,
  'remove-extra-spaces': RemoveExtraSpacesTool,
  'fancy-text-generator': FancyTextGeneratorTool,
  'reverse-text-generator': ReverseTextGeneratorTool,
  'credit-card-validator': CreditCardValidatorTool,
  'roman-numeral-converter': RomanNumeralConverterTool,
  'jwt-token-decoder': JwtTokenDecoderTool,
  'html-table-generator': HtmlTableGeneratorTool,
  'youtube-thumbnail-downloader': YoutubeThumbnailDownloaderTool,
  'whatsapp-link-generator': WhatsappLinkGeneratorTool,
  'screen-resolution-checker': ScreenResolutionCheckerTool,
  'speech-to-text': SpeechToTextTool,
  'hijri-date-converter': HijriDateConverterTool,
  'daily-quran-verse': DailyQuranVerseTool,
  'daily-hadith': DailyHadithTool,
  'qibla-direction': QiblaDirectionTool,
  'sehri-iftar-time': SehriIftarTool,
  'electricity-bill-calculator': ElectricityBillCalculatorTool,
  'meeting-time-planner': MeetingTimePlannerTool,
  'world-date-converter': WorldDateConverterTool,
  'govt-service-links': GovtServiceLinksTool,
  'results-hub': ResultsHubTool,
  'notes-todo': NotesTodoTool,
  'tasbih-counter': TasbihCounterTool,
  // A-tools batch, wired 27 Nov 2026 (landing/tools). The 4 remaining
  // alias slugs (typing-speed-test, cv-builder, cover-letter-builder,
  // unit-converter) still render their hub pages.
  'character-counter': CharacterCounterTool,
  'reading-time-calculator': ReadingTimeTool,
  'text-sorter': TextSorterTool,
  'stopwatch': StopwatchTool,
  'world-clock': WorldClockTool,
  'time-zone-converter': WorldDateConverterTool,
  'date-difference-calculator': DateDifferenceTool,
  'time-duration-calculator': TimeDurationTool,
  'unix-timestamp-converter': UnixTimestampTool,
  'ideal-weight-calculator': IdealWeightTool,
  'flashcard-maker': FlashcardMakerTool,
  'random-name-picker': RandomNamePickerTool,
  'profit-margin-calculator': ProfitMarginTool,
  'simple-interest-calculator': SimpleInterestTool,
  'savings-goal-calculator': SavingsGoalTool,
  'fuel-cost-calculator': FuelCostTool,
  'pdf-rotate': PdfRotateTool,
  'pdf-page-number-adder': PdfPageNumberTool,
  'csv-to-excel': CsvToExcelTool,
  'excel-to-csv': ExcelToCsvTool,
  'json-to-csv': JsonToCsvTool,
  'xml-formatter': XmlFormatterTool,
  'markdown-to-html': MarkdownToHtmlTool,
  'html-to-markdown': HtmlToMarkdownTool,
  'qr-code-generator': QrCodeGeneratorTool,
  'qr-code-reader': QrCodeReaderTool,
  'barcode-generator': BarcodeGeneratorTool,
  'password-generator': PasswordGeneratorTool,
  'password-strength-checker': PasswordStrengthTool,
  'random-number-generator': RandomNumberTool,
  'pdf-merger': PdfMergerTool,
  'age-calculator': AgeCalculatorTool,
  'percentage-converter': PercentageConverterTool,
  'loan-emi-calculator': LoanEmiCalculatorTool,
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
        <LinkButton to={langUrl('/tools', lang)} variant="primary">
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
  const guideSections = toolGuideSectionsBySlug(meta.slug);
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
      {guideSections ? (
        <ToolGuide guide={guideSections} />
      ) : guideText ? (
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
                to={langUrl(`/tools/${relatedMeta.slug}`, lang)}
                className="ev-card ev-card-hover"
                style={{ display: 'block', textDecoration: 'none', color: 'var(--heading)', minHeight: 44 }}
              >
                <ToolIcon slug={relatedMeta.slug} category={relatedMeta.category} size={36} style={{ marginBottom: 10 }} />
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
