import { PageShell, EmptyState } from '../components/PageShell';

export default function TeacherRegisterPage() {
  return (
    <PageShell titleBn="শিক্ষক রেজিস্ট্রেশন" titleEn="Teacher registration">
      <p>শিক্ষক ভেরিফিকেশন মানুষের মাধ্যমে যাচাই করা হয়। রেজিস্টার করলেই “ভেরিফায়েড” ব্যাজ পাওয়া যায় না।</p>
      <p style={{ color: '#555' }}>Teacher verification is a human check. Registering does not grant a “verified” badge.</p>
      <EmptyState bn="এখনো কোনো তথ্য নেই।" en="No data yet." />
    </PageShell>
  );
}
