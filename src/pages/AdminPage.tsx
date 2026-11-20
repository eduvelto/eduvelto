import { PageShell, EmptyState } from '../components/PageShell';

export default function AdminPage() {
  return (
    <PageShell titleBn="অ্যাডমিন ড্যাশবোর্ড" titleEn="Admin dashboard">
      <p>অ্যাডমিন ড্যাশবোর্ড: মডারেশন কিউ, রিপোর্ট, ভেরিফিকেশন ও ব্যাকআপ (এক্সপোর্ট/রিস্টোর) — শুধুমাত্র অ্যাডমিন/মডারেটরদের জন্য। এখনো কোনো তথ্য নেই।</p>
      <p style={{ color: '#555' }}>Admin dashboard: moderation queue, reports, verifications and backup (export/restore) — admins/moderators only. No data yet.</p>
      <EmptyState bn="এখনো কোনো তথ্য নেই।" en="No data yet." />
    </PageShell>
  );
}
