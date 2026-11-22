// Eduvelto — National University admission: subject / chapter / topic /
// lesson structure (NU-6, 22 Nov 2026; design doc §5.4, §15 NU-6,
// §19.2.3, §19.3.4).
//
// READ-PATH DECISION (NU-6, BINDING — same rule as Job Step 5 / NU-5):
// the subject/topic pages render from THIS module — NOT from Firestore.
// `NU_SYLLABUS_READ_FROM_FIRESTORE` stays false until ALL of these hold:
//   (1) an admin has applied the syllabus seed set through the admin
//       flow (lib/nuAdmin.ts `applyNuSyllabusSeedDocs`) — nothing has
//       been applied to any database yet;
//   (2) the read-back check reports every doc `matches`;
//   (3) the subject layer is published (status 'published') through the
//       publication flow (NU-7) — today EVERY syllabus doc is 'draft'.
// Until then every count that would come from live data (questions,
// lessons ready) is an honest 0 / honest empty state.
//
// HONESTY (BINDING): the chapter/topic lists below are DRAFT raw
// material for teacher review — NOT the official NU syllabus. Every
// chapter/topic carries `syllabusVerified: false` and a `syllabusSource`
// naming the textbook it was taken from; the UI shows the draft banner
// wherever it renders this structure, and nothing here is ever shown as
// "Published" or as the official syllabus. Sources checked 22 Nov 2026:
//   - Bangla গদ্য/পদ্য/সহপাঠ: NCTB সাহিত্যপাঠ (HSC বাংলা ১ম পত্র),
//     2024-25 session syllabus (12 গদ্য + 12 পদ্য + লালসালু /
//     সিরাজউদ্দৌলা) — checked against two independent syllabus
//     listings (byakoronschool.com, onlinereadingroombd.com, 22 Nov
//     2026). The full textbook holds 28+28 texts; only the 12+12
//     session-syllabus texts are listed.
//   - English Reading: NCTB English for Today, Classes 11-12 (2015
//     edition) — 15 units, 57 lessons — checked against the book's
//     table of contents (slideshare NCTB scan) and the unit list
//     (dailynewnation.com, 22 Nov 2026).
//   - Bangla ব্যাকরণ / English Grammar / Writing: standard HSC 2nd
//     paper items — universal syllabus topics, no textbook claim.
//   - General Knowledge: no single HSC textbook exists — the chapters
//     are the standard admission-GK domains, labelled as such.
// Teacher review (0 verified teachers today) remains the publish gate:
// no syllabus doc may become 'published' without it (NU-7 flow).
//
// GROUP-40 (Blocker B): the group-40 block is ONE subject doc per
// group (`isGroupBlock: true`, marks 40). NO chapter/topic/lesson doc
// references a block subject — its inner split is unverified until
// the NU Guideline arrives (NU-Q2). The parallel browser check of
// nu.ac.bd/admissions returned nothing verified during NU-6, so the
// single block stands and NU-Q2 stays open.

import { NU_CIRCULAR_VERSION } from './nuExamConfig';
import { NU_GROUPS, type NuGroupSlug } from './nuProfile';

/** Read-path flag — see the module header. Flip ONLY when the three
 * switch criteria are all met (admin apply + read-back match +
 * subject layer published). */
export const NU_SYLLABUS_READ_FROM_FIRESTORE = false;

export const NU_GROUP_SLUGS: readonly NuGroupSlug[] = ['humanities', 'science', 'business'];

/** Subject slugs: the 3 common subjects (verified 20 marks each from
 * the circular) + the group-40 block (one per group). */
export type NuSyllabusSubjectSlug =
  | 'bangla'
  | 'english'
  | 'general-knowledge'
  | 'group-humanities'
  | 'group-science'
  | 'group-business';

export const NU_SYLLABUS_COMMON_SLUGS: readonly NuSyllabusSubjectSlug[] = [
  'bangla',
  'english',
  'general-knowledge',
];

export interface NuSyllabusSubjectDoc {
  id: string;
  slug: NuSyllabusSubjectSlug;
  nameBn: string;
  nameEn: string;
  groupIds: NuGroupSlug[];
  /** Verified marks from the circular: 20 per common subject, 40 for
   * the group block. */
  marks: number;
  /** True only for the group-40 block docs — they have no chapters. */
  isGroupBlock: boolean;
  syllabusSource: string;
  status: 'draft' | 'published';
  circularVersion: string;
  createdBy: string;
}

export interface NuSyllabusChapterDoc {
  id: string;
  subjectId: string;
  slug: string;
  nameBn: string;
  nameEn: string;
  order: number;
  syllabusSource: string;
  /** False until a verified teacher confirms the chapter list. */
  syllabusVerified: boolean;
  status: 'draft' | 'published';
  circularVersion: string;
  createdBy: string;
}

export interface NuSyllabusTopicDoc {
  id: string;
  subjectId: string;
  chapterId: string;
  slug: string;
  nameBn: string;
  /** Author (Bangla texts) or Bangla gloss (English/GK topics). */
  detailBn: string;
  order: number;
  syllabusSource: string;
  syllabusVerified: boolean;
  status: 'draft' | 'published';
  circularVersion: string;
  createdBy: string;
}

export interface NuSyllabusLessonDoc {
  id: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
  slug: string;
  order: number;
  titleBn: string;
  /** Honest stub until a teacher writes + verifies the lesson. */
  bodyBn: string;
  status: 'draft' | 'published';
  circularVersion: string;
  createdBy: string;
}

