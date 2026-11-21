import { PageShell, EmptyState } from '../components/PageShell';
import { useLanguage } from '../i18n/LanguageContext';

export default function AiTeacherPage() {
  const { t } = useLanguage();
  return (
    <PageShell titleBn="এডুভেল্টো এআই শিক্ষক" titleEn="Eduvelto AI Teacher">
      <p><strong>{t({ bn: 'এটি একটি স্ক্রিপ্ট করা প্রদর্শনী, আসল এআই নয়।', en: 'This is a scripted demonstration, not live AI.' })}</strong>{' '}{t({ bn: 'বিনামূল্যে প্রোডাকশন-মানের এআই শিক্ষক সম্ভব নয় (ব্লুপ্রিন্ট §5)। বিনামূল্যের সৎ সহায়ক: শব্দকোষ, সূত্রপত্র ও পুনরাবৃত্তি-ভিত্তিক রিভিশন।', en: 'A free production-quality AI teacher is not feasible (blueprint §5). Honest free helpers: glossary, formula sheets and spaced-repetition revision.' })}</p>
      <EmptyState bn="এখনো কোনো তথ্য নেই।" en="No data yet." />
    </PageShell>
  );
}
