// Eduvelto — Interview Questions tool data (28 Nov 2026).
//
// 12 common interview questions with short answer GUIDES — each guide
// explains HOW to answer well (approach + what to include), not a script
// to memorize. General career advice only: no company names, no salary
// figures, no invented facts. Pure static data: no React, no network,
// no storage.

export type InterviewCategoryId = 'general' | 'strengths' | 'career' | 'salary';

export interface InterviewCategory {
  id: InterviewCategoryId;
  bn: string;
  en: string;
}

export const INTERVIEW_CATEGORIES: readonly InterviewCategory[] = [
  { id: 'general', bn: 'সাধারণ', en: 'General' },
  { id: 'strengths', bn: 'শক্তি ও দুর্বলতা', en: 'Strengths & Weaknesses' },
  { id: 'career', bn: 'ক্যারিয়ার', en: 'Career' },
  { id: 'salary', bn: 'বেতন ও শর্ত', en: 'Salary & Terms' },
];

export interface InterviewQuestion {
  id: string;
  category: InterviewCategoryId;
  questionBn: string;
  questionEn: string;
  guideBn: string;
  guideEn: string;
}

export const INTERVIEW_INTRO: { bn: string; en: string } = {
  bn: 'এগুলো প্রস্তুতির নির্দেশনা, মুখস্থ করার স্ক্রিপ্ট নয়। নিজের ভাষায়, নিজের অভিজ্ঞতার উদাহরণ দিয়ে উত্তর দিন — মুখস্থ উত্তর শুনলেই বোঝা যায়।',
  en: 'These are preparation guides, not scripts to memorize. Answer in your own words, with examples from your own experience — a memorized answer is easy to spot.',
};