const CREATED_BY = 'nu-syllabus-seed';
const DRAFT = 'draft' as const;

/** The 3 common subjects + the group-40 block (one per group).
 * Common subjects apply to ALL groups (groupIds = all three). */
export function nuSyllabusSubjects(): NuSyllabusSubjectDoc[] {
  const all: NuGroupSlug[] = ['humanities', 'science', 'business'];
  const common: NuSyllabusSubjectDoc[] = [
    {
      id: 'nu-sub-bangla',
      slug: 'bangla',
      nameBn: 'বাংলা',
      nameEn: 'Bangla',
      groupIds: all,
      marks: 20,
      isGroupBlock: false,
      syllabusSource: 'NU বিজ্ঞপ্তি ২০/১১/২০২৫ §৪ — ২০ নম্বর যাচাইকৃত',
      status: DRAFT,
      circularVersion: NU_CIRCULAR_VERSION,
      createdBy: CREATED_BY,
    },
    {
      id: 'nu-sub-english',
      slug: 'english',
      nameBn: 'ইংরেজি',
      nameEn: 'English',
      groupIds: all,
      marks: 20,
      isGroupBlock: false,
      syllabusSource: 'NU বিজ্ঞপ্তি ২০/১১/২০২৫ §৪ — ২০ নম্বর যাচাইকৃত',
      status: DRAFT,
      circularVersion: NU_CIRCULAR_VERSION,
      createdBy: CREATED_BY,
    },
    {
      id: 'nu-sub-gk',
      slug: 'general-knowledge',
      nameBn: 'সাধারণ জ্ঞান',
      nameEn: 'General Knowledge',
      groupIds: all,
      marks: 20,
      isGroupBlock: false,
      syllabusSource: 'NU বিজ্ঞপ্তি ২০/১১/২০২৫ §৪ — ২০ নম্বর যাচাইকৃত',
      status: DRAFT,
      circularVersion: NU_CIRCULAR_VERSION,
      createdBy: CREATED_BY,
    },
  ];
  const blocks: NuSyllabusSubjectDoc[] = NU_GROUPS.map((g) => ({
    id: `nu-sub-group-${g.slug}`,
    slug: `group-${g.slug}` as NuSyllabusSubjectSlug,
    nameBn: 'শাখা-ভিত্তিক প্রশ্ন (৪০)',
    nameEn: 'Group subjects (40)',
    groupIds: [g.slug],
    marks: 40,
    isGroupBlock: true,
    syllabusSource:
      'NU বিজ্ঞপ্তি ২০/১১/২০২৫ §৪ — ৪০ নম্বর যাচাইকৃত; ভেতরের বিভাজন Guideline-এ নিশ্চিত হলে আসবে (Blocker B)',
    status: DRAFT,
    circularVersion: NU_CIRCULAR_VERSION,
    createdBy: CREATED_BY,
  }));
  return [...common, ...blocks];
}

// ---------- chapters ----------

const BANGLA_PROSE_SOURCE =
  'NCTB সাহিত্যপাঠ (HSC বাংলা ১ম পত্র) — ২০২৪-২৫ সেশন সিলেবাস, ১২ গদ্য — ওয়েব-যাচাই, শিক্ষক-যাচাই বাকি';
const BANGLA_POETRY_SOURCE =
  'NCTB সাহিত্যপাঠ (HSC বাংলা ১ম পত্র) — ২০২৪-২৫ সেশন সিলেবাস, ১২ পদ্য — ওয়েব-যাচাই, শিক্ষক-যাচাই বাকি';
const BANGLA_COMPANION_SOURCE =
  'NCTB সহপাঠ (HSC বাংলা ১ম পত্র) — উপন্যাস লালসালু, নাটক সিরাজউদ্দৌলা — ওয়েব-যাচাই, শিক্ষক-যাচাই বাকি';
const BANGLA_GRAMMAR_SOURCE =
  'HSC বাংলা ২য় পত্র — ব্যাকরণ অংশ (মানক) — শিক্ষক-যাচাই বাকি';
const ENGLISH_READING_SOURCE =
  'NCTB English for Today, Classes 11-12 (2015) — ১৫ ইউনিট — ওয়েব-যাচাই, শিক্ষক-যাচাই বাকি';
const ENGLISH_GRAMMAR_SOURCE =
  'HSC ইংরেজি ২য় পত্র — ব্যাকরণ (মানক) — শিক্ষক-যাচাই বাকি';
const ENGLISH_WRITING_SOURCE =
  'HSC ইংরেজি ১ম ও ২য় পত্র — লিখন অংশ (মানক) — শিক্ষক-যাচাই বাকি';
const GK_SOURCE = 'ভর্তি-পরীক্ষার সাধারণ জ্ঞান — মানক ডোমেইন, শিক্ষক-যাচাই বাকি';

function chapter(
  id: string,
  subjectId: string,
  slug: string,
  nameBn: string,
  nameEn: string,
  order: number,
  syllabusSource: string,
): NuSyllabusChapterDoc {
  return {
    id,
    subjectId,
    slug,
    nameBn,
    nameEn,
    order,
    syllabusSource,
    syllabusVerified: false,
    status: DRAFT,
    circularVersion: NU_CIRCULAR_VERSION,
    createdBy: CREATED_BY,
  };
}

