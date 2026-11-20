import { PageShell, EmptyState } from '../components/PageShell';
import AdSlot from '../components/AdSlot';

export default function LibraryPage() {
  return (
    <PageShell titleBn="ডিজিটাল লাইব্রেরি" titleEn="Digital Library">
      <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
      {/* First in-feed ad slot (library list page). Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed" />
      <p style={{ marginTop: 16 }}>
        লাইব্রেরিতে বই, নোট ও প্রশ্নোত্তর যোগ করা হবে — নিচে স্ক্রল করলে আরও দেখা যাবে। / Books,
        notes and Q&A will be added to the library — scroll down to see more.
      </p>
      {/* Second in-feed ad slot, lower down the list — revealed on scroll. Renders nothing until AdSense is configured. */}
      <AdSlot placement="in-feed-2" />
    </PageShell>
  );
}
