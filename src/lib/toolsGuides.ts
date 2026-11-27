// Eduvelto — Finance & Health tool GUIDES (26 Nov 2026, 100-Tools Project).
//
// The heavy guide content for the Finance (slugs 21-30) and Health
// (slugs 31-40) tools: a 300-400 word guide in English and a 300-400
// word guide in Bangla for each tool. Second batch (27 Nov 2026):
// 3 more Finance/Health guides (tip-calculator,
// bkash-nagad-calculator, ovulation-calculator). Imported ONLY by the lazy
// ToolsDetailPage — never by seo.ts — so this prose downloads only
// when a tool page is visited, not on first paint. This mirrors the
// publicGuideMeta / publicGuideBodies split used for public guides.
//
// Content rules: standard formulas only, worked numeric examples,
// no invented facts, no superlatives, no hardcoded changing rates
// or live prices — where a rate or price varies, the user enters it.
// Health guides carry a short "not medical advice" disclaimer.

export interface ToolGuide {
  slug: string;
  guideBn: string;
  guideEn: string;
}

// Structured guides (27 Nov 2026, AdSense guides): the top-20 tools
// get a full guide — intro, numbered how-to, formula/rule, one worked
// example, 3-5 FAQs — in both languages. Each language is 150-250
// words (300-500 combined). Rendered by ToolGuide.tsx; ToolsDetailPage
// prefers a structured guide and falls back to the prose guide above
// for tools that only have one. Facts come from each tool's own engine
// code (src/lib/tools/); where a rate varies, the guide says so instead
// of fixing a number.
export interface ToolGuideFaq {
  q: string;
  a: string;
}

export interface ToolGuideContent {
  title: string;
  intro: string;
  howTo: string[];
  formula: string;
  example: string;
  faq: ToolGuideFaq[];
}

export interface ToolGuideSections {
  bn: ToolGuideContent;
  en: ToolGuideContent;
}