export function nuSyllabusChapters(): NuSyllabusChapterDoc[] {
  return [
    chapter('nu-ch-bangla-prose', 'nu-sub-bangla', 'prose', 'গদ্য (সাহিত্যপাঠ)', 'Prose — Sahityapath', 1, BANGLA_PROSE_SOURCE),
    chapter('nu-ch-bangla-poetry', 'nu-sub-bangla', 'poetry', 'পদ্য (সাহিত্যপাঠ)', 'Poetry — Sahityapath', 2, BANGLA_POETRY_SOURCE),
    chapter('nu-ch-bangla-companion', 'nu-sub-bangla', 'companion', 'সহপাঠ (উপন্যাস ও নাটক)', 'Supplementary Reading', 3, BANGLA_COMPANION_SOURCE),
    chapter('nu-ch-bangla-grammar', 'nu-sub-bangla', 'grammar', 'ব্যাকরণ ও নির্মিতি', 'Grammar & Composition', 4, BANGLA_GRAMMAR_SOURCE),
    chapter('nu-ch-english-reading', 'nu-sub-english', 'reading', 'Reading — English for Today', 'Reading — English for Today', 1, ENGLISH_READING_SOURCE),
    chapter('nu-ch-english-grammar', 'nu-sub-english', 'grammar', 'Grammar', 'Grammar', 2, ENGLISH_GRAMMAR_SOURCE),
    chapter('nu-ch-english-writing', 'nu-sub-english', 'writing', 'Writing', 'Writing', 3, ENGLISH_WRITING_SOURCE),
    chapter('nu-ch-gk-bangladesh', 'nu-sub-gk', 'bangladesh', 'বাংলাদেশ বিষয়াবলি', 'Bangladesh Affairs', 1, GK_SOURCE),
    chapter('nu-ch-gk-international', 'nu-sub-gk', 'international', 'আন্তর্জাতিক বিষয়াবলি', 'International Affairs', 2, GK_SOURCE),
    chapter('nu-ch-gk-current', 'nu-sub-gk', 'current', 'সাম্প্রতিক ঘটনা', 'Current Affairs', 3, GK_SOURCE),
    chapter('nu-ch-gk-science', 'nu-sub-gk', 'science-tech', 'বিজ্ঞান ও প্রযুক্তি', 'Science & Technology', 4, GK_SOURCE),
  ];
}

// ---------- topics ----------

/** Compact topic rows: [slug, nameBn, detailBn]. The builder fills
 * in ids, parents, order, source and the draft flags. */
type TopicRow = [string, string, string];

const BANGLA_PROSE_TOPICS: TopicRow[] = [
  ['bangalar-nobbo-lekhok', 'বাঙ্গালার নব্য লেখকদিগের প্রতি নিবেদন', 'বঙ্কিমচন্দ্র চট্টোপাধ্যায়'],
  ['oporichita', 'অপরিচিতা', 'রবীন্দ্রনাথ ঠাকুর'],
  ['bilashi', 'বিলাসী', 'শরৎচন্দ্র চট্টোপাধ্যায়'],
  ['ordhangi', 'অর্ধাঙ্গী', 'বেগম রোকেয়া সাখাওয়াত হোসেন'],
  ['gontobbo-kabul', 'গন্তব্য কাবুল', 'সৈয়দ মুজতবা আলী'],
  ['jouboner-gaan', 'যৌবনের গান', 'কাজী নজরুল ইসলাম'],
  ['jibon-o-brikkho', 'জীবন ও বৃক্ষ', 'মোতাহের হোসেন চৌধুরী'],
  ['mashi-pishi', 'মাসি-পিসি', 'মানিক বন্দ্যোপাধ্যায়'],
  ['sahitye-khela', 'সাহিত্যে খেলা', 'প্রমথ চৌধুরী'],
  ['rainkot', 'রেইনকোট', 'আখতারুজ্জামান ইলিয়াস'],
  ['kopildas-murmur-sesh-kaj', 'কপিলদাস মুর্মুর শেষ কাজ', 'শওকত আলী'],
  ['necklace', 'নেকলেস', 'গী দ্য মোপাসাঁ (অনুবাদ: পূর্ণেন্দু দস্তিদার)'],
];

const BANGLA_POETRY_TOPICS: TopicRow[] = [
  ['bibhishoner-proti-meghnad', 'বিভীষণের প্রতি মেঘনাদ', 'মাইকেল মধুসূদন দত্ত'],
  ['sonar-tori', 'সোনার তরী', 'রবীন্দ্রনাথ ঠাকুর'],
  ['bidrohi', 'বিদ্রোহী', 'কাজী নজরুল ইসলাম'],
  ['protidan', 'প্রতিদান', 'জসীমউদ্দীন'],
  ['suchetona', 'সুচেতনা', 'জীবনানন্দ দাশ'],
  ['taharei-pore-mone', 'তাহারেই পড়ে মনে', 'সুফিয়া কামাল'],
  ['podma', 'পদ্মা', 'ফররুখ আহমদ'],
  ['atharo-bochhor-boyos', 'আঠারো বছর বয়স', 'সুকান্ত ভট্টাচার্য'],
  ['february-1969', 'ফেব্রুয়ারি ১৯৬৯', 'শামসুর রাহমান'],
  ['ami-kingbodontir-kotha-bolchhi', 'আমি কিংবদন্তির কথা বলছি', 'আবু জাফর ওবায়দুল্লাহ'],
  ['ritu-bornon', 'ঋতু বর্ণন', 'আলাওল'],
  ['prottabortoner-lojja', 'প্রত্যাবর্তনের লজ্জা', 'আল মাহমুদ'],
];

