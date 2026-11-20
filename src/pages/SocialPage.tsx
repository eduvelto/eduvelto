import { PageShell, EmptyState } from '../components/PageShell';

export default function SocialPage() {
  return (
    <PageShell titleBn="EduSocial" titleEn="EduSocial">
      <p><strong>ডিজাইন প্রস্তাব মাত্র — কোনো লাইভ সোশ্যাল ফিচার নেই।</strong> প্রাইভেট মেসেজিং, গ্রুপ চ্যাট ও ভয়েস মেসেজ তৈরি করা হবে না, যতক্ষণ নিরাপত্তা, বয়স-সুরক্ষা ও মডারেশন প্রস্তুত না হয় (ব্লুপ্রিন্ট §7)।</p>
      <p style={{ color: '#555' }}><strong>Design proposal only — no live social features.</strong> No private messaging, group chat or voice messages until safety, age protection and moderation are ready (blueprint §7).</p>
      <EmptyState bn="এখনো কোনো তথ্য নেই।" en="No data yet." />
    </PageShell>
  );
}
