import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { PageShell } from '../components/PageShell';
import { Breadcrumb } from '../components/Breadcrumb';
import { HealthDisclaimer, AccuracyNote } from '../components/HealthDisclaimer';
import { LIFE_SOURCES } from '../lib/lifeContent';

// Everyday Life Services (§3C) — Health awareness hub.
// General, reliable health information ONLY, summarised in our own words
// from WHO / CDC / DGHS public guidance (sources listed at the bottom).
// No diagnosis, no dosages, no medicine recommendations anywhere.
// The disclaimer + accuracy note repeat under every section, following
// the Health section convention (see components/HealthDisclaimer.tsx).

const SECTION_STYLE: React.CSSProperties = {
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '18px 16px',
  marginTop: 16,
  background: 'var(--card, transparent)',
};

export default function LifeHealthPage() {
  const { t, lang } = useLanguage();
  const sources = LIFE_SOURCES.filter((s) =>
    ['who-diet', 'who-activity', 'who-hand-hygiene', 'cdc-sleep', 'dghs', 'emergency-999'].includes(s.id),
  );

  return (
    <PageShell titleBn="স্বাস্থ্য সচেতনতা" titleEn="Health Awareness">
      {/* Visible breadcrumb (24 Nov 2026 SEO pass) — labels match the BreadcrumbList JSON-LD in lib/seo.ts. */}
      <Breadcrumb items={[{ label: lang === 'bn' ? 'জীবন সেবা' : 'Life Services', to: '/life' }, { label: lang === 'bn' ? 'স্বাস্থ্য সচেতনতা' : 'Health Awareness' }]} />
      <HealthDisclaimer />
      <p>
        {t({
          bn: 'সুস্থ থাকার সাধারণ নিয়মগুলো এখানে সহজ ভাষায় দেওয়া হলো। তথ্যগুলো বিশ্ব স্বাস্থ্য সংস্থা (WHO), CDC ও স্বাস্থ্য অধিদপ্তরের (DGHS) প্রকাশ্য নির্দেশনা থেকে নেওয়া সারাংশ।',
          en: 'Here are the basic rules of staying healthy, in simple language. The information is summarised from public guidance by the World Health Organization (WHO), the CDC and the Directorate General of Health Services (DGHS).',
        })}
      </p>

      {/* Balanced diet — WHO healthy diet fact sheet */}
      <section style={SECTION_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: '🥗 সুষম খাদ্য', en: '🥗 Balanced diet' })}</h2>
        <p>
          {t({
            bn: 'প্রতিদিন নানা ধরনের খাবার খান — শাকসবজি, ফল, ডাল, বাদাম ও আস্ত শস্য (যেমন লাল চাল, আটা, ওটস)। WHO-এর পরামর্শ অনুযায়ী, ১০ বছরের বেশি বয়সীদের দিনে অন্তত ৪০০ গ্রাম (প্রায় পাঁচ পরিবেশন) ফল ও সবজি খাওয়া উচিত।',
            en: 'Eat a variety of foods every day — vegetables, fruit, pulses, nuts and whole grains (such as brown rice, whole wheat and oats). WHO advises people over 10 years old to eat at least 400 g (about five servings) of fruit and vegetables a day.',
          })}
        </p>
        <ul>
          <li>
            {t({
              bn: 'চিনি কমান: মুক্ত চিনি (খাবার বা পানীয়ে যোগ করা চিনি, মধু, সিরাপ ও ফলের রসের চিনিসহ) দিনের মোট শক্তির ১০%-এর কম রাখুন; আরও ভালো হয় ৫%-এর নিচে রাখলে।',
              en: 'Cut down sugar: keep free sugars (sugar added to food or drinks, including honey, syrups and fruit-juice sugars) below 10% of daily energy — below 5% is even better.',
            })}
          </li>
          <li>
            {t({
              bn: 'লবণ কমান: দিনে ৫ গ্রামের (প্রায় এক চা চামচ) কম লবণ খান; আয়োডিনযুক্ত লবণ ব্যবহার করুন।',
              en: 'Cut down salt: eat less than 5 g of salt a day (about one teaspoon); use iodised salt.',
            })}
          </li>
          <li>
            {t({
              bn: 'চর্বি কমান: মোট চর্বি দিনের মোট শক্তির ৩০%-এর কম রাখুন; ভাজা ও বেশি প্রক্রিয়াজাত খাবার কম খান।',
              en: 'Cut down fat: keep total fat below 30% of daily energy; eat less fried and heavily processed food.',
            })}
          </li>
          <li>
            {t({
              bn: 'পানি পান করুন: পানীয় হিসেবে নিরাপদ পানি ও চিনি ছাড়া পানীয় বেছে নিন।',
              en: 'Drink water: choose safe water and unsweetened drinks.',
            })}
          </li>
        </ul>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          {t({
            bn: 'এটি সাধারণ তথ্য — ডায়াবেটিস, কিডনি বা অন্য কোনো রোগ থাকলে খাবার নিয়ে ডাক্তারের পরামর্শ নিন।',
            en: 'This is general information — if you have diabetes, kidney disease or any other condition, ask a doctor about food.',
          })}
        </p>
        <AccuracyNote />
      </section>

      {/* Physical activity — WHO */}
      <section style={SECTION_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: '🚶 শারীরিক সক্রিয়তা', en: '🚶 Physical activity' })}</h2>
        <p>
          {t({
            bn: 'WHO-এর পরামর্শ অনুযায়ী, প্রাপ্তবয়স্কদের (১৮–৬৪ বছর) সপ্তাহে ১৫০–৩০০ মিনিট মাঝারি ধরনের ব্যায়াম (যেমন দ্রুত হাঁটা) অথবা ৭৫–১৫০ মিনিট জোরালো ব্যায়াম করা উচিত। সঙ্গে সপ্তাহে অন্তত ২ দিন পেশি শক্ত করার ব্যায়াম করুন।',
            en: 'WHO advises adults (18–64 years) to do 150–300 minutes of moderate activity (such as brisk walking) or 75–150 minutes of vigorous activity per week, plus muscle-strengthening activity on at least 2 days a week.',
          })}
        </p>
        <ul>
          <li>
            {t({
              bn: 'হাঁটা, সাইকেল চালানো, সাঁতার, ঘরের কাজ, সিঁড়ি ব্যবহার — সবই সক্রিয়তা হিসেবে গোনায়।',
              en: 'Walking, cycling, swimming, housework and taking the stairs all count as activity.',
            })}
          </li>
          <li>
            {t({
              bn: 'একটানা বসে থাকা কমান — মাঝে মাঝে উঠে হাঁটুন। অল্প হলেও নড়াচড়া, একদম না করার চেয়ে ভালো।',
              en: 'Sit less — stand up and walk around from time to time. Even a little movement is better than none.',
            })}
          </li>
          <li>
            {t({
              bn: 'ধীরে শুরু করুন, শরীরের কথা শুনুন। বুকে ব্যথা, শ্বাসকষ্ট বা মাথা ঘোরার মতো সমস্যা হলে ব্যায়াম থামিয়ে ডাক্তার দেখান।',
              en: 'Start slowly and listen to your body. If you get chest pain, breathlessness or dizziness, stop and see a doctor.',
            })}
          </li>
        </ul>
        <AccuracyNote />
      </section>

      {/* Sleep — CDC / AASM */}
      <section style={SECTION_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: '😴 ঘুম', en: '😴 Sleep' })}</h2>
        <p>
          {t({
            bn: 'CDC-এর পরামর্শ অনুযায়ী, প্রাপ্তবয়স্কদের প্রতি রাতে ৭ ঘণ্টা বা তার বেশি ঘুম দরকার। নিয়মিত একই সময়ে ঘুমাতে যাওয়া ও ওঠা ঘুম ভালো করতে সাহায্য করে।',
            en: 'The CDC advises adults to sleep 7 or more hours each night. Going to bed and waking up at regular times helps sleep better.',
          })}
        </p>
        <ul>
          <li>
            {t({
              bn: 'ঘুমের আগে উজ্জ্বল স্ক্রিন ও ভারী খাবার এড়িয়ে চলুন; ঘর অন্ধকার ও ঠান্ডা রাখুন।',
              en: 'Avoid bright screens and heavy meals before bed; keep the room dark and cool.',
            })}
          </li>
          <li>
            {t({
              bn: 'নিয়মিত ঘুমের সমস্যা, নাক ডাকা বা দিনে অতিরিক্ত ঘুম পেলে ডাক্তারের সঙ্গে কথা বলুন।',
              en: 'If sleep problems, snoring or excessive daytime sleepiness persist, talk to a doctor.',
            })}
          </li>
        </ul>
        <AccuracyNote />
      </section>

      {/* Hygiene — WHO community hand hygiene guidelines (2025) */}
      <section style={SECTION_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: '🧼 পরিষ্কার-পরিচ্ছন্নতা', en: '🧼 Hygiene' })}</h2>
        <p>
          {t({
            bn: 'WHO-এর নির্দেশনা অনুযায়ী, সাবান ও পানি দিয়ে হাত ধোয়া সংক্রমণ ছড়ানো রোধের সহজ ও কার্যকর উপায়। হাতের সব জায়গা ঢেকে ভালোভাবে ঘষে ধুয়ে নিন।',
            en: 'According to WHO guidance, washing hands with soap and water is a simple and effective way to stop infections spreading. Cover all parts of the hands and rub them well.',
          })}
        </p>
        <ul>
          <li>
            {t({
              bn: 'খাবার তৈরি ও খাওয়ার আগে, টয়লেটের পরে এবং হাঁচি-কাশির পরে হাত ধুয়ে নিন।',
              en: 'Wash hands before preparing food and before eating, after using the toilet, and after coughing or sneezing.',
            })}
          </li>
          <li>
            {t({
              bn: 'হাত দেখতে ময়লা না হলে অন্তত ৬০% অ্যালকোহলযুক্ত হ্যান্ড রাবও কার্যকর; হাত ময়লা দেখালে সাবান-পানিই ব্যবহার করুন।',
              en: 'When hands are not visibly dirty, a hand rub with at least 60% alcohol also works; if hands look dirty, use soap and water.',
            })}
          </li>
          <li>
            {t({
              bn: 'নিরাপদ পানি পান করুন, খাবার ঢেকে রাখুন এবং শিশুদের হাত ধোয়ার অভ্যাস করান।',
              en: 'Drink safe water, keep food covered, and teach children to wash their hands.',
            })}
          </li>
        </ul>
        <AccuracyNote />
      </section>

      {/* When to see a doctor — general guidance only */}
      <section style={SECTION_STYLE}>
        <h2 style={{ marginTop: 0 }}>{t({ bn: '🩺 কখন ডাক্তার দেখাবেন', en: '🩺 When to see a doctor' })}</h2>
        <p>
          {t({
            bn: 'এই পাতা রোগ নির্ণয় করে না। নিচের যেকোনো অবস্থায় দেরি না করে ডাক্তার দেখান বা জরুরি হলে ৯৯৯-এ কল করুন।',
            en: 'This page does not diagnose illness. If any of the following happens, see a doctor without delay — or call 999 in an emergency.',
          })}
        </p>
        <ul>
          <li>{t({ bn: 'বুকে ব্যথা, শ্বাস নিতে কষ্ট, বা হঠাৎ শরীরের এক পাশ দুর্বল হয়ে যাওয়া', en: 'Chest pain, difficulty breathing, or sudden weakness on one side of the body' })}</li>
          <li>{t({ bn: 'থামছে না এমন রক্তপাত, গুরুতর আঘাত বা দুর্ঘটনা', en: 'Bleeding that will not stop, a serious injury or an accident' })}</li>
          <li>{t({ bn: 'কয়েক দিনেও না কমা জ্বর, তীব্র পেটব্যথা, বমি বা পানিশূন্যতার লক্ষণ', en: 'Fever that does not go down after a few days, severe stomach pain, vomiting or signs of dehydration' })}</li>
          <li>{t({ bn: 'যেকোনো উপসর্গ যা দিন দিন খারাপ হচ্ছে বা আপনাকে ভয় পাইয়ে দিচ্ছে', en: 'Any symptom that is getting worse day by day or that worries you' })}</li>
        </ul>
        <p>
          {t({
            bn: 'ফোনে স্বাস্থ্য পরামর্শের জন্য স্বাস্থ্য বাতায়ন ১৬২৬৩-এ (২৪ ঘণ্টা, DGHS) কল করতে পারেন — তবে ফোনের পরামর্শ ডাক্তারের সরাসরি পরীক্ষার বিকল্প নয়।',
            en: 'For health advice on the phone you can call Shasthyo Batayon 16263 (24 hours, DGHS) — but phone advice is not a substitute for being examined by a doctor.',
          })}
        </p>
        <AccuracyNote />
      </section>

      {/* BMI calculator link */}
      <div className="ev-card" style={{ marginTop: 16 }}>
        <strong>{t({ bn: '⚖️ BMI ক্যালকুলেটর', en: '⚖️ BMI calculator' })}</strong>
        <p style={{ color: 'var(--muted)', margin: '8px 0' }}>
          {t({
            bn: 'উচ্চতা ও ওজন থেকে আপনার বডি মাস ইনডেক্স (BMI) হিসাব করুন। BMI শুধু একটি সাধারণ নির্দেশক — এটি রোগ নির্ণয় করে না।',
            en: 'Calculate your Body Mass Index (BMI) from your height and weight. BMI is only a general indicator — it does not diagnose illness.',
          })}
        </p>
        <Link to="/life/calculators" style={{ fontWeight: 600 }}>
          {t({ bn: 'ক্যালকুলেটরে যান →', en: 'Go to the calculators →' })}
        </Link>
      </div>

      {/* Sources */}
      <section style={{ marginTop: 24 }}>
        <h2>{t({ bn: 'তথ্যের উৎস', en: 'Sources' })}</h2>
        <ul>
          {sources.map((s) => (
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
            bn: 'এই পাতার তথ্য উপরের উৎসগুলোর সারাংশ; মূল নির্দেশনা অফিসিয়াল সাইটে দেখুন। তথ্য পরিবর্তন হতে পারে।',
            en: 'The information on this page summarises the sources above; read the full guidance on the official sites. Information can change.',
          })}
        </p>
      </section>
    </PageShell>
  );
}