const BANGLA_COMPANION_TOPICS: TopicRow[] = [
  ['lalsalu', 'লালসালু (উপন্যাস)', 'সৈয়দ ওয়ালীউল্লাহ'],
  ['sirajuddaula', 'সিরাজউদ্দৌলা (নাটক)', 'সিকান্দার আবু জাফর'],
];

const BANGLA_GRAMMAR_TOPICS: TopicRow[] = [
  ['dhoni-o-borno', 'ধ্বনি ও বর্ণ', 'বাংলা ২য় পত্র — ব্যাকরণ'],
  ['shobdo-o-pod', 'শব্দ ও পদ', 'বাংলা ২য় পত্র — ব্যাকরণ'],
  ['bakyo-o-karok', 'বাক্য ও কারক', 'বাংলা ২য় পত্র — ব্যাকরণ'],
  ['somas-o-sondhi', 'সমাস ও সন্ধি', 'বাংলা ২য় পত্র — ব্যাকরণ'],
  ['prottoy-o-uposorgo', 'প্রত্যয় ও উপসর্গ', 'বাংলা ২য় পত্র — ব্যাকরণ'],
  ['bagdhara-o-probad', 'বাগধারা ও প্রবাদ-প্রবচন', 'বাংলা ২য় পত্র — ব্যাকরণ'],
  ['anuchched-o-rochona', 'অনুচ্ছেদ ও রচনা', 'বাংলা ২য় পত্র — নির্মিতি'],
  ['potro-o-abedonpotro', 'পত্র ও আবেদনপত্র', 'বাংলা ২য় পত্র — নির্মিতি'],
];

const ENGLISH_READING_TOPICS: TopicRow[] = [
  ['eft-unit-01', 'People or Institutions Making History', 'ইতিহাস গড়া মানুষ ও প্রতিষ্ঠান'],
  ['eft-unit-02', 'Traffic Education', 'ট্রাফিক শিক্ষা'],
  ['eft-unit-03', 'Food Adulteration', 'খাদ্যে ভেজাল'],
  ['eft-unit-04', 'Human Relationships', 'মানবিক সম্পর্ক'],
  ['eft-unit-05', 'Adolescence', 'বয়ঃসন্ধি'],
  ['eft-unit-06', 'Path to Higher Education', 'উচ্চশিক্ষার পথ'],
  ['eft-unit-07', 'Human Rights', 'মানবাধিকার'],
  ['eft-unit-08', 'Environment and Nature', 'পরিবেশ ও প্রকৃতি'],
  ['eft-unit-09', 'Myths and Literature', 'পুরাণ ও সাহিত্য'],
  ['eft-unit-10', 'Dreams', 'স্বপ্ন'],
  ['eft-unit-11', 'Diaspora', 'প্রবাসী জীবন'],
  ['eft-unit-12', 'Peace and Conflict', 'শান্তি ও সংঘাত'],
  ['eft-unit-13', 'Greatest Scientific Achievements', 'বিজ্ঞানের শ্রেষ্ঠ অর্জন'],
  ['eft-unit-14', 'Art and Music', 'শিল্প ও সংগীত'],
  ['eft-unit-15', 'Tours and Travels', 'ভ্রমণ'],
];

const ENGLISH_GRAMMAR_TOPICS: TopicRow[] = [
  ['tense', 'Tense', 'কাল — HSC ইংরেজি ২য় পত্র'],
  ['articles-prepositions', 'Articles & Prepositions', 'আর্টিকেল ও প্রিপজিশন'],
  ['voice', 'Voice', 'বাচ্য'],
  ['narration', 'Narration', 'উক্তি'],
  ['transformation', 'Transformation of Sentences', 'বাক্য-রূপান্তর'],
  ['right-forms-of-verbs', 'Right Forms of Verbs', 'ক্রিয়ার সঠিক রূপ'],
  ['synonyms-antonyms', 'Synonyms & Antonyms', 'সমার্থক ও বিপরীতার্থক শব্দ'],
  ['connectors', 'Connectors & Linking Words', 'সংযোজক'],
];

const ENGLISH_WRITING_TOPICS: TopicRow[] = [
  ['paragraph', 'Paragraph Writing', 'অনুচ্ছেদ-লিখন'],
  ['letter-email', 'Letter & Email Writing', 'চিঠি ও ইমেইল-লিখন'],
  ['completing-story', 'Completing Story', 'গল্প-সমাপ্তকরণ'],
  ['graph-chart', 'Graph & Chart Description', 'গ্রাফ ও চার্ট-বর্ণনা'],
  ['summary', 'Summary Writing', 'সারাংশ-লিখন'],
  ['dialogue', 'Dialogue Writing', 'সংলাপ-লিখন'],
];

