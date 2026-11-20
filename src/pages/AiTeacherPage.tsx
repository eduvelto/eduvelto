import { PageShell, EmptyState } from '../components/PageShell';

export default function AiTeacherPage() {
  return (
    <PageShell titleBn="এডুভেল্টো এআই শিক্ষক" titleEn="Eduvelto AI Teacher">
      <p><strong>এটি একটি স্ক্রিপ্ট করা প্রদর্শনী, আসল এআই নয়।</strong> বিনামূল্যে প্রোডাকশন-মানের এআই শিক্ষক সম্ভব নয় (ব্লুপ্রিন্ট §5)। বিনামূল্যের সৎ সহায়ক: শব্দকোষ, সূত্রপত্র ও পুনরাবৃত্তি-ভিত্তিক রিভিশন।</p>
      <p style={{ color: '#555' }}><strong>This is a scripted demonstration, not live AI.</strong> A free production-quality AI teacher is not feasible (blueprint §5). Honest free helpers: glossary, formula sheets and spaced-repetition revision.</p>
      <EmptyState bn="এখনো কোনো তথ্য নেই।" en="No data yet." />
    </PageShell>
  );
}