export const TOOL_GUIDE_SECTIONS: Record<string, ToolGuideSections> = {
  'bmi-calculator': {
    bn:     {
      title: `বিএমআই ক্যালকুলেটর`,
      intro: `বিএমআই ক্যালকুলেটর আপনার ওজন ও উচ্চতা দিয়ে শরীরের ভর সূচক (BMI) হিসাব করে। এটি দেখায় আপনার ওজন আপনার উচ্চতার তুলনায় কম, স্বাভাবিক, বেশি, নাকি স্থূলতার পর্যায়ে আছে। ফলাফল WHO শ্রেণিবিভাগ অনুযায়ী দেওয়া হয়। এই টুলটি ছাত্র, অভিভাবক ও স্বাস্থ্য সচেতন যে কারও জন্য সহজে ব্যবহারযোগ্য।`,
      howTo: [
        `ওজনের ঘরে আপনার ওজন কেজিতে লিখুন।`,
        `উচ্চতার ঘরে আপনার উচ্চতা সেন্টিমিটারে লিখুন।`,
        `চাইলে লক্ষ্য BMI-এর ঘরে একটি সংখ্যা লিখুন, তাহলে ওই BMI-তে পৌঁছাতে কত ওজন দরকার তা দেখাবে।`,
        `ফলাফলে আপনার BMI, WHO শ্রেণি ও স্বাস্থ্যকর ওজনের সীমা দেখুন।`,
      ],
      formula: `সূত্র: BMI = ওজন (কেজি) ÷ উচ্চতা (মিটার)²। WHO শ্রেণি: ১৮.৫-এর নিচে কম ওজন, ১৮.৫–২৪.৯ স্বাভাবিক, ২৫–২৯.৯ বেশি ওজন, ৩০ বা বেশি স্থূলতা। ফলাফল দুই দশমিক পর্যন্ত দেখানো হয়।`,
      example: `উদাহরণ: ওজন ৭০ কেজি ও উচ্চতা ১৭৫ সেমি হলে উচ্চতা মিটারে ১.৭৫। হিসাব: 70 ÷ (1.75 × 1.75) = 22.86। এটি স্বাভাবিক শ্রেণিতে পড়ে। এই উচ্চতায় স্বাস্থ্যকর ওজন ৫৬.৭–৭৬.৩ কেজি।`,
      faq: [
        { q: `BMI কি চিকিৎসকের পরামর্শের বদলে ব্যবহার করা যায়?`, a: `না, BMI শুধু একটি সাধারণ নির্দেশিকা। স্বাস্থ্য নিয়ে কোনো সিদ্ধান্ত নেওয়ার আগে চিকিৎসকের সঙ্গে কথা বলুন।` },
        { q: `উচ্চতা কি সেন্টিমিটারেই দিতে হবে?`, a: `হ্যাঁ, এই টুলে উচ্চতা সেন্টিমিটারে দিতে হয়। টুলটি নিজেই সেটিকে মিটারে বদলে হিসাব করে।` },
        { q: `লক্ষ্য BMI-এর ঘরটি কী কাজে লাগে?`, a: `আপনি যে BMI-তে পৌঁছাতে চান সেটি লিখলে টুলটি বলে দেয় আপনার উচ্চতায় সেই BMI-র জন্য কত কেজি ওজন দরকার।` },
        { q: `আমার তথ্য কি কোথাও পাঠানো হয়?`, a: `না, সব হিসাব আপনার ব্রাউজারেই হয়। ওজন বা উচ্চতার কোনো তথ্য সার্ভারে পাঠানো হয় না।` },
      ],
    },
    en:     {
      title: `BMI Calculator`,
      intro: `The BMI Calculator works out your body mass index (BMI) from your weight and height. It shows whether your weight is underweight, normal, overweight or obese for your height, following the WHO classification. Students, parents and anyone watching their health can use it easily.`,
      howTo: [
        `Enter your weight in kilograms.`,
        `Enter your height in centimetres.`,
        `Optionally, enter a target BMI to see the weight you would need for it.`,
        `Read your BMI, WHO category and healthy weight range.`,
      ],
      formula: `Formula: BMI = weight (kg) ÷ height (m)². WHO ranges: below 18.5 underweight, 18.5–24.9 normal, 25–29.9 overweight, 30 or above obese. The result is shown to two decimal places.`,
      example: `Example: a weight of 70 kg and a height of 175 cm (1.75 m). Calculation: 70 ÷ (1.75 × 1.75) = 22.86, in the normal range. For this height, the healthy weight range is 56.7–76.3 kg.`,
      faq: [
        { q: `Can BMI replace a doctor's advice?`, a: `No, BMI is only a general guide. Talk to a doctor before making any health decision based on it.` },
        { q: `Must height be entered in centimetres?`, a: `Yes. Enter height in centimetres; the tool converts it to metres itself.` },
        { q: `What is the target BMI box for?`, a: `Enter the BMI you want to reach, and the tool shows the weight you would need at your height.` },
        { q: `Is my information sent anywhere?`, a: `No. Everything is calculated in your browser, and your weight and height are never sent to a server.` },
      ],
    },
  },
  'bmr-calculator': {
    bn:     {
      title: `বিএমআর ক্যালকুলেটর`,
      intro: `বিএমআর ক্যালকুলেটর হিসাব করে বিশ্রাম অবস্থায় আপনার শরীর এক দিনে কত ক্যালোরি খরচ করে। BMR মানে বেসাল মেটাবলিক রেট। এটি খাবারের পরিমাণ ও ব্যায়ামের পরিকল্পনা করার প্রথম ধাপ। হিসাবটি Mifflin-St Jeor সূত্র (১৯৯০) অনুযায়ী হয়।`,
      howTo: [
        `লিঙ্গের ঘরে পুরুষ বা নারী বেছে নিন।`,
        `ওজনের ঘরে আপনার ওজন কেজিতে লিখুন।`,
        `উচ্চতার ঘরে আপনার উচ্চতা সেন্টিমিটারে লিখুন।`,
        `বয়সের ঘরে আপনার বয়স বছরে লিখুন, তারপর দৈনিক ক্যালোরির ফলাফল দেখুন।`,
      ],
      formula: `সূত্র (Mifflin-St Jeor, 1990): পুরুষ: BMR = 10 × ওজন (কেজি) + 6.25 × উচ্চতা (সেমি) − 5 × বয়স + 5। নারী: একই হিসাবের শেষে − 161। ফলাফল পূর্ণ সংখ্যায় ক্যালোরি/দিনে দেখানো হয়।`,
      example: `উদাহরণ: একজন পুরুষ, ওজন ৭০ কেজি, উচ্চতা ১৭৫ সেমি, বয়স ৩০ বছর। হিসাব: 10 × 70 = 700; 6.25 × 175 = 1093.75; 5 × 30 = 150। BMR = 700 + 1093.75 − 150 + 5 = 1648.75, অর্থাৎ ১৬৪৯ ক্যালোরি/দিন। সপ্তাহে ১১,৫৪৩ ক্যালোরি।`,
      faq: [
        { q: `BMR আর TDEE-এর মধ্যে পার্থক্য কী?`, a: `BMR হলো বিশ্রামে শরীরের খরচ; TDEE হলো কাজ ও ব্যায়ামসহ মোট খরচ। মোট চাহিদা জানতে TDEE ক্যালকুলেটর দেখুন।` },
        { q: `লিঙ্গ কেন ফলাফল বদলে দেয়?`, a: `পুরুষের জন্য শেষে ৫ যোগ হয়, নারীর জন্য ১৬১ বিয়োগ হয়। তাই একই তথ্যেও ফলাফল আলাদা হয়।` },
        { q: `বয়স বাড়লে BMR কি কমে?`, a: `হ্যাঁ, সূত্রে প্রতি বছর বয়সের জন্য ৫ ক্যালোরি কমে। বয়স বাড়লে BMR সাধারণত কিছুটা কমে।` },
        { q: `এই ফলাফল কি চিকিৎসা পরামর্শ?`, a: `না, এটি আনুমানিক হিসাব, চিকিৎসা পরামর্শ নয়। বড় সিদ্ধান্তের আগে বিশেষজ্ঞের সঙ্গে কথা বলুন।` },
      ],
    },
    en:     {
      title: `BMR Calculator`,
      intro: `The BMR Calculator works out how many calories your body uses in a day at rest (basal metabolic rate). It follows the Mifflin-St Jeor equation from 1990.`,
      howTo: [
        `Choose male or female.`,
        `Enter your weight in kilograms.`,
        `Enter your height in centimetres.`,
        `Enter your age in years, then read your daily calorie result.`,
      ],
      formula: `Formula (Mifflin-St Jeor, 1990): men: BMR = 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5. Women: same, but − 161 at the end. The result is a whole number in kcal/day.`,
      example: `Example: a man, 70 kg, 175 cm, aged 30. Calculation: 10 × 70 = 700; 6.25 × 175 = 1093.75; 5 × 30 = 150. So BMR = 700 + 1093.75 − 150 + 5 = 1648.75, rounded to 1649 kcal/day (11,543 per week).`,
      faq: [
        { q: `What is the difference between BMR and TDEE?`, a: `BMR is the at-rest cost; TDEE adds daily activity and exercise. Use the TDEE calculator for your total daily need.` },
        { q: `Why does sex change the result?`, a: `The formula adds 5 for men and subtracts 161 for women, so the same inputs give different results.` },
        { q: `Does BMR fall as you get older?`, a: `Yes, it subtracts 5 kcal per year of age, so BMR usually falls a little with age.` },
        { q: `Is this result medical advice?`, a: `No, it is an estimate, not medical advice. Talk to a specialist before big decisions about food or exercise.` },
      ],
    },
  },
  'grade-analyzer': {
    bn:     {
      title: `গ্রেড বিশ্লেষক`,
      intro: `গ্রেড বিশ্লেষক আপনার পরীক্ষার নম্বর থেকে গ্রেড ও জিপিএ বের করে। এটি বাংলাদেশের SSC ও HSC নম্বর-গ্রেড স্কেল ব্যবহার করে। প্রতিটি বিষয়ের গ্রেড, মোট নম্বর, গড় ও পাস-ফেল একসঙ্গে দেখায়। ছাত্র, শিক্ষক ও অভিভাবকদের জন্য এটি সহজ একটি টুল।`,
      howTo: [
        `নম্বরের ঘরে সব বিষয়ের নম্বর লিখুন, কমা বা নতুন লাইন দিয়ে আলাদা করুন।`,
        `প্রতিটি নম্বর ০ থেকে ১০০-এর মধ্যে হতে হবে।`,
        `ফলাফল নিজে থেকেই দেখাবে, কোনো বোতাম চাপতে হবে না।`,
        `জিপিএ, মোট, গড় ও প্রতিটি বিষয়ের গ্রেডের তালিকা দেখুন।`,
      ],
      formula: `নিয়ম (বাংলাদেশের SSC/HSC স্কেল): ৮০+ = A+ (৫.০), ৭০+ = A (৪.০), ৬০+ = A− (৩.৫), ৫০+ = B (৩.০), ৪০+ = C (২.০), ৩৩+ = D (১.০), ৩৩-এর নিচে F (০)। জিপিএ = গ্রেড পয়েন্টের গড়, দুই দশমিক পর্যন্ত।`,
      example: `উদাহরণ: নম্বর 85, 72, 65। গ্রেড: 85 = A+ (৫.০), 72 = A (৪.০), 65 = A− (৩.৫)। মোট ২২২, গড় ৭৪.০০। জিপিএ = (5.0 + 4.0 + 3.5) ÷ 3 = 4.17। কোনো বিষয়ে F নেই, তাই ফল পাস।`,
      faq: [
        { q: `পাস নম্বর কত?`, a: `এই টুলে পাস নম্বর ৩৩। ৩৩-এর নিচে পেলে বিষয়টিতে F হয়।` },
        { q: `এক বিষয়ে ফেল করলে কি পুরো ফল ফেল হয়?`, a: `হ্যাঁ, কোনো একটি বিষয়ে F থাকলে পুরো ফল ফেল হয়, জিপিএ যতই ভালো হোক।` },
        { q: `১০০-এর বেশি নম্বর দেওয়া যাবে?`, a: `না, প্রতিটি নম্বর ০ থেকে ১০০-এর মধ্যে হতে হবে। এর বাইরের সংখ্যা দিলে টুলটি ভুল বার্তা দেখায়।` },
        { q: `এই জিপিএ কি বোর্ডের অফিসিয়াল জিপিএ?`, a: `এই জিপিএ বিষয়গুলোর গ্রেড পয়েন্টের গড়। বোর্ডের অফিসিয়াল নিয়ম আলাদা হতে পারে, তাই অফিসিয়াল ফলের জন্য বোর্ডের নিয়ম দেখে নিন।` },
      ],
    },
    en:     {
      title: `Grade Analyzer`,
      intro: `The Grade Analyzer turns your exam marks into grades and a GPA, using the Bangladesh SSC and HSC marks-to-grade scale. It shows each subject's grade, the total, the average and pass or fail together.`,
      howTo: [
        `Type all subject marks in the box, separated by commas or new lines.`,
        `Every mark must be between 0 and 100.`,
        `The result appears on its own; no button to press.`,
        `Read the GPA, total, average and each subject's grade.`,
      ],
      formula: `Rule (Bangladesh SSC/HSC scale): 80+ = A+ (5.0), 70+ = A (4.0), 60+ = A− (3.5), 50+ = B (3.0), 40+ = C (2.0), 33+ = D (1.0), below 33 = F (0). GPA = mean grade point, to two decimals.`,
      example: `Example: marks 85, 72, 65. Grades: 85 = A+ (5.0), 72 = A (4.0), 65 = A− (3.5). Total 222, average 74.00. GPA = (5.0 + 4.0 + 3.5) ÷ 3 = 4.17. No F, so it is a pass.`,
      faq: [
        { q: `What is the pass mark?`, a: `The pass mark is 33. Below 33 in a subject gives an F.` },
        { q: `Does failing one subject fail the whole result?`, a: `Yes. One F in any subject fails the whole result, whatever the GPA.` },
        { q: `Can I enter a mark above 100?`, a: `No. Every mark must be between 0 and 100; anything else shows an error.` },
        { q: `Is this GPA the board's official GPA?`, a: `This GPA is the average of grade points. Board rules may differ, so check them for an official result.` },
      ],
    },
  },
  'word-counter': {
    bn:     {
      title: `শব্দ গণনা`,
      intro: `শব্দ গণনা টুলটি আপনার লেখার শব্দ, অক্ষর, বাক্য, অনুচ্ছেদ ও লাইনের সংখ্যা গুনে দেয়। একই সঙ্গে পড়তে কত সময় লাগবে তার একটি অনুমান দেয়। রচনা, অ্যাসাইনমেন্ট বা যেকোনো লেখার দৈর্ঘ্য মাপতে এটি কাজে লাগে। সব গণনা আপনার ব্রাউজারেই হয়।`,
      howTo: [
        `লেখার ঘরে আপনার লেখা টাইপ করুন বা পেস্ট করুন।`,
        `গণনা নিজে থেকেই হালনাগাদ হয়, কোনো বোতাম চাপতে হবে না।`,
        `উপরের টাইলে শব্দ, অক্ষর, বাক্য, অনুচ্ছেদ ও লাইনের সংখ্যা দেখুন।`,
        `নিচে পড়ার সময় দেখুন, চাইলে উদাহরণ বোতামে নমুনা লেখা বসান।`,
      ],
      formula: `নিয়ম: শব্দ গোনা হয় ফাঁকা জায়গা দিয়ে ভাগ করে; বাক্য গোনা হয় . ! ? । চিহ্ন দিয়ে ভাগ করে; অনুচ্ছেদ গোনা হয় ফাঁকা লাইন দিয়ে ভাগ করে। পড়ার সময় = শব্দ ÷ ২০০ শব্দ/মিনিট। অক্ষর গোনা হয় ফাঁকাসহ ও ফাঁকা ছাড়া দুভাবেই।`,
      example: `উদাহরণ: লেখা: আমি বাংলা ভালোবাসি। Eduvelto is a free learning platform for Bangladesh। এই লেখায় শব্দ ১১টি, অক্ষর ৭২টি, ফাঁকা ছাড়া অক্ষর ৬২টি, বাক্য ২টি। পড়ার সময়: 11 ÷ 200 × 60 = ৩.৩ সেকেন্ড, অর্থাৎ প্রায় ৩ সেকেন্ড।`,
      faq: [
        { q: `বাংলা লেখা কি গোনা যায়?`, a: `হ্যাঁ, শব্দ গোনা হয় ফাঁকা জায়গা দিয়ে ভাগ করে, তাই বাংলা ও ইংরেজি একইভাবে গোনা হয়।` },
        { q: `সংখ্যাও কি শব্দ হিসেবে গোনা হয়?`, a: `হ্যাঁ, ফাঁকা জায়গা দিয়ে আলাদা করা যেকোনো টুকরো একটি শব্দ হিসেবে গোনা হয়, সংখ্যাসহ।` },
        { q: `পড়ার সময় কি একদম ঠিক?`, a: `না, এটি একটি অনুমান মাত্র। ধরা হয় একজন পাঠক মিনিটে প্রায় ২০০ শব্দ পড়েন।` },
        { q: `আমার লেখা কি কোথাও পাঠানো হয়?`, a: `না, সব গণনা আপনার ব্রাউজারেই হয়। আপনার লেখা কোথাও আপলোড বা সংরক্ষণ করা হয় না।` },
      ],
    },
    en:     {
      title: `Word Counter`,
      intro: `The Word Counter counts the words, characters, sentences, paragraphs and lines in your text. It also estimates how long the text takes to read. It is useful for essays, assignments or any writing, and all counting happens in your browser.`,
      howTo: [
        `Type or paste your text in the text box.`,
        `The counts update on their own; no button to press.`,
        `Read the words, characters, sentences, paragraphs and lines in the tiles.`,
        `See the reading time below, or load the sample text with the example button.`,
      ],
      formula: `Rule: words are counted by splitting on whitespace; sentences by splitting on . ! ? and । ; paragraphs by splitting on blank lines. Reading time = words ÷ 200 words per minute. Characters are counted with spaces and without spaces.`,
      example: `Example: the text “আমি বাংলা ভালোবাসি। Eduvelto is a free learning platform for Bangladesh.” has 11 words, 72 characters, 62 characters without spaces, and 2 sentences. Reading time: 11 ÷ 200 × 60 = 3.3 seconds, about 3 seconds.`,
      faq: [
        { q: `Can it count Bangla text?`, a: `Yes. Words are counted by splitting on whitespace, so Bangla and English count the same way.` },
        { q: `Do numbers count as words?`, a: `Yes, any piece separated by whitespace counts as one word, including numbers.` },
        { q: `Is the reading time exact?`, a: `No, it is only an estimate, assuming about 200 words per minute.` },
        { q: `Is my text sent anywhere?`, a: `No, all counting happens in your browser. Your text is never uploaded or stored anywhere.` },
      ],
    },
  },
  'compound-interest-calculator': {
    bn:     {
      title: `চক্রবৃদ্ধি সুদ ক্যালকুলেটর`,
      intro: `এই ক্যালকুলেটর দেখায় সঞ্চয় বা বিনিয়োগ চক্রবৃদ্ধি সুদে কীভাবে বাড়ে, যখন সুদের ওপরও সুদ পাওয়া যায়। দীর্ঘ সময়ে এই জমতে থাকা প্রভাব বড় পার্থক্য তৈরি করে।`,
      howTo: [
        `শুরুর টাকা লিখুন।`,
        `মাসিক জমা লিখুন (না থাকলে 0)।`,
        `বার্ষিক হার (%) ও মেয়াদ (বছর) লিখুন।`,
        `মেয়াদ শেষে মোট টাকা ও সুদ দেখুন।`,
      ],
      formula: `FV = P × (1 + r)^n + C × ((1 + r)^n − 1) ÷ r, যেখানে P শুরুর টাকা, C মাসিক জমা, r মাসিক হার (বার্ষিক হার ÷ 12) ও n মাসের সংখ্যা।`,
      example: `উদাহরণ: শুরুর টাকা 100,000, বার্ষিক হার 8%, মেয়াদ 10 বছর। বছরে একবার সুদ যোগ হলে মোট হয় প্রায় 215,892 টাকা; সরল সুদে হতো মাত্র 180,000 টাকা। মাসে মাসে সুদ যোগ হলে (টুলটি এভাবেই হিসাব করে) ফল প্রায় 221,964 টাকা।`,
      faq: [
        { q: `চক্রবৃদ্ধি সুদ আর সরল সুদের পার্থক্য কী?`, a: `সরল সুদে শুধু মূল টাকার ওপর সুদ পাওয়া যায়; চক্রবৃদ্ধিতে সুদের ওপরও সুদ ধরে, তাই টাকা দ্রুত বাড়ে।` },
        { q: `মাসিক জমা দিলে কী হয়?`, a: `প্রতিটি জমা নিজে নিজে বছরের পর বছর চক্রবৃদ্ধি পায়, তাই শেষের পরিমাণ অনেক বেড়ে যায়।` },
        { q: `ফলাফল কি নিশ্চিত?`, a: `না, লেখা হার একটি ধারণা মাত্র। বাস্তব লাভ, কর, ফি ও মূল্যস্ফীতি হিসাব করা হয় না; ফলাফল আনুমানিক।` },
      ],
    },
    en:     {
      title: `Compound Interest Calculator`,
      intro: `This calculator shows how savings or an investment grows with compound interest, when the interest itself starts earning interest. Over long periods, this snowball effect makes a large difference.`,
      howTo: [
        `Enter the starting amount.`,
        `Enter the monthly contribution (0 if none).`,
        `Enter the annual rate (%) and the term in years.`,
        `Read the final amount and the interest earned.`,
      ],
      formula: `FV = P × (1 + r)^n + C × ((1 + r)^n − 1) ÷ r, where P is the starting amount, C is the monthly contribution, r is the monthly rate (annual rate ÷ 12) and n is the number of months.`,
      example: `Example: a starting amount of 100,000 at 8% a year for 10 years. Added once a year, it grows to about 215,892; with simple interest it would reach only 180,000. Added monthly (as this tool calculates), the result is about 221,964.`,
      faq: [
        { q: `What is the difference from simple interest?`, a: `Simple interest pays only on the original amount; compound interest also earns interest on the interest, so money grows faster.` },
        { q: `What do monthly deposits change?`, a: `Every deposit earns compound interest for years of its own, so the final amount grows much larger.` },
        { q: `Is the result guaranteed?`, a: `No. The rate you enter is an assumption, and the tool ignores taxes, fees and inflation, so treat the result as a planning estimate.` },
      ],
    },
  },
  'mortgage-calculator': {
    bn:     {
      title: `মর্টগেজ ও হোম লোন ক্যালকুলেটর`,
      intro: `এই ক্যালকুলেটর বাড়ির ঋণ নেওয়ার আগেই তার মাসিক খরচ বুঝতে সাহায্য করে। মাসিক কিস্তি, মোট পরিশোধ ও মোট সুদ দেখে তিনটি প্রস্তাব সহজে তুলনা করা যায়।`,
      howTo: [
        `বাড়ির দাম লিখুন।`,
        `ডাউন পেমেন্ট লিখুন (ঋণ = দাম − ডাউন পেমেন্ট)।`,
        `বার্ষিক সুদের হার (%) ও মেয়াদ (বছর) লিখুন।`,
        `মাসিক কিস্তি, মোট সুদ ও মোট পরিশোধ দেখুন।`,
      ],
      formula: `EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), যেখানে P ঋণের পরিমাণ, r মাসিক হার (বার্ষিক হার ÷ 12) ও n কিস্তির সংখ্যা। সুদ 0% হলে EMI = P ÷ n।`,
      example: `উদাহরণ: বাড়ির দাম 5,000,000 টাকা, ডাউন পেমেন্ট নেই, হার 9%, মেয়াদ 20 বছর। ঋণ 5,000,000 টাকা; মাসিক হার 0.0075 ও কিস্তি 240টি, EMI প্রায় 44,986 টাকা। মোট দিতে হয় 10,796,640 টাকা, যার মধ্যে সুদ 5,796,640 টাকা। একই ঋণ 10 বছরে নিলে কিস্তি প্রায় 63,338 টাকা, কিন্তু সুদ মাত্র 2,600,560 টাকা।`,
      faq: [
        { q: `শুরুর দিকে ঋণ কমতে দেরি হয় কেন?`, a: `প্রথম মাসগুলোতে কিস্তির বেশিরভাগ অংশ সুদে যায়, অল্প অংশই আসল কমায়। বকেয়া কমলে সুদের অংশও কমে।` },
        { q: `আগাম পরিশোধ করলে লাভ হয়?`, a: `হ্যাঁ, শুরুর দিকে বাড়তি টাকা দিলে মোট সুদ অনেক কমে। তবে আগাম পরিশোধে জরিমানা আছে কি না জেনে নিন।` },
        { q: `কর, বীমা কি হিসাবে ধরা হয়?`, a: `না, এই টুলটি শুধু ঋণের কিস্তি হিসাব করে। কর, বীমা ও বাড়ির অন্যান্য খরচ আলাদা।` },
      ],
    },
    en:     {
      title: `Mortgage & Home Loan Calculator`,
      intro: `This calculator helps you understand the monthly cost of a home loan before you commit. Comparing EMI, total payment and total interest makes it easy to compare offers.`,
      howTo: [
        `Enter the home price.`,
        `Enter the down payment (loan = price − down payment).`,
        `Enter the annual rate (%) and the term in years.`,
        `Read the EMI, total interest and total payment.`,
      ],
      formula: `EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan, r is the monthly rate (annual rate ÷ 12) and n is the number of payments. At 0%, EMI = P ÷ n.`,
      example: `Example: a home price of 5,000,000 with no down payment, at 9% a year for 20 years. The loan is 5,000,000; the monthly rate is 0.0075 and there are 240 payments, so the EMI is about 44,986. In total you pay about 10,796,640, including about 5,796,640 in interest. Over 10 years it costs about 63,338 a month but only about 2,600,560 in interest.`,
      faq: [
        { q: `Why does the balance fall slowly at first?`, a: `In the early months most of each payment goes to interest and only a small part reduces the loan.` },
        { q: `Does paying early save money?`, a: `Yes, extra payments early in the loan cut total interest the most. But check whether the lender charges a fee for early repayment.` },
        { q: `Are taxes and insurance included?`, a: `No, this tool estimates the loan payment only. Taxes, insurance and other home costs are separate.` },
      ],
    },
  },
  'income-tax-calculator': {
    bn:     {
      title: `আয়কর ক্যালকুলেটর`,
      intro: `এই ক্যালকুলেটর বার্ষিক আয়ের ওপর আনুমানিক আয়কর বের করে, আপনি নিজে যে স্ল্যাব ও হার লিখবেন সেই অনুযায়ী। করের নিয়ম প্রতি বছর বদলায়, তাই হার এখানে স্থায়ীভাবে বসানো হয়নি।`,
      howTo: [
        `বার্ষিক আয় লিখুন।`,
        `করের ধাপের সীমা ও হার দেখে নিন, প্রয়োজনে বদলে নিন।`,
        `মোট কর, মাসিক কর ও কার্যকর হার দেখুন।`,
        `দাখিলের আগে NBR-এর বর্তমান স্ল্যাব মিলিয়ে নিন।`,
      ],
      formula: `কর = প্রতিটি স্ল্যাবের (স্ল্যাবের আয় × স্ল্যাবের হার) যোগফল। টুলটি NBR-এর অর্থ আইন ২০২৫-এর স্ল্যাব দিয়ে শুরু হয়: প্রথম 350,000 টাকা করমুক্ত।`,
      example: `উদাহরণ: করযোগ্য আয় 500,000 টাকা; স্ল্যাব: প্রথম 300,000 টাকায় 0%, পরের 200,000 টাকায় 10%। প্রথম স্ল্যাবে কর নেই, দ্বিতীয় স্ল্যাবে 20,000 টাকা; মোট কর 20,000 টাকা। কার্যকর হার 4%। আয় 600,000 টাকা হলে শুধু বাড়তি 100,000 টাকার ওপর বেশি হার পড়ে, পুরো আয়ের ওপর নয়।`,
      faq: [
        { q: `প্রান্তিক হার আর কার্যকর হার কী?`, a: `আয়ের শেষ অংশের হার প্রান্তিক হার; মোট করকে মোট আয় দিয়ে ভাগ করলে কার্যকর হার পাওয়া যায়, যা প্রায় সবসময় কম হয়।` },
        { q: `বেতন বাড়লে হাতে কম টাকা থাকবে?`, a: `না, বেশি হারে শুধু বাড়তি আয়ের ওপর কর পড়ে, পুরো আয়ের ওপর নয়। তাই বেতন বাড়লে করের পরও বেশি টাকা থাকে।` },
        { q: `এই হিসাব কি কর পরামর্শ?`, a: `না, এটি শুধু পরিকল্পনার জন্য আনুমানিক হিসাব। জটিল রিটার্নের ক্ষেত্রে লাইসেন্সপ্রাপ্ত কর উপদেষ্টার সাহায্য নিন।` },
      ],
    },
    en:     {
      title: `Income Tax Calculator`,
      intro: `This calculator estimates the income tax on your yearly income, using the slabs and rates you enter yourself. Tax rules change every year, so no rate is fixed in place here.`,
      howTo: [
        `Enter your annual income.`,
        `Check the slab limits and rates, and change them if needed.`,
        `Read the total tax, monthly tax and effective rate.`,
        `Before filing, check the current NBR slabs.`,
      ],
      formula: `Tax = the sum over slabs of (income in the slab × that slab's rate). The tool starts with the NBR Finance Act 2025 slabs: the first 350,000 is tax-free.`,
      example: `Example: taxable income 500,000, with slabs you enter: 0% on the first 300,000 and 10% on the next 200,000. The first slab gives no tax; the second gives 20,000, so total tax is 20,000. The effective rate is 4%. If income rose to 600,000, only the extra 100,000 would be taxed at the higher rate, not the whole amount.`,
      faq: [
        { q: `What are the marginal and effective rates?`, a: `The marginal rate is the rate on the last part of your income; the effective rate is total tax divided by total income, and it is almost always lower.` },
        { q: `Can a pay rise leave me with less money?`, a: `No. Only the extra income is taxed at the higher rate, not the whole income, so you keep more after tax.` },
        { q: `Is this tax advice?`, a: `No, it is an estimate for planning only. For a complex return, ask a licensed tax adviser to check your situation.` },
      ],
    },
  },
  'salary-to-hourly-converter': {
    bn:     {
      title: `বেতন থেকে ঘণ্টাপ্রতি হার`,
      intro: `এই টুলটি মাসিক বা বার্ষিক বেতনকে ঘণ্টাপ্রতি হারে রূপান্তর করে। চাকরির প্রস্তাব, ফ্রিল্যান্স কাজ ও খণ্ডকালীন কাজের তুলনা একই মাপে করা যায়।`,
      howTo: [
        `বেতনের পরিমাণ লিখুন।`,
        `বেতনের সময়কাল বেছে নিন: মাসিক, বার্ষিক, সাপ্তাহিক বা দৈনিক।`,
        `সপ্তাহে কাজের ঘণ্টা লিখুন (সাধারণত 40)।`,
        `ঘণ্টাপ্রতি, দৈনিক, সাপ্তাহিক ও বার্ষিক হার দেখুন।`,
      ],
      formula: `ঘণ্টাপ্রতি হার = বার্ষিক বেতন ÷ বছরের মোট কাজের ঘণ্টা; মোট ঘণ্টা = সপ্তাহে ঘণ্টা × 52। দৈনিক হার ধরা হয় 5 দিনের সপ্তাহে।`,
      example: `উদাহরণ: বার্ষিক বেতন 600,000 টাকা, সপ্তাহে 40 ঘণ্টা, বছরে 52 সপ্তাহ। মোট ঘণ্টা 2,080; 600,000 ÷ 2,080 = প্রায় 288 টাকা প্রতি ঘণ্টা। মাসিক 50,000 টাকা একই হিসাব। উল্টোভাবে, ঘণ্টায় 350 টাকা হলে বার্ষিক আয় প্রায় 728,000 টাকা।`,
      faq: [
        { q: `ঘণ্টাপ্রতি হার কেন জানা দরকার?`, a: `দুটি চাকরির কাজের ঘণ্টা আলাদা হলে শুধু মাসিক বেতন দেখে তুলনা করা যায় না; ঘণ্টাপ্রতি হার আসল মূল্য দেখায়।` },
        { q: `ফ্রিল্যান্স হার ঠিক করতে কী করব?`, a: `মোট কাজের ঘণ্টা নয়, বিল করা যায় এমন ঘণ্টা ব্যবহার করুন; ক্লায়েন্ট খোঁজা ও হিসাবের সময়ও ধরুন।` },
        { q: `ছুটি ও সুবিধা কি হিসাবে ধরা হয়?`, a: `না, শুধু বেতন ও ঘণ্টা দিয়ে হিসাব করা হয়। তুলনার আগে সুবিধার টাকার মূল্য বেতনের সঙ্গে যোগ করে নিন।` },
      ],
    },
    en:     {
      title: `Salary to Hourly Converter`,
      intro: `This tool converts a monthly or yearly salary into an hourly rate. It lets you compare job offers, freelance work and part-time roles on equal terms.`,
      howTo: [
        `Enter the salary amount.`,
        `Choose the salary period: monthly, yearly, weekly or daily.`,
        `Enter your working hours per week (usually 40).`,
        `Read the hourly, daily, weekly and yearly rates.`,
      ],
      formula: `Hourly rate = annual salary ÷ total working hours in a year; total hours = hours per week × 52. The daily rate assumes a 5-day working week.`,
      example: `Example: an annual salary of 600,000 with a 40-hour week over 52 weeks. Total hours are 52 × 40 = 2,080, and 600,000 ÷ 2,080 gives about 288 per hour. A monthly salary of 50,000 is the same example. In reverse, 350 an hour at 40 hours a week for 52 weeks equals about 728,000 a year.`,
      faq: [
        { q: `Why do I need an hourly rate?`, a: `When two jobs have different working hours, monthly pay alone cannot compare them; the hourly rate shows the real value of your time.` },
        { q: `How should I set a freelance rate?`, a: `Use your billable hours, not your total working hours, and count unpaid time spent finding clients and doing admin.` },
        { q: `Are holidays and benefits included?`, a: `No, the tool uses only pay and hours. Add the cash value of benefits to the salary before converting for a fair comparison.` },
      ],
    },
  },
  'electricity-bill-calculator': {
    bn:     {
      title: `বিদ্যুৎ বিল ক্যালকুলেটর`,
      intro: `এই টুল দিয়ে মাসে ব্যবহৃত ইউনিট থেকে আনুমানিক বিল বের করতে পারবেন। আবাসিক গ্রাহকদের জন্য তৈরি; বাড়ির মালিক, ভাড়াটিয়া কিংবা বিদ্যুৎ খরচের হিসাব রাখতে চান—এমন যে কারও কাজে লাগবে। ফলাফল আনুমানিক, সরকারি বিলের বিকল্প নয়।`,
      howTo: [
        `"ব্যবহৃত ইউনিট (kWh)" ঘরে মাসের মোট ব্যবহার লিখুন।`,
        `"অনুমোদিত লোড (kW)" ঘরে মিটারের লোড লিখুন; সাধারণত এটি ১।`,
        `মিটার ভাড়া থাকলে তা লিখুন; না থাকলে ০ রাখুন।`,
        `প্রয়োজন হলে স্ল্যাবের হার, ডিমান্ড চার্জ ও ভ্যাট সর্বশেষ বিলের সঙ্গে মিলিয়ে বদলে নিন।`,
      ],
      formula: `ব্যবহার স্ল্যাব অনুযায়ী ভাগ হয়: ৫০ ইউনিট পর্যন্ত লাইফলাইন হার ৳৪.৬৩; এর বেশি হলে ০–৭৫ ইউনিট ৳৫.২৬, ৭৬–২০০ ইউনিট ৳৮.৫০, ২০১–৩০০ ইউনিট ৳৯.১০, ৩০১–৪০০ ইউনিট ৳৯.৬২, ৪০১–৬০০ ইউনিট ৳১৫.০১ এবং ৬০০-এর বেশি ৳১৭.৩৫। এর সঙ্গে ডিমান্ড চার্জ ৳৪২/kW ও মিটার ভাড়া যোগ হয়, তারপর মোটের ওপর ৫% ভ্যাট। হার জুন ২০২৬ বিলিং মাসের প্রকাশিত আবাসিক ট্যারিফের ডিফল্ট মান।`,
      example: `২০০ ইউনিট, ১ kW লোড, মিটার ভাড়া ০: জ্বালানি চার্জ ৭৫ × ৫.২৬ + ১২৫ × ৮.৫০ = ৳১,৪৫৭। ডিমান্ড চার্জ ৳৪২। মোট ৳১,৪৯৯-এর ওপর ৫% ভ্যাট ৳৭৪.৯৫। মোট ৳১,৫৭৩.৯৫, প্রতি ইউনিটে গড়ে প্রায় ৳৭.৮৭।`,
      faq: [
        { q: `এই হিসাব কি আমার আসল বিলের সমান হবে?`, a: `না। এটি আনুমানিক হিসাব; হার বদলাতে পারে, আর মিটার ভাড়া বা ছাড় আপনার বিলে ভিন্ন হতে পারে। বিলের সঙ্গে মিলিয়ে নিন।` },
        { q: `৫০ ইউনিটের কম ব্যবহার করলে কী হয়?`, a: `মোট ব্যবহার ৫০ ইউনিট বা তার কম হলে লাইফলাইন হার ৳৪.৬৩ প্রযোজ্য হয়।` },
        { q: `ডিমান্ড চার্জ কী?`, a: `অনুমোদিত লোডের জন্য প্রতি kW-তে মাসিক চার্জ; ডিফল্ট হার ৳৪২/kW।` },
      ],
    },
    en:     {
      title: `Electricity Bill Calculator`,
      intro: `This tool estimates your monthly electricity bill from the units used. It is for residential customers — homeowners, tenants, or anyone tracking electricity spending. The result is an estimate, not your official bill.`,
      howTo: [
        `Enter your monthly usage in the "Units used (kWh)" field.`,
        `Enter your sanctioned load in the "Sanctioned load (kW)" field; usually 1.`,
        `Enter the meter rent, or leave it at 0.`,
        `Edit the slab rates, demand charge and VAT to match your latest bill.`,
      ],
      formula: `Usage is split by slab: up to 50 units, the lifeline rate is ৳4.63; above that, 0–75 units cost ৳5.26, 76–200 units ৳8.50, 201–300 units ৳9.10, 301–400 units ৳9.62, 401–600 units ৳15.01, and above 600 units ৳17.35. A demand charge of ৳42/kW and any meter rent are added, then 5% VAT applies to the total. Rates are the default tariff as reported for June 2026.`,
      example: `200 units, 1 kW load, no meter rent: energy charge 75 × 5.26 + 125 × 8.50 = ৳1,457. Demand charge ৳42. VAT at 5% on ৳1,499 is ৳74.95. Total bill ৳1,573.95, about ৳7.87 per unit on average.`,
      faq: [
        { q: `Will this match my real bill exactly?`, a: `No. It is an estimate — rates change, and meter rent or rebates may differ. Check your latest bill.` },
        { q: `What happens if I use 50 units or less?`, a: `At 50 units or less, the lifeline rate of ৳4.63 applies to all units.` },
        { q: `What is the demand charge?`, a: `A monthly charge per kW of sanctioned load; the default is ৳42/kW.` },
      ],
    },
  },
  'zakat-calculator': {
    bn:     {
      title: `যাকাত ক্যালকুলেটর`,
      intro: `যাকাত ইসলামের একটি ফরজ ইবাদত। এই টুল আপনার নগদ টাকা, সোনা, রুপা, ব্যবসার পণ্য ও ঋণের হিসাব থেকে মোট সম্পদ ও নিসাব বের করে যাকাতের পরিমাণ হিসাব করতে সাহায্য করে। এটি শুধু হিসাবের সহায়ক; ধর্মীয় সিদ্ধান্তের জন্য আলেমের পরামর্শ নিন।`,
      howTo: [
        `নগদ টাকা, সোনার পরিমাণ (গ্রাম) ও ব্যবসার পণ্যের মূল্য লিখুন।`,
        `রুপার পরিমাণ (গ্রাম) ও ঋণ বা দেনার পরিমাণ লিখুন।`,
        `সোনা ও রুপার বর্তমান বাজারদর (প্রতি গ্রাম) নিজে বসান—এখানে কোনো দাম আগে থেকে দেওয়া নেই।`,
        `নিসাবের ভিত্তি বাছুন—সোনা (৮৫ গ্রাম) বা রুপা (৫৯৫ গ্রাম)—তারপর ফল দেখুন।`,
      ],
      formula: `মোট সম্পদ = নগদ টাকা + সোনার মূল্য + রুপার মূল্য + ব্যবসার পণ্য − ঋণ। নিসাব = ৮৫ গ্রাম সোনার দাম অথবা ৫৯৫ গ্রাম রুপার দাম। মোট সম্পদ নিসাবের সমান বা বেশি হলে যাকাত = মোট সম্পদের ২.৫%; নিসাবের নিচে হলে যাকাত দিতে হয় না।`,
      example: `নগদ ৳১,০০,০০০, সোনা ১০ গ্রাম (প্রতি গ্রাম ৳৮,০০০), রুপা ১০০ গ্রাম (প্রতি গ্রাম ৳১২০), ব্যবসার পণ্য ৳৫০,০০০, ঋণ ৳২০,০০০: মোট সম্পদ = ১,০০,০০০ + ৮০,০০০ + ১২,০০০ + ৫০,০০০ − ২০,০০০ = ৳২,২২,০০০। রুপার ভিত্তিতে নিসাব = ৫৯৫ × ১২০ = ৳৭১,৪০০। সম্পদ নিসাবের বেশি, তাই যাকাত = ২,২২,০০০ × ২.৫% = ৳৫,৫৫০।`,
      faq: [
        { q: `নিসাব কী?`, a: `যাকাত ফরজ হওয়ার সর্বনিম্ন সম্পদের পরিমাণ। এই টুলে সোনার ভিত্তিতে ৮৫ গ্রাম ও রুপার ভিত্তিতে ৫৯৫ গ্রামের দাম ধরা হয়।` },
        { q: `সোনা ও রুপার দাম এখানে দেওয়া নেই কেন?`, a: `বাজারদর প্রতিদিন বদলায়, তাই আপনি নিজে বর্তমান দাম বসাবেন—তাহলেই হিসাব সঠিক হবে।` },
        { q: `ঋণ থাকলে কী হয়?`, a: `মোট সম্পদ থেকে ঋণ বাদ দেওয়া হয়। বাকি সম্পদ নিসাবের সমান বা বেশি হলেই যাকাত দিতে হয়।` },
      ],
    },
    en:     {
      title: `Zakat Calculator`,
      intro: `Zakat is an obligatory act of worship in Islam. This tool works out the amount of zakat from your cash, gold, silver, business goods and debts. It is only a calculation aid; for religious decisions, consult a scholar.`,
      howTo: [
        `Enter your cash, gold in grams, and business goods value.`,
        `Enter your silver in grams and any debts you owe.`,
        `Enter the current gold and silver prices per gram yourself.`,
        `Choose the nisab basis — gold (85 g) or silver (595 g) — then view the result.`,
      ],
      formula: `Net wealth = cash + gold + silver + business goods − debts. Nisab = the price of 85 g of gold or 595 g of silver. At or above the nisab, zakat = 2.5% of net wealth; below it, no zakat is due.`,
      example: `Cash ৳100,000, gold 10 g (৳8,000/g), silver 100 g (৳120/g), business goods ৳50,000, debts ৳20,000: net wealth = 100,000 + 80,000 + 12,000 + 50,000 − 20,000 = ৳222,000. Silver-basis nisab = 595 × 120 = ৳71,400. Wealth is above the nisab, so zakat = 222,000 × 2.5% = ৳5,550.`,
      faq: [
        { q: `What is nisab?`, a: `The minimum wealth at which zakat becomes due: the price of 85 g of gold or 595 g of silver.` },
        { q: `Why are gold and silver prices not given here?`, a: `Prices change daily, so enter the current prices yourself.` },
        { q: `What happens if I have debts?`, a: `Debts are subtracted from total wealth. Zakat is due only when the remaining wealth reaches the nisab.` },
      ],
    },
  },
  'govt-job-age-calculator': {
    bn:     {
      title: `সরকারি চাকরির বয়স ক্যালকুলেটর`,
      intro: `সরকারি চাকরির আবেদনে বয়সসীমা একটি গুরুত্বপূর্ণ শর্ত। এই টুল জন্মতারিখ থেকে আপনার বর্তমান বয়স বছর, মাস ও দিনে বের করে এবং বেছে নেওয়া বয়সসীমার সঙ্গে মিলিয়ে আপনি আবেদনের যোগ্য কি না তা জানায়।`,
      howTo: [
        `"জন্মতারিখ" ঘরে আপনার জন্মতারিখ বসান।`,
        `"বয়সসীমা (বছর)" ঘরে পদের বয়সসীমা লিখুন; সাধারণত এটি ৩০।`,
        `চাইলে "সাধারণ: ৩০" বা "মুক্তিযোদ্ধা কোটা: ৩২" বোতামে চাপ দিয়ে সীমা বসান।`,
        `ফলে আপনার বয়স, যোগ্যতা ও কত বছর বাকি আছে তা দেখুন।`,
      ],
      formula: `বয়স = আজকের তারিখ − জন্মতারিখ (বছর, মাস ও দিনে)। সীমার সমান বয়সেও যোগ্য ধরা হয়; সীমা পেরিয়ে গেলে আর যোগ্য নন। ডিফল্ট সীমা সাধারণ ৩০ বছর, মুক্তিযোদ্ধা কোটায় ৩২ বছর—তবে প্রতিটি বিজ্ঞপ্তির সীমা আলাদা হতে পারে, তাই আবেদনের বিজ্ঞপ্তি দেখে যাচাই করুন।`,
      example: `জন্মতারিখ ১৫ জানুয়ারি ২০০০, হিসাবের তারিখ ২৭ নভেম্বর ২০২৬, সীমা ৩০ বছর: বয়স ২৬ বছর। আপনি ৩০ বছরে পৌঁছাবেন ১৫ জানুয়ারি ২০৩০-এ, তাই এখনও ৩ পূর্ণ বছর বাকি—আপনি আবেদনের যোগ্য।`,
      faq: [
        { q: `বয়সসীমা কি সব পদের জন্য একই?`, a: `না। সাধারণ সীমা ৩০ বছর হলেও পদ ও কোটাভেদে ভিন্ন হতে পারে। আবেদনের বিজ্ঞপ্তিতে লেখা সীমাই চূড়ান্ত।` },
        { q: `বয়স কোন তারিখ ধরে হিসাব হয়?`, a: `এই টুল আজকের তারিখ ধরে বয়স বের করে। বিজ্ঞপ্তিতে অন্য তারিখ দেওয়া থাকলে সেই তারিখের বয়স হিসাব করে মিলিয়ে নিন।` },
        { q: `মুক্তিযোদ্ধা কোটার বয়সসীমা কত?`, a: `টুলের ডিফল্ট মান ৩২ বছর। তবে এটি শুধু একটি সাধারণ মান—বিজ্ঞপ্তি দেখে যাচাই করা জরুরি।` },
      ],
    },
    en:     {
      title: `Govt Job Age Calculator`,
      intro: `The age limit is an important condition for government job applications. This tool calculates your age from your date of birth, then compares it with the limit you choose and tells you whether you are eligible.`,
      howTo: [
        `Enter your date of birth in the "Date of birth" field.`,
        `Enter the post's age limit; it is usually 30.`,
        `Or tap "General: 30" or "Freedom-fighter quota: 32".`,
        `View your age, eligibility and years left.`,
      ],
      formula: `Age = today's date − date of birth (in years, months and days). An age equal to the limit still counts as eligible; above the limit, you are not. The default limits are 30 years for general applicants and 32 for the freedom-fighter quota. Each circular can set its own limit, so verify it.`,
      example: `Date of birth 15 January 2000, on 27 November 2026, limit 30 years: age 26 years. You turn 30 on 15 January 2030, so 3 years remain — you are eligible.`,
      faq: [
        { q: `Is the age limit the same for every post?`, a: `No. The general limit is 30 years, but it can differ by post and quota. The limit in the job circular is final.` },
        { q: `Which date is the age calculated from?`, a: `This tool calculates your age as of today. If the circular gives a different cut-off date, work out your age on that date.` },
        { q: `What is the age limit for the freedom-fighter quota?`, a: `The tool’s default value is 32 years — only a general value, so verify it against the circular.` },
      ],
    },
  },
  'prayer-times': {
    bn:     {
      title: `নামাজের সময়`,
      intro: `এই টুল আপনার অবস্থান ও তারিখ থেকে পাঁচ ওয়াক্ত নামাজের সময় হিসাব করে—ফজর, যোহর, আসর, মাগরিব ও ইশা, সঙ্গে সূর্যোদয়। হিসাব আপনার ডিভাইসেই হয়; কোনো ইন্টারনেট বা তথ্য পাঠানোর দরকার নেই।`,
      howTo: [
        `তারিখ বসান; আজকের তারিখ আগে থেকেই দেওয়া থাকে।`,
        `অক্ষাংশ (latitude) লিখুন—ঢাকার জন্য ২৩.৮১০৩।`,
        `দ্রাঘিমাংশ (longitude) লিখুন—ঢাকার জন্য ৯০.৪১২৫।`,
        `সময় অঞ্চল লিখুন—বাংলাদেশের জন্য UTC+৬—তারপর ছয়টি সময় দেখুন।`,
      ],
      formula: `হিসাব হয় সূর্যের অবস্থান থেকে, Muslim World League পদ্ধতিতে: ফজর সূর্য দিগন্তের ১৮° নিচে, ইশা ১৭° নিচে; আসরে ছায়া-গুণক ১; সূর্যোদয় ও সূর্যাস্তে −০.৮৩৩°। ভিন্ন পদ্ধতিতে সময় কয়েক মিনিট এদিক-ওদিক হতে পারে।`,
      example: `ঢাকা, ২৬ নভেম্বর ২০২৬ (অক্ষাংশ ২৩.৮১, দ্রাঘিমাংশ ৯০.৪১, UTC+৬): ফজর প্রায় ০৫:০১, সূর্যোদয় ০৬:২০, যোহর ১১:৪৭, আসর ১৪:৫০, মাগরিব ১৭:১১, ইশা ১৮:২৬–১৮:৩০। প্রকাশিত সময়সূচির সঙ্গে কয়েক মিনিটের পার্থক্য হতে পারে।`,
      faq: [
        { q: `হিসাবের সময় কি মসজিদের সময়সূচির সঙ্গে পুরোপুরি মিলবে?`, a: `সাধারণত কয়েক মিনিটের মধ্যে মিলবে, তবে পদ্ধতিভেদে পার্থক্য হতে পারে। নামাজের জন্য স্থানীয় সময়সূচি মিলিয়ে নিন।` },
        { q: `ইন্টারনেট ছাড়া কি কাজ করে?`, a: `হ্যাঁ। হিসাব আপনার ডিভাইসেই হয়, কোনো তথ্য কোথাও পাঠানো হয় না।` },
        { q: `অন্য শহরের সময় কীভাবে পাব?`, a: `সেই শহরের অক্ষাংশ, দ্রাঘিমাংশ ও সময় অঞ্চল বসালেই হবে।` },
        { q: `আসরের হিসাব কোন মতে হয়?`, a: `ডিফল্ট ছায়া-গুণক ১, অর্থাৎ শাফেয়ী মত অনুযায়ী।` },
      ],
    },
    en:     {
      title: `Prayer Times`,
      intro: `This tool calculates the five daily prayer times — Fajr, Dhuhr, Asr, Maghrib and Isha — plus sunrise, from your location and date. The calculation happens on your own device; no internet connection or data transfer is needed.`,
      howTo: [
        `Enter the date; today's date is already filled in.`,
        `Enter the latitude — for Dhaka, 23.8103.`,
        `Enter the longitude — for Dhaka, 90.4125.`,
        `Enter the time zone — UTC+6 for Bangladesh — then view all six times.`,
      ],
      formula: `Times are calculated from the Sun's position using the Muslim World League method: Fajr when the Sun is 18° below the horizon, Isha at 17° below; Asr uses shadow factor 1; sunrise and sunset use −0.833°. Different methods can shift the times by a few minutes.`,
      example: `Dhaka, 26 November 2026 (latitude 23.81, longitude 90.41, UTC+6): Fajr about 05:01, Sunrise 06:20, Dhuhr 11:47, Asr 14:50, Maghrib 17:11, Isha 18:26–18:30. Published timetables may differ by a few minutes.`,
      faq: [
        { q: `Will the times match my mosque's timetable exactly?`, a: `Usually within a few minutes, but methods can differ slightly. Check the local timetable before prayer.` },
        { q: `Does it work without the internet?`, a: `Yes. The calculation happens on your device, and no data is sent anywhere.` },
        { q: `How do I get times for another city?`, a: `Just enter that city's latitude, longitude and time zone.` },
        { q: `Which school of thought is used for Asr?`, a: `The default shadow factor is 1, which follows the Shafi'i view.` },
      ],
    },
  },
  'cgpa-to-percentage-converter': {
    bn:     {
      title: `সিজিপিএ থেকে শতাংশ কনভার্টার`,
      intro: `চাকরির আবেদন বা ভর্তির ফরমে অনেক সময় সিজিপিএর বদলে শতাংশ চাওয়া হয়। এই টুল আপনার সিজিপিএকে শতাংশে রূপান্তর করে—সূত্রটি আপনি নিজে বেছে নিতে পারবেন, কারণ কোনো একক সর্বজনীন সূত্র নেই।`,
      howTo: [
        `সিজিপিএ ঘরে আপনার সিজিপিএ লিখুন, যেমন ৩.৫।`,
        `স্কেল বাছুন—৪.০০, ৫.০০ বা ১০.০০।`,
        `সূত্র বাছুন—আনুপাতিক, × ৯.৫ অথবা × ১০।`,
        `ফলে শতাংশ দেখুন; যে প্রতিষ্ঠানে জমা দেবেন, তাদের সূত্র মিলিয়ে নিন।`,
      ],
      formula: `আনুপাতিক: শতাংশ = সিজিপিএ ÷ স্কেল × ১০০। × ৯.৫: শতাংশ = সিজিপিএ × ৯.৫ (১০-পয়েন্ট স্কেলের সাধারণ সূত্র)। × ১০: শতাংশ = সিজিপিএ × ১০। ফল ১০০%-এর বেশি হলে ১০০% ধরা হয়।`,
      example: `সিজিপিএ ৩.৫, স্কেল ৪.০, আনুপাতিক সূত্র: ৩.৫ ÷ ৪.০ × ১০০ = ৮৭.৫%। একই সিজিপিএ × ৯.৫ সূত্রে ৩৩.২৫% হয়—তাই ফরম জমা দেওয়ার আগে প্রতিষ্ঠান কোন সূত্র চায়, তা জেনে নিন।`,
      faq: [
        { q: `কোন সূত্রটি সঠিক?`, a: `কোনো একক সঠিক সূত্র নেই। প্রতিষ্ঠানভেদে ভিন্ন হয়—আবেদনপত্রে যে সূত্র বলা আছে, সেটিই ব্যবহার করুন।` },
        { q: `× ৯.৫ সূত্রটি কাদের জন্য?`, a: `এটি ১০-পয়েন্ট স্কেলের একটি সাধারণ সূত্র; ৪.০ স্কেলে সাধারণত আনুপাতিক সূত্র ব্যবহৃত হয়।` },
        { q: `৫.০ স্কেলের সিজিপিএ কি এখানে চলে?`, a: `হ্যাঁ—স্কেলে ৪.০০, ৫.০০ বা ১০.০০ বাছা যায়।` },
        { q: `শতাংশ কি ১০০%-এর বেশি হতে পারে?`, a: `না। ফল ১০০%-এর বেশি হলে টুল ১০০% দেখায়।` },
      ],
    },
    en:     {
      title: `CGPA to Percentage Converter`,
      intro: `Job applications and admission forms often ask for a percentage instead of a CGPA. This tool converts your CGPA into a percentage — and you choose the formula yourself, because there is no single universal formula.`,
      howTo: [
        `Enter your CGPA, for example 3.5.`,
        `Choose the scale — 4.00, 5.00 or 10.00.`,
        `Choose the formula — proportional, × 9.5 or × 10.`,
        `View the percentage, and check which formula the institution you are applying to expects.`,
      ],
      formula: `Proportional: percentage = CGPA ÷ scale × 100. × 9.5: percentage = CGPA × 9.5 (the common 10-point formula). × 10: percentage = CGPA × 10. If the result is above 100%, it is capped at 100%.`,
      example: `CGPA 3.5 on a 4.0 scale, proportional formula: 3.5 ÷ 4.0 × 100 = 87.5%. The same CGPA with the × 9.5 formula gives 33.25% — so check which formula the institution wants before you submit the form.`,
      faq: [
        { q: `Which formula is correct?`, a: `No single formula is correct for everyone. It differs by institution — use the formula stated in the application form.` },
        { q: `Who is the × 9.5 formula for?`, a: `It is a common formula for the 10-point scale; on a 4.0 scale the proportional formula is usually used.` },
        { q: `Can I convert a CGPA on the 5.0 scale?`, a: `Yes — the scale can be set to 4.00, 5.00 or 10.00.` },
        { q: `Can the percentage go above 100%?`, a: `No. If the result is above 100%, the tool shows 100%.` },
      ],
    },
  },
  'pdf-splitter': {
    bn:     {
      title: `পিডিএফ স্প্লিটার`,
      intro: `একটি পিডিএফ থেকে দরকারি পাতাগুলো আলাদা করে নতুন পিডিএফ বানান। বড় নথি থেকে শুধু যে পাতাগুলো লাগবে সেগুলো নিতে এটি কাজে আসে। ফাইল আপনার ডিভাইসেই থাকে, কোথাও আপলোড হয় না।`,
      howTo: [
        `আপনার পিডিএফ ফাইলটি বাছুন — টুলটি মোট কত পাতা আছে তা দেখাবে।`,
        `পাতা বাছাইয়ের ঘরে লিখুন, যেমন 1,3-5 — মানে ১, ৩, ৪ ও ৫ নম্বর পাতা।`,
        `ভাগ করুন বোতামে ক্লিক করুন।`,
        `তৈরি নতুন পিডিএফটি ডাউনলোড করুন।`,
      ],
      formula: `নিয়ম: পাতা গোনা হয় ১ থেকে। একক পাতা কমা দিয়ে আর পরপর পাতা ড্যাশ দিয়ে লিখুন, যেমন 1,3-5,7 — পরিসর দুই দিকেই অন্তর্ভুক্ত। একই পাতা দুবার লিখলে একবারই নেওয়া হয়, আর মোট পাতার বাইরের নম্বর লিখলে ভুল দেখাবে।`,
      example: `ধরুন একটি পিডিএফে ১০টি পাতা আছে আর আপনার দরকার পাতা ১, ৩, ৪ ও ৫। ঘরে লিখুন 1,3-5 — পাবেন মোট ৪ পাতার একটি নতুন পিডিএফ, যার পাতাগুলো হবে মূল ফাইলের ১, ৩, ৪ ও ৫ নম্বর পাতা।`,
      faq: [
        { q: `পাতা বাছাই কেমন করে লিখব?`, a: `একক পাতা কমা দিয়ে লিখুন, যেমন 1,7, আর পরপর পাতা ড্যাশ দিয়ে, যেমন 3-5। একসঙ্গে লিখতে পারেন: 1,3-5।` },
        { q: `ফাইল কি সার্ভারে আপলোড হয়?`, a: `না। ফাইল আপনার ব্রাউজারেই ভাগ করা হয়, কোথাও আপলোড হয় না।` },
        { q: `ফাইলের সর্বোচ্চ আকার কত?`, a: `এই টুলের কোডে ফাইলের আকারের কোনো সীমা লেখা নেই — শুধু .pdf ফাইল চলবে। খুব বড় ফাইল ব্রাউজারে ধীরে চলতে পারে।` },
        { q: `নষ্ট বা পিডিএফ নয় এমন ফাইল দিলে কী হবে?`, a: `টুলটি ভুল দেখাবে — ফাইলটি পিডিএফ হিসেবে পড়া যায়নি। সঠিক .pdf ফাইল বেছে আবার চেষ্টা করুন।` },
      ],
    },
    en:     {
      title: `PDF Splitter`,
      intro: `Extract the pages you need from a PDF into a new PDF — useful when only a few pages of a large document are needed. The file stays on your device and is never uploaded.`,
      howTo: [
        `Choose your PDF file — the tool shows how many pages it has.`,
        `Type the page selection, e.g. 1,3-5, meaning pages 1, 3, 4 and 5.`,
        `Click the Split PDF button.`,
        `Download the new PDF that is created.`,
      ],
      formula: `Key rule: pages are counted from 1. Write single pages separated by commas and consecutive pages with a dash, e.g. 1,3-5,7 — ranges include both ends. A number beyond the total pages shows an error.`,
      example: `Suppose a PDF has 10 pages and you need pages 1, 3, 4 and 5. Type 1,3-5 to get a new PDF of 4 pages, made from those pages of the original file.`,
      faq: [
        { q: `How do I write the page selection?`, a: `Write single pages with commas, e.g. 1,7, and consecutive pages with a dash, e.g. 3-5. You can mix them: 1,3-5.` },
        { q: `Is the file uploaded to a server?`, a: `No. The file is split in your browser and is never uploaded.` },
        { q: `What is the maximum file size?`, a: `No size limit is stated in this tool's code — only .pdf files work. Very large files may run slowly.` },
        { q: `What if the file is corrupt or not a PDF?`, a: `The tool shows an error — the file could not be read as a PDF. Choose a .pdf file and try again.` },
      ],
    },
  },
  'image-to-pdf': {
    bn:     {
      title: `ছবি থেকে পিডিএফ`,
      intro: `এক বা একাধিক ছবি থেকে পিডিএফ ফাইল তৈরি করুন। ছবি তোলা নোট, সার্টিফিকেট বা ফরমের ছবি একসঙ্গে একটি পিডিএফে পাঠাতে এটি কাজে আসে। সবকিছু আপনার ডিভাইসেই প্রক্রিয়া হয়, কোথাও আপলোড হয় না।`,
      howTo: [
        `ছবিগুলো বাছুন — একসঙ্গে একাধিক ছবি বাছা যায়।`,
        `তীর চিহ্ন দিয়ে ছবির ক্রম সাজান; প্রতিটি ছবি পিডিএফের এক পাতা হবে।`,
        `পিডিএফ বানান বোতামে ক্লিক করুন।`,
        `তৈরি পিডিএফটি ডাউনলোড করুন।`,
      ],
      formula: `নিয়ম: JPG, PNG ও WebP ছবি চলে; অন্য ছবি JPEG-এ বদলে নেওয়া হয়। প্রতিটি ছবি ১০ MB-এর মধ্যে হতে হবে। প্রতিটি ছবি A4 পাতায় বসানো হয়, ছবির অনুপাত ঠিক রেখে।`,
      example: `ধরুন আপনার তিনটি ছবি আছে — একটি নোটের, একটি সার্টিফিকেটের ও একটি ফরমের। তিনটি বাছলে পাবেন ৩ পাতার একটি পিডিএফ, প্রতিটি পাতায় একটি করে ছবি, আপনার সাজানো ক্রমে।`,
      faq: [
        { q: `কোন ছবির ফরম্যাট চলে?`, a: `JPG, PNG ও WebP চলে। অন্য ফরম্যাটের ছবি JPEG-এ বদলে নেওয়া হয়, তাই বেশিরভাগ ছবিই কাজ করবে।` },
        { q: `এক ছবির সর্বোচ্চ আকার কত?`, a: `প্রতিটি ছবি ১০ MB-এর মধ্যে হতে হবে। এর বেশি হলে ছোট করে নিন, তারপর বাছুন।` },
        { q: `ছবিগুলো কি সার্ভারে আপলোড হয়?`, a: `না। সবকিছু আপনার ডিভাইসেই প্রক্রিয়া হয়, ছবি কোথাও পাঠানো হয় না।` },
        { q: `৫টির বেশি ছবি হলে কী হয়?`, a: `৫টির বেশি ছবি হলে ডাউনলোড বিনামূল্যে পেতে একটি ছোট বিজ্ঞাপন দেখতে হয় — তারপর ডাউনলোড বোতামটি কাজ করে।` },
      ],
    },
    en:     {
      title: `Image to PDF`,
      intro: `Turn one or more images into a PDF file. It is handy for sending photographed notes, certificates or forms together as a single PDF. Everything is processed on your device and nothing is uploaded.`,
      howTo: [
        `Choose your images — you can pick several at once.`,
        `Use the arrows to order the images; each image becomes one PDF page.`,
        `Click the Make PDF button.`,
        `Download the finished PDF.`,
      ],
      formula: `Key rule: JPG, PNG and WebP images work; other images are converted to JPEG first. Each image must be within 10 MB. Each image is placed on an A4 page, keeping its aspect ratio.`,
      example: `Suppose you have three images — a note, a certificate and a form. Choose all three to get a 3-page PDF, one image per page, in the order you arranged.`,
      faq: [
        { q: `Which image formats work?`, a: `JPG, PNG and WebP work. Other formats are converted to JPEG first, so most images will work.` },
        { q: `What is the maximum size of one image?`, a: `Each image must be within 10 MB. If one is bigger, shrink it first, then choose it.` },
        { q: `Are my images uploaded to a server?`, a: `No. Everything is processed on your device, and no image is sent anywhere.` },
        { q: `What if I add more than 5 images?`, a: `With more than 5 images, the free download asks you to watch a short ad first — then the download button works.` },
      ],
    },
  },
  'bkash-nagad-calculator': {
    bn:     {
      title: `বিকাশ / নগদ ক্যাশ আউট চার্জ ক্যালকুলেটর`,
      intro: `এই টুলটি এজেন্টের মাধ্যমে বিকাশ বা নগদ অ্যাকাউন্ট থেকে নগদ টাকা তুলতে কত চার্জ লাগবে তা বের করে দেয়। চার্জের হার বদলাতে পারে, তাই টুলটি কোনো হার নির্দিষ্ট করে রাখে না — আপনি বর্তমান হারটি নিজে লিখবেন।`,
      howTo: [
        `টাকার পরিমাণের ঘরে কত টাকা তুলতে চান তা লিখুন।`,
        `বিকাশ বা নগদ বেছে নিন, আর পদ্ধতি থেকে এজেন্ট, পার্সোনাল নম্বর বা অ্যাপ বেছে নিন।`,
        `চার্জের হারের ঘরে অ্যাপে দেখা বর্তমান হারটি লিখুন।`,
        `ফলাফলে চার্জ, মোট খরচ ও হাতে কত পাবেন তা দেখুন।`,
      ],
      formula: `সূত্র: চার্জ = টাকার পরিমাণ × হার ÷ ১০০; মোট খরচ = টাকার পরিমাণ + চার্জ।`,
      example: `উদাহরণ: ৫,০০০ টাকা ক্যাশ আউট করতে চান, হার ১.৫%। চার্জ = ৫,০০০ × ১.৫ ÷ ১০০ = ৭৫ টাকা; মোট মূল্য ৫,০৭৫ টাকা। চার্জ টাকা থেকে কাটা হলে হাতে পাবেন ৪,৯২৫ টাকা। একই হারে ২০,০০০ টাকা তুললে চার্জ ৩০০ টাকা।`,
      faq: [
        { q: `হারটি কোথা থেকে জানব?`, a: `অ্যাপে বা এজেন্ট পয়েন্টে দেখা বর্তমান হারটি লিখুন; হার বদলাতে পারে, তাই আগে যাচাই করে নিন।` },
        { q: `হাতে ১০,০০০ টাকা পেতে কত তুলতে হবে?`, a: `উল্টো ঘরে হাতে কত চান তা লিখুন। ১.৫% হারে ১০,০০০ টাকা পেতে তুলতে হবে প্রায় ১০,১৫২ টাকা, চার্জ প্রায় ১৫২ টাকা।` },
        { q: `সেন্ড মানি আর ক্যাশ আউট কি একই?`, a: `না, দুটি আলাদা লেনদেন, চার্জও আলাদা হতে পারে। আপনি যে লেনদেন করছেন তার হারটিই লিখুন।` },
        { q: `সরাসরি দিলে কি খরচ কম হয়?`, a: `অনেক সময় সরাসরি অ্যাকাউন্ট থেকে দিলে খরচ কম হয়, তাই দুটি উপায়ের চার্জ তুলনা করে নিন।` },
      ],
    },
    en:     {
      title: `bKash / Nagad Cash Out Charge Calculator`,
      intro: `This tool works out the charge for withdrawing cash from a bKash or Nagad account through an agent. The charge rate can change, so the tool never fixes a rate — you enter the current rate yourself.`,
      howTo: [
        `Enter the amount you want to withdraw.`,
        `Choose bKash or Nagad and the method: agent, personal number or app.`,
        `Enter the current rate from the app or agent point.`,
        `Read the charge, total cost and cash in hand.`,
      ],
      formula: `Formula: charge = amount × rate ÷ 100; total cost = amount + charge.`,
      example: `Example: you cash out 5,000 taka at a rate of 1.5%. Charge = 5,000 × 1.5 ÷ 100 = 75 taka; total value 5,075 taka. If the charge is taken from the amount, you receive 4,925 taka.`,
      faq: [
        { q: `Where do I find the current rate?`, a: `Use the rate shown in the app or at the agent point, and check it before you calculate.` },
        { q: `How much must I withdraw to receive 10,000 taka in hand?`, a: `Enter the cash you want in hand in the reverse box. At 1.5%, 10,000 taka in hand needs about 10,152 taka, a charge of about 152 taka.` },
        { q: `Is send money the same as cash out?`, a: `No. They are different transactions with different charges, so enter the rate for the one you are doing.` },
        { q: `Is paying directly cheaper than withdrawing cash first?`, a: `Often yes. Compare the cash out charge with paying directly from your account where the shop accepts it.` },
      ],
    },
  },
  'ssc-hsc-gpa-calculator': {
    bn:     {
      title: `এসএসসি/এইচএসসি জিপিএ ক্যালকুলেটর`,
      intro: `এই টুলটি এসএসসি বা এইচএসসি পরীক্ষার ৬টি মূল বিষয়ের গ্রেড থেকে জিপিএ বের করে দেয়। চতুর্থ বিষয়ের গ্রেড থাকলে তার অতিরিক্ত নম্বরও হিসাব করা হয়।`,
      howTo: [
        `মূল বিষয় ১ থেকে ৬ — প্রতিটি ঘরে সেই বিষয়ের গ্রেড বেছে নিন।`,
        `চতুর্থ বিষয়ের গ্রেড থাকলে সেই ঘরেও গ্রেড বেছে নিন; না থাকলে খালি রাখুন।`,
        `সব মূল বিষয়ের গ্রেড দিলেই জিপিএ, গ্রেড ও পাস-ফেল দেখা যাবে।`,
        `ফলাফলের নিচে দেওয়া সূত্র দিয়ে হিসাবটি মিলিয়ে নিন।`,
      ],
      formula: `সূত্র: জিপিএ = (৬টি মূল বিষয়ের গ্রেড পয়েন্টের যোগফল + চতুর্থ বিষয়ের অতিরিক্ত) ÷ ৬। চতুর্থ বিষয়ের অতিরিক্ত = চতুর্থ বিষয়ের পয়েন্ট − ২, সর্বোচ্চ ৩.০। জিপিএ সর্বোচ্চ ৫.০। গ্রেড পয়েন্ট: A+ ৫.০, A ৪.০, A− ৩.৫, B ৩.০, C ২.০, D ১.০, F ০.০।`,
      example: `উদাহরণ: মূল বিষয়ের গ্রেড পয়েন্ট ৫, ৫, ৪, ৪, ৩.৫ ও ৩; চতুর্থ বিষয় A+ (৫.০)। মূল যোগফল ২৪.৫, চতুর্থ বিষয়ের অতিরিক্ত ৫ − ২ = ৩। জিপিএ = (২৪.৫ + ৩) ÷ ৬ = ৪.৫৮, গ্রেড A।`,
      faq: [
        { q: `চতুর্থ বিষয়ে A+ পেলে কত বাড়তি পয়েন্ট মেলে?`, a: `চতুর্থ বিষয়ের পয়েন্ট থেকে ২ বাদ যায়, আর বাড়তি সর্বোচ্চ ৩.০। তাই A+ (৫.০) দিলে বাড়তি ৩.০ মেলে।` },
        { q: `একটি মূল বিষয়ে F থাকলে কী হয়?`, a: `কোনো মূল বিষয়ে F থাকলে পরীক্ষায় ফেল হয়, আর জিপিএ ০ ধরা হয় — অন্য বিষয়ের গ্রেড যত ভালোই হোক।` },
        { q: `জিপিএ কি ৫.০-এর বেশি হতে পারে?`, a: `না, জিপিএ সর্বোচ্চ ৫.০। হিসাব ৫.০ ছাড়িয়ে গেলেও ফলাফল ৫.০-তেই থামে।` },
        { q: `চতুর্থ বিষয় ছাড়া কি জিপিএ বের করা যায়?`, a: `হ্যাঁ, চতুর্থ বিষয়ের ঘর খালি রাখলে শুধু ৬টি মূল বিষয়ের গড়েই জিপিএ বের হয়।` },
      ],
    },
    en:     {
      title: `SSC/HSC GPA Calculator`,
      intro: `This tool works out the GPA from the grades of the 6 main subjects in an SSC or HSC exam. A 4th subject grade adds extra points.`,
      howTo: [
        `Choose the grade for each main subject.`,
        `If there is a 4th subject grade, choose it too.`,
        `Once all 6 grades are entered, the GPA, grade and pass or fail appear.`,
        `Check the working against the formula shown under the result.`,
      ],
      formula: `Formula: GPA = (sum of the 6 main-subject grade points + 4th-subject extra) ÷ 6. 4th-subject extra = 4th-subject points − 2, capped at 3.0. GPA is capped at 5.0. Grade points: A+ 5.0, A 4.0, A− 3.5, B 3.0, C 2.0, D 1.0, F 0.0.`,
      example: `Example: main grades 5, 5, 4, 4, 3.5 and 3; 4th subject A+ (5.0). Main total 24.5, 4th-subject extra 5 − 2 = 3. GPA = (24.5 + 3) ÷ 6 = 4.58, grade A.`,
      faq: [
        { q: `How many extra points does an A+ in the 4th subject give?`, a: `Two is subtracted from the 4th-subject points, capped at 3.0, so an A+ (5.0) gives 3.0 extra.` },
        { q: `What happens with an F in a main subject?`, a: `An F in any main subject means failing, and the GPA is 0, however good the other grades are.` },
        { q: `Can the GPA go above 5.0?`, a: `No, the GPA is capped at 5.0.` },
        { q: `Can I get a GPA without a 4th subject?`, a: `Yes. Leave the 4th-subject box empty and the GPA is the average of the 6 main subjects.` },
      ],
    },
  },
  'pdf-to-jpg': {
    bn:     {
      title: `পিডিএফ থেকে জেপিজি`,
      intro: `এই টুলটি পিডিএফ ফাইলের প্রতিটি পাতাকে জেপিজি ছবিতে রূপান্তর করে দেয়। ফাইলটি আপনার ডিভাইসেই প্রক্রিয়া হয়, কোথাও আপলোড করা হয় না। ছবি শেয়ার করা, প্রিন্ট করা বা অন্য কাজে ব্যবহার করা সহজ হয়।`,
      howTo: [
        `পিডিএফ ফাইলের ঘরে আপনার .pdf ফাইলটি বেছে নিন।`,
        `ছবির মানের বোতাম থেকে ১×, ১.৫×, ২× বা ৩× বেছে নিন।`,
        `JPG কোয়ালিটির স্লাইডার দিয়ে ছবির মান ৫০% থেকে ১০০%-এর মধ্যে ঠিক করুন।`,
        `তৈরি হওয়া প্রতিটি JPG ছবির পাশে ডাউনলোড বোতাম চেপে সংরক্ষণ করুন।`,
      ],
      formula: `নিয়ম: শুধু .pdf ফাইল চলবে; ফাইল সর্বোচ্চ ১০ MB, একবারে সর্বোচ্চ ৫০ পাতা। ছবির মান: ১× = ৭২ DPI, ১.৫× = ১০৮ DPI, ২× = ১৪৪ DPI, ৩× = ২১৬ DPI। JPG কোয়ালিটি ৫০% থেকে ১০০% পর্যন্ত বাছা যায়।`,
      example: `উদাহরণ: ৩ পাতার একটি পিডিএফ ২× (১৪৪ DPI) ও ৯০% কোয়ালিটিতে রূপান্তর করলে ৩টি JPG ছবি তৈরি হয় — report-p1.jpg, report-p2.jpg ও report-p3.jpg। প্রতিটি ছবি আলাদাভাবে ডাউনলোড করা যায়।`,
      faq: [
        { q: `পাসওয়ার্ড দেওয়া পিডিএফ কি রূপান্তর করা যায়?`, a: `না, পাসওয়ার্ড দেওয়া পিডিএফ রূপান্তর করা যায় না। আগে পাসওয়ার্ড সরিয়ে নিন, তারপর ফাইলটি বাছুন।` },
        { q: `ফাইলটি কি সার্ভারে আপলোড হয়?`, a: `না, সব কাজ আপনার ব্রাউজারেই হয়। পিডিএফ ফাইলটি আপনার ডিভাইস ছাড়ে না।` },
        { q: `৫০ পাতার বেশি পিডিএফ হলে কী করব?`, a: `একবারে সর্বোচ্চ ৫০ পাতা রূপান্তর করা যায়। বড় পিডিএফ ছোট ভাগে ভাগ করে নিন, তারপর আলাদাভাবে রূপান্তর করুন।` },
        { q: `কোন DPI বেছে নেব?`, a: `সাধারণ ব্যবহারের জন্য ১.৫× (১০৮ DPI) যথেষ্ট। প্রিন্ট বা বড় ছবির জন্য ২× বা ৩× বেছে নিন, তবে ফাইলের আকার বড় হবে।` },
      ],
    },
    en:     {
      title: `PDF to JPG`,
      intro: `This tool turns every page of a PDF file into a JPG image. The file is processed on your device and is never uploaded anywhere. The images are easy to share, print or use elsewhere.`,
      howTo: [
        `Choose your .pdf file in the PDF file box.`,
        `Pick an image quality button: 1×, 1.5×, 2× or 3×.`,
        `Set the JPG quality slider between 50% and 100%.`,
        `Download each JPG image with the download button beside it.`,
      ],
      formula: `Rules: only .pdf files work; a file may be at most 10 MB, and at most 50 pages at a time. Quality: 1× = 72 DPI, 1.5× = 108 DPI, 2× = 144 DPI, 3× = 216 DPI. JPG quality can be set from 50% to 100%.`,
      example: `Example: converting a 3-page PDF at 2× (144 DPI) and 90% quality makes 3 JPG images — report-p1.jpg, report-p2.jpg and report-p3.jpg. Each image can be downloaded separately.`,
      faq: [
        { q: `Can I convert a password-protected PDF?`, a: `No, password-protected PDFs cannot be converted. Remove the password first, then choose the file.` },
        { q: `Is my file uploaded to a server?`, a: `No, everything happens in your browser. The PDF never leaves your device.` },
        { q: `What if my PDF has more than 50 pages?`, a: `At most 50 pages can be converted at once. Split a larger PDF into smaller parts first.` },
        { q: `Which DPI should I choose?`, a: `For everyday use, 1.5× (108 DPI) is enough. For printing or larger images choose 2× or 3×, but the files will be bigger.` },
      ],
    },
  },
  'calorie-tdee-calculator': {
    bn:     {
      title: `ক্যালোরি ও টিডিইই ক্যালকুলেটর`,
      intro: `এই টুলটি অনুমান করে আপনার শরীর দিনে কত ক্যালোরি খরচ করে, যাতে আপনি লক্ষ্য অনুযায়ী সঠিক পরিমাণ খেতে পারেন। প্রথমে মিফলিন-সেন্ট জিওর সূত্রে বিএমআর বের হয়, তারপর কাজের ধরনের গুণক দিয়ে গুণ করে টিডিইই পাওয়া যায়।`,
      howTo: [
        `লিঙ্গ থেকে পুরুষ বা নারী বেছে নিন।`,
        `ওজনের ঘরে ওজন কেজিতে ও উচ্চতার ঘরে উচ্চতা সেন্টিমিটারে লিখুন।`,
        `বয়সের ঘরে আপনার বয়স বছর হিসেবে লিখুন।`,
        `কাজের ধরন বেছে নিন, তারপর ফলাফলে বিএমআর ও টিডিইই দেখুন।`,
      ],
      formula: `সূত্র: পুরুষের বিএমআর = ১০ × ওজন (কেজি) + ৬.২৫ × উচ্চতা (সেমি) − ৫ × বয়স + ৫; নারীর ক্ষেত্রে শেষে + ৫-এর বদলে − ১৬১। টিডিইই = বিএমআর × কাজের গুণক (বসে থাকা ১.২, হালকা ১.৩৭৫, মাঝারি ১.৫৫, সক্রিয় ১.৭২৫, খুব সক্রিয় ১.৯)।`,
      example: `উদাহরণ: ৩০ বছর বয়সী পুরুষ, ওজন ৮০ কেজি, উচ্চতা ১৮০ সেমি। বিএমআর = ৮০০ + ১,১২৫ − ১৫০ + ৫ = ১,৭৮০ ক্যালোরি। মাঝারি কাজে টিডিইই = ১,৭৮০ × ১.৫৫ ≈ ২,৭৫৯ ক্যালোরি/দিন। এই পরিমাণ খেলে ওজন প্রায় একই থাকবে।`,
      faq: [
        { q: `টিডিইই আর বিএমআর-এর পার্থক্য কী?`, a: `বিএমআর হলো বিশ্রামে শরীরের খরচ, আর টিডিইই হলো বিএমআর-কে কাজের গুণক দিয়ে গুণ করা মোট দৈনিক খরচ।` },
        { q: `ওজন কমাতে কত ক্যালোরি খাব?`, a: `টিডিইই থেকে দিনে প্রায় ৫০০ ক্যালোরি কম খেলে সপ্তাহে প্রায় আধা কেজি কমতে পারে। এটি একটি সাধারণ নির্দেশিকা, চিকিৎসা পরামর্শ নয়।` },
        { q: `কাজের স্তর ভুল বাছলে কী হয়?`, a: `মাঝারি বাছলে ফলাফল বেশি দেখায়। সাপ্তাহিক ব্যায়াম ও হাঁটা সততার সঙ্গে হিসাব করুন।` },
        { q: `ফলাফল না মিললে কী করব?`, a: `ফলাফলকে শুরুর হিসাব ধরুন: দুই-তিন সপ্তাহ মেনে চলুন, ওজনের ধারা দেখুন, তারপর একবারে ২০০ ক্যালোরি করে সমন্বয় করুন।` },
      ],
    },
    en:     {
      title: `Calorie & TDEE Calculator`,
      intro: `This tool estimates how many calories your body uses in a day, so you can eat the right amount for your goal. It first works out BMR with the Mifflin-St Jeor equation, then multiplies by an activity factor to give TDEE.`,
      howTo: [
        `Choose male or female.`,
        `Enter weight in kilograms and height in centimetres.`,
        `Enter your age in years.`,
        `Choose your activity level, then read BMR and TDEE.`,
      ],
      formula: `Formula: for men, BMR = 10 × weight (kg) + 6.25 × height (cm) − 5 × age + 5; for women the last term is −161. TDEE = BMR × activity factor (1.2 to 1.9).`,
      example: `Example: a 30-year-old man, 80 kg, 180 cm. BMR = 800 + 1,125 − 150 + 5 = 1,780 kcal. At moderate activity, TDEE = 1,780 × 1.55 ≈ 2,759 kcal/day.`,
      faq: [
        { q: `What is the difference between TDEE and BMR?`, a: `BMR is energy used at rest; TDEE is BMR times an activity factor, the total for the day.` },
        { q: `How many calories for weight loss?`, a: `About 500 fewer calories a day than your TDEE should lead to roughly half a kilogram of fat loss a week.` },
        { q: `What happens if I pick the wrong activity level?`, a: `Many people pick moderate when their real life is sedentary, overstating the result by several hundred calories.` },
        { q: `What if the result does not match?`, a: `Treat it as a starting point: follow it for two or three weeks, then adjust by 200 calories at a time.` },
      ],
    },
  },
  'tip-calculator': {
    bn:     {
      title: `টিপ ক্যালকুলেটর`,
      intro: `এই টুলটি ভালো সেবার জন্য বাড়তি কত টাকা দেবেন আর মোট বিল কত হবে তা বের করে দেয়, যাতে টেবিলে বসে হিসাব করতে না হয়। বিলের পরিমাণ ও টিপের শতাংশ লিখুন, আর ভাগ হলে প্রত্যেকের ভাগও দেখে নিন।`,
      howTo: [
        `বিলের পরিমাণের ঘরে বিলের মোট টাকা লিখুন।`,
        `টিপের ঘরে শতাংশ লিখুন, বা দেওয়া বোতাম থেকে বেছে নিন।`,
        `কতজন ভাগ করবে সেই ঘরে লোকের সংখ্যা লিখুন।`,
        `ফলাফলে টিপ, মোট বিল ও প্রত্যেকে কত দেবে তা দেখুন।`,
      ],
      formula: `সূত্র: টিপ = বিল × শতাংশ ÷ ১০০; মোট = বিল + টিপ; প্রত্যেকে = মোট ÷ লোকের সংখ্যা।`,
      example: `উদাহরণ: বিল ২,০০০ টাকা, টিপ ১০%। টিপ = ২,০০০ × ১০ ÷ ১০০ = ২০০ টাকা; মোট ২,২০০ টাকা। ১৫% দিলে টিপ ৩০০ টাকা, মোট ২,৩০০ টাকা; ২০% দিলে টিপ ৪০০ টাকা, মোট ২,৪০০ টাকা। চারজনে ভাগ করলে ১০%-এ প্রত্যেকে ৫৫০ টাকা দেবে।`,
      faq: [
        { q: `কত শতাংশ টিপ দেওয়া ঠিক?`, a: `অনেক রেস্তোরাঁয় ১০% সাধারণ শুরু, ভালো সেবায় ১৫% উদার, আর ২০% স্পষ্টভাবে ভালো সেবার জন্য।` },
        { q: `বিলে সার্ভিস চার্জ থাকলে কি আবার টিপ দেব?`, a: `আগে রসিদ দেখে নিন। সার্ভিস চার্জে টিপ ধরা থাকতে পারে, তখন আবার পুরো টিপ দিলে দুবার দেওয়া হবে।` },
        { q: `বিল সমান ভাগে না ভাগ হলে কী করব?`, a: `প্রত্যেকের নিজের অংশ আলাদাভাবে লিখুন, সবার ওপর একই শতাংশ প্রয়োগ করুন, তাহলে প্রত্যেকে ন্যায্য পরিমাণ দেবে।` },
        { q: `করের আগে না পরে টিপ ধরব?`, a: `টুলটিতে করের ঘর আছে; করের আগে বা পরে বেছে নিন। কর না লিখলে দুটি একই হয়।` },
      ],
    },
    en:     {
      title: `Tip Calculator`,
      intro: `A tip calculator works out how much extra to leave for good service and what the total bill comes to. Enter the bill and the tip percentage, and see each person's share when the bill is split.`,
      howTo: [
        `Enter the total bill amount.`,
        `Enter the tip percentage, or tap a preset chip.`,
        `Enter how many people are splitting the bill.`,
        `Read the tip, the total and what each person pays.`,
      ],
      formula: `Formula: tip = bill × percentage ÷ 100; total = bill + tip; per person = total ÷ people.`,
      example: `Example: a bill of 2,000 taka with a 10% tip. Tip = 2,000 × 10 ÷ 100 = 200 taka; total 2,200 taka. At 15% the tip is 300 taka; at 20% it is 400 taka. Split between four people at 10%, each pays 550 taka.`,
      faq: [
        { q: `What tip percentage is right?`, a: `In many restaurants 10% is a common starting point, 15% is generous for good service, and 20% is for clearly better service.` },
        { q: `Should I tip again if a service charge is already added?`, a: `Check the receipt first. The service charge may already cover the tip, so another full tip would pay twice.` },
        { q: `What if the bill should not be split equally?`, a: `Enter each person's own share separately and apply the same percentage to each.` },
        { q: `Should the tip be on the pre-tax or post-tax amount?`, a: `Use the tax box and choose pre-tax or post-tax; with no tax entered, both are the same.` },
      ],
    },
  },
};