const GK_BANGLADESH_TOPICS: TopicRow[] = [
  ['muktijuddho', 'মুক্তিযুদ্ধ ও স্বাধীনতা', '১৯৭১ — মুক্তিযুদ্ধ, স্বাধীনতা ঘোষণা, বিজয়'],
  ['songbidhan-sorkar', 'সংবিধান ও সরকার', 'সংবিধান, সরকার-ব্যবস্থা, সংসদ'],
  ['bhugol-nodi', 'ভূগোল ও নদ-নদী', 'বাংলাদেশের ভূগোল, নদ-নদী, জলবায়ু'],
  ['orthoniti-bank', 'অর্থনীতি ও ব্যাংক', 'অর্থনীতি, ব্যাংক, মুদ্রা, বাজেট'],
  ['songskriti-oitijhyo', 'সংস্কৃতি ও ঐতিহ্য', 'সংস্কৃতি, ঐতিহ্য, লোকজ ধারা'],
  ['jatiyo-dibos-protik', 'জাতীয় দিবস ও প্রতীক', 'জাতীয় দিবস, জাতীয় প্রতীক'],
];

const GK_INTERNATIONAL_TOPICS: TopicRow[] = [
  ['antorjatik-songstha', 'আন্তর্জাতিক সংস্থা', 'জাতিসংঘ ও অন্যান্য সংস্থা'],
  ['bishwo-itihash', 'বিশ্ব-ইতিহাস', 'বিশ্বের প্রধান ঐতিহাসিক ঘটনা'],
  ['bishwo-bhugol', 'বিশ্ব-ভূগোল', 'মহাদেশ, দেশ, রাজধানী, বিখ্যাত স্থান'],
  ['antorjatik-somporko', 'আন্তর্জাতিক সম্পর্ক', 'দেশের মধ্যে সম্পর্ক, চুক্তি'],
  ['puroskar-sommanona', 'পুরস্কার ও সম্মাননা', 'নোবেলসহ আন্তর্জাতিক পুরস্কার'],
];

const GK_CURRENT_TOPICS: TopicRow[] = [
  ['samprotik-bangladesh', 'সাম্প্রতিক বাংলাদেশ', 'সাম্প্রতিক ঘটনা — বাংলাদেশ'],
  ['samprotik-bishwo', 'সাম্প্রতিক বিশ্ব', 'সাম্প্রতিক ঘটনা — বিশ্ব'],
  ['kheladhula', 'খেলাধুলা', 'ক্রিকেট, ফুটবলসহ খেলাধুলা'],
];

const GK_SCIENCE_TOPICS: TopicRow[] = [
  ['sadharon-biggan', 'সাধারণ বিজ্ঞান', 'পদার্থ, রসায়ন, জীববিজ্ঞান — সাধারণ ধারণা'],
  ['tothyo-projukti', 'তথ্য-প্রযুক্তি', 'কম্পিউটার, ইন্টারনেট, কৃত্রিম বুদ্ধিমত্তা'],
  ['poribesh-jolobayu', 'পরিবেশ ও জলবায়ু', 'পরিবেশ, জলবায়ু-পরিবর্তন'],
];

interface ChapterTopicSet {
  chapterId: string;
  subjectId: string;
  source: string;
  rows: TopicRow[];
}

const TOPIC_SETS: ChapterTopicSet[] = [
  { chapterId: 'nu-ch-bangla-prose', subjectId: 'nu-sub-bangla', source: BANGLA_PROSE_SOURCE, rows: BANGLA_PROSE_TOPICS },
  { chapterId: 'nu-ch-bangla-poetry', subjectId: 'nu-sub-bangla', source: BANGLA_POETRY_SOURCE, rows: BANGLA_POETRY_TOPICS },
  { chapterId: 'nu-ch-bangla-companion', subjectId: 'nu-sub-bangla', source: BANGLA_COMPANION_SOURCE, rows: BANGLA_COMPANION_TOPICS },
  { chapterId: 'nu-ch-bangla-grammar', subjectId: 'nu-sub-bangla', source: BANGLA_GRAMMAR_SOURCE, rows: BANGLA_GRAMMAR_TOPICS },
  { chapterId: 'nu-ch-english-reading', subjectId: 'nu-sub-english', source: ENGLISH_READING_SOURCE, rows: ENGLISH_READING_TOPICS },
  { chapterId: 'nu-ch-english-grammar', subjectId: 'nu-sub-english', source: ENGLISH_GRAMMAR_SOURCE, rows: ENGLISH_GRAMMAR_TOPICS },
  { chapterId: 'nu-ch-english-writing', subjectId: 'nu-sub-english', source: ENGLISH_WRITING_SOURCE, rows: ENGLISH_WRITING_TOPICS },
  { chapterId: 'nu-ch-gk-bangladesh', subjectId: 'nu-sub-gk', source: GK_SOURCE, rows: GK_BANGLADESH_TOPICS },
  { chapterId: 'nu-ch-gk-international', subjectId: 'nu-sub-gk', source: GK_SOURCE, rows: GK_INTERNATIONAL_TOPICS },
  { chapterId: 'nu-ch-gk-current', subjectId: 'nu-sub-gk', source: GK_SOURCE, rows: GK_CURRENT_TOPICS },
  { chapterId: 'nu-ch-gk-science', subjectId: 'nu-sub-gk', source: GK_SOURCE, rows: GK_SCIENCE_TOPICS },
];

