import { PageShell, EmptyState } from '../components/PageShell';
import AdSlot from '../components/AdSlot';

export default function HomePage() {
  return (
    <PageShell titleBn="হোম" titleEn="Home">
      <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
      <p style={{ marginTop: 16 }}>এখানে প্রকাশিত বিষয়, বই ও কুইজ দেখা যাবে। / Published subjects, books and quizzes will appear here.</p>
      {/* First in-feed ad slot (home list page). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
      <p style={{ marginTop: 16 }}>
        নতুন পাঠ, বই ও পরীক্ষা নিয়মিত যোগ করা হবে — নিচে স্ক্রল করলে আরও দেখা যাবে। / New lessons,
        books and exams are added regularly — scroll down to see more.
      </p>
      {/* Second in-feed ad slot, lower down the list — revealed on scroll. Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed-2" />
    </PageShell>
  );
}