export function toolGuideSectionsBySlug(slug: string): ToolGuideSections | undefined {
  return TOOL_GUIDE_SECTIONS[slug];
}

export const TOOLS_GUIDES: Record<string, { guideBn: string; guideEn: string }> = {
  'credit-card-payoff-calculator': {
    guideEn: `A credit card payoff calculator shows how long it will take to clear a card balance, and how much interest you will pay along the way. Credit card interest is charged monthly on the unpaid balance, so paying only the minimum each month keeps the debt alive for a long time. You enter the current balance, the annual interest rate, and the fixed amount you plan to pay each month, and the tool works out the number of months until the card is clear and the total interest paid. The maths behind it is the same amortisation idea used for loans: each month interest is added on the balance at the monthly rate, which is the annual rate divided by 12, and then your payment reduces the balance. The balance only falls when the payment is larger than that month's interest, so a payment barely above the interest charge makes almost no progress. For a worked example, take a balance of 100,000 at a 24 percent annual rate, which is a monthly rate of 0.02. Paying 5,000 a month clears the card in about 26 months and costs about 29,000 in interest. Paying only 2,500 a month stretches the payoff to about 81 months and costs about 103,000 in interest, more than the original balance. The same debt costs more than three times as much interest simply because the monthly payment was halved. That comparison is the point of the tool. It also shows why a small increase in the monthly payment helps so much: raising the payment from 5,000 to 6,000 in the example above cuts several months off the payoff and saves thousands in interest, because more of every payment reaches the principal. A practical tip is to pay the highest-rate card first while making at least the minimum payment on every other card, and to stop adding new spending to a card you are trying to clear, since new purchases restart the interest clock on fresh amounts. If the balance feels unmanageable, contact the card issuer to ask about a lower rate or a structured repayment plan before missing payments, because missed payments add fees and damage your credit record. Remember that the rate you enter should match the rate on your statement, and that this tool estimates payoff time from a fixed monthly payment, not from changing minimum-payment rules.`,
    guideBn: `ক্রেডিট কার্ড পে-অফ ক্যালকুলেটর দেখায় কার্ডের বকেয়া শোধ করতে কত সময় লাগবে এবং পথে কত সুদ দিতে হবে। ক্রেডিট কার্ডের সুদ প্রতি মাসে অপরিশোধিত বকেয়ার ওপর ধরা হয়, তাই শুধু সর্বনিম্ন টাকা দিতে থাকলে ঋণ অনেক বছর ধরে টিকে থাকে, আর আপনার দেওয়া টাকার বেশিরভাগই সুদে চলে যায়, আসল কমে খুব কম। আপনি বর্তমান বকেয়া, বার্ষিক সুদের হার এবং প্রতি মাসে কত টাকা দেবেন তা লিখলে টুলটি হিসাব করে কত মাসে কার্ড শোধ হবে এবং মোট কত সুদ দিতে হবে। এর পেছনের হিসাব ঋণের অ্যামর্টাইজেশনের মতোই: প্রতি মাসে মাসিক হারে বকেয়ার ওপর সুদ যোগ হয়, মাসিক হার হলো বার্ষিক হারকে 12 দিয়ে ভাগ করলে যা হয়, তারপর আপনার দেওয়া টাকা বকেয়া কমায়। বকেয়া তখনই কমে যখন দেওয়া টাকা সেই মাসের সুদের চেয়ে বেশি হয়, তাই সুদের সামান্য ওপরে টাকা দিলে প্রায় কোনো অগ্রগতি হয় না। একটি উদাহরণ দেখা যাক: বকেয়া 100,000 টাকা, বার্ষিক হার 24 শতাংশ, অর্থাৎ মাসিক হার 0.02। মাসে 5,000 টাকা করে দিলে কার্ড শোধ হয় প্রায় 26 মাসে, আর সুদ দিতে হয় প্রায় 29,000 টাকা। মাসে মাত্র 2,500 টাকা দিলে শোধ হতে লাগে প্রায় 81 মাস, আর সুদ দিতে হয় প্রায় 103,000 টাকা — মূল বকেয়ার চেয়েও বেশি। একই ঋণে মাসিক দেওয়া অর্ধেক করায় সুদের খরচ বেড়ে যায় তিন গুণের বেশি। এই তুলনাটাই এই টুলের আসল উদ্দেশ্য। এটা আরও দেখায় মাসিক দেওয়া সামান্য বাড়ালে কতটা উপকার হয়: ওপরের উদাহরণে 5,000 টাকার বদলে 6,000 টাকা দিলে শোধের সময় কয়েক মাস কমে যায় এবং হাজার হাজার টাকা সুদ বাঁচে, কারণ প্রতিটি দেওয়ার বেশি অংশ আসলে পৌঁছায়। ব্যবহারিক পরামর্শ হলো সবচেয়ে বেশি হারের কার্ডটি আগে শোধ করুন, আর অন্য সব কার্ডে অন্তত সর্বনিম্ন টাকাটা দিতে থাকুন। আর যে কার্ডটি শোধ করার চেষ্টা করছেন, তাতে নতুন খরচ যোগ করা বন্ধ করুন, কারণ নতুন কেনাকাটায় নতুন টাকার ওপর আবার সুদ ধরা শুরু হয়। বকেয়া সামলানো কঠিন মনে হলে কিস্তি মিস করার আগে কার্ডের প্রতিষ্ঠানের সঙ্গে যোগাযোগ করে কম হার বা কাঠামোবদ্ধ পরিশোধ পরিকল্পনার কথা জিজ্ঞাসা করুন, কারণ মিস করা কিস্তিতে ফি যোগ হয় এবং আপনার ক্রেডিট রেকর্ড ক্ষতিগ্রস্ত হয়। মনে রাখবেন, আপনি যে হার লিখবেন তা আপনার স্টেটমেন্টের হারের সঙ্গে মিলতে হবে, আর এই টুলটি নির্দিষ্ট মাসিক দেওয়ার ভিত্তিতে শোধের সময়ের অনুমান দেয়, পরিবর্তনশীল সর্বনিম্ন কিস্তির নিয়মের ভিত্তিতে নয়।`,
  },
  'retirement-savings-planner': {
    guideEn: `A retirement savings planner helps you work out how much to save each month so you can stop working with enough money to live on. Small regular deposits, left to grow for decades, can become a large sum because each deposit earns returns for years. The tool takes your current age, the age you plan to retire, how much you have saved already, how much you can add each month, and an assumed annual return, and it projects the final amount. The maths uses the future value of a series of monthly deposits. If you deposit the same amount every month at a monthly rate r for n months, the deposits grow to PMT times ((1 + r) to the power n minus 1) divided by r, where PMT is the monthly deposit. Your existing savings grow separately by compound interest. For a worked example, suppose you save 10,000 a month at an assumed 8 percent annual return, which is a monthly rate of about 0.00667, for 20 years, or 240 months. The deposits grow to about 5,893,000, while you only paid in 2,400,000, so about 3,493,000 comes from growth alone. Starting ten years earlier, at 30 years, the same monthly deposit would grow to about 14,916,000, which shows why time matters more than the deposit size. The planner also works backwards: enter the amount you want at retirement and it shows the monthly deposit needed to reach it. Inflation is the part people forget. Prices rise over time, so 5,890,000 in twenty years will buy less than the same amount buys today. To allow for this, some planners let you enter a lower real return, which is the investment return minus inflation, and that gives a figure in today's buying power. A commonly cited rule of thumb is that you can withdraw about 4 percent of your savings each year in retirement without running out quickly, so 5,893,000 would support about 235,700 a year, or about 19,600 a month, before tax. A practical tip is to increase your monthly deposit a little each year, for example when your pay rises, because even a small annual increase compounds into a large difference over twenty years. The return you enter is an assumption, not a guarantee: real returns vary, and this tool does not account for taxes, fees, or pension rules.`,
    guideBn: `অবসর সঞ্চয় পরিকল্পনাকারী আপনাকে হিসাব করতে সাহায্য করে প্রতি মাসে কত টাকা জমাতে হবে, যাতে কাজ বন্ধ করার পর জীবনযাপনের জন্য যথেষ্ট টাকা থাকে। ধারণাটি সহজ: নিয়মিত অল্প অল্প জমা, কয়েক দশক ধরে বাড়তে দিলে, বড় অঙ্কে পরিণত হতে পারে, কারণ প্রতিটি জমা বহু বছর ধরে লাভ দেয়। এই টুলটি আপনার বর্তমান বয়স, কত বছর বয়সে অবসর নিতে চান, এখন কত জমা আছে, প্রতি মাসে কত যোগ করতে পারেন এবং ধরে নেওয়া বার্ষিক লাভের হার নিয়ে শেষের পরিমাণের পূর্বাভাস দেয়। হিসাবটি মাসিক জমার ভবিষ্যৎ মূল্যের সূত্রে করা হয়। মাসিক হার r-এ n মাস ধরে প্রতি মাসে একই টাকা জমা দিলে জমাগুলো বেড়ে হয় PMT গুণ ((1 + r) এর n ঘাত বিয়োগ 1) ভাগ r, যেখানে PMT মাসিক জমা। আপনার আগের সঞ্চয় আলাদাভাবে চক্রবৃদ্ধি হারে বাড়ে। একটি উদাহরণ দেখা যাক: ধরা যাক আপনি 8 শতাংশ বার্ষিক লাভের ধারণায়, অর্থাৎ মাসিক হার প্রায় 0.00667-এ, 20 বছর বা 240 মাস ধরে প্রতি মাসে 10,000 টাকা করে জমা দিচ্ছেন। জমাগুলো বেড়ে হয় প্রায় 5,893,000 টাকা, অথচ আপনি জমা দিয়েছেন মাত্র 2,400,000 টাকা, অর্থাৎ প্রায় 3,493,000 টাকা আসে শুধু বৃদ্ধি থেকে। দশ বছর আগে শুরু করলে, 30 বছরে একই মাসিক জমা বেড়ে হতো প্রায় 14,916,000 টাকা, যা দেখায় জমার অঙ্কের চেয়ে সময় বেশি গুরুত্বপূর্ণ। পরিকল্পনাকারী উল্টোভাবেও কাজ করে: অবসরের সময় কত টাকা চান তা লিখলে সেখানে পৌঁছাতে মাসে কত জমাতে হবে তা দেখায়। মূল্যস্ফীতিই সেই অংশ যা মানুষ ভুলে যায়। সময়ের সঙ্গে দাম বাড়ে, তাই বিশ বছর পরের 5,890,000 টাকায় আজকের সমান টাকার চেয়ে কম জিনিস কেনা যাবে। এ জন্য কিছু পরিকল্পনাকারীতে কম বাস্তব লাভের হার লেখা যায়, যা বিনিয়োগের লাভ থেকে মূল্যস্ফীতি বাদ দিলে থাকে, আর তাতে আজকের ক্রয়ক্ষমতায় হিসাব পাওয়া যায়। একটি বহুল প্রচলিত ধারণা হলো অবসরে প্রতি বছর সঞ্চয়ের প্রায় 4 শতাংশ তুলে খরচ করা যায়, আর তাতে টাকা দ্রুত শেষ হয় না, তাই 5,893,000 টাকা থেকে বছরে প্রায় 235,700 টাকা বা মাসে প্রায় 19,600 টাকা পাওয়া যাবে, করের আগে। ব্যবহারিক পরামর্শ হলো প্রতি বছর মাসিক জমা সামান্য বাড়ান, যেমন বেতন বাড়লে, কারণ বিশ বছরে সামান্য বার্ষিক বৃদ্ধিও চক্রবৃদ্ধি হয়ে বড় পার্থক্য তৈরি করে। মনে রাখবেন, আপনি যে লাভের হার লিখবেন তা একটি ধারণা, কোনো নিশ্চয়তা নয়: বাস্তবে লাভ কমবেশি হয়, আর এই টুলটি কর, ফি বা পেনশনের নিয়ম হিসাব করে না, তাই ফলাফলকে পরিকল্পনার একটি নির্দেশিকা হিসেবে নিন।`,
  },
  'bank-emi-dps-fdr-calculator': {
    guideEn: `A bank EMI, DPS, and FDR calculator covers the three most common bank products in one place, so you can compare borrowing against saving before deciding. The EMI part works out the fixed monthly instalment on a loan, using the standard formula EMI equals P times r times (1 + r) to the power n, divided by ((1 + r) to the power n minus 1), where P is the loan amount, r is the monthly rate, and n is the number of payments. A DPS, or deposit pension scheme, is the opposite direction: you deposit a fixed amount every month for a set term, and the bank pays back the deposits plus profit at maturity. Its maturity value uses the future value of monthly deposits: PMT times ((1 + r) to the power n minus 1) divided by r, where PMT is the monthly deposit and r is the monthly rate. For a worked example, deposit 5,000 a month at an 8 percent annual rate, which is a monthly rate of about 0.00667, for 5 years, or 60 months. The maturity value is about 367,423, while you paid in 300,000, so the profit is about 67,423. An FDR, or fixed deposit receipt, is a single lump sum kept with the bank for a fixed term. Its value is A equals P times (1 + r) to the power t, where P is the deposit, r is the annual rate, and t is the years. For example, 100,000 kept for one year at 8 percent grows to 108,000, a profit of 8,000, and for two years with yearly compounding it grows to about 116,640. The three products answer different questions: EMI tells you what borrowing costs, DPS builds savings by habit, and FDR locks a lump sum away at a known return. A practical tip is to compare the return after tax and fees, not the headline rate, because profit on deposits may be taxed and deducted at source, and breaking an FDR early usually loses part of the profit, so check the early-encashment rule before locking money away. Also compare the DPS maturity value with the total EMI cost of a loan of the same size, because saving first and buying later is often cheaper than borrowing. Enter the rates your own bank quotes, since rates differ between banks and change over time.`,
    guideBn: `ব্যাংক ইএমআই, ডিপিএস ও এফডিআর ক্যালকুলেটর তিনটি সবচেয়ে প্রচলিত ব্যাংক পণ্যের হিসাব এক জায়গায় দেয়, যাতে সিদ্ধান্ত নেওয়ার আগে ধার নেওয়ার সঙ্গে সঞ্চয়ের তুলনা করা যায়। ইএমআই অংশে ঋণের নির্দিষ্ট মাসিক কিস্তি বের করা হয় প্রচলিত সূত্রে: ইএমআই সমান P গুণ r গুণ (1 + r) এর n ঘাত, ভাগ করে ((1 + r) এর n ঘাত বিয়োগ 1) দিয়ে, যেখানে P ঋণের পরিমাণ, r মাসিক হার এবং n কিস্তির সংখ্যা। ডিপিএস বা ডিপোজিট পেনশন স্কিম হলো উল্টো দিক: আপনি নির্দিষ্ট মেয়াদের জন্য প্রতি মাসে নির্দিষ্ট টাকা জমা দেন, আর মেয়াদ শেষে ব্যাংক জমা টাকার সঙ্গে মুনাফা ফেরত দেয়। এর মেয়াদপূর্তির মূল্য মাসিক জমার ভবিষ্যৎ মূল্যের সূত্রে বের হয়: PMT গুণ ((1 + r) এর n ঘাত বিয়োগ 1) ভাগ r, যেখানে PMT মাসিক জমা এবং r মাসিক হার। একটি উদাহরণ দেখা যাক: 8 শতাংশ বার্ষিক হারে, অর্থাৎ মাসিক হার প্রায় 0.00667-এ, 5 বছর বা 60 মাস ধরে প্রতি মাসে 5,000 টাকা জমা দিলে মেয়াদপূর্তির মূল্য হয় প্রায় 367,423 টাকা, অথচ আপনি জমা দিয়েছেন 300,000 টাকা, অর্থাৎ মুনাফা প্রায় 67,423 টাকা। এফডিআর বা ফিক্সড ডিপোজিট রিসিপ্ট হলো নির্দিষ্ট মেয়াদের জন্য ব্যাংকে রাখা এককালীন টাকা। এর মূল্য A সমান P গুণ (1 + r) এর t ঘাত, যেখানে P জমার টাকা, r বার্ষিক হার এবং t বছর। যেমন 100,000 টাকা এক বছরের জন্য 8 শতাংশ হারে রাখলে হয় 108,000 টাকা, মুনাফা 8,000 টাকা, আর দুই বছর বার্ষিক চক্রবৃদ্ধিতে রাখলে হয় প্রায় 116,640 টাকা। তিনটি পণ্য তিনটি আলাদা প্রশ্নের উত্তর দেয়: ইএমআই জানায় ধার নিতে কত খরচ, ডিপিএস অভ্যাসে সঞ্চয় গড়ে তোলে, আর এফডিআর এককালীন টাকা নির্দিষ্ট লাভে আটকে রাখে। ব্যবহারিক পরামর্শ হলো মূল হারের বদলে কর ও ফি বাদ দিয়ে আসল লাভের তুলনা করুন, কারণ আমানতের মুনাফায় কর কাটা হতে পারে, আর এফডিআর মেয়াদের আগে ভাঙলে সাধারণত মুনাফার একটি অংশ নষ্ট হয়, তাই টাকা আটকে রাখার আগে আগাম ভাঙার নিয়ম দেখে নিন। একই অঙ্কের ঋণের মোট ইএমআই খরচের সঙ্গে ডিপিএসের মেয়াদপূর্তির মূল্যের তুলনা করুন, কারণ আগে সঞ্চয় করে পরে কেনা প্রায়ই ধার নেওয়ার চেয়ে সস্তা হয়। আপনার নিজের ব্যাংকের জানানো হার লিখুন, কারণ ব্যাংকভেদে হার আলাদা হয় এবং সময়ের সঙ্গে বদলায়।`,
  },
  'discount-vat-profit-calculator': {
    guideEn: `A discount, VAT, and profit calculator helps shopkeepers, online sellers, and buyers check prices quickly and avoid mistakes at the till. The three calculations look similar but answer different questions, and mixing them up is a common source of lost money. A discount reduces the marked price: the price you pay equals the marked price times (1 minus the discount rate). For a worked example, a marked price of 2,000 with a 25 percent discount means you pay 2,000 times 0.75, which is 1,500, saving 500. Two discounts do not simply add up: a 20 percent discount followed by another 10 percent gives 2,000 times 0.8 times 0.9, which is 1,440, not 1,400, because the second discount applies to the already reduced price. VAT, or value added tax, is charged at the rate you enter, because rates differ by place and product and change over time. If the price excludes VAT, the VAT amount is the price times the rate, so a price of 1,000 at a user-entered rate of 15 percent adds 150, making the total 1,150. If the price already includes VAT, the VAT inside it is the total times the rate divided by (1 plus the rate): 1,150 times 15 divided by 115 equals 150. Profit is the difference between selling price and cost, and it is measured two ways that are often confused. Profit margin is profit divided by selling price, while markup is profit divided by cost. For example, buying at 800 and selling at 1,000 gives a profit of 200, a margin of 200 divided by 1,000, which is 20 percent, and a markup of 200 divided by 800, which is 25 percent. A practical tip is to set your selling price from the margin you need, not from a markup you guessed: if you need a 20 percent margin and the cost is 800, the price must be 800 divided by 0.8, which is 1,000. Check the VAT rate that applies to your product before quoting a price, and always write the rate you used next to the result.`,
    guideBn: `ছাড়, ভ্যাট ও লাভের ক্যালকুলেটর দোকানদার, অনলাইন বিক্রেতা ও ক্রেতাদের দাম দ্রুত যাচাই করতে এবং হিসাবের ভুল এড়াতে সাহায্য করে। তিনটি হিসাব দেখতে একই রকম হলেও তিনটি আলাদা প্রশ্নের উত্তর দেয়, আর এগুলো গুলিয়ে ফেললে প্রায়ই টাকা নষ্ট হয়। ছাড় নির্ধারিত দাম কমায়: আপনি যে দাম দেবেন তা সমান নির্ধারিত দাম গুণ (1 বিয়োগ ছাড়ের হার)। একটি উদাহরণ দেখা যাক: 2,000 টাকা নির্ধারিত দামে 25 শতাংশ ছাড় হলে দিতে হয় 2,000 গুণ 0.75, অর্থাৎ 1,500 টাকা, বাঁচে 500 টাকা। দুটি ছাড় সরাসরি যোগ হয় না: 20 শতাংশ ছাড়ের পর আরও 10 শতাংশ ছাড় দিলে হয় 2,000 গুণ 0.8 গুণ 0.9, অর্থাৎ 1,440 টাকা, 1,400 টাকা নয়, কারণ দ্বিতীয় ছাড়টি কমানো দামের ওপর ধরা হয়। ভ্যাট বা মূল্য সংযোজন কর ধরা হয় আপনি যে হার লিখবেন সেই হারে, কারণ জায়গা ও পণ্যভেদে হার আলাদা হয় এবং সময়ের সঙ্গে বদলায়। দামে ভ্যাট না থাকলে ভ্যাটের পরিমাণ হলো দাম গুণ হার, তাই 1,000 টাকার দামে আপনি লেখা 15 শতাংশ হারে ভ্যাট যোগ হয় 150 টাকা, মোট হয় 1,150 টাকা। দামে ভ্যাট আগেই থাকলে তার ভেতরের ভ্যাট হলো মোট দাম গুণ হার ভাগ (1 যোগ হার): 1,150 গুণ 15 ভাগ 115 সমান 150 টাকা। লাভ হলো বিক্রয়মূল্য ও খরচের পার্থক্য, আর এটি দুভাবে মাপা হয় যা প্রায়ই গুলিয়ে যায়। লাভের মার্জিন হলো লাভ ভাগ বিক্রয়মূল্য, আর মার্কআপ হলো লাভ ভাগ খরচ। যেমন 800 টাকায় কিনে 1,000 টাকায় বিক্রি করলে লাভ 200 টাকা, মার্জিন 200 ভাগ 1,000, অর্থাৎ 20 শতাংশ, আর মার্কআপ 200 ভাগ 800, অর্থাৎ 25 শতাংশ। ব্যবহারিক পরামর্শ হলো বিক্রয়মূল্য ঠিক করুন আপনার প্রয়োজনীয় মার্জিন থেকে, অনুমান করা মার্কআপ থেকে নয়: 20 শতাংশ মার্জিন চাইলে এবং খরচ 800 টাকা হলে দাম হতে হবে 800 ভাগ 0.8, অর্থাৎ 1,000 টাকা। দাম বলার আগে আপনার পণ্যে কোন ভ্যাট হার প্রযোজ্য তা দেখে নিন, আর ফলাফলের পাশে আপনি যে হার ব্যবহার করেছেন তা লিখে রাখুন। দোকানে কেনার আগে ছাড়ের পরের দাম নিজে হিসাব করে নিলে ভুল ধরা সহজ হয়।`,
  },
  'macro-nutrient-calculator': {
    guideEn: `A macro nutrient calculator splits your daily calories into protein, carbohydrates, and fat, the three nutrients that supply energy, so you can plan meals that match your goal. Each gram of protein gives 4 calories, each gram of carbohydrate gives 4 calories, and each gram of fat gives 9 calories, which is why fat is the most energy-dense of the three. You enter your daily calorie target, usually from a TDEE calculator, and the share of calories you want from each macro, and the tool converts those shares into grams per day. For a worked example, take a daily target of 2,000 calories split as 25 percent protein, 50 percent carbohydrates, and 25 percent fat. Protein is 25 percent of 2,000, which is 500 calories, and 500 divided by 4 gives 125 grams of protein. Carbohydrates are 50 percent, which is 1,000 calories, and 1,000 divided by 4 gives 250 grams. Fat is 25 percent, which is 500 calories, and 500 divided by 9 gives about 56 grams of fat. The three grams add up to the full 2,000 calories, and the tool shows the same breakdown for any split you choose. Common splits vary by goal: people aiming to build or keep muscle often raise protein to around 30 percent of calories, while endurance athletes often raise carbohydrates, and people reducing calories sometimes keep protein high because it helps with fullness and muscle retention. A useful cross-check is protein per kilogram of body weight: many active adults aim for roughly 1.6 to 2.2 grams of protein per kilogram a day, so a 70-kilogram person would aim for about 112 to 154 grams, which you can compare with the calculator's result. A practical tip is to track what you actually eat for one week before changing anything, because most people misjudge their current protein and fat intake by a wide margin, and the calculator can only help once the starting point is honest. This guide is general information, not medical advice; if you have kidney disease, diabetes, or another condition that affects diet, see a doctor or a registered dietitian.`,
    guideBn: `ম্যাক্রো পুষ্টি ক্যালকুলেটর আপনার দৈনিক ক্যালোরিকে প্রোটিন, শর্করা ও চর্বিতে ভাগ করে, এই তিনটি পুষ্টি শক্তি দেয়, যাতে আপনি আপনার লক্ষ্যের সঙ্গে মিলিয়ে খাবারের পরিকল্পনা করতে পারেন। প্রতি গ্রাম প্রোটিনে 4 ক্যালোরি, প্রতি গ্রাম শর্করায় 4 ক্যালোরি এবং প্রতি গ্রাম চর্বিতে 9 ক্যালোরি থাকে, তাই তিনটির মধ্যে চর্বিতেই সবচেয়ে বেশি শক্তি থাকে। আপনি দৈনিক ক্যালোরির লক্ষ্য লিখবেন, সাধারণত টিডিইই ক্যালকুলেটর থেকে পাওয়া, আর প্রতিটি ম্যাক্রো থেকে কত শতাংশ ক্যালোরি চান তা লিখবেন, আর টুলটি সেই ভাগগুলোকে প্রতিদিনের গ্রামে রূপান্তর করে দেয়। একটি উদাহরণ দেখা যাক: দৈনিক লক্ষ্য 2,000 ক্যালোরি, ভাগ 25 শতাংশ প্রোটিন, 50 শতাংশ শর্করা ও 25 শতাংশ চর্বি। প্রোটিন হলো 2,000-এর 25 শতাংশ, অর্থাৎ 500 ক্যালোরি, আর 500 ভাগ 4 দিলে হয় 125 গ্রাম প্রোটিন। শর্করা 50 শতাংশ, অর্থাৎ 1,000 ক্যালোরি, আর 1,000 ভাগ 4 দিলে হয় 250 গ্রাম। চর্বি 25 শতাংশ, অর্থাৎ 500 ক্যালোরি, আর 500 ভাগ 9 দিলে হয় প্রায় 56 গ্রাম চর্বি। তিনটি গ্রাম মিলিয়ে পুরো 2,000 ক্যালোরি হয়, আর আপনি যে ভাগই বেছে নিন টুলটি একইভাবে হিসাব দেখায়। লক্ষ্য অনুযায়ী প্রচলিত ভাগ আলাদা হয়: পেশি গড়তে বা ধরে রাখতে চাওয়া মানুষেরা প্রায়ই প্রোটিন বাড়িয়ে ক্যালোরির প্রায় 30 শতাংশ করেন, আর ধৈর্যশীল খেলাধুলা করা মানুষেরা প্রায়ই শর্করা বাড়ান, আর ক্যালোরি কমাতে চাওয়া মানুষেরা প্রোটিন বেশি রাখেন, কারণ এতে পেট ভরা থাকে ও পেশি ধরে রাখা সহজ হয়। একটি দরকারি যাচাই হলো প্রতি কিলোগ্রাম শরীরের ওজনে প্রোটিন: অনেক সক্রিয় প্রাপ্তবয়স্ক দিনে প্রতি কিলোগ্রামে প্রায় 1.6 থেকে 2.2 গ্রাম প্রোটিনের লক্ষ্য রাখেন, তাই 70 কিলোগ্রামের একজন মানুষের লক্ষ্য হয় প্রায় 112 থেকে 154 গ্রাম, যা আপনি ক্যালকুলেটরের ফলাফলের সঙ্গে মিলিয়ে দেখতে পারেন। ব্যবহারিক পরামর্শ হলো কিছু বদলানোর আগে এক সপ্তাহ আপনি আসলে কী খান তা লিখে রাখুন, কারণ বেশিরভাগ মানুষ বর্তমানে কত প্রোটিন ও চর্বি খান তা অনেক ভুল অনুমান করেন, আর শুরুর হিসাব সঠিক হলে তবেই ক্যালকুলেটর কাজে আসে। এই গাইডটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়; আপনার কিডনির রোগ, ডায়াবেটিস বা খাবারে প্রভাব ফেলে এমন কোনো অসুস্থতা থাকলে চিকিৎসক বা নিবন্ধিত পুষ্টিবিদের কাছে যান।`,
  },
  'pregnancy-due-date-calculator': {
    guideEn: `A pregnancy due date calculator estimates when a baby is likely to be born, from the first day of the last menstrual period, known as the LMP. A full pregnancy lasts about 40 weeks, or 280 days, counted from the LMP, even though conception usually happens about two weeks later, around ovulation. The tool adds 280 days to the LMP date to give the estimated due date, and it also shows the current week of pregnancy and the start of each trimester: the first trimester runs from week 1 to week 13, the second from week 14 to week 27, and the third from week 28 to birth. For a worked example, if the LMP is 1 January 2026, adding 280 days gives a due date of 8 October 2026. The same calculation can be done with an ovulation date instead: add 266 days, or 38 weeks, to the conception date, which gives the same result when ovulation fell 14 days after the LMP. The calculator can also estimate the ovulation window for planning, which usually falls about 14 days before the next expected period in a regular cycle, though cycle length varies between people and even between months. It is important to understand what the date means: only a small share of babies arrive exactly on the due date, and most arrive within two weeks before or after it, so the date is a planning guide for check-ups, leave, and preparation, not a fixed appointment. An early ultrasound scan can refine the estimate, and a doctor may adjust the date if the scan and the LMP disagree. A practical tip is to note the due date together with the trimester dates and the dates of routine antenatal visits, so nothing is missed, and to pack a hospital bag a few weeks early, since early arrival is common. This guide is general information, not medical advice, and the result is an estimate, not a diagnosis; always follow the advice of your own doctor or midwife.`,
    guideBn: `গর্ভাবস্থার সম্ভাব্য প্রসবের তারিখের ক্যালকুলেটর শেষ মাসিকের প্রথম দিন থেকে, যাকে এলএমপি বলা হয়, শিশুর জন্ম কবে হতে পারে তার একটি অনুমান দেয়। পূর্ণ গর্ভাবস্থা স্থায়ী হয় প্রায় 40 সপ্তাহ বা 280 দিন, এলএমপি থেকে গণনা করা হয়, যদিও গর্ভধারণ সাধারণত প্রায় দুই সপ্তাহ পরে, ডিম্বস্ফোটনের সময় হয়। টুলটি এলএমপির তারিখের সঙ্গে 280 দিন যোগ করে সম্ভাব্য প্রসবের তারিখ দেয়, আর গর্ভাবস্থার বর্তমান সপ্তাহ এবং প্রতিটি ত্রৈমাসিকের শুরুও দেখায়: প্রথম ত্রৈমাসিক 1 থেকে 13 সপ্তাহ, দ্বিতীয় 14 থেকে 27 সপ্তাহ এবং তৃতীয় 28 সপ্তাহ থেকে জন্ম পর্যন্ত। একটি উদাহরণ দেখা যাক: এলএমপি 1 জানুয়ারি 2026 হলে 280 দিন যোগ করলে সম্ভাব্য প্রসবের তারিখ হয় 8 অক্টোবর 2026। একই হিসাব ডিম্বস্ফোটনের তারিখ দিয়েও করা যায়: গর্ভধারণের তারিখের সঙ্গে 266 দিন বা 38 সপ্তাহ যোগ করুন, ডিম্বস্ফোটন এলএমপির 14 দিন পরে হলে একই ফল আসে। ক্যালকুলেটরটি পরিকল্পনার জন্য ডিম্বস্ফোটনের সময়ের অনুমানও দিতে পারে, যা নিয়মিত চক্রে সাধারণত পরের প্রত্যাশিত মাসিকের প্রায় 14 দিন আগে পড়ে, যদিও চক্রের দৈর্ঘ্য মানুষভেদে এমনকি মাসভেদেও বদলায়। এই তারিখের অর্থ কী তা বোঝা জরুরি: খুব কম শিশুই ঠিক সম্ভাব্য তারিখে জন্মায়, আর বেশিরভাগ শিশু তার দুই সপ্তাহ আগে বা পরে জন্মায়, তাই এই তারিখটি পরীক্ষা, ছুটি ও প্রস্তুতির পরিকল্পনার জন্য একটি নির্দেশিকা, কোনো নির্দিষ্ট সময় নয়। শুরুর দিকে আল্ট্রাসাউন্ড পরীক্ষা এই অনুমান আরও নির্ভুল করতে পারে, আর স্ক্যান ও এলএমপি না মিললে চিকিৎসক তারিখটি সমন্বয় করতে পারেন। ব্যবহারিক পরামর্শ হলো সম্ভাব্য তারিখের সঙ্গে ত্রৈমাসিকের তারিখ ও নিয়মিত গর্ভকালীন পরীক্ষার তারিখগুলো একসঙ্গে লিখে রাখুন, যাতে কিছু বাদ না যায়, আর কয়েক সপ্তাহ আগেই হাসপাতালের ব্যাগ গুছিয়ে রাখুন, কারণ আগে জন্মানো খুবই স্বাভাবিক। এই গাইডটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়, আর ফলাফল একটি অনুমান, কোনো রোগ নির্ণয় নয়; সবসময় আপনার নিজের চিকিৎসক বা ধাত্রীর পরামর্শ মেনে চলুন। গর্ভাবস্থায় প্রতিদিন ফলিক অ্যাসিডসহ চিকিৎসকের দেওয়া ভিটামিন নেওয়া এবং নিয়মিত হাঁটার মতো হালকা ব্যায়াম অনেকের জন্য উপকারী, তবে নতুন কিছু শুরু করার আগে চিকিৎসকের সঙ্গে কথা বলুন।`,
  },
  'water-intake-calculator': {
    guideEn: `A water intake calculator estimates how much water you should drink each day, based on your body weight and how active you are. Water carries nutrients around the body, regulates temperature, and helps digestion, and even mild dehydration can cause tiredness and headaches. The most widely used estimate is 30 to 35 millilitres of water per kilogram of body weight per day. You enter your weight, and the tool multiplies it by that range to give a daily target in litres. For a worked example, a person who weighs 70 kilograms needs about 70 times 30, which is 2,100 millilitres, to 70 times 35, which is 2,450 millilitres, or roughly 2.1 to 2.5 litres a day. A person who weighs 90 kilograms needs about 2.7 to 3.2 litres by the same formula. Exercise and heat raise the need: as a rough guide, add about 500 millilitres for each hour of sweaty exercise, and drink more on very hot days. About a fifth of daily water usually comes from food, especially fruit, vegetables, and soups, so the calculator's figure is a target for total fluids, not only plain water. Thirst and urine colour are useful checks: urine that is pale yellow usually means hydration is adequate, while dark yellow suggests you should drink more. Drinking too much water too quickly can also be harmful, so the aim is steady sipping through the day rather than forcing large volumes at once. A practical tip is to keep a bottle at your desk or in your bag and refill it on a schedule, for example one litre by midday and another by evening, because most people who fall short do so simply by forgetting. If you have kidney disease, heart failure, or a condition that limits fluids, follow your doctor's limit instead of this estimate. This guide is general information, not medical advice; see a doctor if you have symptoms of dehydration or a condition that affects fluid balance.`,
    guideBn: `পানি পানের ক্যালকুলেটর আপনার শরীরের ওজন ও আপনি কতটা সক্রিয় তার ভিত্তিতে দিনে কতটা পানি খাওয়া উচিত তার একটি অনুমান দেয়। পানি শরীরে পুষ্টি পৌঁছে দেয়, তাপমাত্রা নিয়ন্ত্রণ করে ও হজমে সাহায্য করে, আর সামান্য পানিশূন্যতাতেও ক্লান্তি ও মাথাব্যথা হতে পারে। সবচেয়ে বেশি ব্যবহৃত অনুমান হলো প্রতিদিন প্রতি কিলোগ্রাম ওজনে 30 থেকে 35 মিলিলিটার পানি। আপনি ওজন লিখলে টুলটি সেই পরিসর দিয়ে গুণ করে দৈনিক লক্ষ্য লিটারে বের করে দেয়। একটি উদাহরণ দেখা যাক: 70 কিলোগ্রাম ওজনের একজন মানুষের দরকার প্রায় 70 গুণ 30, অর্থাৎ 2,100 মিলিলিটার, থেকে 70 গুণ 35, অর্থাৎ 2,450 মিলিলিটার, বা প্রায় 2.1 থেকে 2.5 লিটার। একই সূত্রে 90 কিলোগ্রাম ওজনের মানুষের দরকার প্রায় 2.7 থেকে 3.2 লিটার। ব্যায়াম ও গরমে চাহিদা বাড়ে: একটি সাধারণ হিসাব হিসেবে ঘাম ঝরানো প্রতি ঘণ্টা ব্যায়ামে প্রায় 500 মিলিলিটার যোগ করুন, আর খুব গরম দিনে আরও বেশি পান করুন। দৈনিক পানির প্রায় এক-পঞ্চমাংশ সাধারণত খাবার থেকে আসে, বিশেষ করে ফল, সবজি ও স্যুপ থেকে, তাই ক্যালকুলেটরের সংখ্যাটি মোট তরলের লক্ষ্য, শুধু সাদা পানির নয়। তৃষ্ণা ও প্রস্রাবের রং দরকারি যাচাই: হালকা হলুদ প্রস্রাব সাধারণত যথেষ্ট পানি পানের লক্ষণ, আর গাঢ় হলুদ হলে আরও পানি খাওয়া উচিত। একসঙ্গে খুব বেশি পানি দ্রুত খাওয়াও ক্ষতিকর হতে পারে, তাই একবারে অনেকটা জোর করে খাওয়ার বদলে সারা দিন ধীরে ধীরে পান করাই লক্ষ্য। ব্যবহারিক পরামর্শ হলো ডেস্কে বা ব্যাগে একটি বোতল রাখুন এবং সময় ধরে আবার ভরে নিন, যেমন দুপুরের মধ্যে এক লিটার ও সন্ধ্যার মধ্যে আরেক লিটার, কারণ যাঁরা কম পান করেন তাঁদের বেশিরভাগই শুধু ভুলে যাওয়ার কারণে কম পান করেন। আপনার কিডনির রোগ, হার্ট ফেইলিওর বা তরল সীমিত রাখতে হয় এমন কোনো অসুস্থতা থাকলে এই অনুমানের বদলে চিকিৎসকের দেওয়া সীমা মেনে চলুন। এই গাইডটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়; পানিশূন্যতার লক্ষণ থাকলে বা তরলের ভারসাম্যে প্রভাব ফেলে এমন অসুস্থতা থাকলে চিকিৎসকের কাছে যান। কাজের ফাঁকে পানি খাওয়ার কথা মনে করিয়ে দিতে ফোনে একটি রিমাইন্ডার সেট করে রাখতে পারেন।`,
  },
  'sleep-cycle-calculator': {
    guideEn: `A sleep cycle calculator helps you choose a bedtime so you wake up at the end of a sleep cycle, when waking feels easiest. Sleep runs in cycles of about 90 minutes, moving from light sleep into deep sleep and then into dream sleep, and each night usually contains four to six cycles. Waking in the middle of deep sleep leaves you groggy, while waking at the end of a cycle, in light sleep, feels much easier, even after the same total hours. You enter the time you need to wake up, and the tool counts backwards in 90-minute steps to suggest bedtimes. For a worked example, if you must wake at 6:00 in the morning, five full cycles of 7.5 hours put bedtime at 22:30 the night before, four cycles of 6 hours put it at midnight, and three cycles of 4.5 hours put it at 1:30. Most adults need 7 to 9 hours of sleep, which is five to six cycles, so the 22:30 bedtime is the sensible choice in this example, giving 7.5 hours. The tool also adds the time it takes to fall asleep, usually about 15 minutes, so a 22:30 bedtime means being in bed by about 22:15. The same maths works in reverse: enter your bedtime and the tool shows the wake times that fall at the end of a cycle. Sleep cycles are averages, not exact timers: your own cycles may run a little shorter or longer than 90 minutes, and illness, alcohol, and late caffeine all disturb the pattern. What matters most is regularity: going to bed and waking at the same times each day trains the body clock more reliably than any single perfect bedtime. A practical tip is to keep the bedroom dark, cool, and free of screens for the last half hour before bed, and to keep wake time fixed even on weekends, because a shifting wake time resets the cycle. This guide is general information, not medical advice; if you snore loudly, stop breathing in sleep, or feel sleepy through the day despite enough hours, see a doctor.`,
    guideBn: `ঘুমের চক্রের ক্যালকুলেটর আপনাকে এমন সময়ে ঘুমাতে যেতে সাহায্য করে যাতে আপনি ঘুমের চক্রের শেষে জেগে উঠতে পারেন, যখন জাগা সবচেয়ে সহজ মনে হয়। ঘুম চলে প্রায় 90 মিনিটের চক্রে, হালকা ঘুম থেকে গভীর ঘুমে এবং তারপর স্বপ্নের ঘুমে যায়, আর প্রতি রাতে সাধারণত চার থেকে ছয়টি চক্র থাকে। গভীর ঘুমের মাঝখানে জাগলে মাথা ভারী লাগে, আর চক্রের শেষে হালকা ঘুমে জাগলে মোট ঘণ্টা একই থাকলেও অনেক সহজ মনে হয়। আপনি কখন জাগতে চান তা লিখলে টুলটি 90 মিনিট করে পেছনে গুনে ঘুমের সময়ের পরামর্শ দেয়। একটি উদাহরণ দেখা যাক: সকাল 6:00-এ জাগতে হলে পাঁচটি পূর্ণ চক্র বা 7.5 ঘণ্টা হিসেবে ঘুমের সময় আগের রাত 22:30, চারটি চক্র বা 6 ঘণ্টা হিসেবে রাত 12:00, আর তিনটি চক্র বা 4.5 ঘণ্টা হিসেবে রাত 1:30। বেশিরভাগ প্রাপ্তবয়স্কের 7 থেকে 9 ঘণ্টা ঘুম দরকার, অর্থাৎ পাঁচ থেকে ছয়টি চক্র, তাই এই উদাহরণে 22:30-এর সময়টিই যুক্তিসংগত, যাতে 7.5 ঘণ্টা ঘুম হয়। টুলটি ঘুম আসতে যে সময় লাগে, সাধারণত প্রায় 15 মিনিট, তাও যোগ করে, তাই 22:30-এ ঘুমাতে হলে প্রায় 22:15-এ বিছানায় যেতে হবে। একই হিসাব উল্টোভাবেও কাজ করে: ঘুমের সময় লিখলে টুলটি চক্রের শেষে পড়া জাগার সময়গুলো দেখায়। ঘুমের চক্র গড় হিসাব, নিখুঁত সময় নয়: আপনার নিজের চক্র 90 মিনিটের চেয়ে সামান্য ছোট বা বড় হতে পারে, আর অসুস্থতা, মদ ও রাতে ক্যাফেইন এই ধারাকে ব্যাহত করে। সবচেয়ে গুরুত্বপূর্ণ হলো নিয়মিত থাকা: প্রতিদিন একই সময়ে ঘুমানো ও জাগা শরীরের ঘড়িকে যেকোনো একক নিখুঁত সময়ের চেয়ে বেশি নির্ভরযোগ্যভাবে প্রশিক্ষণ দেয়। ব্যবহারিক পরামর্শ হলো ঘুমের আগের আধা ঘণ্টা শোবার ঘর অন্ধকার, ঠান্ডা ও পর্দামুক্ত রাখুন, আর সপ্তাহান্তেও জাগার সময় একই রাখুন, কারণ বদলে যাওয়া জাগার সময় চক্রটি আবার নতুন করে সাজায়। এই গাইডটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়; আপনি জোরে নাক ডাকলে, ঘুমের মধ্যে শ্বাস বন্ধ হলে বা যথেষ্ট ঘণ্টা ঘুমিয়েও দিনের বেলা ঘুম ঘুম ভাব থাকলে চিকিৎসকের কাছে যান। নিয়মিত ব্যায়ামও ঘুমের মান বাড়ায়, তবে ঘুমের ঠিক আগে ভারী ব্যায়াম এড়িয়ে চলুন।`,
  },
  'body-fat-calculator': {
    guideEn: `A body fat calculator estimates the percentage of your weight that is fat, which is often more useful than weight alone, because two people of the same weight can carry very different amounts of fat and muscle. The tool uses the US Navy method, which needs only a tape measure: your height and the circumference of your neck and waist for men, plus the hips for women. For men the formula is 495 divided by (1.0324 minus 0.19077 times log10 of waist minus neck, plus 0.15456 times log10 of height), minus 450, with all measurements in the same unit. For women it is 495 divided by (1.29579 minus 0.35004 times log10 of waist plus hips minus neck, plus 0.22100 times log10 of height), minus 450. For a worked example, take a man with a waist of 85 centimetres, a neck of 40 centimetres, and a height of 180 centimetres. Waist minus neck is 45, and log10 of 45 is about 1.653, while log10 of 180 is about 2.255. The denominator is 1.0324 minus 0.315 plus 0.349, which is about 1.066, and 495 divided by 1.066 is about 464.5, minus 450 gives about 14.5 percent body fat. Commonly cited ranges for men are essential fat 2 to 5 percent, athletes 6 to 13 percent, fit 14 to 17 percent, average 18 to 24 percent, and above 25 percent. For women the ranges are essential fat 10 to 13 percent, athletes 14 to 20 percent, fit 21 to 24 percent, average 25 to 31 percent, and above 32 percent. The tape method is an estimate: it is usually within a few percentage points of lab methods, but it is sensitive to how the tape is placed, so measure at the same spots each time, with the tape level and snug but not tight. A practical tip is to track the trend over months rather than a single number, and to pair the result with strength training and enough protein if your goal is to lower body fat while keeping muscle. This guide is general information, not medical advice; see a doctor before starting a major diet or exercise change.`,
    guideBn: `শরীরের চর্বির শতাংশের ক্যালকুলেটর আপনার ওজনের কত শতাংশ চর্বি তা অনুমান করে, যা শুধু ওজনের চেয়ে প্রায়ই বেশি কাজে আসে, কারণ একই ওজনের দুজন মানুষের শরীরে চর্বি ও পেশির পরিমাণ খুব আলাদা হতে পারে। এই টুলটি মার্কিন নৌবাহিনীর পদ্ধতি ব্যবহার করে, যাতে শুধু একটি ফিতা লাগে: আপনার উচ্চতা এবং পুরুষদের ক্ষেত্রে গলা ও কোমরের পরিধি, আর নারীদের ক্ষেত্রে কোমরের সঙ্গে নিতম্বের পরিধি। পুরুষদের সূত্রটি হলো 495 ভাগ (1.0324 বিয়োগ 0.19077 গুণ কোমর বিয়োগ গলার log10, যোগ 0.15456 গুণ উচ্চতার log10), বিয়োগ 450, সব মাপ একই এককে। নারীদের সূত্রটি হলো 495 ভাগ (1.29579 বিয়োগ 0.35004 গুণ কোমর যোগ নিতম্ব বিয়োগ গলার log10, যোগ 0.22100 গুণ উচ্চতার log10), বিয়োগ 450। একটি উদাহরণ দেখা যাক: একজন পুরুষের কোমর 85 সেন্টিমিটার, গলা 40 সেন্টিমিটার, উচ্চতা 180 সেন্টিমিটার। কোমর বিয়োগ গলা সমান 45, আর 45-এর log10 প্রায় 1.653, আর 180-এর log10 প্রায় 2.255। হরটি হলো 1.0324 বিয়োগ 0.315 যোগ 0.349, অর্থাৎ প্রায় 1.066, আর 495 ভাগ 1.066 সমান প্রায় 464.5, বিয়োগ 450 দিলে হয় প্রায় 14.5 শতাংশ শরীরের চর্বি। পুরুষদের জন্য প্রচলিত সীমাগুলো হলো অপরিহার্য চর্বি 2 থেকে 5 শতাংশ, খেলোয়াড় 6 থেকে 13 শতাংশ, ফিট 14 থেকে 17 শতাংশ, গড় 18 থেকে 24 শতাংশ এবং 25 শতাংশের ওপরে। নারীদের জন্য সীমাগুলো হলো অপরিহার্য চর্বি 10 থেকে 13 শতাংশ, খেলোয়াড় 14 থেকে 20 শতাংশ, ফিট 21 থেকে 24 শতাংশ, গড় 25 থেকে 31 শতাংশ এবং 32 শতাংশের ওপরে। ফিতার পদ্ধতিটি একটি অনুমান: এটি সাধারণত ল্যাব পদ্ধতির কয়েক শতাংশ পয়েন্টের মধ্যে থাকে, তবে ফিতা কীভাবে রাখা হয় তার ওপর সংবেদনশীল, তাই প্রতিবার একই জায়গায় মাপুন, ফিতা সমানভাবে ও টানটান করে, কিন্তু শক্ত করে নয়। ব্যবহারিক পরামর্শ হলো একক সংখ্যার বদলে মাসের পর মাস ধারাটি দেখুন, আর পেশি ধরে রেখে চর্বি কমানো লক্ষ্য হলে ফলাফলের সঙ্গে শক্তির ব্যায়াম ও যথেষ্ট প্রোটিন মিলিয়ে নিন। এই গাইডটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়; বড় ধরনের খাদ্য বা ব্যায়ামের পরিবর্তন শুরু করার আগে চিকিৎসকের কাছে যান।`,
  },
  'heart-rate-zone-calculator': {
    guideEn: `A heart rate zone calculator shows the heart rate ranges for different training intensities, so you can train at the right effort for your goal instead of guessing. Each zone is a percentage of your maximum heart rate, and each one trains a different quality: easier zones build endurance, harder zones build speed and power. You enter your age and optionally your resting heart rate, and the tool works out the five zones. Maximum heart rate is commonly estimated as 220 minus age, which is a rough population average rather than an exact measure for any one person. For a worked example, take a 30-year-old: the estimated maximum is 220 minus 30, which is 190 beats per minute. The zones are Zone 1 at 50 to 60 percent, which is 95 to 114 beats per minute, Zone 2 at 60 to 70 percent, which is 114 to 133, Zone 3 at 70 to 80 percent, which is 133 to 152, Zone 4 at 80 to 90 percent, which is 152 to 171, and Zone 5 at 90 to 100 percent, which is 171 to 190. Zone 2 is where most endurance training happens: you can still talk in full sentences, and the effort feels sustainable for a long time. A more personal method is the Karvonen formula, which uses heart rate reserve, the gap between maximum and resting heart rate. With a resting rate of 60, the reserve is 190 minus 60, which is 130, and Zone 2 becomes 130 times 0.6 plus 60, which is 138, to 130 times 0.7 plus 60, which is 151. The Karvonen zones sit higher because they account for your resting rate. A practical tip is to spend most training time in Zone 2 and only short periods in Zones 4 and 5, because too much hard training without enough easy training is the most common cause of stalled progress and injury. Check your resting rate first thing in the morning, before getting up, for the most reliable reading. This guide is general information, not medical advice; if you have a heart condition, high blood pressure, or feel chest pain, dizziness, or unusual breathlessness during exercise, stop and see a doctor.`,
    guideBn: `হার্ট রেট জোন ক্যালকুলেটর বিভিন্ন প্রশিক্ষণের তীব্রতার জন্য হৃদস্পন্দনের সীমা দেখায়, যাতে আপনি অনুমান না করে আপনার লক্ষ্যের জন্য সঠিক চেষ্টায় প্রশিক্ষণ নিতে পারেন। প্রতিটি জোন আপনার সর্বোচ্চ হৃদস্পন্দনের একটি শতাংশ, আর প্রতিটি জোন আলাদা গুণ গড়ে তোলে: সহজ জোনগুলো সহনশীলতা গড়ে, আর কঠিন জোনগুলো গতি ও শক্তি গড়ে। আপনি বয়স এবং চাইলে বিশ্রামে হৃদস্পন্দন লিখলে টুলটি পাঁচটি জোন বের করে দেয়। সর্বোচ্চ হৃদস্পন্দন সাধারণত 220 বিয়োগ বয়স দিয়ে অনুমান করা হয়, যা কোনো একজনের জন্য নিখুঁত মাপ নয়, বরং জনসংখ্যার একটি সাধারণ গড়। একটি উদাহরণ দেখা যাক: 30 বছর বয়সী একজন মানুষের আনুমানিক সর্বোচ্চ হৃদস্পন্দন 220 বিয়োগ 30, অর্থাৎ প্রতি মিনিটে 190 বার। জোনগুলো হলো জোন 1: 50 থেকে 60 শতাংশ, অর্থাৎ 95 থেকে 114 বার প্রতি মিনিটে, জোন 2: 60 থেকে 70 শতাংশ, অর্থাৎ 114 থেকে 133, জোন 3: 70 থেকে 80 শতাংশ, অর্থাৎ 133 থেকে 152, জোন 4: 80 থেকে 90 শতাংশ, অর্থাৎ 152 থেকে 171, এবং জোন 5: 90 থেকে 100 শতাংশ, অর্থাৎ 171 থেকে 190। জোন 2-এই বেশিরভাগ সহনশীলতার প্রশিক্ষণ হয়: আপনি তখনও পূর্ণ বাক্যে কথা বলতে পারেন, আর চেষ্টাটি দীর্ঘ সময় ধরে রাখা যায়। আরও ব্যক্তিগত একটি পদ্ধতি হলো কারভোনেন সূত্র, যাতে হৃদস্পন্দনের রিজার্ভ ব্যবহার করা হয়, অর্থাৎ সর্বোচ্চ ও বিশ্রামের হৃদস্পন্দনের পার্থক্য। বিশ্রামের হার 60 হলে রিজার্ভ হয় 190 বিয়োগ 60, অর্থাৎ 130, আর জোন 2 হয় 130 গুণ 0.6 যোগ 60, অর্থাৎ 138, থেকে 130 গুণ 0.7 যোগ 60, অর্থাৎ 151। কারভোনেন জোনগুলো বেশি হয়, কারণ এতে আপনার বিশ্রামের হার হিসাব করা হয়। ব্যবহারিক পরামর্শ হলো বেশিরভাগ প্রশিক্ষণের সময় জোন 2-এ কাটান, আর জোন 4 ও 5-এ শুধু অল্প সময় থাকুন, কারণ যথেষ্ট সহজ প্রশিক্ষণ ছাড়া অতিরিক্ত কঠিন প্রশিক্ষণই অগ্রগতি থেমে যাওয়া ও আঘাতের সবচেয়ে সাধারণ কারণ। সবচেয়ে নির্ভরযোগ্য মাপের জন্য সকালে ওঠার আগে, বিছানা থেকে না উঠে বিশ্রামের হার মাপুন। এই গাইডটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়; আপনার হৃদরোগ, উচ্চ রক্তচাপ থাকলে বা ব্যায়ামের সময় বুকে ব্যথা, মাথা ঘোরা বা অস্বাভাবিক শ্বাসকষ্ট হলে থেমে গিয়ে চিকিৎসকের কাছে যান।`,
  },
  'pace-speed-calculator': {
    guideEn: `A pace and speed calculator converts between the two ways runners describe how fast they are going, and works out finish times for any distance. Pace is time per unit of distance, usually minutes per kilometre or minutes per mile, while speed is distance per unit of time, usually kilometres per hour. You enter any two of distance, time, and pace, and the tool works out the third. Pace equals time divided by distance, and speed equals distance divided by time. For a worked example, running 5 kilometres in 30 minutes gives a pace of 30 divided by 5, which is 6 minutes per kilometre, and a speed of 5 divided by 0.5 hours, which is 10 kilometres per hour. Running 10 kilometres in 50 minutes gives a pace of 5 minutes per kilometre and a speed of 12 kilometres per hour. To convert pace to speed, divide 60 by the pace in minutes per kilometre: 60 divided by 6 is 10 kilometres per hour, and 60 divided by 5 is 12. The tool can also predict a finish time: at a steady 6 minutes per kilometre, a 10-kilometre run takes 60 minutes, and a half marathon of 21.1 kilometres takes about 2 hours 7 minutes. Splits help you check progress during a race: at 5 minutes per kilometre you should pass 5 kilometres in 25 minutes and 10 kilometres in 50 minutes, so a watch check at each marker tells you whether you are ahead or behind. A practical tip is to train most runs slightly slower than race pace and to aim for even or slightly faster second halves, because starting too fast is the most common reason runners fade in the later kilometres. Record your pace on the same flat route when comparing weeks, since hills and heat change pace without any change in fitness. This guide is general information, not medical advice; build distance gradually, and see a doctor if running causes chest pain, dizziness, or joint pain that does not settle.`,
    guideBn: `গতি ও গতিবেগের ক্যালকুলেটর দৌড়বিদরা কত দ্রুত যাচ্ছেন তা বোঝানোর দুটি উপায়ের মধ্যে রূপান্তর করে এবং যেকোনো দূরত্বের শেষ করার সময় বের করে দেয়। পেস হলো প্রতি একক দূরত্বে সময়, সাধারণত প্রতি কিলোমিটারে মিনিট বা প্রতি মাইলে মিনিট, আর গতি হলো প্রতি একক সময়ে দূরত্ব, সাধারণত ঘণ্টায় কিলোমিটার। আপনি দূরত্ব, সময় ও পেসের মধ্যে যেকোনো দুটি লিখলে টুলটি তৃতীয়টি বের করে দেয়। পেস সমান সময় ভাগ দূরত্ব, আর গতি সমান দূরত্ব ভাগ সময়। একটি উদাহরণ দেখা যাক: 30 মিনিটে 5 কিলোমিটার দৌড়ালে পেস হয় 30 ভাগ 5, অর্থাৎ প্রতি কিলোমিটারে 6 মিনিট, আর গতি হয় 5 ভাগ 0.5 ঘণ্টা, অর্থাৎ ঘণ্টায় 10 কিলোমিটার। 50 মিনিটে 10 কিলোমিটার দৌড়ালে পেস হয় প্রতি কিলোমিটারে 5 মিনিট এবং গতি হয় ঘণ্টায় 12 কিলোমিটার। পেস থেকে গতি বের করতে 60-কে প্রতি কিলোমিটারে মিনিটের পেস দিয়ে ভাগ করুন: 60 ভাগ 6 সমান ঘণ্টায় 10 কিলোমিটার, আর 60 ভাগ 5 সমান 12। এই টুলটি শেষ করার সময়ের পূর্বাভাসও দিতে পারে: প্রতি কিলোমিটারে 6 মিনিটের স্থির গতিতে 10 কিলোমিটার দৌড়ে লাগে 60 মিনিট, আর 21.1 কিলোমিটারের হাফ ম্যারাথনে লাগে প্রায় 2 ঘণ্টা 7 মিনিট। স্প্লিট বা ভাগের সময় দৌড়ের মধ্যে অগ্রগতি যাচাই করতে সাহায্য করে: প্রতি কিলোমিটারে 5 মিনিট গতিতে 5 কিলোমিটার পার হতে লাগবে 25 মিনিট এবং 10 কিলোমিটার পার হতে 50 মিনিট, তাই প্রতিটি চিহ্নে ঘড়ি দেখলে বোঝা যায় আপনি এগিয়ে আছেন নাকি পিছিয়ে। ব্যবহারিক পরামর্শ হলো বেশিরভাগ প্রশিক্ষণ দৌড় প্রতিযোগিতার গতির চেয়ে সামান্য ধীরে দিন, আর দ্বিতীয়ার্ধে সমান বা সামান্য দ্রুত গতির লক্ষ্য রাখুন, কারণ শুরুতে বেশি দ্রুত দৌড়ানোই পরের কিলোমিটারগুলোতে ক্লান্ত হয়ে পড়ার সবচেয়ে সাধারণ কারণ। সপ্তাহের তুলনা করার সময় একই সমতল পথে আপনার পেস লিখে রাখুন, কারণ পাহাড় ও গরম ফিটনেস না বদলেও পেস বদলে দেয়। এই গাইডটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়; দূরত্ব ধীরে ধীরে বাড়ান, আর দৌড়ে বুকে ব্যথা, মাথা ঘোরা বা জয়েন্টের ব্যথা হলে চিকিৎসকের কাছে যান। প্রতিযোগিতার আগে নতুন জুতা পরে দৌড়াবেন না, আগের জুতাই ব্যবহার করুন।`,
  },
  'ovulation-calculator': {
    guideEn: `An ovulation calculator estimates the days in a menstrual cycle when ovulation is most likely, using the dates you enter. Ovulation is the release of an egg from the ovary, and it usually happens about 14 days before the next period starts, not a fixed number of days after the last period began. The tool needs two inputs: the first day of your last period and the usual length of your cycle, in days. For a worked example, take a regular cycle of 28 days, with the last period starting on 1 March. The next period is expected on 29 March, and ovulation is estimated at about 14 days before that, on 15 March. The fertile window is the days when pregnancy is most likely: the five days before ovulation plus the day of ovulation, because sperm can survive in the body for up to five days while the egg survives for about a day. In the example the fertile window runs from about 10 March to 15 March. For a longer cycle of 32 days, ovulation moves later: with a period starting on 1 March, the next period is expected on 2 April, ovulation is estimated at about 19 March, and the fertile window runs from about 14 to 19 March. For a shorter cycle of 24 days, ovulation is estimated at about 11 March, with the fertile window from about 6 to 11 March. The key point is that the estimate counts backwards from the next period, so it depends on the cycle length you enter. Cycles vary from month to month, even for the same person, and stress, illness, travel and age can all shift the timing, so the result is an estimate, not a certainty. Track three or more cycles and enter your average cycle length, rather than a single cycle, because the average gives a steadier estimate. Some people also watch body signs such as changes in cervical mucus and a small rise in morning temperature, but this tool uses dates only. This guide is general information, not medical advice. Do not rely on this estimate as a method of contraception, because ovulation can happen earlier or later than predicted. If your cycles are very irregular, very short, or very long, or if you have been trying to conceive for a year without success, see a doctor.`,
    guideBn: `ডিম্বস্ফোটন ক্যালকুলেটর আপনার দেওয়া তারিখ দিয়ে মাসিক চক্রের কোন দিনগুলোতে ডিম্বস্ফোটন হওয়ার সম্ভাবনা বেশি তা অনুমান করে। ডিম্বস্ফোটন হলো ডিম্বাশয় থেকে ডিম বের হওয়া, আর এটি সাধারণত পরের মাসিক শুরুর প্রায় 14 দিন আগে ঘটে, শেষ মাসিক শুরু হওয়ার নির্দিষ্ট দিন পর নয়। টুলটির জন্য দুটি তথ্য লাগে: শেষ মাসিকের প্রথম দিন এবং আপনার চক্রের সাধারণ দৈর্ঘ্য, দিন হিসেবে। একটি উদাহরণ দেখা যাক: 28 দিনের নিয়মিত চক্র, শেষ মাসিক শুরু হয়েছে 1 মার্চ। পরের মাসিক আশা করা যায় 29 মার্চ, আর ডিম্বস্ফোটনের অনুমান তার প্রায় 14 দিন আগে, 15 মার্চ। উর্বর সময় হলো সেই দিনগুলো যখন গর্ভধারণের সম্ভাবনা সবচেয়ে বেশি: ডিম্বস্ফোটনের আগের পাঁচ দিন যোগ ডিম্বস্ফোটনের দিন, কারণ শুক্রাণু শরীরে পাঁচ দিন পর্যন্ত বেঁচে থাকতে পারে, আর ডিম বেঁচে থাকে প্রায় এক দিন। এই উদাহরণে উর্বর সময় চলে প্রায় 10 মার্চ থেকে 15 মার্চ পর্যন্ত। 32 দিনের লম্বা চক্রে ডিম্বস্ফোটন পরে হয়: 1 মার্চ মাসিক শুরু হলে পরের মাসিক আশা করা যায় 2 এপ্রিল, ডিম্বস্ফোটনের অনুমান প্রায় 19 মার্চ, আর উর্বর সময় চলে প্রায় 14 মার্চ থেকে 19 মার্চ পর্যন্ত। 24 দিনের ছোট চক্রে ডিম্বস্ফোটনের অনুমান প্রায় 11 মার্চ, আর উর্বর সময় চলে প্রায় 6 মার্চ থেকে 11 মার্চ পর্যন্ত। মূল কথাটি হলো অনুমানটি পরের মাসিক থেকে পেছনে গুনে করা হয়, তাই এটি নির্ভর করে আপনি যে চক্রের দৈর্ঘ্য লিখেছেন তার ওপর। চক্র মাসে মাসে বদলায়, একই মানুষের ক্ষেত্রেও, আর মানসিক চাপ, অসুস্থতা, ভ্রমণ ও বয়স সবই সময় বদলে দিতে পারে, তাই ফলাফল একটি অনুমান, নিশ্চয়তা নয়। ব্যবহারিক পরামর্শ হলো তিন বা তার বেশি চক্রের হিসাব রেখে গড় চক্রের দৈর্ঘ্য লিখুন, একটি চক্রের বদলে, কারণ গড় থেকে অনুমান আরও স্থির হয়। কেউ কেউ শরীরের লক্ষণও দেখেন, যেমন সার্ভিকাল মিউকাসের পরিবর্তন ও সকালে তাপমাত্রা সামান্য বেড়ে যাওয়া, তবে এই টুলটি শুধু তারিখ ব্যবহার করে। এই গাইডটি সাধারণ তথ্য, চিকিৎসা পরামর্শ নয়। এই অনুমানের ওপর নির্ভর করে জন্মনিয়ন্ত্রণের পদ্ধতি হিসেবে ব্যবহার করবেন না, কারণ ডিম্বস্ফোটন অনুমানের চেয়ে আগেও বা পরেও হতে পারে। আপনার চক্র খুব অনিয়মিত, খুব ছোট বা খুব লম্বা হলে, অথবা এক বছর চেষ্টা করেও গর্ভধারণ না হলে চিকিৎসকের কাছে যান।`,
  },
};

export function toolGuideBySlug(slug: string): { guideBn: string; guideEn: string } | undefined {
  return TOOLS_GUIDES[slug];
}
