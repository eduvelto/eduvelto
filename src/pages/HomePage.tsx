import { PageShell, EmptyState } from '../components/PageShell';
import AdSlot from '../components/AdSlot';

export default function HomePage() {
  return (
    <PageShell titleBn="হোম" titleEn="Home">
      <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
      <p style={{ marginTop: 16 }}>এখানে প্রকাশিত বিষয়, বই ও কুইজ দেখা যাবে। / Published subjects, books and quizzes will appear here.</p>
      {/* In-feed ad slot (home list page only). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
    </PageShell>
  );
}