export const INTERVIEW_QUESTIONS: readonly InterviewQuestion[] = [
  {
    id: 'about-yourself',
    category: 'general',
    questionBn: 'নিজের সম্পর্কে বলুন',
    questionEn: 'Tell us about yourself',
    guideBn:
      'সংক্ষেপে শুরু করুন: বর্তমানে আপনি কী করেন, তারপর সংক্ষেপে আপনার পড়াশোনা ও অভিজ্ঞতা, শেষে কেন এই চাকরিটি আপনার জন্য উপযুক্ত। পুরো জীবনবৃত্তান্ত বলবেন না — চাকরির সঙ্গে সম্পর্কিত বিষয়গুলোই বেছে নিন। আত্মবিশ্বাসের সঙ্গে, দুই মিনিটের মধ্যে শেষ করুন।',
    guideEn:
      'Start briefly: what you do now, then a short summary of your education and experience, and finish with why this job suits you. Do not recite your whole life story — pick only what relates to the job. Speak confidently and finish within about two minutes.',
  },
  {
    id: 'greatest-strength',
    category: 'strengths',
    questionBn: 'আপনার সবচেয়ে বড় শক্তি কী?',
    questionEn: 'What is your greatest strength?',
    guideBn:
      'একটি বা দুটি সত্যিকারের শক্তি বেছে নিন যা এই চাকরির কাজে লাগবে, আর প্রতিটির পেছনে একটি ছোট বাস্তব উদাহরণ দিন। শুধু গুণ বলে থেমে যাবেন না — উদাহরণ ছাড়া দাবি বিশ্বাসযোগ্য হয় না। নিজের শক্তি চাকরির প্রয়োজনের সঙ্গে মিলিয়ে বলুন।',
    guideEn:
      'Pick one or two real strengths that matter for this job, and back each one with a short real example. Do not stop at naming the quality — a claim without an example is not convincing. Match your strength to what the job actually needs.',
  },
  {
    id: 'greatest-weakness',
    category: 'strengths',
    questionBn: 'আপনার দুর্বলতা কী?',
    questionEn: 'What is your greatest weakness?',
    guideBn:
      'এমন একটি সত্যিকারের দুর্বলতা বলুন যা এই চাকরির মূল কাজের সঙ্গে সরাসরি জড়িত নয়, আর সঙ্গে সঙ্গে বলুন সেটি কাটিয়ে উঠতে আপনি কী করছেন। উন্নতির চেষ্টা দেখানোই আসল উদ্দেশ্য — "আমার কোনো দুর্বলতা নেই" বলবেন না। মিথ্যা দুর্বলতাকে গুণ সাজিয়ে বলা এড়িয়ে চলুন।',
    guideEn:
      'Name a real weakness that is not central to this job, and immediately explain what you are doing to improve it. Showing that you are working on it is the real point — never say you have no weaknesses. Avoid dressing up a fake weakness as a strength.',
  },
  {
    id: 'why-this-job',
    category: 'career',
    questionBn: 'কেন এই চাকরিটি চান?',
    questionEn: 'Why do you want this job?',
    guideBn:
      'চাকরির বিজ্ঞপ্তিটি ভালোভাবে পড়ে আপনার দক্ষতা ও আগ্রহের সঙ্গে কাজটির মিল দেখান। শুধু "চাকরি দরকার" বলবেন না — কাজটির কোন দিকটি আপনাকে আকর্ষণ করে, সেটি নির্দিষ্ট করে বলুন। আপনার আগ্রহ সত্যিকারের মনে হলে নিয়োগকর্তা আস্থা পান।',
    guideEn:
      'Read the job advertisement carefully and show how your skills and interests match the work. Do not just say you need a job — name specifically what attracts you about this role. When your interest sounds genuine, the employer trusts you more.',
  },
  {
    id: 'why-hire-you',
    category: 'career',
    questionBn: 'কেন আপনাকেই নেব?',
    questionEn: 'Why should we hire you?',
    guideBn:
      'সংক্ষেপে আপনার উপযুক্ততা সাজান: প্রয়োজনীয় দক্ষতা, প্রাসঙ্গিক অভিজ্ঞতা, আর কাজের প্রতি মনোভাব। একটি ছোট উদাহরণ দিন যেখানে আপনি ভালো ফল দিয়েছেন। আত্মবিশ্বাসী হোন, তবে অহংকারী শোনাবেন না — অন্য প্রার্থীদের ছোট করে বলবেন না।',
    guideEn:
      'Summarize your fit briefly: the skills needed, relevant experience, and your attitude to work. Give one short example of a time you delivered good results. Be confident but not arrogant — never put other candidates down.',
  },
  {
    id: 'where-in-five-years',
    category: 'career',
    questionBn: '৫ বছর পর নিজেকে কোথায় দেখেন?',
    questionEn: 'Where do you see yourself in five years?',
    guideBn:
      'একই ক্ষেত্রে বাস্তবসম্মত উন্নতির কথা বলুন — যেমন নতুন দক্ষতা শেখা, বড় দায়িত্ব নেওয়া, দলের জন্য বেশি অবদান রাখা। এমন কিছু বলবেন না যা থেকে মনে হয় আপনি শিগগিরই চাকরি ছেড়ে দেবেন। দীর্ঘমেয়াদে এই প্রতিষ্ঠানের সঙ্গে বেড়ে ওঠার আগ্রহ দেখান।',
    guideEn:
      'Describe realistic growth in the same field — such as learning new skills, taking on bigger responsibilities, and contributing more to the team. Avoid anything that suggests you will leave soon. Show that you want to grow with this organization over the long term.',
  },
  {
    id: 'working-under-pressure',
    category: 'general',
    questionBn: 'চাপের মধ্যে কীভাবে কাজ করেন?',
    questionEn: 'How do you work under pressure?',
    guideBn:
      'শান্ত থাকার কৌশল বলুন: কাজের অগ্রাধিকার ঠিক করা, বড় কাজকে ছোট ধাপে ভাগ করা, সময়মতো যোগাযোগ রাখা। চাপের মধ্যে কাজ করার একটি বাস্তব উদাহরণ দিন — কী সমস্যা ছিল, আপনি কী করলেন, ফল কী হলো। প্রয়োজনে সাহায্য চাওয়াও দক্ষতার লক্ষণ, দুর্বলতা নয়।',
    guideEn:
      'Explain how you stay calm: setting priorities, breaking big work into small steps, and keeping communication on time. Give a real example of working under pressure — what the problem was, what you did, and what the result was. Asking for help when needed is a sign of skill, not weakness.',
  },
  {
    id: 'teamwork-experience',
    category: 'general',
    questionBn: 'দলগত কাজের অভিজ্ঞতা বলুন',
    questionEn: 'Tell us about a teamwork experience',
    guideBn:
      'একটি নির্দিষ্ট দলগত কাজের কথা বলুন: দলে আপনার ভূমিকা কী ছিল, আপনি কী অবদান রাখলেন, মতের অমিল হলে কীভাবে মিটিয়েছিলেন। সাফল্যের কৃতিত্ব দলকে দিন, শুধু নিজেকে নয়। এই প্রশ্নে শোনা-বোঝা আর সহযোগিতার মনোভাবই আসল বিষয়।',
    guideEn:
      'Describe one specific team effort: your role in the team, what you contributed, and how you handled disagreements. Share the credit with the team instead of taking it all yourself. This question is really about listening, understanding, and a cooperative attitude.',
  },
  {
    id: 'why-leaving-previous-job',
    category: 'career',
    questionBn: 'আগের চাকরি ছাড়লেন কেন / ছাড়তে চান কেন?',
    questionEn: 'Why did you leave your previous job / why do you want to leave?',
    guideBn:
      'ইতিবাচকভাবে বলুন: নতুন চ্যালেঞ্জ, শেখার সুযোগ, বা ক্যারিয়ারে এগিয়ে যাওয়ার ইচ্ছা। আগের নিয়োগকর্তা বা সহকর্মীদের সম্পর্কে খারাপ কিছু বলবেন না — এতে নিয়োগকর্তার মনে খারাপ ধারণা হয়। বর্তমান চাকরিতে থাকলে বলুন, আপনি ভালো সুযোগের খোঁজে আছেন, পালাচ্ছেন না।',
    guideEn:
      'Stay positive: a new challenge, a chance to learn, or a wish to move forward in your career. Never speak badly about a previous employer or colleagues — it creates a bad impression. If you are still employed, say you are looking for a better opportunity, not running away.',
  },
  {
    id: 'salary-expectation',
    category: 'salary',
    questionBn: 'আপনার বেতন প্রত্যাশা কত?',
    questionEn: 'What is your salary expectation?',
    guideBn:
      'উত্তর দেওয়ার আগে বাজার সম্পর্কে গবেষণা করুন: একই ধরনের পদে, আপনার অভিজ্ঞতা অনুযায়ী সাধারণত কেমন বেতন দেওয়া হয় জেনে নিন। একটি নির্দিষ্ট অঙ্ক না বলে একটি যুক্তিসংগত পরিসর বলুন, আর পুরো সুযোগ-সুবিধার কথাও বিবেচনায় নিন। নম্রভাবে বলুন যে আপনি আলোচনার জন্য প্রস্তুত।',
    guideEn:
      'Before answering, research the market: find out what is usually paid for a similar role with your experience. Instead of one fixed figure, give a reasonable range, and consider the full package of benefits too. Say politely that you are open to discussion.',
  },
  {
    id: 'what-know-about-us',
    category: 'general',
    questionBn: 'আমাদের প্রতিষ্ঠান সম্পর্কে কী জানেন?',
    questionEn: 'What do you know about our organization?',
    guideBn:
      'সাক্ষাৎকারের আগে প্রতিষ্ঠান সম্পর্কে জেনে আসুন: তারা কী কাজ করে, তাদের মূল্যবোধ কী, সম্প্রতি তারা কী করেছে। যা জানলেন তা আপনার আগ্রহ ও দক্ষতার সঙ্গে মিলিয়ে বলুন। আন্দাজে কিছু বলবেন না — না জানলে সততার সঙ্গে বলুন আপনি আরও জানতে আগ্রহী।',
    guideEn:
      'Research the organization before the interview: what they do, what they value, and what they have done recently. Connect what you learned to your own interests and skills. Never guess — if you do not know something, say honestly that you are keen to learn more.',
  },
  {
    id: 'any-questions-for-us',
    category: 'general',
    questionBn: 'আপনার কোনো প্রশ্ন আছে?',
    questionEn: 'Do you have any questions for us?',
    guideBn:
      'অবশ্যই প্রশ্ন করুন — "না, কিছু নেই" বললে আগ্রহের অভাব মনে হয়। কাজটি, দলটি, সাফল্যের মাপকাঠি, বা শেখার সুযোগ নিয়ে প্রশ্ন করুন। শুরুতেই শুধু ছুটি বা সুযোগ-সুবিধা নিয়ে প্রশ্ন করবেন না — প্রথমে কাজের প্রতি আগ্রহ দেখান।',
    guideEn:
      'Always ask a question — saying you have none looks like a lack of interest. Ask about the role, the team, how success is measured, or opportunities to learn. Do not start with questions only about leave or benefits — show interest in the work first.',
  },
];

export function interviewQuestionsByCategory(
  category: InterviewCategoryId | 'all',
): readonly InterviewQuestion[] {
  if (category === 'all') return INTERVIEW_QUESTIONS;
  return INTERVIEW_QUESTIONS.filter((q) => q.category === category);
}

export function interviewCategoryById(id: InterviewCategoryId): InterviewCategory {
  const found = INTERVIEW_CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown interview category: ${id}`);
  return found;
}
