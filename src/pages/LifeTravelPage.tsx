import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { EMERGENCY_NUMBERS, LIFE_SOURCES } from '../lib/lifeContent';

// Everyday Life Services (§3C) — Travel + daily needs in Bangladesh.
// Emergency numbers were verified by web search on 23 Nov 2026
// (National Portal, DGHS, Tourist Police).
// No timetables or fares are stated anywhere — those must be checked
// on the official operator sites linked below.

export default function LifeTravelPage() {
  const { t } = useLanguage();
  const travelSources = LIFE_SOURCES.filter((s) =>
    ['emergency-999', 'railway', 'biman', 'dghs'].includes(s.id),
  );

  return (
    <PageShell titleBn="ভ্রমণ ও দৈনন্দিন প্রয়োজন" titleEn="Travel & Daily Needs">
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: 'জীবন সেবা', to: '/life' }, { label: 'ভ্রমণ তথ্য' }]} />
      <p>
        {t({
          bn: 'বাংলাদেশে ভ্রমণের আগে জরুরি নম্বরগুলো ফোনে সংরক্ষণ করুন। এই পাতায় কোনো ট্রেন বা বিমানের সময়সূচি ও ভাড়া দেওয়া হয়নি — তা অফিসিয়াল সাইটে যাচাই করে নিন।',
          en: 'Before travelling in Bangladesh, save the emergency numbers on your phone. No train or flight timetable or fare is given on this page — check those on the official sites.',
        })}
      </p>

      {/* Emergency numbers */}
      <section>
        <h2>{t({ bn: '🚨 জরুরি নম্বর', en: '🚨 Emergency numbers' })}</h2>
        <p style={{ color: 'var(--muted)' }}>
          {t({
            bn: 'জরুরি অবস্থায় প্রথমে ৯৯৯-এ কল করুন — একজন অপারেটর আপনার প্রয়োজন অনুযায়ী পুলিশ, ফায়ার সার্ভিস বা অ্যাম্বুলেন্সের সঙ্গে যুক্ত করে দেবেন।',
            en: 'In an emergency, call 999 first — an operator will connect you to the police, fire service or ambulance as needed.',
          })}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {EMERGENCY_NUMBERS.map((e) => (
            <div key={e.number} className="ev-card">
              <a
                href={`tel:${e.number.replace(/[^0-9]/g, '')}`}
                style={{ fontSize: 22, fontWeight: 700, textDecoration: 'none' }}
              >
                {e.number}
              </a>
              <strong style={{ display: 'block', marginTop: 6 }}>
                {t({ bn: e.nameBn, en: e.nameEn })}
              </strong>
              <span style={{ display: 'block', color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
                {t({ bn: e.useBn, en: e.useEn })}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* What to do in an emergency */}
      <section className="ev-card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: 'জরুরি অবস্থায় কী করবেন', en: 'What to do in an emergency' })}</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {t({
            bn: 'সাধারণ নির্দেশনা মাত্র — এটি পেশাদার জরুরি সেবার বিকল্প নয়।',
            en: 'General guidance only — this is not a substitute for professional emergency services.',
          })}
        </p>
        <ul>
          <li>
            {t({
              bn: 'শান্ত থাকুন ও নিরাপদ স্থানে যান; নিজে বিপদে পড়ে কাউকে সাহায্য করতে যাবেন না।',
              en: 'Stay calm and move to a safe place; do not put yourself in danger while trying to help someone.',
            })}
          </li>
          <li>
            {t({
              bn: '৯৯৯-এ কল করে স্পষ্টভাবে বলুন: কী ঘটেছে, কোথায় ঘটেছে, কতজন আহত, আপনার ফোন নম্বর।',
              en: 'Call 999 and say clearly: what happened, where it happened, how many people are hurt, and your phone number.',
            })}
          </li>
          <li>
            {t({
              bn: 'আগুন লাগলে ধোঁয়া থেকে দূরে থাকুন, নিচু হয়ে বেরিয়ে আসুন; লিফট ব্যবহার করবেন না।',
              en: 'In a fire, stay away from smoke, get out low to the ground, and do not use a lift.',
            })}
          </li>
          <li>
            {t({
              bn: 'গুরুতর আহত কাউকে প্রয়োজন ছাড়া নাড়াবেন না; রক্তপাত হলে পরিষ্কার কাপড় দিয়ে চাপ দিন।',
              en: 'Do not move a seriously injured person unless you must; press a clean cloth on bleeding.',
            })}
          </li>
          <li>
            {t({
              bn: 'স্বাস্থ্য বিষয়ে ফোনে পরামর্শের জন্য স্বাস্থ্য বাতায়ন ১৬২৬৩ (DGHS, ২৪ ঘণ্টা)।',
              en: 'For health advice on the phone, call Shasthyo Batayon 16263 (DGHS, 24 hours).',
            })}
          </li>
        </ul>
      </section>

      {/* Domestic travel */}
      <section style={{ marginTop: 24 }}>
        <h2>{t({ bn: '🚆 দেশের ভেতরে ভ্রমণ', en: '🚆 Domestic travel' })}</h2>
        <div className="ev-card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>{t({ bn: 'ট্রেন — বাংলাদেশ রেলওয়ে', en: 'Train — Bangladesh Railway' })}</h3>
          <ul>
            <li>
              {t({
                bn: 'টিকিট কাটুন শুধু অফিসিয়াল ই-টিকিট সাইট (eticket.railway.gov.bd), অফিসিয়াল Rail Sheba অ্যাপ, অথবা স্টেশন কাউন্টার থেকে।',
                en: 'Buy tickets only from the official e-ticket site (eticket.railway.gov.bd), the official Rail Sheba app, or a station counter.',
              })}
            </li>
            <li>
              {t({
                bn: 'অনলাইনে টিকিট কাটতে NID দিয়ে নিবন্ধন করতে হয়। সময়সূচি, আসন ও ভাড়া সাইটেই দেখে নিন — এখানে কোনো সময় বা ভাড়া দেওয়া হয়নি।',
                en: 'Online tickets need registration with your NID. Check the timetable, seats and fare on the site itself — no times or fares are given here.',
              })}
            </li>
            <li>
              {t({
                bn: 'ভুয়া অ্যাপ বা তৃতীয় পক্ষের সাইটে NID, OTP বা পেমেন্ট তথ্য দেবেন না।',
                en: 'Never enter your NID, OTP or payment details on a fake app or a third-party site.',
              })}
            </li>
          </ul>
          <a href="https://eticket.railway.gov.bd/" target="_blank" rel="noreferrer">
            eticket.railway.gov.bd
          </a>
        </div>
        <div className="ev-card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>{t({ bn: '✈️ বিমান — অভ্যন্তরীণ ফ্লাইট', en: '✈️ Flights — domestic' })}</h3>
          <ul>
            <li>
              {t({
                bn: 'অভ্যন্তরীণ ফ্লাইটের টিকিট বিমান বাংলাদেশ এয়ারলাইন্সের অফিসিয়াল সাইটে বুক করা যায়; ফ্লাইটের সময়, ভাড়া ও ব্যাগের নিয়ম সেখানেই যাচাই করুন।',
                en: 'Domestic flight tickets can be booked on Biman Bangladesh Airlines’ official site; check flight times, fares and baggage rules there.',
              })}
            </li>
            <li>
              {t({
                bn: 'টিকিটের কপি ও পরিচয়পত্র (NID/পাসপোর্ট) সঙ্গে রাখুন; বিমানবন্দরে নির্ধারিত সময়ের আগেই পৌঁছান।',
                en: 'Carry your ticket copy and ID (NID/passport); reach the airport well before the scheduled time.',
              })}
            </li>
          </ul>
          <a href="https://www.biman-airlines.com/" target="_blank" rel="noreferrer">
            www.biman-airlines.com
          </a>
        </div>
        <div className="ev-card" style={{ marginTop: 12 }}>
          <h3 style={{ marginTop: 0 }}>{t({ bn: '🚌 বাস ও অন্যান্য যানবাহন', en: '🚌 Bus & other transport' })}</h3>
          <p>
            {t({
              bn: 'বাসের সময়সূচি ও ভাড়া কাউন্টার বা সংশ্লিষ্ট পরিবহন সংস্থার অফিসিয়াল তথ্য থেকে যাচাই করুন — এই পাতায় কোনো বাসের সময় বা ভাড়া দেওয়া হয়নি। টিকিট কাউন্টার থেকে নিন এবং ভাড়ার রসিদ সংরক্ষণ করুন।',
              en: 'Check bus timetables and fares at the counter or from the transport operator’s official information — no bus times or fares are given on this page. Buy tickets at the counter and keep the receipt.',
            })}
          </p>
        </div>
      </section>

      {/* Travel checklist */}
      <section className="ev-card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: '🎒 ভ্রমণের আগের তালিকা', en: '🎒 Before you travel' })}</h2>
        <ul>
          <li>{t({ bn: 'পরিচয়পত্র (NID/পাসপোর্ট) ও টিকিটের কপি সঙ্গে নিন', en: 'Carry your ID (NID/passport) and a copy of your ticket' })}</li>
          <li>{t({ bn: 'ফোন চার্জ করে নিন ও জরুরি নম্বরগুলো সংরক্ষণ করুন', en: 'Charge your phone and save the emergency numbers' })}</li>
          <li>{t({ bn: 'পরিবারের কাউকে জানিয়ে যান — কোথায় যাচ্ছেন, কখন ফিরবেন', en: 'Tell a family member where you are going and when you will return' })}</li>
          <li>{t({ bn: 'প্রয়োজনীয় ওষুধ ও পানির বোতল সঙ্গে রাখুন', en: 'Carry any medicine you need and a water bottle' })}</li>
          <li>{t({ bn: 'অচেনা কারও দেওয়া খাবার বা পানীয় খাবেন না', en: 'Do not eat or drink anything given by strangers' })}</li>
        </ul>
      </section>

      {/* Sources */}
      <section style={{ marginTop: 24 }}>
        <h2>{t({ bn: 'তথ্যের উৎস', en: 'Sources' })}</h2>
        <ul>
          {travelSources.map((s) => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {t({ bn: s.labelBn, en: s.labelEn })}
              </a>
              {' — '}
              {t({ bn: s.purposeBn, en: s.purposeEn })}
            </li>
          ))}
        </ul>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {t({
            bn: 'জরুরি নম্বরগুলো ২৩ নভেম্বর ২০২৬ তারিখে যাচাই করা হয়েছে। সময়সূচি ও ভাড়া পরিবর্তন হতে পারে — ভ্রমণের আগে অফিসিয়াল সাইটে যাচাই করুন।',
            en: 'The emergency numbers were verified on 23 November 2026. Timetables and fares can change — verify them on the official site before travelling.',
          })}
        </p>
      </section>
    </PageShell>
  );
}
