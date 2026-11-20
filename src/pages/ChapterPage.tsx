import { PageShell, EmptyState } from '../components/PageShell';

export default function ChapterPage() {
  return (
    <PageShell titleBn="অধ্যায়" titleEn="Chapter">
      <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
    </PageShell>
  );
}
