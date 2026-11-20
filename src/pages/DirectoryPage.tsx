import { PageShell, EmptyState } from '../components/PageShell';

export default function DirectoryPage() {
  return (
    <PageShell titleBn="শিক্ষা নির্দেশিকা" titleEn="Education Directory">
      <EmptyState bn="এখনো কোনো তথ্য নেই। কনটেন্ট প্রকাশিত হলে এখানে দেখা যাবে।" en="No data yet. Content will appear here once it is published." />
    </PageShell>
  );
}