export function nuSyllabusTopics(): NuSyllabusTopicDoc[] {
  const out: NuSyllabusTopicDoc[] = [];
  for (const set of TOPIC_SETS) {
    set.rows.forEach(([slug, nameBn, detailBn], i) => {
      out.push({
        id: `nu-tp-${set.chapterId.replace('nu-ch-', '')}-${String(i + 1).padStart(2, '0')}`,
        subjectId: set.subjectId,
        chapterId: set.chapterId,
        slug,
        nameBn,
        detailBn,
        order: i + 1,
        syllabusSource: set.source,
        syllabusVerified: false,
        status: DRAFT,
        circularVersion: NU_CIRCULAR_VERSION,
        createdBy: CREATED_BY,
      });
    });
  }
  return out;
}

/** One lesson stub per topic — the lesson body is an honest
 * "being prepared" note until a verified teacher writes the lesson.
 * No lesson content is fabricated. */
export const NU_LESSON_STUB_BODY_BN =
  'এই টপিকের লেসন তৈরি হচ্ছে — শিক্ষক যাচাইয়ের পরে এখানে সংক্ষিপ্ত নোট ও ব্যাখ্যা প্রকাশিত হবে।';

export function nuSyllabusLessons(): NuSyllabusLessonDoc[] {
  return nuSyllabusTopics().map((t) => ({
    id: `nu-ls-${t.id.replace('nu-tp-', '')}-01`,
    subjectId: t.subjectId,
    chapterId: t.chapterId,
    topicId: t.id,
    slug: `${t.slug}-lesson-1`,
    order: 1,
    titleBn: `${t.nameBn} — পরিচিতি`,
    bodyBn: NU_LESSON_STUB_BODY_BN,
    status: DRAFT,
    circularVersion: NU_CIRCULAR_VERSION,
    createdBy: CREATED_BY,
  }));
}

// ---------- lookups (code-backed read path) ----------

export function nuSyllabusSubjectsForGroup(group: NuGroupSlug): NuSyllabusSubjectDoc[] {
  return nuSyllabusSubjects().filter((s) => s.groupIds.includes(group));
}

export function nuSyllabusSubjectBySlug(slug: string): NuSyllabusSubjectDoc | undefined {
  return nuSyllabusSubjects().find((s) => s.slug === slug);
}

export function nuSyllabusChaptersForSubject(subjectId: string): NuSyllabusChapterDoc[] {
  return nuSyllabusChapters()
    .filter((c) => c.subjectId === subjectId)
    .sort((a, b) => a.order - b.order);
}

export function nuSyllabusTopicsForChapter(chapterId: string): NuSyllabusTopicDoc[] {
  return nuSyllabusTopics()
    .filter((t) => t.chapterId === chapterId)
    .sort((a, b) => a.order - b.order);
}

export function nuSyllabusTopicBySlug(subjectId: string, slug: string): NuSyllabusTopicDoc | undefined {
  return nuSyllabusTopics().find((t) => t.subjectId === subjectId && t.slug === slug);
}

export function nuSyllabusLessonForTopic(topicId: string): NuSyllabusLessonDoc | undefined {
  return nuSyllabusLessons().find((l) => l.topicId === topicId);
}

/** Route helpers — subject pages live under the group so the
 * breadcrumb (hub ← group ← subject ← topic) always works. */
export function nuSubjectRoute(group: NuGroupSlug, subjectSlug: string): string {
  return `/admissions/national-university/${group}/subjects/${subjectSlug}`;
}

export function nuTopicRoute(group: NuGroupSlug, subjectSlug: string, topicSlug: string): string {
  return `/admissions/national-university/${group}/subjects/${subjectSlug}/${topicSlug}`;
}

/** The draft banner shown on every page that renders this structure
 * while `syllabusVerified` is false. */
export const NU_SYLLABUS_DRAFT_BANNER_BN =
  'এই সিলেবাস-কাঠামো খসড়া — HSC পাঠ্যবই থেকে নেওয়া, শিক্ষক যাচাই চলছে; তালিকা পরিবর্তন হতে পারে। এটি NU-র অফিসিয়াল সিলেবাস নয়।';

// ---------- validators (mirrors of firestore.rules) ----------

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function baseProblems(d: Record<string, unknown>): string[] {
  const problems: string[] = [];
  if (!isNonEmptyString(d.id)) problems.push('id must be a non-empty string');
  if (!isNonEmptyString(d.slug)) problems.push('slug must be a non-empty string');
  if (!isNonEmptyString(d.nameBn)) problems.push('nameBn must be a non-empty string');
  if (typeof d.order !== 'number' || !Number.isInteger(d.order) || d.order < 1) {
    problems.push('order must be an integer >= 1');
  }
  if (!isNonEmptyString(d.syllabusSource)) problems.push('syllabusSource must be a non-empty string');
  if (d.status !== 'draft' && d.status !== 'published') {
    problems.push(`status must be draft/published, got ${String(d.status)}`);
  }
  if (!isNonEmptyString(d.circularVersion)) problems.push('circularVersion must be a non-empty string');
  if (!isNonEmptyString(d.createdBy)) problems.push('createdBy must be a non-empty string');
  return problems;
}

