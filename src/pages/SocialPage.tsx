import { Link } from 'react-router-dom';
import { PageShell, EmptyState } from '../components/PageShell';

// /social stays a DESIGN PROPOSAL for public social posting (blueprint
// §7): no unrestricted public posting until safety, age protection and
// moderation are ready. Private messaging and educational groups ARE
// live now, with the approved privacy safeguards (firestore.rules):
// DMs are private (participants only), groups are admin-created and
// member-only, reporting + blocking are available everywhere.
export default function SocialPage() {
  return (
    <PageShell titleBn="EduSocial" titleEn="EduSocial">
      <p>
        <strong>পাবলিক সোশ্যাল পোস্টিং এখনো ডিজাইন প্রস্তাব মাত্র — কোনো লাইভ পাবলিক পোস্টিং নেই।</strong>{' '}
        নিরাপত্তা, বয়স-সুরক্ষা ও মডারেশন সম্পূর্ণ প্রস্তুত না হওয়া পর্যন্ত খোলা পাবলিক পোস্টিং চালু হবে না (ব্লুপ্রিন্ট §7)।
      </p>
      <p style={{ color: '#555' }}>
        <strong>Public social posting is still a design proposal only — no live public posting.</strong> Open public
        posting will not launch until safety, age protection and moderation are fully ready (blueprint §7).
      </p>
      <p>
        প্রাইভেট মেসেজিং ও শিক্ষামূলক গ্রুপ এখন চালু আছে — সুরক্ষাসহ:{' '}
        <Link to="/messages">বার্তা / Messages</Link> · <Link to="/groups">গ্রুপ / Groups</Link> ·{' '}
        <Link to="/notifications">নোটিশ / Notifications</Link>
      </p>
      <p style={{ color: '#555' }}>
        Private messaging and educational groups are live now, with safeguards: Messages · Groups · Notifications.
      </p>
      <EmptyState bn="এখনো কোনো পাবলিক পোস্ট নেই।" en="No public posts yet." />
    </PageShell>
  );
}
