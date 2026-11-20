import { PageShell, EmptyState } from '../components/PageShell';

export default function LoginPage() {
  return (
    <PageShell titleBn="লগইন" titleEn="Log in">
      <p>লগইন/রেজিস্ট্রেশন চালু হবে Firebase যুক্ত হওয়ার পর (গেট G1)। কোনো ডেমো অ্যাকাউন্ট নেই — যেকোনো ইনপুট কাজ করে এমন ভুয়া লগইন এখানে নেই।</p>
      <p style={{ color: '#555' }}>Sign-in starts once Firebase is connected (gate G1). There is no demo account and no fake login that accepts any input.</p>
      <EmptyState bn="এখনো কোনো তথ্য নেই।" en="No data yet." />
    </PageShell>
  );
}