export function validateNuSyllabusSubjectDoc(doc: unknown): string[] {
  if (typeof doc !== 'object' || doc === null) return ['subject doc is not an object'];
  const d = doc as Record<string, unknown>;
  // Subjects carry no `order` field, so they do not use baseProblems().
  const problems: string[] = [];
  if (!isNonEmptyString(d.id)) problems.push('id must be a non-empty string');
  if (!isNonEmptyString(d.slug)) problems.push('slug must be a non-empty string');
  if (!isNonEmptyString(d.nameBn)) problems.push('nameBn must be a non-empty string');
  if (!isNonEmptyString(d.syllabusSource)) problems.push('syllabusSource must be a non-empty string');
  if (d.status !== 'draft' && d.status !== 'published') {
    problems.push(`status must be draft/published, got ${String(d.status)}`);
  }
  if (!isNonEmptyString(d.circularVersion)) problems.push('circularVersion must be a non-empty string');
  if (!isNonEmptyString(d.createdBy)) problems.push('createdBy must be a non-empty string');
  if (!Array.isArray(d.groupIds) || d.groupIds.length < 1 || d.groupIds.length > 3) {
    problems.push('groupIds must be a list of 1-3 group slugs');
  } else if (d.groupIds.some((g) => !NU_GROUP_SLUGS.includes(g as NuGroupSlug))) {
    problems.push('groupIds must contain only humanities/science/business');
  }
  if ('order' in d) problems.push('subjects carry no order field');
  if (typeof d.marks !== 'number' || !Number.isInteger(d.marks)) problems.push('marks must be an integer');
  if (typeof d.isGroupBlock !== 'boolean') problems.push('isGroupBlock must be a boolean');
  if (d.isGroupBlock === true && d.marks !== 40) problems.push('group-block subjects must carry 40 marks');
  if (d.isGroupBlock === false && d.marks !== 20) problems.push('common subjects must carry 20 marks');
  if (d.isGroupBlock === true && !String(d.slug).startsWith('group-')) {
    problems.push('group-block slugs must start with group-');
  }
  if (d.isGroupBlock === false && !NU_SYLLABUS_COMMON_SLUGS.includes(d.slug as NuSyllabusSubjectSlug)) {
    problems.push(`common subject slug must be bangla/english/general-knowledge, got ${String(d.slug)}`);
  }
  return problems;
}

export function validateNuSyllabusChapterDoc(doc: unknown): string[] {
  if (typeof doc !== 'object' || doc === null) return ['chapter doc is not an object'];
  const d = doc as Record<string, unknown>;
  const problems = baseProblems(d);
  if (!isNonEmptyString(d.subjectId)) problems.push('subjectId must be a non-empty string');
  if (typeof d.syllabusVerified !== 'boolean') problems.push('syllabusVerified must be a boolean');
  return problems;
}

export function validateNuSyllabusTopicDoc(doc: unknown): string[] {
  if (typeof doc !== 'object' || doc === null) return ['topic doc is not an object'];
  const d = doc as Record<string, unknown>;
  const problems = baseProblems(d);
  if (!isNonEmptyString(d.subjectId)) problems.push('subjectId must be a non-empty string');
  if (!isNonEmptyString(d.chapterId)) problems.push('chapterId must be a non-empty string');
  if (!isNonEmptyString(d.detailBn)) problems.push('detailBn must be a non-empty string');
  if (typeof d.syllabusVerified !== 'boolean') problems.push('syllabusVerified must be a boolean');
  return problems;
}

export function validateNuSyllabusLessonDoc(doc: unknown): string[] {
  if (typeof doc !== 'object' || doc === null) return ['lesson doc is not an object'];
  const d = doc as Record<string, unknown>;
  const problems: string[] = [];
  if (!isNonEmptyString(d.id)) problems.push('id must be a non-empty string');
  if (!isNonEmptyString(d.slug)) problems.push('slug must be a non-empty string');
  if (!isNonEmptyString(d.titleBn)) problems.push('titleBn must be a non-empty string');
  if (!isNonEmptyString(d.bodyBn)) problems.push('bodyBn must be a non-empty string');
  if (typeof d.order !== 'number' || !Number.isInteger(d.order) || d.order < 1) {
    problems.push('order must be an integer >= 1');
  }
  if (!isNonEmptyString(d.subjectId)) problems.push('subjectId must be a non-empty string');
  if (!isNonEmptyString(d.chapterId)) problems.push('chapterId must be a non-empty string');
  if (!isNonEmptyString(d.topicId)) problems.push('topicId must be a non-empty string');
  if (d.status !== 'draft' && d.status !== 'published') {
    problems.push(`status must be draft/published, got ${String(d.status)}`);
  }
  if (!isNonEmptyString(d.circularVersion)) problems.push('circularVersion must be a non-empty string');
  if (!isNonEmptyString(d.createdBy)) problems.push('createdBy must be a non-empty string');
  return problems;
}

/** Cross-document checks: parent references, block-subject isolation,
 * order/slug uniqueness. Returns every problem — empty means valid. */
export function validateNuSyllabusSet(): string[] {
  const problems: string[] = [];
  const subjects = nuSyllabusSubjects();
  const chapters = nuSyllabusChapters();
  const topics = nuSyllabusTopics();
  const lessons = nuSyllabusLessons();
  const subjectIds = new Set(subjects.map((s) => s.id));
  const chapterIds = new Set(chapters.map((c) => c.id));
  const topicIds = new Set(topics.map((t) => t.id));

  for (const s of subjects) problems.push(...validateNuSyllabusSubjectDoc(s).map((p) => `subject/${s.id}: ${p}`));
  for (const c of chapters) problems.push(...validateNuSyllabusChapterDoc(c).map((p) => `chapter/${c.id}: ${p}`));
  for (const t of topics) problems.push(...validateNuSyllabusTopicDoc(t).map((p) => `topic/${t.id}: ${p}`));
  for (const l of lessons) problems.push(...validateNuSyllabusLessonDoc(l).map((p) => `lesson/${l.id}: ${p}`));

  const blockIds = new Set(subjects.filter((s) => s.isGroupBlock).map((s) => s.id));
  for (const c of chapters) {
    if (!subjectIds.has(c.subjectId)) problems.push(`chapter/${c.id}: subjectId ${c.subjectId} does not exist`);
    if (blockIds.has(c.subjectId)) problems.push(`chapter/${c.id}: group-block subject ${c.subjectId} must have no chapters`);
  }
  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  for (const t of topics) {
    if (!subjectIds.has(t.subjectId)) problems.push(`topic/${t.id}: subjectId ${t.subjectId} does not exist`);
    if (!chapterIds.has(t.chapterId)) problems.push(`topic/${t.id}: chapterId ${t.chapterId} does not exist`);
    const ch = chapterById.get(t.chapterId);
    if (ch && ch.subjectId !== t.subjectId) problems.push(`topic/${t.id}: chapter subject ${ch.subjectId} != topic subject ${t.subjectId}`);
  }
  for (const l of lessons) {
    if (!subjectIds.has(l.subjectId)) problems.push(`lesson/${l.id}: subjectId ${l.subjectId} does not exist`);
    if (!chapterIds.has(l.chapterId)) problems.push(`lesson/${l.id}: chapterId ${l.chapterId} does not exist`);
    if (!topicIds.has(l.topicId)) problems.push(`lesson/${l.id}: topicId ${l.topicId} does not exist`);
  }
  // Marks sum per group: 20 + 20 + 20 + 40 = 100 (the verified pattern).
  for (const g of NU_GROUP_SLUGS) {
    const sum = nuSyllabusSubjectsForGroup(g).reduce((acc, s) => acc + s.marks, 0);
    if (sum !== 100) problems.push(`group ${g}: subject marks sum ${sum}, expected 100`);
  }
  // Orders unique within each parent; slugs unique per collection.
  const checkUnique = (items: { id: string; order: number; slug: string }[], parent: string, label: string) => {
    const orders = new Map<string, number>();
    const slugs = new Set<string>();
    for (const it of items) {
      const key = `${parent}:${it.order}`;
      if (orders.has(key)) problems.push(`${label}/${it.id}: duplicate order ${it.order} under ${parent}`);
      orders.set(key, 1);
      if (slugs.has(it.slug)) problems.push(`${label}/${it.id}: duplicate slug ${it.slug}`);
      slugs.add(it.slug);
    }
  };
  for (const s of subjects) checkUnique(chapters.filter((c) => c.subjectId === s.id), s.id, 'chapter');
  for (const c of chapters) checkUnique(topics.filter((t) => t.chapterId === c.id), c.id, 'topic');
  for (const t of topics) checkUnique(lessons.filter((l) => l.topicId === t.id), t.id, 'lesson');
  // Every topic has exactly one lesson (the stub).
  for (const t of topics) {
    const n = lessons.filter((l) => l.topicId === t.id).length;
    if (n !== 1) problems.push(`topic/${t.id}: expected exactly 1 lesson, found ${n}`);
  }
  return problems;
}

// ---------- seed-doc set (for the admin flow, lib/nuAdmin.ts) ----------

export type NuSyllabusCollection = 'nuSubjects' | 'nuChapters' | 'nuTopics' | 'nuLessons';

export interface NuSyllabusSeedDoc {
  collection: NuSyllabusCollection;
  docId: string;
  payload: Record<string, unknown>;
}

export function nuSyllabusSeedDocs(): NuSyllabusSeedDoc[] {
  const docs: NuSyllabusSeedDoc[] = [];
  for (const s of nuSyllabusSubjects()) {
    docs.push({ collection: 'nuSubjects', docId: s.id, payload: s as unknown as Record<string, unknown> });
  }
  for (const c of nuSyllabusChapters()) {
    docs.push({ collection: 'nuChapters', docId: c.id, payload: c as unknown as Record<string, unknown> });
  }
  for (const t of nuSyllabusTopics()) {
    docs.push({ collection: 'nuTopics', docId: t.id, payload: t as unknown as Record<string, unknown> });
  }
  for (const l of nuSyllabusLessons()) {
    docs.push({ collection: 'nuLessons', docId: l.id, payload: l as unknown as Record<string, unknown> });
  }
  return docs;
}

/** All syllabus copy in one place for the prohibited-wording test
 * (same pattern as nuStructure.ts `nuAllCopyStrings`). */
export function nuSyllabusAllCopyStrings(): string[] {
  const out: string[] = [NU_SYLLABUS_DRAFT_BANNER_BN, NU_LESSON_STUB_BODY_BN];
  for (const s of nuSyllabusSubjects()) out.push(s.nameBn, s.nameEn, s.syllabusSource);
  for (const c of nuSyllabusChapters()) out.push(c.nameBn, c.nameEn, c.syllabusSource);
  for (const t of nuSyllabusTopics()) out.push(t.nameBn, t.detailBn, t.syllabusSource);
  for (const l of nuSyllabusLessons()) out.push(l.titleBn, l.bodyBn);
  return out;
}
